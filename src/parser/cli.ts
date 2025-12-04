#!/usr/bin/env node
import { HTMLParser } from './html-parser';

/**
 * CLI tool for parsing HTML content
 * Usage: ts-node src/parser/cli.ts <url>
 */
async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.error('Usage: npm run parse <url>');
    console.error('Example: npm run parse https://example.com');
    process.exit(1);
  }

  const url = args[0];

  try {
    console.log(`Parsing URL: ${url}\n`);

    const parser = new HTMLParser({
      includeMetadata: true,
      includeStructure: true,
      maxDepth: 10,
      includeAttributes: true,
    });

    const result = await parser.parseFromUrl(url);

    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    console.error('Error parsing URL:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

main();
