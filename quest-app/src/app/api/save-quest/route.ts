// app/api/save-quest/route.ts
import { NextResponse } from "next/server";
import { DynamoDBClient, PutItemCommand } from "@aws-sdk/client-dynamodb";
import { v4 as uuidv4 } from "uuid";

// Configure AWS SDK
const dynamoDB = new DynamoDBClient({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

// Define TypeScript interface for quest data
interface Quest {
  quest_id: string; // Changed from id to quest_id to match DynamoDB table
  title: string;
  description: string;
  artifacts: Array<{
    id: string;
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
    imageBase64?: string; // Base64 encoded image
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
      questData.artifacts.length === 0
    ) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Generate unique ID and timestamp if not provided
    const questId = uuidv4();
    const timestamp = new Date().toISOString();

    // Prepare complete quest object
    const quest: Quest = {
      quest_id: questId, // Use quest_id as primary key
      ...questData,
      createdAt: timestamp,
    };

    // Prepare DynamoDB item
    // Note: We convert the complex objects to strings for storage
    const params = {
      TableName: "quests", // Make sure this is the correct table name
      Item: {
        quest_id: { S: quest.quest_id }, // Changed from id to quest_id
        title: { S: quest.title },
        description: { S: quest.description },
        artifacts: { S: JSON.stringify(quest.artifacts) },
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
