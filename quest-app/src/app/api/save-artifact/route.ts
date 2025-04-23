// app/api/save-artifact/route.ts
import { NextResponse } from 'next/server';
import { DynamoDBClient, PutItemCommand } from '@aws-sdk/client-dynamodb';
import { v4 as uuidv4 } from 'uuid';
import { ComponentData } from '@/app/admin/page-builder/types';

// Configure AWS SDK
const dynamoDB = new DynamoDBClient({
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
    // Validate and parse incoming data
    const artifactData: ArtifactData = await request.json();

    // Validate required fields
    if (!artifactData.name || !artifactData.components) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Prepare DynamoDB item
    const params = {
      TableName: 'artefacts',
      Item: {
        id: { S: artifactData.id },
        name: { S: artifactData.name },
        components: { S: JSON.stringify(artifactData.components) },
        createdAt: { S: artifactData.createdAt },
        partOfQuest: { BOOL: artifactData.partOfQuest },
      },
    };

    // Execute DynamoDB put operation
    await dynamoDB.send(new PutItemCommand(params));
    
    return NextResponse.json({ 
      success: true, 
      id: artifactData.id 
    });

  } catch (error) {
    console.error('DynamoDB Error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to save artifact', 
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}