// POST /api/collect-artifact
// Body: { questId: string, artefactId: string }
import { NextRequest, NextResponse } from 'next/server';
import { getUserIdFromRequest } from '../utils/utils';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, UpdateCommand, GetCommand, UpdateCommandInput, PutCommand } from '@aws-sdk/lib-dynamodb';
import { Quest, QuestArtefact, UserQuestProgress, Hint } from '@/lib/types';

const client = new DynamoDBClient({ region: process.env.AWS_REGION });
const docClient = DynamoDBDocumentClient.from(client);

// Function to complete the quest in user profile
async function completeQuestInProfile(userId: string, questId: string, quest: Quest) {
  try {
    // First check if user exists in the user table
    const getUserParams = {
      TableName: process.env.USER_TABLE,
      Key: { userId },
    };

    const userResponse = await docClient.send(new GetCommand(getUserParams));
    if (!userResponse.Item) {
      const createUserParams = {
        TableName: process.env.USER_TABLE,
        Item: {
          userId,
          completed_quests: [],
          artefacts_collected: [],
          createdAt: new Date().toISOString(),
        },
      };
      await docClient.send(new PutCommand(createUserParams));
    }

    // Update user profile with completed quest
    const timestamp = new Date().toISOString();
    const completedQuest = {
      questId: questId,
      completedAt: timestamp,
      prize: quest?.prize?.title || null
    };

    const userProfileParams = {
      TableName: process.env.USER_TABLE,
      Key: { userId },
      UpdateExpression: 'SET completed_quests = list_append(if_not_exists(completed_quests, :empty_list), :quest)',
      ExpressionAttributeValues: {
        ':empty_list': [],
        ':quest': [completedQuest],
        ':questId': questId
      },
      ReturnValues: "ALL_NEW" as const,      ExpressionAttributeNames: {
        '#cq': 'completed_quests'
      },
      // Check if completed_quests doesn't exist or if this quest isn't in it
      ConditionExpression: 'attribute_not_exists(#cq) OR NOT contains(#cq, :questId)',
    };

    try {
      const updateResult = await docClient.send(new UpdateCommand(userProfileParams));
      return { success: true, update: updateResult.Attributes };
    } catch (conditionalError) {
      // Check if it's a conditional check failure (quest already completed)
      if ((conditionalError as any)?.name === 'ConditionalCheckFailedException') {
        return { success: true, message: 'Quest was already marked as completed' };
      }

      throw conditionalError;
    }
  } catch (error) {
    console.error('Error completing quest in profile:', error);
    throw error;
  }
}

// Determine which hints should be displayed based on attempts
function getNewlyAvailableHints(
  artefact: QuestArtefact,
  attempts: number,
  displayedHints: Record<string, boolean>
): string[] {
  if (!artefact.hints) return [];
  
  const newHints: string[] = [];
  
  for (let i = 0; i < artefact.hints.length; i++) {
    const hint: Hint = artefact.hints[i];
    // Use hint.id if available, otherwise use index
    const hintIdentifier = hint.id || i.toString();
    const hintId = `${artefact.artefactId}-${hintIdentifier}`;
    
    // Check if hint should be displayed (meets attempt threshold and hasn't been shown)
    if (attempts >= hint.displayAfterAttempts && !displayedHints[hintId]) {
      newHints.push(hintId);
    }
  }

  // If sequential mode, only return the first new hint
  if (artefact.hintDisplayMode === 'sequential' && newHints.length > 0) {
    return [newHints[0]];
  }

  return newHints;
}

