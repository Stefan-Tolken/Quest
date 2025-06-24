import { NextResponse } from "next/server";
import { DynamoDBClient, PutItemCommand, PutItemCommandInput } from "@aws-sdk/client-dynamodb";
import { Artefact } from "@/lib/types";

// Configure AWS SDK
const dynamoDB = new DynamoDBClient({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

export async function POST(request: Request) {
  try {
    // Parse JSON directly instead of FormData
    const artifactData: Artefact = await request.json();

    if (!artifactData.name) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Validate that image URLs are proper S3 URLs if present
    if (artifactData.image && typeof artifactData.image === "string") {
      // Check if it's still a base64 string (shouldn't happen with new system)
      if (artifactData.image.startsWith("data:image/")) {
        console.warn("Base64 image detected - this should not happen with pre-signed URL system");
        return NextResponse.json(
          { error: "Invalid image format. Please upload images using the image upload interface." },
          { status: 400 }
        );
      }
    }

    // Validate component images
    const validatedComponents = artifactData.components.map((component, index) => {
      // Check image components
      if (
        component.type === "image" &&
        typeof component.content === "object" &&
        "url" in component.content &&
        component.content.url
      ) {
        if (component.content.url.startsWith("data:image/")) {
          console.warn(`Base64 image detected in component ${index} - this should not happen with pre-signed URL system`);
          throw new Error("Invalid image format in component. Please upload images using the image upload interface.");
        }
      }

      // Check restoration components
      if (
        component.type === "restoration" &&
        typeof component.content === "object" &&
        "restorations" in component.content
      ) {
        const restorations = component.content.restorations as Array<any>;
        restorations.forEach((restoration: any, rIndex: number) => {
          if (restoration.imageUrl && restoration.imageUrl.startsWith("data:image/")) {
            console.warn(`Base64 image detected in restoration ${index}-${rIndex} - this should not happen with pre-signed URL system`);
            throw new Error("Invalid image format in restoration. Please upload images using the image upload interface.");
          }
        });
      }

      return component;
    });

    // Build DynamoDB item - much simpler now!
    const params: PutItemCommandInput = {
      TableName: process.env.ARTEFACTS_TABLE || "artefacts",
      Item: {
        id: { S: artifactData.id },
        name: { S: artifactData.name },
        artist: artifactData.artist ? { S: artifactData.artist } : { NULL: true },
        type: artifactData.type ? { S: artifactData.type } : { NULL: true },
        date: artifactData.date ? { S: artifactData.date } : { NULL: true },
        description: { S: artifactData.description },
        image: { S: typeof artifactData.image === "string" ? artifactData.image : "" },
        components: { S: JSON.stringify(validatedComponents) },
        createdAt: { S: artifactData.createdAt },
      },
    };

    await dynamoDB.send(new PutItemCommand(params));

    console.log(`Artifact saved successfully: ${artifactData.id}`);

    return NextResponse.json({
      success: true,
      id: artifactData.id,
      message: "Artifact saved successfully"
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