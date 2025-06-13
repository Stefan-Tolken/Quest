import { NextRequest, NextResponse } from 'next/server';
import { getUserIdFromRequest } from '../utils/utils';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, UpdateCommand, GetCommand, PutCommand } from '@aws-sdk/lib-dynamodb';

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
    const questResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/quests`);
    const questsData = await questResponse.json();
    const quest = questsData.quests?.find((q: any) => q.quest_id === questId);

    // Update quest progress to mark as completed
    const questProgressParams = {
      TableName: process.env.USER_QUEST_PROGRESS_TABLE,
      Key: {
        userId: userId,
        questId: questId,
      },
      UpdateExpression: 'SET completed = :c, completedAt = :t',
      ExpressionAttributeValues: {
        ':c': true,
        ':t': new Date().toISOString(),
      },
      ReturnValues: "ALL_NEW" as const,
    };

    await docClient.send(new UpdateCommand(questProgressParams));    // First check if user exists and create if not
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
    }    // Update user profile with completed quest
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
        ':quest': [completedQuest],
        ':questId': questId
      },
      ReturnValues: "ALL_NEW" as const, // Make sure we get the updated item back
      // Only prevent duplicates based on questId
      ExpressionAttributeNames: {
        '#cq': 'completed_quests'
      },
      ConditionExpression: 'attribute_not_exists(#cq) OR NOT contains(#cq, :questId)',
    };    try {
      console.log('Attempting to update user profile with completed quest:', {
        userId,
        questId,
        userProfileParams
      });

      const updateResult = await docClient.send(new UpdateCommand(userProfileParams));
      
      console.log('Update result:', updateResult);

      if (!updateResult.Attributes) {
        throw new Error('Update did not return updated attributes');
      }

      return NextResponse.json({ 
        success: true,
        message: 'Quest completed and saved to profile',
        update: updateResult.Attributes
      });

    } catch (conditionalError) {
      console.error('Error updating user profile:', conditionalError);
      
      // Check if it's a conditional check failure
      if ((conditionalError as any)?.name === 'ConditionalCheckFailedException') {
        return NextResponse.json({ 
          success: true,
          message: 'Quest was already marked as completed'
        });
      }

      throw conditionalError; // Re-throw if it's not a conditional check error
    }

  } catch (error) {
    console.error('Error completing quest:', error);
    return NextResponse.json({ error: 'Failed to complete quest' }, { status: 500 });
  }
}