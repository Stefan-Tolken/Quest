import { NextRequest, NextResponse } from 'next/server';
import { getUserIdFromRequest } from '../utils/utils';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, UpdateCommand, GetCommand, PutCommand } from '@aws-sdk/lib-dynamodb';
import { LeaderboardEntry } from '@/lib/types';

const client = new DynamoDBClient({ region: process.env.AWS_REGION });
const docClient = DynamoDBDocumentClient.from(client);

export async function POST(req: NextRequest) {
  const userId = await getUserIdFromRequest(req);
  const { questId } = await req.json();
  
  if (!userId || !questId) {
    return NextResponse.json({ error: 'Missing data' }, { status: 400 });
  }

  try {
    // First, get the quest details to find the prize
    const questParams = {
      TableName: process.env.QUESTS_TABLE,
      Key: { quest_id: questId }
    };
    const questResponse = await docClient.send(new GetCommand(questParams));
    const quest = questResponse.Item;

    // Get the user's quest progress to calculate time taken
    const progressParams = {
      TableName: process.env.USER_QUEST_PROGRESS_TABLE,
      Key: {
        userId: userId,
        questId: questId,
      }
    };
    const progressResponse = await docClient.send(new GetCommand(progressParams));
    const questProgress = progressResponse.Item;
    
    // Calculate time taken
    const completedAt = new Date().toISOString();
    let timeTaken: number | null = null;
    
    // If we have a startTime, calculate the time taken
    if (questProgress?.startTime) {
      const startTime = new Date(questProgress.startTime).getTime();
      const endTime = new Date(completedAt).getTime();
      timeTaken = Math.trunc((endTime - startTime) / 1000); // Time taken in seconds
    } else {
      // If no startTime exists, use the createdAt time from quest progress or current time
      // This ensures we always have a timeTaken value for the leaderboard
      const fallbackStartTime = questProgress?.createdAt ? new Date(questProgress.createdAt).getTime() : new Date().getTime();
      const endTime = new Date(completedAt).getTime();
      timeTaken = Math.trunc((endTime - fallbackStartTime) / 1000);
      
      // If the calculated time is 0 or negative (edge case), set a default minimum time
      if (timeTaken <= 0) {
        timeTaken = 1; // 1 second minimum
      }
    }

    // Update quest progress to mark as completed
    const questProgressParams = {
      TableName: process.env.USER_QUEST_PROGRESS_TABLE,
      Key: {
        userId: userId,
        questId: questId,
      },
      UpdateExpression: 'SET completed = :c, completedAt = :t, endTime = :e',
      ExpressionAttributeValues: {
        ':c': true,
        ':t': completedAt,
        ':e': completedAt,
      },
      ReturnValues: "ALL_NEW" as const,
    };

    await docClient.send(new UpdateCommand(questProgressParams));
    
    // First check if user exists and create if not
    const getUserParams = {
      TableName: process.env.USER_TABLE,
      Key: { userId },
    };

    const userResponse = await docClient.send(new GetCommand(getUserParams));
    if (!userResponse.Item) {
      console.log('User not found, creating new user profile');
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
    
    // Check if quest is already completed by examining existing completed_quests
    const existingUser = userResponse.Item;
    const existingCompletedQuests = existingUser?.completed_quests || [];
    
    // Check if this questId already exists in completed_quests
    const isAlreadyCompleted = existingCompletedQuests.some((completedQuest: any) => 
      completedQuest.questId === questId
    );
    
    if (isAlreadyCompleted) {
      console.log('Quest already completed by user');
      return NextResponse.json({ 
        success: true,
        message: 'Quest was already marked as completed'
      });
    }
    
    // Update user profile with completed quest
    const timestamp = new Date().toISOString();
    const completedQuest = {
      questId: questId,
      completedAt: timestamp,
      prize: quest?.prize?.title || null
    };

    console.log('Preparing to add completed quest:', completedQuest);

    const userProfileParams = {
      TableName: process.env.USER_TABLE,
      Key: { userId },
      UpdateExpression: 'SET completed_quests = list_append(if_not_exists(completed_quests, :empty_list), :quest)',
      ExpressionAttributeValues: {
        ':empty_list': [],
        ':quest': [completedQuest]
      },
      ReturnValues: "ALL_NEW" as const,
    };
    
    try {
      console.log('Attempting to update user profile with completed quest:', {
        userId,
        questId,
        userProfileParams
      });

      const updateResult = await docClient.send(new UpdateCommand(userProfileParams));
      
      console.log('Update result:', updateResult);

      // CRITICAL FIX: Always update the quest's leaderboard when quest is completed
      // Create leaderboard entry with the calculated timeTaken
      const leaderboardEntry: LeaderboardEntry = {
        userId,
        completedAt,
        timeTaken: timeTaken || 1 // Ensure we always have a time value
      };

      console.log('Updating quest leaderboard with entry:', leaderboardEntry);

      // Update the quest with the new leaderboard entry
      const updateQuestLeaderboardParams = {
        TableName: process.env.QUESTS_TABLE,
        Key: { quest_id: questId },
        UpdateExpression: 'SET leaderboard = list_append(if_not_exists(leaderboard, :empty_list), :entry)',
        ExpressionAttributeValues: {
          ':empty_list': [],
          ':entry': [leaderboardEntry]
        },
        ReturnValues: "ALL_NEW" as const
      };

      const leaderboardUpdateResult = await docClient.send(new UpdateCommand(updateQuestLeaderboardParams));
      console.log('Leaderboard update result:', leaderboardUpdateResult);

      if (!updateResult.Attributes) {
        throw new Error('Update did not return updated attributes');
      }

      return NextResponse.json({ 
        success: true,
        message: 'Quest completed and saved to profile',
        update: updateResult.Attributes,
        timeTaken
      });

    } catch (updateError) {
      console.error('Error updating user profile:', updateError);
      throw updateError;
    }

  } catch (error) {
    console.error('Error completing quest:', error);
    return NextResponse.json({ error: 'Failed to complete quest' }, { status: 500 });
  }
}