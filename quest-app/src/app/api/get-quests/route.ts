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
      TableName: process.env.QUESTS_TABLE || 'quests',
    };

    const result = await dynamoDB.send(new ScanCommand(params));
    
    // Simplified processing - no need for complex image URL processing
    // since all images are now directly stored as S3 URLs
    const quests = (result.Items ?? []).map((item) => {
      const prize = item.prize?.S ? JSON.parse(item.prize.S) : undefined;
      
      // With pre-signed URL system, prize.image is already the correct URL
      // No need for getUrl() or key extraction
      
      return {
        quest_id: item.quest_id.S,
        title: item.title.S,
        description: item.description.S,
        artefacts: JSON.parse(item.artefacts.S || '[]'),
        questType: item.questType.S,
        dateRange: item.dateRange?.S ? JSON.parse(item.dateRange.S) : undefined,
        prize, // Prize image URLs are already correct
        createdAt: item.createdAt.S,
      };
    });

    return NextResponse.json({ quests });
  } catch (error) {
    console.error('Error fetching quests:', error);
    return NextResponse.json(
      { error: 'Failed to fetch quests' },
      { status: 500 }
    );
  }
}