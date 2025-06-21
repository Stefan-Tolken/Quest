// src/app/api/get-quest/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand } from '@aws-sdk/lib-dynamodb';
import { getUrl } from '../utils/utils';

// Configure AWS SDK
const client = new DynamoDBClient({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

const docClient = DynamoDBDocumentClient.from(client);

function extractKeyFromProxyUrl(url: string): string | null {
  try {
    const parsed = new URL(url, 'http://localhost'); // Fallback base
    return parsed.pathname === '/api/get-image'
      ? decodeURIComponent(parsed.searchParams.get('key') || '')
      : null;
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const questId = url.searchParams.get('questId');
  
  if (!questId) {
    return NextResponse.json({ error: 'Missing questId parameter' }, { status: 400 });
  }

  try {
    console.log('Fetching quest:', questId);
    
    const params = {
      TableName: process.env.QUESTS_TABLE || 'quests',
      Key: { quest_id: questId }
    };
    
    const result = await docClient.send(new GetCommand(params));
    const item = result.Item;
    
    if (!item) {
      return NextResponse.json({ error: 'Quest not found' }, { status: 404 });
    }

    // Process the quest data similar to get-quests route
    const prize = item.prize ? (typeof item.prize === 'string' ? JSON.parse(item.prize) : item.prize) : undefined;
    const imageKey = prize?.imageKey || extractKeyFromProxyUrl(prize?.image);

    const prizeImageUrl = imageKey ? await getUrl(imageKey) : null;
    if (prizeImageUrl) prize.image = prizeImageUrl;

    const quest = {
      quest_id: item.quest_id,
      title: item.title,
      description: item.description,
      artefacts: typeof item.artefacts === 'string' ? JSON.parse(item.artefacts) : (item.artefacts || []),
      questType: item.questType,
      dateRange: item.dateRange ? (typeof item.dateRange === 'string' ? JSON.parse(item.dateRange) : item.dateRange) : undefined,
      prize,
      createdAt: item.createdAt,
    };

    return NextResponse.json({ quest });
  } catch (error: any) {
    console.error('Error fetching quest:', error);
    return NextResponse.json(
      { error: 'Failed to fetch quest', message: error.message || 'Unknown error' }, 
      { status: 500 }
    );
  }
}