import { NextRequest, NextResponse } from 'next/server';
import AWS from 'aws-sdk';

const lambda = new AWS.Lambda({
  region: process.env.AWS_REGION,
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const params = {
      FunctionName: process.env.QR_LAMBDA_FUNCTION_NAME!,
      Payload: JSON.stringify({
        body: JSON.stringify(body),
        httpMethod: 'POST'
      }),
    };

    const result = await lambda.invoke(params).promise();

    if (result.FunctionError) {
      let errorDetails = result.FunctionError;
      if (result.Payload) {
        try {
          const errorPayload = JSON.parse(result.Payload.toString());
          errorDetails = errorPayload.errorMessage || errorPayload.message || result.FunctionError;
        } catch (e) {
          // If payload isn't JSON, use the raw payload
          errorDetails = result.Payload.toString();
        }
      }
      
      return NextResponse.json(
        { 
          error: 'Lambda function error', 
          details: errorDetails,
          functionError: result.FunctionError
        },
        { status: 500 }
      );
    }
    
    if (result.Payload) {
      const response = JSON.parse(result.Payload.toString());
      
      if (response.statusCode === 200) {
        const responseBody = JSON.parse(response.body);
        return NextResponse.json(responseBody);
      } else {
        return NextResponse.json(
          JSON.parse(response.body),
          { status: response.statusCode }
        );
      }
    } else {
      console.error('No payload from Lambda');
      return NextResponse.json(
        { error: 'No response from Lambda' },
        { status: 500 }
      );
    }
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json(
        { 
          error: 'Internal server error', 
          message: error.message,
          stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        },
        { status: 500 }
      );
    } else {
      return NextResponse.json(
        { error: 'Unknown error occurred' },
        { status: 500 }
      );
    }
  }
}

// Handle non-POST methods
export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  );
}

export async function PUT() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  );
}

export async function DELETE() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  );
}