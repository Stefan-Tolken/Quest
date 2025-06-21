// app/api/user/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, PutCommand, UpdateCommand, ScanCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb';
import { UserData, ProfileSettings } from '@/lib/types';

// Initialize DynamoDB client
const client = new DynamoDBClient({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

const docClient = DynamoDBDocumentClient.from(client);
const TABLE_NAME = 'userData';

// GET - Retrieve user data by email
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // Since we need to find by email but the primary key might be userId,
    // we'll use a scan operation with a filter
    const command = new ScanCommand({
      TableName: TABLE_NAME,
      FilterExpression: 'email = :email',
      ExpressionAttributeValues: {
        ':email': email,
      },
    });

    const result = await docClient.send(command);

    if (!result.Items || result.Items.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Return the first matching user
    return NextResponse.json({ user: result.Items[0] as UserData });
  } catch (error) {
    console.error('Error retrieving user:', error);
    return NextResponse.json({ error: 'Failed to retrieve user' }, { status: 500 });
  }
}

// POST - Create or update user
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, userId } = body;

    if (!email || !userId) {
      return NextResponse.json({ error: 'Email and userId are required' }, { status: 400 });
    }

    // Check if user already exists by scanning for email
    const scanCommand = new ScanCommand({
      TableName: TABLE_NAME,
      FilterExpression: 'email = :email',
      ExpressionAttributeValues: {
        ':email': email,
      },
    });

    const existingUser = await docClient.send(scanCommand);

    if (existingUser.Items && existingUser.Items.length > 0) {
      // User exists, return existing user data
      return NextResponse.json({ 
        user: existingUser.Items[0] as UserData, 
        created: false 
      });
    }

    const defaultProfileSettings: ProfileSettings = {
      theme: 'light',
      notifications: true,
    };

    const newUser: UserData = {
      userId,
      email,
      profile_settings: defaultProfileSettings,
      completed_quests: [],
      artefacts_collected: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Use userId as the primary key for the put operation
    const putCommand = new PutCommand({
      TableName: TABLE_NAME,
      Item: newUser,
    });

    await docClient.send(putCommand);

    return NextResponse.json({ 
      user: newUser, 
      created: true 
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating/updating user:', error);
    return NextResponse.json({ error: 'Failed to create/update user' }, { status: 500 });
  }
}

// PUT - Update user data
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, updateData } = body;

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // First, find the user by email to get their userId
    const scanCommand = new ScanCommand({
      TableName: TABLE_NAME,
      FilterExpression: 'email = :email',
      ExpressionAttributeValues: {
        ':email': email,
      },
    });

    const userResult = await docClient.send(scanCommand);

    if (!userResult.Items || userResult.Items.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const user = userResult.Items[0] as UserData;

    // Build update expression dynamically
    const updateExpressions: string[] = [];
    const expressionAttributeNames: Record<string, string> = {};
    const expressionAttributeValues: Record<string, any> = {};

    Object.keys(updateData).forEach((key, index) => {
      const placeholder = `#attr${index}`;
      const valuePlaceholder = `:val${index}`;
      
      updateExpressions.push(`${placeholder} = ${valuePlaceholder}`);
      expressionAttributeNames[placeholder] = key;
      expressionAttributeValues[valuePlaceholder] = updateData[key];
    });

    // Always update the updatedAt timestamp
    updateExpressions.push('#updatedAt = :updatedAt');
    expressionAttributeNames['#updatedAt'] = 'updatedAt';
    expressionAttributeValues[':updatedAt'] = new Date().toISOString();

    // Use userId as the key for the update operation
    const updateCommand = new UpdateCommand({
      TableName: TABLE_NAME,
      Key: {
        userId: user.userId, // Use userId as the key
      },
      UpdateExpression: `SET ${updateExpressions.join(', ')}`,
      ExpressionAttributeNames: expressionAttributeNames,
      ExpressionAttributeValues: expressionAttributeValues,
      ReturnValues: 'ALL_NEW',
    });

    const result = await docClient.send(updateCommand);

    return NextResponse.json({ user: result.Attributes as UserData });

  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
  }
}

// DELETE - Delete user account
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // First, find the user by email to get their userId
    const scanCommand = new ScanCommand({
      TableName: TABLE_NAME,
      FilterExpression: 'email = :email',
      ExpressionAttributeValues: {
        ':email': email,
      },
    });

    const userResult = await docClient.send(scanCommand);

    if (!userResult.Items || userResult.Items.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const user = userResult.Items[0] as UserData;
    const userId = user.userId;

    console.log('Deleting user:', userId, 'Email:', email);

    // Step 1: Get all quests to check for leaderboards containing this user
    const questsParams = {
      TableName: process.env.QUESTS_TABLE || 'quests',
    };

    const questsResult = await docClient.send(new ScanCommand(questsParams));
    const questsToUpdate: any[] = [];

    // Step 2: Check each quest's leaderboard for the user
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

    // Step 3: Update quest leaderboards to remove the user
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
      } catch (error) {
        console.error(`Failed to update leaderboard for quest ${questId}:`, error);
      }
    });

    // Wait for all leaderboard updates to complete
    await Promise.all(updatePromises);

    // Step 4: Delete the user from userData table
    const deleteCommand = new DeleteCommand({
      TableName: TABLE_NAME,
      Key: {
        userId: user.userId,
      },
      ReturnValues: 'ALL_OLD',
    });

    const result = await docClient.send(deleteCommand);

    if (!result.Attributes) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ 
      message: 'User account deleted successfully',
      deletedUser: {
        userId: result.Attributes.userId,
        email: result.Attributes.email,
      },
      leaderboardsUpdated: questsToUpdate.length
    }, { status: 200 });

  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json({ error: 'Failed to delete user account' }, { status: 500 });
  }
}