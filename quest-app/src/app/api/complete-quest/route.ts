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
    console.log('Starting quest completion process:', { userId, questId });
    
    // First, get the quest details to find the prize
    const questParams = {
      TableName: process.env.QUESTS_TABLE,
      Key: { quest_id: questId }
    };
    const questResponse = await docClient.send(new GetCommand(questParams));
    const quest = questResponse.Item;
    
    if (!quest) {
      console.error('Quest not found:', questId);
      return NextResponse.json({ error: 'Quest not found' }, { status: 404 });
    }

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
      const fallbackStartTime = questProgress?.createdAt ? new Date(questProgress.createdAt).getTime() : new Date().getTime();
      const endTime = new Date(completedAt).getTime();
      timeTaken = Math.trunc((endTime - fallbackStartTime) / 1000);
      
      // If the calculated time is 0 or negative (edge case), set a default minimum time
      if (timeTaken <= 0) {
        timeTaken = 1; // 1 second minimum
      }
    }

    console.log('Time taken to complete quest:', timeTaken, 'seconds');

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
    console.log('Quest progress updated successfully');
    
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
          updatedAt: new Date().toISOString(),
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
    
    // *** FIX 1: Always create a leaderboard entry ***
    // Create leaderboard entry with the calculated timeTaken
    const leaderboardEntry: LeaderboardEntry = {
      userId,
      completedAt,
      timeTaken: timeTaken || 1 // Ensure we always have a time value
    };

    console.log('Creating leaderboard entry:', leaderboardEntry);

    // *** FIX 2: Handle leaderboard update separately and more robustly ***
    try {
      // Check if user is already in the quest's leaderboard to avoid duplicates
      // Ensure leaderboard is an array
      const questLeaderboard = Array.isArray(quest?.leaderboard) ? quest.leaderboard : [];
      console.log('Current leaderboard:', quest?.leaderboard, 'Type:', typeof quest?.leaderboard);
      
      // Safely check if user is in leaderboard
      let isInLeaderboard = false;
      try {
        isInLeaderboard = questLeaderboard.some((entry: LeaderboardEntry) => 
          entry.userId === userId
        );
      } catch (error) {
        console.log('Error checking leaderboard, assuming user is not in it:', error);
        isInLeaderboard = false;
      }
      
      if (!isInLeaderboard) {
        console.log('User not in leaderboard, adding entry...');
        
        // Update the quest with the new leaderboard entry
        // First check if leaderboard exists
        if (!quest.leaderboard || typeof quest.leaderboard !== 'object' || !Array.isArray(quest.leaderboard)) {
          // Initialize the leaderboard as a fresh array
          console.log('Initializing leaderboard as a new array');
          const initLeaderboardParams = {
            TableName: process.env.QUESTS_TABLE,
            Key: { quest_id: questId },
            UpdateExpression: 'SET leaderboard = :entries',
            ExpressionAttributeValues: {
              ':entries': [leaderboardEntry]
            },
            ReturnValues: "ALL_NEW" as const
          };
          
          const initResult = await docClient.send(new UpdateCommand(initLeaderboardParams));
          console.log('Initialized new leaderboard:', initResult.Attributes?.leaderboard);
        } else {
          // Append to existing leaderboard
          console.log('Appending to existing leaderboard');
          const updateQuestLeaderboardParams = {
            TableName: process.env.QUESTS_TABLE,
            Key: { quest_id: questId },
            UpdateExpression: 'SET leaderboard = list_append(leaderboard, :entry)',
            ExpressionAttributeValues: {
              ':entry': [leaderboardEntry]
            },
            ReturnValues: "ALL_NEW" as const
          };

          const leaderboardResult = await docClient.send(new UpdateCommand(updateQuestLeaderboardParams));
          console.log('Added user to existing leaderboard:', leaderboardResult.Attributes?.leaderboard?.length || 0, 'entries total');
        }
      } else {
        console.log('User already in leaderboard, skipping');
      }
    } catch (leaderboardError) {
      // *** FIX 4: Better error handling, but don't fail the whole request ***
      console.error('Error updating leaderboard (continuing with quest completion):', leaderboardError);
    }
    
    if (isAlreadyCompleted) {
      console.log('Quest already completed by user');
      return NextResponse.json({ 
        success: true,
        message: 'Quest was already marked as completed',
        timeTaken
      });
    }
    
    // Update user profile with completed quest
    const timestamp = new Date().toISOString();
    const completedQuest = {
      questId: questId,
      completedAt: timestamp,
      prize: quest?.prize?.title || null
    };

    console.log('Adding completed quest to user profile:', completedQuest);

    // *** FIX 5: Also update the updatedAt timestamp ***
    const userProfileParams = {
      TableName: process.env.USER_TABLE,
      Key: { userId },
      UpdateExpression: 'SET completed_quests = list_append(if_not_exists(completed_quests, :empty_list), :quest), updatedAt = :updated',
      ExpressionAttributeValues: {
        ':empty_list': [],
        ':quest': [completedQuest],
        ':updated': timestamp
      },
      ReturnValues: "ALL_NEW" as const,
    };
    
    try {
      const updateResult = await docClient.send(new UpdateCommand(userProfileParams));
      
      if (!updateResult.Attributes) {
        throw new Error('Update did not return updated attributes');
      }

      console.log('User profile updated successfully with completed quest');

      return NextResponse.json({ 
        success: true,
        message: 'Quest completed and saved to profile',
        update: updateResult.Attributes,
        timeTaken
      });

    } catch (updateError) {
      console.error('Error updating user profile:', updateError);
      return NextResponse.json({ error: 'Failed to update user profile' }, { status: 500 });
    }

  } catch (error: any) {
    console.error('Error completing quest:', error.message || error);
    return NextResponse.json({ 
      error: 'Failed to complete quest', 
      message: error.message || 'Unknown error'
    }, { status: 500 });
  }
}