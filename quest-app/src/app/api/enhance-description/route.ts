import { NextResponse } from 'next/server';

const SYSTEM_PROMPT = `You are an expert museum curator and storyteller. Your task is to enhance quest descriptions. Write in a clear, direct style without markdown or formatting. Keep your responses focused on the description only. Follow these rules:
1. Maintain the core meaning and objectives
2. Make the description engaging and immersive
3. Use appropriate language for museum visitors
4. Keep the educational value while making it fun
5. Ensure clarity of objectives
6. Do not include titles, bullet points, or markdown
7. Return only the enhanced description text
Do not invent new requirements or change the fundamental quest goals.`;

// Default to OpenAI > HuggingFace > fallback
export async function POST(request: Request) {
  try {
    const { description, title, type } = await request.json();
    console.log('[Enhancement API] Request received:', { title, type, descriptionLength: description?.length });

    if (!description) {
      console.log('[Enhancement API] Error: Missing description');
      return NextResponse.json({ error: 'Description is required' }, { status: 400 });
    }

    // Attempt OpenAI
    if (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'your-api-key') {
      console.log('[Enhancement API] Attempting OpenAI enhancement');
      try {
        const enhancedDescription = await enhanceWithOpenAI(description, title, type);
        console.log('[Enhancement API] OpenAI enhancement successful');
        return NextResponse.json({ enhancedDescription, provider: 'openai' });
      } catch (error) {
        console.error('[Enhancement API] OpenAI failed:', error);
      }
    } else {
      console.log('[Enhancement API] OpenAI not configured or using placeholder key, skipping');
    }

    // Attempt Hugging Face
    if (process.env.HUGGINGFACE_API_KEY && process.env.HUGGINGFACE_API_KEY !== 'your-api-key') {
      console.log('[Enhancement API] Attempting Hugging Face enhancement');
      try {
        const enhancedDescription = await enhanceWithHuggingFace(description, title, type);
        console.log('[Enhancement API] Hugging Face enhancement successful');
        return NextResponse.json({ enhancedDescription, provider: 'huggingface' });
      } catch (error) {
        console.error('[Enhancement API] Hugging Face failed:', error);
      }
    } else {
      console.log('[Enhancement API] Hugging Face not configured or using placeholder key, skipping');
    }

    // Final fallback
    console.log('[Enhancement API] Using fallback enhancement');
    const enhancedDescription = createFallbackEnhancement(description);
    return NextResponse.json({ enhancedDescription, provider: 'fallback' });

  } catch (error) {
    console.error('[Enhancement API] General error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown enhancement error' },
      { status: 500 }
    );
  }
}

async function enhanceWithOpenAI(description: string, title: string, type: string): Promise<string> {
  console.log('[Enhancement API] OpenAI: Starting enhancement', { model: process.env.OPENAI_MODEL || 'gpt-3.5-turbo' });
  const model = process.env.OPENAI_MODEL || 'gpt-3.5-turbo';

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: `Transform this quest description into an engaging narrative, keeping the same goals but making it more immersive: ${description}\n\nReturn only the enhanced description text, without any formatting, titles, or additional context.` }
      ],
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    console.error('[Enhancement API] OpenAI: API error', {
      status: response.status,
      statusText: response.statusText,
      error: errorData.error
    });
    throw new Error(`OpenAI API error: ${response.status} - ${errorData.error?.message || response.statusText}`);
  }

  const data = await response.json();
  const enhancedText = data.choices?.[0]?.message?.content?.trim() || '';
  
  if (enhancedText.length <= 20) {
    console.warn('[Enhancement API] OpenAI: Response too short, falling back');
    return createFallbackEnhancement(description);
  }
  
  console.log('[Enhancement API] OpenAI: Enhancement completed successfully');
  return enhancedText;
}

async function enhanceWithHuggingFace(description: string, title: string, type: string): Promise<string> {
  const endpoint = process.env.HF_ENDPOINT || 'https://router.huggingface.co/novita/v3/openai/chat/completions';
  const model = process.env.HF_MODEL || 'deepseek/deepseek-v3-0324';
  
  console.log('[Enhancement API] Hugging Face: Starting enhancement', { model });

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: `Transform this quest description into an engaging narrative, keeping the same goals but making it more immersive: ${description}\n\nReturn only the enhanced description text, without any formatting, titles, or additional context.` }
      ],
      model,
      stream: false,
      temperature: 0.8,
    }),
  });

  if (!response.ok) {
    console.error('[Enhancement API] Hugging Face: API error', {
      status: response.status,
      statusText: response.statusText
    });
    throw new Error(`Hugging Face API error: ${response.status}`);
  }

  const result = await response.json();
  const enhancedText = result?.choices?.[0]?.message?.content?.trim() || '';
  
  if (enhancedText.length <= 20) {
    console.warn('[Enhancement API] Hugging Face: Response too short, falling back');
    return createFallbackEnhancement(description);
  }
  
  console.log('[Enhancement API] Hugging Face: Enhancement completed successfully');
  return enhancedText;
}

function createFallbackEnhancement(originalDescription: string): string {
  console.log('[Enhancement API] Fallback: Starting enhancement');
  
  if (!originalDescription || originalDescription.trim().length === 0) {
    console.log('[Enhancement API] Fallback: Using default description for empty input');
    return "Embark on an extraordinary quest filled with mystery and discovery! Uncover hidden secrets and solve fascinating puzzles in this immersive museum adventure.";
  }

  const description = originalDescription.trim();
  const lower = description.toLowerCase();

  const hasAction = /find|discover|explore|search|collect|solve|navigate|uncover/.test(lower);
  const hasHistory = /ancient|historical|past|century|era|artifact|culture/.test(lower);
  const hasMystery = /mystery|secret|hidden|puzzle|clue|riddle/.test(lower);

  console.log('[Enhancement API] Fallback: Detected themes', { hasAction, hasHistory, hasMystery });

  let opening = 'Discover the fascinating world of ';
  if (hasMystery) opening = 'Unravel the mysteries and ';
  else if (hasHistory) opening = 'Journey through time and ';
  else if (hasAction) opening = 'Embark on an exciting adventure to ';

  const descriptors = ['captivating', 'immersive', 'thrilling', 'extraordinary', 'fascinating', 'engaging', 'remarkable', 'intriguing'];
  const endings = [
    'in this interactive museum experience that combines learning with adventure.',
    'through hands-on exploration and discovery.',
    'while uncovering fascinating historical insights.',
    'in an unforgettable educational journey.',
    'that will challenge your mind and spark your curiosity.'
  ];

  const randomDescriptor = descriptors[Math.floor(Math.random() * descriptors.length)];
  const randomEnding = endings[Math.floor(Math.random() * endings.length)];

  const enhancedText = `${opening}${description} in this ${randomDescriptor} quest ${randomEnding}`;
  console.log('[Enhancement API] Fallback: Enhancement completed successfully');
  return enhancedText;
}
