// POST /api/collect-artifact
// Body: { questId: string, artefactId: string }
import { NextRequest, NextResponse } from 'next/server';
import { getUserIdFromRequest } from '../utils/utils';
import { DynamoDBClient, GetItemCommand } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, UpdateCommand, GetCommand, UpdateCommandInput } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({ region: process.env.AWS_REGION });
const docClient = DynamoDBDocumentClient.from(client);

interface Quest {
  quest_id: string;
  title: string;
  description: string;
  artefacts: Array<{
    artefactId: string;
  }>;
  questType: "sequential" | "concurrent";
}

export async function POST(req: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(req);
    const { questId, artefactId } = await req.json();
    
    if (!userId || !questId || !artefactId) {
      return NextResponse.json({ error: 'Missing required data. Need questId and artefactId.' }, { status: 400 });
    }

    // Get quest details to check completion requirements
    const questParams = {
      TableName: 'quests',
      Key: {
        quest_id: questId,
      },
    };
      const questData = await docClient.send(new GetCommand(questParams));
    if (!questData.Item) {
      return NextResponse.json({ error: 'Quest not found' }, { status: 404 });
    }

    // Parse artefacts from DynamoDB JSON string
    const quest = {
      ...questData.Item,
      artefacts: JSON.parse(questData.Item.artefacts || '[]')
    } as Quest;
    const requiredArtefacts = quest.artefacts.map(a => a.artefactId);

    // Check if user has already collected this artifact
    const getParams = {
      TableName: process.env.USER_QUEST_PROGRESS_TABLE,
      Key: {
        userId,
        questId
      }
    };

    const existingProgress = await docClient.send(new GetCommand(getParams));
    const existingCollectedArtefacts: string[] = existingProgress.Item?.collectedArtefactIds || [];

    if (existingCollectedArtefacts.includes(artefactId)) {
      return NextResponse.json({ success: true, alreadyCollected: true });
    }    // For sequential quests, check if we can collect this artifact
    if (quest.questType === 'sequential') {
      const expectedIndex = existingCollectedArtefacts.length;
      if (artefactId !== quest.artefacts[expectedIndex]?.artefactId) {
        // Get the existing attempts array or initialize a new one
        let attempts = existingProgress.Item?.attempts || [];
        if (!Array.isArray(attempts)) attempts = [];
        
        // Find the index of this artifact in the quest
        const artifactIndex = quest.artefacts.findIndex(a => 
          a.artefactId === artefactId || a === artefactId
        );
        
        // Update attempts for this artifact
        while (attempts.length <= artifactIndex) {
          attempts.push(0);
        }
        attempts[artifactIndex]++;

        const incrementAttemptParams: UpdateCommandInput = {
          TableName: process.env.USER_QUEST_PROGRESS_TABLE,
          Key: { userId, questId },
          UpdateExpression: 'SET attempts = :a',
          ExpressionAttributeValues: {
            ':a': attempts
          },
          ReturnValues: "ALL_NEW"
        };
        
        const result = await docClient.send(new UpdateCommand(incrementAttemptParams));
        
        return NextResponse.json({ 
          error: 'Cannot collect this artifact yet. Must collect artifacts in order.',
          attempts: attempts[artifactIndex]
        }, { status: 400 });
      }
    }    // Add artefactId to collectedArtefactIds
    const collectedArtefacts = [...existingCollectedArtefacts, artefactId];
    const isComplete = requiredArtefacts.every(id => collectedArtefacts.includes(id));

    // Get current attempts array
    let attempts = existingProgress.Item?.attempts || [];
    if (!Array.isArray(attempts)) attempts = [];

    const updateParams: UpdateCommandInput = {
      TableName: process.env.USER_QUEST_PROGRESS_TABLE,
      Key: {
        userId,
        questId
      },
      UpdateExpression: 'SET collectedArtefactIds = :a, completed = :c, completedAt = :t, attempts = :att',
      ExpressionAttributeValues: {
        ':a': collectedArtefacts,
        ':c': isComplete,
        ':t': isComplete ? new Date().toISOString() : null,
        ':att': attempts
      },
      ReturnValues: "ALL_NEW"
    };
    const result = await docClient.send(new UpdateCommand(updateParams));
    return NextResponse.json({ 
      success: true,
      collectedArtefactIds: result.Attributes?.collectedArtefactIds,
      completed: result.Attributes?.completed,
      completedAt: result.Attributes?.completedAt,
      attempts: result.Attributes?.attempts || {} // Include attempts in response
    });
  } catch (e) {
    console.error('Error in collect-artifact:', e);
    return NextResponse.json({ 
      error: 'Failed to update progress', 
      details: e instanceof Error ? e.message : 'Unknown error'
    }, { status: 500 });
  }
}
