// app/api/save-user/route.ts
import { NextResponse } from 'next/server';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { UserData } from '@/lib/types';
import { v4 as uuidv4 } from 'uuid';

// Initialize DynamoDB client (following your pattern)
const dynamoDB = new DynamoDBClient({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

// Initialize S3 client (following your pattern)
const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

const docClient = DynamoDBDocumentClient.from(dynamoDB);
const TABLE_NAME = 'userData';

// Helper function to extract S3 key from profile image URL
const extractS3KeyFromUrl = (url: string): string | null => {
  try {
    // Handle URLs in format: /api/get-image?key=profile/userId/profile-image-uuid.ext
    if (url.includes('/api/get-image?key=')) {
      const keyParam = url.split('key=')[1];
      return decodeURIComponent(keyParam);
    }
    
    // Handle direct S3 URLs if they exist in a different format
    if (url.includes('amazonaws.com/')) {
      const parts = url.split('amazonaws.com/');
      if (parts.length > 1) {
        return parts[1].split('?')[0]; // Remove query parameters if any
      }
    }
    
    return null;
  } catch (error) {
    console.error('Error extracting S3 key from URL:', error);
    return null;
  }
};

// Helper function to delete old profile image from S3
const deleteOldProfileImage = async (oldImageUrl: string): Promise<void> => {
  try {
    const s3Key = extractS3KeyFromUrl(oldImageUrl);
    
    if (!s3Key) {
      console.log('Could not extract S3 key from URL:', oldImageUrl);
      return;
    }

    console.log('Attempting to delete old profile image:', s3Key);

    await s3.send(
      new DeleteObjectCommand({
        Bucket: process.env.AWS_BUCKET_NAME!,
        Key: s3Key,
      })
    );

    console.log('Successfully deleted old profile image:', s3Key);
  } catch (error) {
    // Log the error but don't fail the whole operation
    console.error('Error deleting old profile image:', error);
    console.error('Old image URL was:', oldImageUrl);
  }
};

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const email = formData.get('email') as string;
    const displayName = formData.get('displayName') as string;
    const profileImageFile = formData.get('profileImage') as File | null;

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    if (!displayName) {
      return NextResponse.json({ error: 'Display name is required' }, { status: 400 });
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
    let profileImageUrl = user.profileImage; // Keep existing image if no new one uploaded
    const oldProfileImageUrl = user.profileImage; // Store the old URL for deletion

    // Handle profile image upload to S3 (following your pattern)
    if (profileImageFile) {
      try {
        // Generate unique filename using your pattern
        const buffer = Buffer.from(await profileImageFile.arrayBuffer());
        const fileExtension = profileImageFile.name.split('.').pop() || 'jpg';
        const imageKey = `profile/${user.userId}/profile-image-${uuidv4()}.${fileExtension}`;

        // Upload new image to S3 using your pattern
        await s3.send(
          new PutObjectCommand({
            Bucket: process.env.AWS_BUCKET_NAME!,
            Key: imageKey,
            Body: buffer,
            ContentType: profileImageFile.type,
          })
        );

        // Construct the new URL using your API pattern
        profileImageUrl = `/api/get-image?key=${encodeURIComponent(imageKey)}`;
        
        console.log('New profile image uploaded successfully:', profileImageUrl);

        // Delete the old profile image if it exists and is different from the new one
        if (oldProfileImageUrl && oldProfileImageUrl !== profileImageUrl) {
          // Delete old image asynchronously to not block the response
          deleteOldProfileImage(oldProfileImageUrl).catch(error => {
            console.error('Failed to delete old profile image:', error);
          });
        }
        
      } catch (uploadError) {
        console.error('Error uploading profile image:', uploadError);
        return NextResponse.json({ 
          error: 'Failed to upload profile image' 
        }, { status: 500 });
      }
    }

    // Update user data in DynamoDB using your UpdateCommand pattern
    const updateExpressions: string[] = [];
    const expressionAttributeNames: Record<string, string> = {};
    const expressionAttributeValues: Record<string, any> = {};

    // Add display name update
    updateExpressions.push('#displayName = :displayName');
    expressionAttributeNames['#displayName'] = 'displayName';
    expressionAttributeValues[':displayName'] = displayName;

    // Add profile image update if we have a new URL
    if (profileImageUrl) {
      updateExpressions.push('#profileImage = :profileImage');
      expressionAttributeNames['#profileImage'] = 'profileImage';
      expressionAttributeValues[':profileImage'] = profileImageUrl;
    }

    // Always update the updatedAt timestamp (following your pattern)
    updateExpressions.push('#updatedAt = :updatedAt');
    expressionAttributeNames['#updatedAt'] = 'updatedAt';
    expressionAttributeValues[':updatedAt'] = new Date().toISOString();

    // Update the user in DynamoDB using your pattern
    const updateParams = {
      TableName: TABLE_NAME,
      Key: { userId: user.userId },
      UpdateExpression: `SET ${updateExpressions.join(', ')}`,
      ExpressionAttributeNames: expressionAttributeNames,
      ExpressionAttributeValues: expressionAttributeValues,
      ReturnValues: 'ALL_NEW' as const,
    };

    const result = await docClient.send(new UpdateCommand(updateParams));

    console.log(`User profile updated successfully: ${user.userId}`);

    return NextResponse.json({ 
      success: true,
      user: result.Attributes as UserData,
      message: 'Profile updated successfully'
    });

  } catch (error) {
    console.error('Error saving user profile:', error);
    return NextResponse.json({ 
      error: 'Failed to save profile',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}