// app/api/leaderboard/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, BatchGetCommand } from '@aws-sdk/lib-dynamodb';
import { LeaderboardEntry } from '@/lib/types';

const client = new DynamoDBClient({ region: process.env.AWS_REGION });
const docClient = DynamoDBDocumentClient.from(client);

export async function GET(req: NextRequest) {
  const questId = req.nextUrl.searchParams.get('questId');
  
  if (!questId) {
    return NextResponse.json({ error: 'Missing questId parameter' }, { status: 400 });
  }

  try {
    // Get the quest with leaderboard data
    const params = {
      TableName: process.env.QUESTS_TABLE,
      Key: { quest_id: questId }
    };

    const response = await docClient.send(new GetCommand(params));
    const quest = response.Item;
    
    if (!quest) {
      return NextResponse.json({ error: 'Quest not found' }, { status: 404 });
    }

    // Extract leaderboard from quest
    const leaderboard: LeaderboardEntry[] = quest.leaderboard || [];
    
    if (leaderboard.length === 0) {
      return NextResponse.json({
        questId,
        questTitle: quest.title,
        leaderboard: []
      });
    }

    // Get unique user IDs from leaderboard
    const userIds = [...new Set(leaderboard.map(entry => entry.userId))];
    
    // Batch get user data to fetch emails
    const userEmails: Record<string, string> = {};
    
    if (userIds.length > 0) {
      try {
        // Create batch get request for users
        const userKeys = userIds.map(userId => ({ userId }));
        
        const batchParams = {
          RequestItems: {
            [process.env.USER_TABLE || 'userData']: {
              Keys: userKeys
            }
          }
        };

        const userResponse = await docClient.send(new BatchGetCommand(batchParams));
        const users = userResponse.Responses?.[process.env.USER_TABLE || 'userData'] || [];
        
        // Create userId -> email mapping
        users.forEach(user => {
          if (user.userId && user.email) {
            userEmails[user.userId] = user.email;
          }
        });
      } catch (userError) {
        console.warn('Error fetching user emails:', userError);
      }
    }
    
    // Add user emails to leaderboard entries
    const enrichedLeaderboard = leaderboard.map(entry => ({
      ...entry,
      userEmail: userEmails[entry.userId] || undefined
    }));
    
    // Sort by time taken (ascending) and take top 10
    const sortedLeaderboard = [...enrichedLeaderboard]
      .sort((a, b) => a.timeTaken - b.timeTaken)
      .slice(0, 10);
    
    return NextResponse.json({
      questId,
      questTitle: quest.title,
      leaderboard: sortedLeaderboard
    });
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    return NextResponse.json({ error: 'Failed to fetch leaderboard' }, { status: 500 });
  }
}