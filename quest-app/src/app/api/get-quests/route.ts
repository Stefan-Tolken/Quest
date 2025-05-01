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

export async function GET() {
  try {
    const params = {
      TableName: 'quests',
    };

    const result = await dynamoDB.send(new ScanCommand(params));

    const quests = result.Items?.map((item) => ({
      quest_id: item.quest_id.S,
      title: item.title.S,
      description: item.description.S,
      artifacts: JSON.parse(item.artifacts.S || '[]'),
      questType: item.questType.S,
      dateRange: item.dateRange?.S ? JSON.parse(item.dateRange.S) : undefined,
      prize: item.prize?.S ? JSON.parse(item.prize.S) : undefined,
      createdAt: item.createdAt.S,
    })) || [];

    return NextResponse.json({ quests });
  } catch (error) {
    console.error('Error fetching quests:', error);
    return NextResponse.json(
      { error: 'Failed to fetch quests' },
      { status: 500 }
    );
  }
}