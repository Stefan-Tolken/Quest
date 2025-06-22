// src/app/api/users/route.ts
import { NextResponse } from 'next/server';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand } from '@aws-sdk/lib-dynamodb';
import { UserData } from '@/lib/types';

// Initialize DynamoDB client
const client = new DynamoDBClient({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

const docClient = DynamoDBDocumentClient.from(client);
const TABLE_NAME = process.env.USER_TABLE || 'userData';

// GET - Retrieve all users
export async function GET() {
  try {
    console.log('Fetching all users from userData table');
    
    const command = new ScanCommand({
      TableName: TABLE_NAME,
    });

    const result = await docClient.send(command);

    if (!result.Items) {
      return NextResponse.json({ users: [] });
    }

    // Return all users
    const users = result.Items as UserData[];
    console.log(`Found ${users.length} users`);
    
    return NextResponse.json({ users });
  } catch (error) {
    console.error('Error retrieving users:', error);
    return NextResponse.json({ error: 'Failed to retrieve users' }, { status: 500 });
  }
}