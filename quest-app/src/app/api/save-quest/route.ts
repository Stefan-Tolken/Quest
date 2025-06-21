import { NextResponse } from "next/server";
import { DynamoDBClient, PutItemCommand } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand } from "@aws-sdk/lib-dynamodb";
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
    const isEdit = formData.get("isEdit") === "true";
    const editQuestId = formData.get("editQuestId") as string | null;

    // Validate required fields
    if (!questData.title || !questData.description || questData.artefacts.length === 0) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    let questId: string;
    let existingQuest: Quest | null = null;
    let existingLeaderboard: any[] = [];
    let createdAt: string;

    if (isEdit && editQuestId) {
      // This is an edit operation - get existing quest data
      questId = editQuestId;
      
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
      questId = uuidv4();
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

    // Prepare complete quest object - preserve existing leaderboard for edits
    const quest: Quest = {
      quest_id: questId,
      ...questData,
      prize: updatedPrize,
      createdAt: createdAt,
      leaderboard: existingLeaderboard, // Preserve existing leaderboard data
    };

    // Prepare DynamoDB item
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
        leaderboard: { S: JSON.stringify(existingLeaderboard) }, // Use preserved leaderboard
        createdAt: { S: quest.createdAt },
      },
    };

    await dynamoDB.send(new PutItemCommand(params));

    const operation = isEdit ? 'updated' : 'created';
    console.log(`Quest ${operation} successfully: ${questId}`);

    return NextResponse.json({
      success: true,
      message: `Quest ${operation} successfully`,
      quest_id: questId,
      shouldRefresh: true,
      leaderboardEntriesPreserved: existingLeaderboard.length
    });
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