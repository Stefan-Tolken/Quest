import { NextRequest, NextResponse } from 'next/server';
import { DynamoDBClient, GetItemCommand } from '@aws-sdk/client-dynamodb';
import { ComponentData, DynamoDBItem } from '@/lib/types';

// Configure AWS SDK
const dynamoDB = new DynamoDBClient({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

// Helper to parse DynamoDB Items
function parseItem(item: DynamoDBItem) {
  const components: ComponentData[] = JSON.parse(item.components.S!);
  // Sort components by order property, fallback to array index if order is missing
  const sortedComponents = components.sort((a: ComponentData, b: ComponentData) => {
    const orderA = a.order !== undefined ? a.order : components.indexOf(a);
    const orderB = b.order !== undefined ? b.order : components.indexOf(b);
    return orderA - orderB;
  });
  return {
    id: item.id?.S ?? '',
    name: item.name?.S ?? '',
    artist: item.artist?.S ?? undefined,
    date: item.date?.S ?? undefined,
    description: item.description?.S ?? '',
    image: item.image?.S ?? '',
    components: sortedComponents,
    createdAt: item.createdAt?.S ?? '',
    partOfQuest: item.partOfQuest?.BOOL ?? false,
  };
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Artefact ID is required' },
        { status: 400 }
      );
    }

    const params = {
      TableName: process.env.ARTEFACTS_TABLE || 'artefacts',
      Key: {
        id: { S: id }
      }
    };

    const data = await dynamoDB.send(new GetItemCommand(params));
    
    if (!data.Item) {
      return NextResponse.json(
        { error: 'Artefact not found' },
        { status: 404 }
      );
    }

    const artefact = parseItem(data.Item as unknown as DynamoDBItem);

    return NextResponse.json({ success: true, artefact });
  } catch (error) {
    console.error('DynamoDB Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch artefact',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}