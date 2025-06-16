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

export async function POST(request: Request) {
  try {
    const { description, title, type } = await request.json();

    if (!description) {
      return NextResponse.json(
        { error: 'Description is required' },
        { status: 400 }
      );
    }

    const enhancedDescription = await enhanceWithHuggingFace(description, title, type);

    return NextResponse.json({ enhancedDescription });
  } catch (error) {
    console.error('Error enhancing description:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to enhance description';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}



async function enhanceWithHuggingFace(description: string, title: string, type: string): Promise<string> {
  if (!process.env.HUGGINGFACE_API_KEY) {
    console.log("No API keys available, using fallback enhancement");
    return createFallbackEnhancement(description);
  }

  try {    const response = await fetch('https://router.huggingface.co/novita/v3/openai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: [
          {
            role: "system",
            content: SYSTEM_PROMPT
          },
          {
            role: "user",            content: `Transform this quest description into an engaging narrative, keeping the same goals but making it more immersive: ${description}

Return only the enhanced description text, without any formatting, titles, or additional context.`
          }
        ],
        model: "deepseek/deepseek-v3-0324",
        stream: false,
        temperature: 0.8
      })
    });

    if (response.ok) {
      const result = await response.json();      const enhancedText = result?.choices?.[0]?.message?.content || '';
      
      // Clean up the response
      const cleanedText = enhancedText.trim();
        
      if (cleanedText.length > 20) {
        return cleanedText;
      }
    }
  } catch (error) {
    console.error('Hugging Face enhancement failed:', error);
  }

  return createFallbackEnhancement(description);
}

function createFallbackEnhancement(originalDescription: string): string {
  if (!originalDescription || originalDescription.trim().length === 0) {
    return "Embark on an extraordinary quest filled with mystery and discovery! Uncover hidden secrets and solve fascinating puzzles in this immersive museum adventure.";
  }

  // Smart enhancement based on content analysis
  const description = originalDescription.toLowerCase();
  const hasAction = /find|discover|explore|search|collect|solve|navigate|uncover/.test(description);
  const hasHistory = /ancient|historical|past|century|era|artifact|culture/.test(description);
  const hasMystery = /mystery|secret|hidden|puzzle|clue|riddle/.test(description);
  
  let enhancementStyle = '';
  
  if (hasMystery) {
    enhancementStyle = 'Unravel the mysteries and ';
  } else if (hasHistory) {
    enhancementStyle = 'Journey through time and ';
  } else if (hasAction) {
    enhancementStyle = 'Embark on an exciting adventure to ';
  } else {
    enhancementStyle = 'Discover the fascinating world of ';
  }
  
  // Add engaging descriptors
  const descriptors = [
    'captivating', 'immersive', 'thrilling', 'extraordinary', 
    'fascinating', 'engaging', 'remarkable', 'intriguing'
  ];
  
  const randomDescriptor = descriptors[Math.floor(Math.random() * descriptors.length)];
  
  // Add educational context
  const endings = [
    'in this interactive museum experience that combines learning with adventure.',
    'through hands-on exploration and discovery.',
    'while uncovering fascinating historical insights.',
    'in an unforgettable educational journey.',
    'that will challenge your mind and spark your curiosity.'
  ];
  
  const randomEnding = endings[Math.floor(Math.random() * endings.length)];
  
  return `${enhancementStyle}${originalDescription.toLowerCase()} in this ${randomDescriptor} quest ${randomEnding}`;
}