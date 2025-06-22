// src/app/api/leaderboard/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, BatchGetCommand } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({ region: process.env.AWS_REGION });
const docClient = DynamoDBDocumentClient.from(client);

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const questId = url.searchParams.get('questId');
  
  if (!questId) {
    return NextResponse.json({ error: 'Missing questId parameter' }, { status: 400 });
  }

  try {
    console.log('Fetching leaderboard for quest:', questId);
    
    // Get the quest to access its leaderboard
    const questParams = {
      TableName: process.env.QUESTS_TABLE,
      Key: { quest_id: questId }
    };
    
    const questResponse = await docClient.send(new GetCommand(questParams));
    const quest = questResponse.Item;
    
    if (!quest) {
      return NextResponse.json({ error: 'Quest not found' }, { status: 404 });
    }
    
    // Safely handle the leaderboard data
    const leaderboard = Array.isArray(quest.leaderboard) ? quest.leaderboard : [];
    
    console.log('Leaderboard data:', leaderboard, 'Type:', typeof leaderboard);
    
    if (!leaderboard.length) {
      console.log('Leaderboard is empty, returning empty array');
      return NextResponse.json({ leaderboard: [] });
    }
    
    // Safely get unique user IDs from leaderboard
    let userIds: string[] = [];
    try {
      // Make sure we're working with an array and each entry has a userId
      userIds = [...new Set(
        leaderboard
          .filter(entry => entry && typeof entry === 'object' && 'userId' in entry)
          .map(entry => entry.userId)
      )];
    } catch (error) {
      console.error('Error extracting userIds from leaderboard:', error);
      // Return the leaderboard without user emails if there's an error
      return NextResponse.json({ 
        leaderboard,
        error: 'Could not process user IDs'
      });
    }
    
    console.log('Extracted user IDs:', userIds);
    
    // Batch get user data to fetch emails
    const userEmails: Record<string, string> = {};
    
    if (userIds.length > 0) {
      try {
        const batchParams = {
          RequestItems: {
            [process.env.USER_TABLE!]: {
              Keys: userIds.map(id => ({ userId: id }))
            }
          }
        };
        
        const batchResponse = await docClient.send(new BatchGetCommand(batchParams));
        const users = batchResponse.Responses?.[process.env.USER_TABLE!] || [];
        
        // Create a map of userId to email
        users.forEach(user => {
          if (user.userId && user.email) {
            userEmails[user.userId] = user.email;
          }
        });
      } catch (error) {
        console.error('Error fetching user emails:', error);
        // Continue without emails if there's an error
      }
    }
    
    // Add emails to leaderboard entries
    const leaderboardWithEmails = leaderboard.map(entry => ({
      ...entry,
      userEmail: userEmails[entry.userId] || 'Unknown'
    }));
    
    // Sort by time taken (ascending)
    const sortedLeaderboard = leaderboardWithEmails.sort((a, b) => {
      const timeA = typeof a.timeTaken === 'number' ? a.timeTaken : Infinity;
      const timeB = typeof b.timeTaken === 'number' ? b.timeTaken : Infinity;
      return timeA - timeB;
    });
    
    return NextResponse.json({ leaderboard: sortedLeaderboard });
    
  } catch (error: any) {
    console.error('Error fetching leaderboard:', error);
    return NextResponse.json(
      { error: 'Failed to fetch leaderboard', message: error.message || 'Unknown error' }, 
      { status: 500 }
    );
  }
}