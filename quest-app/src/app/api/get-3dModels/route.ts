import { NextResponse } from "next/server";
import { DynamoDBClient, ScanCommand } from "@aws-sdk/client-dynamodb";
import { DynamoDBModelItem } from "@/lib/types";

// Configure AWS SDK
const dynamoDB = new DynamoDBClient({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

// Helper to parse DynamoDB Items
function parseModelItem(item: DynamoDBModelItem) {
  return {
    id: item.id?.S ?? "",
    name: item.name?.S ?? "",
    fileName: item.fileName?.S ?? "",
    url: item.url?.S ?? "",
    points: item.points?.S ? JSON.parse(item.points.S) : [],
    createdAt: item.createdAt?.S ?? "",
    light: item.light?.N ? Number(item.light.N) : 5, // Parse light as number, default 5
  };
}

export async function GET() {
  try {
    const params = {
      TableName: "models3d",
    };
    const data = await dynamoDB.send(new ScanCommand(params));
    const models =
      data.Items?.map((item) => parseModelItem(item as unknown as DynamoDBModelItem)) || [];
    return NextResponse.json({ success: true, models });
  } catch (error) {
    console.error("DynamoDB Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch 3D models",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}