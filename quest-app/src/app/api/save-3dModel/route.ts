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
    console.log('📥 Received model metadata:', {
      id: model.id,
      name: model.name,
      fileName: model.fileName,
      url: model.url?.substring(0, 50) + '...',
      pointsCount: model.points?.length,
      light: model.light
    });
    
    if (!model.name || !model.url || !model.fileName) {
      console.log('❌ Missing required fields:', { 
        name: !!model.name, 
        url: !!model.url, 
        fileName: !!model.fileName 
      });
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // ✅ The URL should already be the S3 URL - no file processing needed!
    const s3Url = model.url;
    console.log('✅ Using S3 URL directly:', s3Url);

    // Save metadata to DynamoDB
    console.log('💾 Saving metadata to DynamoDB...');
    const params = {
      TableName: process.env.MODEL_3D_TABLE || "models3d",
      Item: {
        id: { S: model.id },
        name: { S: model.name },
        fileName: { S: model.fileName },
        url: { S: s3Url },
        points: { S: JSON.stringify(model.points) },
        createdAt: { S: new Date().toISOString() },
        light: { N: model.light !== undefined ? String(model.light) : "5" },
      },
    };
    
    console.log('📤 DynamoDB save params:', {
      TableName: params.TableName,
      id: params.Item.id.S,
      name: params.Item.name.S,
      fileName: params.Item.fileName.S,
      url: params.Item.url.S?.substring(0, 50) + '...',
      pointsCount: JSON.parse(params.Item.points.S).length,
      light: params.Item.light.N
    });
    
    const result = await dynamoDB.send(new PutItemCommand(params));
    console.log('✅ DynamoDB save successful:', result.$metadata);

    return NextResponse.json({ success: true, id: model.id, url: s3Url });
  } catch (error) {
    console.error("❌ 3D Model Save Error:", error);
    return NextResponse.json(
      { 
        error: "Failed to save 3D model", 
        details: error instanceof Error ? error.message : "Unknown error" 
      },
      { status: 500 }
    );
  }
}
