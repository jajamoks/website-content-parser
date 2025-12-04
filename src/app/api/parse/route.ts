import { NextRequest, NextResponse } from 'next/server';
import { HTMLParser } from '@/parser/html-parser';
import { z } from 'zod';

const parseRequestSchema = z.object({
  url: z.string().url('Invalid URL format'),
  options: z.object({
    includeMetadata: z.boolean().optional(),
    includeStructure: z.boolean().optional(),
    maxDepth: z.number().min(1).max(20).optional(),
    ignoreSelectors: z.array(z.string()).optional(),
    includeAttributes: z.boolean().optional(),
  }).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate request body
    const validationResult = parseRequestSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: validationResult.error.errors },
        { status: 400 }
      );
    }

    const { url, options } = validationResult.data;

    // Create parser instance with options
    const parser = new HTMLParser(options || {});

    // Parse the URL
    const parsedContent = await parser.parseFromUrl(url);

    return NextResponse.json(parsedContent, { status: 200 });
  } catch (error) {
    console.error('Parse error:', error);

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to parse URL',
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    {
      message: 'HTML Parser API',
      usage: 'Send POST request with { url: string, options?: ParserOptions }',
      example: {
        url: 'https://example.com',
        options: {
          includeMetadata: true,
          includeStructure: true,
          maxDepth: 10,
          includeAttributes: true,
        },
      },
    },
    { status: 200 }
  );
}
