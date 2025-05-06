import { NextResponse } from 'next/server';
import { DynamoDBClient, ScanCommand } from '@aws-sdk/client-dynamodb';

// Configure AWS SDK
const dynamoDB = new DynamoDBClient({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

// Helper to parse DynamoDB Items
function parseItem(item: any) {
  return {
    id: item.id.S,
    name: item.name.S,
    components: JSON.parse(item.components.S),
    createdAt: item.createdAt.S,
    partOfQuest: item.partOfQuest.BOOL,
  };
}

export async function GET() {
  try {
    const params = {
      TableName: 'artefacts',
    };

    const data = await dynamoDB.send(new ScanCommand(params));
    const artifacts = data.Items?.map(parseItem) || [];

    return NextResponse.json({ success: true, artifacts });
  } catch (error) {
    console.error('DynamoDB Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch artifacts',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}