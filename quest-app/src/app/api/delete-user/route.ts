// app/api/delete-user/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand, UpdateCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb';

// Initialize DynamoDB client
const client = new DynamoDBClient({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

const docClient = DynamoDBDocumentClient.from(client);
const USER_TABLE_NAME = process.env.USER_TABLE || 'userData';

// DELETE - Delete user account and remove from all quest leaderboards
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    console.log('Starting user deletion process for email:', email);

    // Step 1: Find the user by email to get their userId
    const scanCommand = new ScanCommand({
      TableName: USER_TABLE_NAME,
      FilterExpression: 'email = :email',
      ExpressionAttributeValues: {
        ':email': email,
      },
    });

    const userResult = await docClient.send(scanCommand);

    if (!userResult.Items || userResult.Items.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const user = userResult.Items[0];
    const userId = user.userId;

    console.log('Found user to delete:', userId, 'Email:', email);

    // Step 2: Get all quests to check for leaderboards containing this user
    const questsParams = {
      TableName: process.env.QUESTS_TABLE || 'quests',
    };

    const questsResult = await docClient.send(new ScanCommand(questsParams));
    const questsToUpdate: Array<{ questId: string; updatedLeaderboard: any[] }> = [];

    // Step 3: Check each quest's leaderboard for the user
    if (questsResult.Items) {
      for (const questItem of questsResult.Items) {
        const quest = {
          quest_id: questItem.quest_id,
          leaderboard: questItem.leaderboard || []
        };

        // Check if the leaderboard contains this user
        const leaderboard = Array.isArray(quest.leaderboard) ? quest.leaderboard : [];
        const userInLeaderboard = leaderboard.some((entry: any) => 
          entry && typeof entry === 'object' && entry.userId === userId
        );

        if (userInLeaderboard) {
          // Filter out the user from the leaderboard
          const updatedLeaderboard = leaderboard.filter((entry: any) => 
            entry && typeof entry === 'object' && entry.userId !== userId
          );
          
          questsToUpdate.push({
            questId: quest.quest_id,
            updatedLeaderboard
          });
        }
      }
    }

    console.log(`Found ${questsToUpdate.length} quests to update leaderboards for user ${userId}`);

    // Step 4: Update quest leaderboards to remove the user
    const updatePromises = questsToUpdate.map(async ({ questId, updatedLeaderboard }) => {
      try {
        const updateQuestCommand = new UpdateCommand({
          TableName: process.env.QUESTS_TABLE || 'quests',
          Key: {
            quest_id: questId,
          },
          UpdateExpression: 'SET leaderboard = :leaderboard',
          ExpressionAttributeValues: {
            ':leaderboard': updatedLeaderboard,
          },
        });

        await docClient.send(updateQuestCommand);
        console.log(`Updated leaderboard for quest ${questId}`);
        return { questId, success: true };
      } catch (error) {
        console.error(`Failed to update leaderboard for quest ${questId}:`, error);
        return { 
          questId, 
          success: false, 
          error: error instanceof Error ? error.message : String(error) 
        };
      }
    });

    // Wait for all leaderboard updates to complete
    const updateResults = await Promise.all(updatePromises);
    const successfulUpdates = updateResults.filter(result => result.success);
    const failedUpdates = updateResults.filter(result => !result.success);

    if (failedUpdates.length > 0) {
      console.warn(`Failed to update ${failedUpdates.length} quest leaderboards:`, failedUpdates);
    }

    // Step 5: Delete the user from userData table
    const deleteCommand = new DeleteCommand({
      TableName: USER_TABLE_NAME,
      Key: {
        userId: user.userId,
      },
      ReturnValues: 'ALL_OLD',
    });

    const deleteResult = await docClient.send(deleteCommand);

    if (!deleteResult.Attributes) {
      return NextResponse.json({ 
        error: 'User not found during deletion' 
      }, { status: 404 });
    }

    console.log('Successfully deleted user:', userId);

    return NextResponse.json({ 
      success: true,
      message: 'User account deleted successfully',
      deletedUser: {
        userId: deleteResult.Attributes.userId,
        email: deleteResult.Attributes.email,
      },
      leaderboardUpdates: {
        total: questsToUpdate.length,
        successful: successfulUpdates.length,
        failed: failedUpdates.length,
      }
    }, { status: 200 });

  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json({ 
      error: 'Failed to delete user account',
      details: typeof error === 'object' && error !== null && 'message' in error ? (error as any).message : String(error)
    }, { status: 500 });
  }
}