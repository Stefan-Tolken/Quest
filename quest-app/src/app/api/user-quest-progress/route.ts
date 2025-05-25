// GET /api/user-quest-progress?questId=...
// Returns the user's progress for a quest
import { NextRequest, NextResponse } from 'next/server';
import { getUserIdFromRequest } from '../utils/utils';
import { DynamoDBClient, GetItemCommand } from '@aws-sdk/client-dynamodb';

const client = new DynamoDBClient({ region: process.env.AWS_REGION });

export async function GET(req: NextRequest) {
  const userId = await getUserIdFromRequest(req);
  const questId = req.nextUrl.searchParams.get('questId');
  if (!userId || !questId) {
    return NextResponse.json({ error: 'Missing user or questId' }, { status: 400 });
  }
  const params = {
    TableName: process.env.USER_QUEST_PROGRESS_TABLE,
    Key: {
      userId: { S: userId },
      questId: { S: questId },
    },
  };
  try {
    const data = await client.send(new GetItemCommand(params));
    if (!data.Item) {
      return NextResponse.json({ collectedArtefactIds: [], completed: false });
    }
    // Defensive: handle missing or wrong type for collectedArtefactIds
    let collectedArtefactIds: string[] = [];
    if (data.Item.collectedArtefactIds && Array.isArray(data.Item.collectedArtefactIds.SS)) {
      collectedArtefactIds = data.Item.collectedArtefactIds.SS;
    }
    return NextResponse.json({
      collectedArtefactIds,
      completed: data.Item.completed ? data.Item.completed.BOOL : false,
      completedAt: data.Item.completedAt ? data.Item.completedAt.S : null,
    });
  } catch (e) {
    console.error('user-quest-progress error:', e);
    return NextResponse.json({ error: 'Failed to fetch progress' }, { status: 500 });
  }
}
