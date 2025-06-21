import { NextResponse } from "next/server";
import { DynamoDBClient, PutItemCommand } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { v4 as uuidv4 } from "uuid";
import { Quest } from "@/lib/types"

const dynamoDB = new DynamoDBClient({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

const docClient = DynamoDBDocumentClient.from(dynamoDB);

const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const questData: Omit<Quest, "quest_id" | "createdAt"> = JSON.parse(
      formData.get("quest") as string
    );
    const prizeImage = formData.get("prizeImage") as File | null;
    
    // Check if this is an edit operation by looking for an existing quest with this ID
    const potentialQuestId = (questData as any).quest_id;
    let isEdit = false;
    let questId = uuidv4(); // Default to new ID
    
    if (potentialQuestId) {
      // Check if a quest with this ID exists in the database
      try {
        const checkCommand = new GetCommand({
          TableName: process.env.QUESTS_TABLE || "quests",
          Key: {
            quest_id: potentialQuestId,
          },
        });
        
        const checkResult = await docClient.send(checkCommand);
        if (checkResult.Item) {
          // Quest exists, this is an edit
          isEdit = true;
          questId = potentialQuestId;
        }
        // If quest doesn't exist, treat as new quest with new ID
      } catch (error) {
        console.log('Error checking for existing quest, treating as new quest:', error);
        // On error, treat as new quest
      }
    }

    // Validate required fields
    if (!questData.title || !questData.description || questData.artefacts.length === 0) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    let existingQuest: Quest | null = null;
    let existingLeaderboard: any[] = [];
    let createdAt: string;

    if (isEdit) {
      // This is an edit operation - get existing quest data
      try {
        const getCommand = new GetCommand({
          TableName: process.env.QUESTS_TABLE || "quests",
          Key: {
            quest_id: questId,
          },
        });

        const result = await docClient.send(getCommand);
        
        if (result.Item) {
          existingQuest = result.Item as Quest;
          existingLeaderboard = existingQuest.leaderboard || [];
          createdAt = existingQuest.createdAt;
          console.log(`Editing quest ${questId}, preserving ${existingLeaderboard.length} leaderboard entries`);
        } else {
          return NextResponse.json(
            { error: "Quest not found for editing" },
            { status: 404 }
          );
        }
      } catch (error) {
        console.error("Error fetching existing quest:", error);
        return NextResponse.json(
          { error: "Failed to fetch existing quest data" },
          { status: 500 }
        );
      }
    } else {
      // This is a new quest
      createdAt = new Date().toISOString();
      existingLeaderboard = []; // Only empty for new quests
      console.log(`Creating new quest ${questId}`);
    }

    // Handle prize image upload
    let updatedPrize = questData.prize;
    if (prizeImage) {
      if (!updatedPrize?.title || !updatedPrize?.description) {
        return NextResponse.json(
          { error: "Prize image provided but prize details are missing" },
          { status: 400 }
        );
      }

      const buffer = Buffer.from(await prizeImage.arrayBuffer());
      const fileExtension = prizeImage.name.split(".").pop();
      const imageKey = `quests/${questId}/prize-image-${uuidv4()}.${fileExtension}`;

      await s3.send(
        new PutObjectCommand({
          Bucket: process.env.AWS_BUCKET_NAME!,
          Key: imageKey,
          Body: buffer,
          ContentType: prizeImage.type,
        })
      );

      updatedPrize = {
        ...updatedPrize,
        image: `/api/get-image?key=${encodeURIComponent(imageKey)}`
      };
    } else if (isEdit && existingQuest?.prize?.image) {
      // If editing and no new image provided, keep the existing image
      updatedPrize = {
        title: updatedPrize?.title ?? existingQuest.prize.title,
        description: updatedPrize?.description ?? existingQuest.prize.description,
        image: existingQuest.prize.image,
        imagePreview: updatedPrize?.imagePreview ?? existingQuest.prize.imagePreview
      };
    }

    if (isEdit) {
      // For edits, use UpdateCommand to preserve leaderboard
      const updateExpressions: string[] = [];
      const expressionAttributeNames: Record<string, string> = {};
      const expressionAttributeValues: Record<string, any> = {};

      // Build update expression for each field
      updateExpressions.push('#title = :title');
      expressionAttributeNames['#title'] = 'title';
      expressionAttributeValues[':title'] = questData.title;

      updateExpressions.push('#description = :description');
      expressionAttributeNames['#description'] = 'description';
      expressionAttributeValues[':description'] = questData.description;

      updateExpressions.push('#artefacts = :artefacts');
      expressionAttributeNames['#artefacts'] = 'artefacts';
      expressionAttributeValues[':artefacts'] = JSON.stringify(questData.artefacts);

      updateExpressions.push('#questType = :questType');
      expressionAttributeNames['#questType'] = 'questType';
      expressionAttributeValues[':questType'] = questData.questType;

      if (questData.dateRange) {
        updateExpressions.push('#dateRange = :dateRange');
        expressionAttributeNames['#dateRange'] = 'dateRange';
        expressionAttributeValues[':dateRange'] = JSON.stringify(questData.dateRange);
      }

      if (updatedPrize) {
        updateExpressions.push('#prize = :prize');
        expressionAttributeNames['#prize'] = 'prize';
        expressionAttributeValues[':prize'] = JSON.stringify(updatedPrize);
      }

      // Always update the updatedAt timestamp
      updateExpressions.push('#updatedAt = :updatedAt');
      expressionAttributeNames['#updatedAt'] = 'updatedAt';
      expressionAttributeValues[':updatedAt'] = new Date().toISOString();

      // EXPLICITLY preserve the leaderboard (this is the key fix)
      updateExpressions.push('#leaderboard = :leaderboard');
      expressionAttributeNames['#leaderboard'] = 'leaderboard';
      expressionAttributeValues[':leaderboard'] = existingLeaderboard;

      const updateParams = {
        TableName: process.env.QUESTS_TABLE || "quests",
        Key: { quest_id: questId },
        UpdateExpression: `SET ${updateExpressions.join(', ')}`,
        ExpressionAttributeNames: expressionAttributeNames,
        ExpressionAttributeValues: expressionAttributeValues,
        ReturnValues: 'ALL_NEW' as const,
      };

      console.log('Updating quest with preserved leaderboard:', existingLeaderboard.length, 'entries');
      
      const result = await docClient.send(new UpdateCommand(updateParams));

      console.log(`Quest updated successfully: ${questId}, leaderboard preserved with ${existingLeaderboard.length} entries`);

      return NextResponse.json({
        success: true,
        message: "Quest updated successfully",
        quest_id: questId,
        shouldRefresh: true,
        leaderboardEntriesPreserved: existingLeaderboard.length,
        quest: result.Attributes
      });

    } else {
      // For new quests, use PutItemCommand as before
      const quest: Quest = {
        quest_id: questId,
        ...questData,
        prize: updatedPrize,
        createdAt: createdAt,
        leaderboard: [], // New quests start with empty leaderboard
      };

      // Prepare DynamoDB item for new quest
      const params = {
        TableName: process.env.QUESTS_TABLE || "quests",
        Item: {
          quest_id: { S: quest.quest_id },
          title: { S: quest.title },
          description: { S: quest.description },
          artefacts: { S: JSON.stringify(quest.artefacts) },
          questType: { S: quest.questType },
          dateRange: quest.dateRange
            ? { S: JSON.stringify(quest.dateRange) }
            : { NULL: true },
          prize: quest.prize
            ? { S: JSON.stringify(quest.prize) }
            : { NULL: true },
          leaderboard: { S: JSON.stringify([]) }, // Empty leaderboard for new quests
          createdAt: { S: quest.createdAt },
        },
      };

      await dynamoDB.send(new PutItemCommand(params));

      console.log(`Quest created successfully: ${questId}`);

      return NextResponse.json({
        success: true,
        message: "Quest created successfully",
        quest_id: questId,
        shouldRefresh: true,
        leaderboardEntriesPreserved: 0
      });
    }

  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      {
        error: "Failed to save quest",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}