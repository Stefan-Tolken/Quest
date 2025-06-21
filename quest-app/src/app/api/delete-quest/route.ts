// src/app/api/delete-quest/route.ts
import { NextResponse } from "next/server";
import { DynamoDBClient, DeleteItemCommand } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, ScanCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { UserData, CompletedQuest } from "@/lib/types";

const dynamoDB = new DynamoDBClient({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

const docClient = DynamoDBDocumentClient.from(dynamoDB);

export async function DELETE(request: Request) {
  const { id } = await request.json();
  if (!id) {
    return NextResponse.json({ error: "Missing quest id" }, { status: 400 });
  }

  try {
    console.log('Deleting quest:', id);

    // Step 1: Get all users to check for completed quests containing this quest
    const usersParams = {
      TableName: 'userData',
    };

    const usersResult = await docClient.send(new ScanCommand(usersParams));
    const usersToUpdate: { userId: string; updatedCompletedQuests: CompletedQuest[] }[] = [];

    // Step 2: Check each user's completed_quests for the quest being deleted
    if (usersResult.Items) {
      for (const userItem of usersResult.Items) {
        const user = userItem as UserData;
        const completedQuests = user.completed_quests || [];

        // Check if the user has completed this quest
        const questInCompletedQuests = completedQuests.some((cq: CompletedQuest) => 
          cq.questId === id
        );

        if (questInCompletedQuests) {
          // Filter out the quest from the user's completed_quests
          const updatedCompletedQuests = completedQuests.filter((cq: CompletedQuest) => 
            cq.questId !== id
          );
          
          usersToUpdate.push({
            userId: user.userId,
            updatedCompletedQuests
          });
        }
      }
    }

    console.log(`Found ${usersToUpdate.length} users to update completed_quests for quest ${id}`);

    // Step 3: Update users' completed_quests to remove the quest
    const updatePromises = usersToUpdate.map(async ({ userId, updatedCompletedQuests }) => {
      try {
        const updateUserCommand = new UpdateCommand({
          TableName: 'userData',
          Key: {
            userId: userId,
          },
          UpdateExpression: 'SET completed_quests = :completedQuests, updatedAt = :updatedAt',
          ExpressionAttributeValues: {
            ':completedQuests': updatedCompletedQuests,
            ':updatedAt': new Date().toISOString(),
          },
        });

        await docClient.send(updateUserCommand);
        console.log(`Updated completed_quests for user ${userId}`);
      } catch (error) {
        console.error(`Failed to update completed_quests for user ${userId}:`, error);
        // Continue with other updates even if one fails
      }
    });

    // Wait for all user updates to complete
    await Promise.all(updatePromises);

    // Step 4: Delete the quest from quests table
    await dynamoDB.send(
      new DeleteItemCommand({
        TableName: process.env.QUESTS_TABLE || "quests",
        Key: { quest_id: { S: id } },
      })
    );

    console.log(`Successfully deleted quest ${id} and updated ${usersToUpdate.length} users`);

    return NextResponse.json({ 
      success: true,
      message: 'Quest deleted successfully',
      usersUpdated: usersToUpdate.length
    });
  } catch (error) {
    console.error('Error deleting quest:', error);
    return NextResponse.json({ error: "Failed to delete quest" }, { status: 500 });
  }
}