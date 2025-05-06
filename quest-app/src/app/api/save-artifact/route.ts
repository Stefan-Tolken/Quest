import { NextResponse } from "next/server";
import { DynamoDBClient, PutItemCommand } from "@aws-sdk/client-dynamodb";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { ComponentData } from "@/lib/types";

// Configure AWS SDK
const dynamoDB = new DynamoDBClient({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

// Define TypeScript interface for artifact data
interface ArtifactData {
  id: string;
  name: string;
  components: ComponentData[];
  createdAt: string;
  partOfQuest: boolean;
}

export async function POST(request: Request) {
  try {
    const artifactData: ArtifactData = await request.json();

    if (!artifactData.name || !artifactData.components) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const updatedComponents = await Promise.all(
      artifactData.components.map(async (component, index) => {
        if (
          component.type === "image" &&
          typeof component.content === "object" &&
          component.content?.url &&
          component.content.url.startsWith("data:image/")
        ) {
          try {
            // Extract the MIME type and base64 data correctly
            const matches = component.content.url.match(
              /^data:([A-Za-z-+\/]+);base64,(.+)$/
            );

            if (!matches || matches.length !== 3) {
              throw new Error("Invalid base64 image data");
            }

            const contentType = matches[1];
            const base64Data = matches[2];
            const buffer = Buffer.from(base64Data, "base64");

            // Generate a unique image key with timestamp
            const timestamp = Date.now();
            const imageKey = `artifacts/${artifactData.id}/component-${index}-${timestamp}.jpg`;

            // Log the upload attempt
            console.log(`Uploading image to S3: ${imageKey}`);

            // Upload to S3 with proper content type
            await s3.send(
              new PutObjectCommand({
                Bucket: process.env.AWS_BUCKET_NAME!,
                Key: imageKey,
                Body: buffer,
                ContentType: contentType,
                // ACL removed as the bucket doesn't support ACLs
              })
            );

            // Store the S3 key path rather than a direct URL
            // You'll need to implement a separate method to access these images
            const imageUrl = `/api/get-image?key=${encodeURIComponent(
              imageKey
            )}`;
            console.log(`Image uploaded successfully with key: ${imageKey}`);

            // Return component with updated image URL
            return {
              ...component,
              content: {
                ...component.content,
                url: imageUrl,
              },
            };
          } catch (err) {
            console.error("S3 upload failed:", err);
            // Return original component but log the error clearly
            console.error(
              "Could not upload image to S3, falling back to base64 storage"
            );
            return component;
          }
        }

        return component;
      })
    );

    // Log the components being saved to DynamoDB
    console.log(
      "Saving to DynamoDB:",
      JSON.stringify(updatedComponents).substring(0, 100) + "..."
    );

    const params = {
      TableName: "artefacts",
      Item: {
        id: { S: artifactData.id },
        name: { S: artifactData.name },
        components: { S: JSON.stringify(updatedComponents) },
        createdAt: { S: artifactData.createdAt },
        partOfQuest: { BOOL: artifactData.partOfQuest },
      },
    };

    await dynamoDB.send(new PutItemCommand(params));

    return NextResponse.json({
      success: true,
      id: artifactData.id,
    });
  } catch (error) {
    console.error("DynamoDB Error:", error);
    return NextResponse.json(
      {
        error: "Failed to save artifact",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