export async function POST(req: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(req);
    const { questId, artefactId } = await req.json();
    
    if (!userId || !questId || !artefactId) {
      return NextResponse.json({ error: 'Missing required data. Need questId and artefactId.' }, { status: 400 });
    }

    // Initialize UserQuestProgress if it doesn't exist
    const startTime = new Date().toISOString();
    
    // Get quest details to check completion requirements
    const questParams = {
      TableName: process.env.QUESTS_TABLE || 'quests',
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

    // Initialize empty UserQuestProgress if it doesn't exist
    const defaultProgress: Partial<UserQuestProgress> = {
      collectedArtefactIds: [],
      completed: false,
      attempts: 0,
      startTime: startTime,
      displayedHints: {},
    };

    // Check if artefact exists in quest
    const artefactExists = quest.artefacts.some(a => a.artefactId === artefactId);
    const requiredArtefacts = quest.artefacts.map(a => a.artefactId);

    // Get existing progress
    const getParams = {
      TableName: process.env.USER_QUEST_PROGRESS_TABLE,
      Key: {
        userId,
        questId
      }
    };

    const existingProgress = await docClient.send(new GetCommand(getParams));
    const currentProgress = {
      ...defaultProgress,
      ...existingProgress.Item
    } as UserQuestProgress;

    const existingCollectedArtefacts = currentProgress.collectedArtefactIds;

    // If artefact doesn't exist in quest, increment attempts and return incorrect answer
    if (!artefactExists) {
      const updatedProgress = {
        ...currentProgress,
        attempts: currentProgress.attempts + 1,
        lastAttemptedArtefactId: artefactId
      };

      // Update attempts and lastAttemptedArtefactId
      const incrementAttemptParams: UpdateCommandInput = {
        TableName: process.env.USER_QUEST_PROGRESS_TABLE,
        Key: { userId, questId },
        UpdateExpression: 'SET attempts = :a, lastAttemptedArtefactId = :l, startTime = if_not_exists(startTime, :st)',
        ExpressionAttributeValues: {
          ':a': updatedProgress.attempts,
          ':l': updatedProgress.lastAttemptedArtefactId,
          ':st': updatedProgress.startTime
        },
        ReturnValues: "ALL_NEW"
      };
      
      const result = await docClient.send(new UpdateCommand(incrementAttemptParams));
      
      return NextResponse.json({ 
        success: false,
        error: 'Incorrect artefact for this quest.',
        attempts: result.Attributes?.attempts || 0,
        lastAttemptedArtefactId: result.Attributes?.lastAttemptedArtefactId,
        progress: result.Attributes
      }, { status: 200 });
    }

    // Check if already collected
    if (existingCollectedArtefacts.includes(artefactId)) {
      return NextResponse.json({ 
        success: true, 
        alreadyCollected: true,
        message: 'Artefact already collected',
        progress: currentProgress
      });
    }

    // For sequential quests, check if we can collect this artifact
    if (quest.questType === 'sequential') {
      const expectedIndex = existingCollectedArtefacts.length;
      if (artefactId !== quest.artefacts[expectedIndex]?.artefactId) {
        // Find the current artefact to check hints
        const currentArtefact = quest.artefacts.find(a => a.artefactId === artefactId);
        
        // Increment attempt counter and update lastAttemptedArtefactId
        const updatedProgress = {
          ...currentProgress,
          attempts: currentProgress.attempts + 1,
          lastAttemptedArtefactId: artefactId
        };

        // Get newly available hints
        const newHints = currentArtefact ? 
          getNewlyAvailableHints(currentArtefact, updatedProgress.attempts, currentProgress.displayedHints) : 
          [];

        // Mark new hints as displayed
        const updatedDisplayedHints = { ...currentProgress.displayedHints };
        for (const hintId of newHints) {
          updatedDisplayedHints[hintId] = true;
        }

        // Update attempts, lastAttemptedArtefactId, and displayedHints
        const incrementAttemptParams: UpdateCommandInput = {
          TableName: process.env.USER_QUEST_PROGRESS_TABLE,
          Key: { userId, questId },
          UpdateExpression: 'SET attempts = :a, lastAttemptedArtefactId = :l, displayedHints = :h, startTime = if_not_exists(startTime, :st)',
          ExpressionAttributeValues: {
            ':a': updatedProgress.attempts,
            ':l': updatedProgress.lastAttemptedArtefactId,
            ':h': updatedDisplayedHints,
            ':st': updatedProgress.startTime
          },
          ReturnValues: "ALL_NEW"
        };
        
        const result = await docClient.send(new UpdateCommand(incrementAttemptParams));
        
        return NextResponse.json({ 
          success: false,
          error: 'Cannot collect this artifact yet. Must collect artifacts in order.',
          attempts: result.Attributes?.attempts || 0,
          lastAttemptedArtefactId: result.Attributes?.lastAttemptedArtefactId,
          progress: result.Attributes
        });
      }
    }

    // Prepare updated progress for successful collection
    const collectedArtefacts = [...existingCollectedArtefacts, artefactId];
    const isComplete = requiredArtefacts.every(id => collectedArtefacts.includes(id));

    // Get current artefact for hint checking
    const currentArtefact = quest.artefacts.find(a => a.artefactId === artefactId);
    
    // For sequential quests, reset attempts to 0 when collecting the correct artifact
    // For concurrent quests, don't increment attempts for correct answers
    const attempts = quest.questType === 'sequential' ? 0 : currentProgress.attempts;
    
    // Get newly available hints
    const newHints = currentArtefact ? 
      getNewlyAvailableHints(currentArtefact, attempts, currentProgress.displayedHints) : 
      [];

    // Mark new hints as displayed
    const updatedDisplayedHints = { ...currentProgress.displayedHints };
    for (const hintId of newHints) {
      updatedDisplayedHints[hintId] = true;
    }

    // Update progress object
    const updatedProgress: UserQuestProgress = {
      ...currentProgress,
      userId,
      questId,
      collectedArtefactIds: collectedArtefacts,
      completed: isComplete,
      completedAt: isComplete ? new Date().toISOString() : undefined,
      attempts: attempts,
      lastAttemptedArtefactId: artefactId,
      endTime: isComplete ? new Date().toISOString() : undefined,
      displayedHints: updatedDisplayedHints
    };

    // Prepare the update
    const updateParams: UpdateCommandInput = {
      TableName: process.env.USER_QUEST_PROGRESS_TABLE,
      Key: {
        userId,
        questId
      },
      UpdateExpression: `
        SET collectedArtefactIds = :a,
            completed = :c,
            completedAt = :t,
            attempts = :att,
            lastAttemptedArtefactId = :l,
            displayedHints = :h,
            endTime = :e,
            startTime = if_not_exists(startTime, :st)
      `,
      ExpressionAttributeValues: {
        ':a': updatedProgress.collectedArtefactIds,
        ':c': updatedProgress.completed,
        ':t': updatedProgress.completedAt || null,
        ':att': updatedProgress.attempts,
        ':l': updatedProgress.lastAttemptedArtefactId,
        ':h': updatedProgress.displayedHints,
        ':e': updatedProgress.endTime || null,
        ':st': updatedProgress.startTime
      },
      ReturnValues: "ALL_NEW"
    };

    const result = await docClient.send(new UpdateCommand(updateParams));

    // Get hint details for newly displayed hints
    const newlyAvailableHints = newHints.map(hintId => {
      const [artefactId, hintIdentifier] = hintId.split('-');
      const artefact = quest.artefacts.find(a => a.artefactId === artefactId);
      if (!artefact?.hints) return null;
      
      // Find hint by id or by index
      const hint = artefact.hints.find(h => h.id === hintIdentifier) || 
                   artefact.hints[parseInt(hintIdentifier)];
      
      return hint ? { id: hintId, description: hint.description } : null;
    }).filter(Boolean);

    // *** NEW: If the quest is complete, also update the user's completed quests ***
    let questCompletionResult: 
      | { success: boolean; update?: Record<string, any>; message?: string }
      | null = null;
    if (isComplete) {
      try {
        questCompletionResult = await completeQuestInProfile(userId, questId, quest);
        console.log('Quest completion result:', questCompletionResult);
      } catch (error) {
        console.error('Failed to complete quest in profile, but artifact collection succeeded:', error);
        // Don't fail the entire request if quest completion fails
      }
    }

    return NextResponse.json({ 
      success: true,
      collectedArtefactIds: result.Attributes?.collectedArtefactIds,
      completed: result.Attributes?.completed,
      completedAt: result.Attributes?.completedAt,
      attempts: result.Attributes?.attempts,
      lastAttemptedArtefactId: result.Attributes?.lastAttemptedArtefactId,
      displayedHints: result.Attributes?.displayedHints || {},
      newlyAvailableHints,
      progress: result.Attributes,
      // Include quest completion info if applicable
      questCompleted: isComplete,
      questCompletionResult: questCompletionResult
    });
  } catch (e) {
    console.error('Error in collect-artifact:', e);
    return NextResponse.json({ 
      error: 'Failed to update progress', 
      details: e instanceof Error ? e.message : 'Unknown error'
    }, { status: 500 });
  }
}