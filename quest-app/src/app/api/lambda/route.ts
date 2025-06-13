import { NextRequest, NextResponse } from 'next/server';
import AWS from 'aws-sdk';

const lambda = new AWS.Lambda({
  region: process.env.AWS_REGION,
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
});

export async function POST(request: NextRequest) {
  // Validate environment variables
  if (!process.env.QR_LAMBDA_FUNCTION_NAME) {
    console.error('QR_LAMBDA_FUNCTION_NAME environment variable is not set');
    return NextResponse.json(
      { error: 'Lambda function name not configured' },
      { status: 500 }
    );
  }

  if (!process.env.AWS_REGION || !process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
    console.error('AWS credentials not properly configured');
    return NextResponse.json(
      { error: 'AWS credentials not configured' },
      { status: 500 }
    );
  }

  try {
    const body = await request.json();
    
    console.log('Invoking Lambda function:', process.env.QR_LAMBDA_FUNCTION_NAME);
    console.log('Request body:', JSON.stringify(body, null, 2));

    const params = {
      FunctionName: process.env.QR_LAMBDA_FUNCTION_NAME!,
      Payload: JSON.stringify({
        body: JSON.stringify(body),
        httpMethod: 'POST'
      }),
    };

    const result = await lambda.invoke(params).promise();
    
    console.log('Lambda response:', result);

    if (result.FunctionError) {
      console.error('Lambda function error:', result.FunctionError);
      console.error('Lambda error payload:', result.Payload?.toString());
      
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
      console.log('Parsed Lambda response:', response);
      
      if (response.statusCode === 200) {
        const responseBody = JSON.parse(response.body);
        return NextResponse.json(responseBody);
      } else {
        console.error('Lambda returned error status:', response.statusCode);
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
    console.error('Lambda invocation error:', error);
    
    // Provide more specific error information
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