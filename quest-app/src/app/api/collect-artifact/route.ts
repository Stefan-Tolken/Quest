// POST /api/collect-artifact
// Body: { questId: string, artefactId: string }
import { NextRequest, NextResponse } from 'next/server';
import { getUserIdFromRequest } from '../utils/utils';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, UpdateCommand } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({ region: process.env.AWS_REGION });
const docClient = DynamoDBDocumentClient.from(client);

export async function POST(req: NextRequest) {
  const userId = await getUserIdFromRequest(req);
  const { questId, artefactId } = await req.json();
  if (!userId || !questId || !artefactId) {
    return NextResponse.json({ error: 'Missing data' }, { status: 400 });
  }
  // Add artefactId to collectedArtefactIds (as a string set, avoids duplicates)
  const params = {
    TableName: process.env.USER_QUEST_PROGRESS_TABLE,
    Key: {
      userId: userId,
      questId: questId,
    },
    UpdateExpression: 'ADD collectedArtefactIds :a',
    ExpressionAttributeValues: {
      ':a': [artefactId],
    },
    ReturnValues: "ALL_NEW" as const,
  };
  try {
    await docClient.send(new UpdateCommand(params));
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: 'Failed to update progress' }, { status: 500 });
  }
}
