import { NextResponse } from "next/server";
import { DynamoDBClient, PutItemCommand } from "@aws-sdk/client-dynamodb";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { v4 as uuidv4 } from "uuid";
import { ModelObject } from "@/lib/types";

// Configure AWS SDK
const dynamoDB = new DynamoDBClient({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

export async function POST(request: Request) {
  try {
    const model: ModelObject = await request.json();
    if (!model.name || !model.url || !model.fileName) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    //return NextResponse.json({ success: true, received: model });

    let s3Url = model.url;
    // If url is a base64 string, upload to S3
    if (typeof model.url === "string" && model.url.startsWith("data:application/octet-stream;base64")) {
      try {
        const matches = model.url.match(/^data:([A-Za-z-+/]+);base64,(.+)$/);
        if (matches && matches.length === 3) {
          const contentType = matches[1];
          const base64Data = matches[2];
          const buffer = Buffer.from(base64Data, "base64");
          const timestamp = Date.now();
          const s3Key = `models/${model.id || uuidv4()}-${model.fileName}`;
          await s3.send(
            new PutObjectCommand({
              Bucket: process.env.AWS_BUCKET_NAME!,
              Key: s3Key,
              Body: buffer,
              ContentType: contentType,
            })
          );
          s3Url = `/api/get-3dModel?key=${encodeURIComponent(s3Key)}`;
        }
      } catch (err) {
        console.error("S3 upload failed for 3D model:", err);
        return NextResponse.json({ error: "S3 upload failed" }, { status: 500 });
      }
    }

    // Save metadata to DynamoDB
    const params = {
      TableName: "models3d",
      Item: {
        id: { S: model.id },
        name: { S: model.name },
        fileName: { S: model.fileName },
        url: { S: s3Url },
        points: { S: JSON.stringify(model.points) },
        createdAt: { S: new Date().toISOString() },
        light: { N: model.light !== undefined ? String(model.light) : "5" }, // Save light as number, default 5
      },
    };
    await dynamoDB.send(new PutItemCommand(params));

    return NextResponse.json({ success: true, id: model.id, url: s3Url });
  } catch (error) {
    console.error("3D Model Save Error:", error);
    return NextResponse.json(
      { error: "Failed to save 3D model", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
