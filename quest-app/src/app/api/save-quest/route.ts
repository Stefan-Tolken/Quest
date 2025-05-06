// app/api/save-quest/route.ts
import { NextResponse } from "next/server";
import { DynamoDBClient, PutItemCommand } from "@aws-sdk/client-dynamodb";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { v4 as uuidv4 } from "uuid";

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

// Define TypeScript interface for quest data
interface Quest {
  quest_id: string;
  title: string;
  description: string;
  artefacts: Array<{
    artefactId: string;
    hints: Array<{
      description: string;
      displayAfterAttempts: number;
    }>;
    hintDisplayMode: "sequential" | "random";
  }>;
  questType: "sequential" | "concurrent";
  dateRange?: {
    from: string; // ISO date string
    to: string; // ISO date string
  };
  prize?: {
    title: string;
    description: string;
    image?: string; // URL to image or base64
  };
  createdAt: string;
}

export async function POST(request: Request) {
  try {
    // Get quest data from request
    const questData: Omit<Quest, "quest_id" | "createdAt"> =
      await request.json();

    // Validate required fields
    if (
      !questData.title ||
      !questData.description ||
      questData.artefacts.length === 0
    ) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Generate unique ID and timestamp
    const questId = uuidv4();
    const timestamp = new Date().toISOString();

    // Handle prize image if present
    let updatedPrize = questData.prize;

    if (
      questData.prize?.image &&
      questData.prize.image.startsWith("data:image/")
    ) {
      try {
        // Extract the MIME type and base64 data correctly
        const matches = questData.prize.image.match(
          /^data:([A-Za-z-+\/]+);base64,(.+)$/
        );

        if (!matches || matches.length !== 3) {
          console.warn("Invalid base64 image data for prize");
        } else {
          const contentType = matches[1];
          const base64Data = matches[2];
          const buffer = Buffer.from(base64Data, "base64");

          // Generate a unique image key with timestamp
          const timestamp = Date.now();
          const imageKey = `quests/${questId}/prize-image-${timestamp}.jpg`;

          console.log(`Uploading prize image to S3: ${imageKey}`);

          // Upload to S3 with proper content type
          await s3.send(
            new PutObjectCommand({
              Bucket: process.env.AWS_BUCKET_NAME!,
              Key: imageKey,
              Body: buffer,
              ContentType: contentType,
              // No ACL setting as the bucket doesn't support it
            })
          );

          // Store the relative path to use with our API endpoint
          const imageUrl = `/api/get-image?key=${encodeURIComponent(imageKey)}`;
          console.log(
            `Prize image uploaded successfully with key: ${imageKey}`
          );

          // Update the prize object with the new image URL
          updatedPrize = {
            ...questData.prize,
            image: imageUrl,
          };
        }
      } catch (err) {
        console.error("S3 upload failed for prize image:", err);
        // Keep the original prize object if upload fails
      }
    }

    // Prepare complete quest object with possible updated prize
    const quest: Quest = {
      quest_id: questId,
      ...questData,
      prize: updatedPrize,
      createdAt: timestamp,
    };

    // Prepare DynamoDB item
    const params = {
      TableName: "quests",
      Item: {
        quest_id: { S: quest.quest_id },
        title: { S: quest.title },
        description: { S: quest.description },
        artefacts: { S: JSON.stringify(quest.artefacts) },
        questType: { S: quest.questType },
        dateRange: quest.dateRange
          ? { S: JSON.stringify(quest.dateRange) }
          : { NULL: true },
        prize: quest.prize
          ? { S: JSON.stringify(quest.prize) }
          : { NULL: true },
        createdAt: { S: quest.createdAt },
      },
    };

    // Execute DynamoDB put operation
    await dynamoDB.send(new PutItemCommand(params));

    return NextResponse.json({
      success: true,
      quest_id: questId,
    });
  } catch (error) {
    console.error("DynamoDB Error:", error);
    return NextResponse.json(
      {
        error: "Failed to save quest",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
