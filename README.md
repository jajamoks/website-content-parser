# Website Content Parser

A powerful TypeScript/Node.js HTML parser with a Next.js app for visualizing parsed content. This tool extracts structured content from any website and renders it block-by-block with proper formatting.

## Features

- **Comprehensive HTML Parsing**: Extracts paragraphs, headings (H1-H6), videos, iframes, images, divs, lists, code blocks, and more
- **Structure Analysis**: Detects page layouts (single, multi-column, grid, flex)
- **Metadata Extraction**: Captures title, description, Open Graph tags, and other metadata
- **Block-Based Rendering**: Visualizes parsed content in a clean, structured format
- **JSON Export**: Download parsed content as JSON for further processing
- **TypeScript**: Fully typed for better developer experience
- **Best Practices**: Uses Cheerio for parsing, Zod for validation, and follows modern TypeScript patterns

## Installation

```bash
npm install
```

## Usage

### 1. Next.js Web App (Recommended)

Start the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

Enter any website URL in the input field and click "Parse" to see the structured content.

### 2. CLI Tool

Parse a URL from the command line:

```bash
npm run parse https://example.com
```

The output will be a JSON structure containing all parsed blocks.

### 3. Programmatic Usage

```typescript
import { HTMLParser } from './src/parser/html-parser';

const parser = new HTMLParser({
  includeMetadata: true,
  includeStructure: true,
  maxDepth: 10,
  includeAttributes: true,
});

const result = await parser.parseFromUrl('https://example.com');
console.log(result);
```

### 4. API Endpoint

Once the Next.js app is running, you can use the API endpoint:

```bash
curl -X POST http://localhost:3000/api/parse \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://example.com",
    "options": {
      "includeMetadata": true,
      "includeStructure": true
    }
  }'
```

## Parser Options

```typescript
interface ParserOptions {
  includeMetadata?: boolean;      // Extract meta tags (default: true)
  includeStructure?: boolean;     // Analyze page structure (default: true)
  maxDepth?: number;              // Maximum nesting depth (default: 10)
  ignoreSelectors?: string[];     // CSS selectors to ignore (default: ['script', 'style', 'nav', 'footer', 'header'])
  includeAttributes?: boolean;    // Include HTML attributes (default: true)
}
```

## Supported Block Types

The parser extracts and categorizes the following content blocks:

- **Headings**: H1-H6 with hierarchy levels
- **Paragraphs**: Text content with formatting
- **Images**: With src, alt text, dimensions
- **Videos**: With source, poster, dimensions
- **Iframes**: Embedded content (YouTube, maps, etc.)
- **Lists**: Ordered and unordered lists
- **Code Blocks**: Pre-formatted code with language detection
- **Blockquotes**: Quoted content with citations
- **Containers**: Divs, sections, and articles with nested children
- **Links**: Hyperlinks with URLs

## Output Structure

```json
{
  "url": "https://example.com",
  "title": "Page Title",
  "metadata": {
    "description": "Page description",
    "keywords": ["keyword1", "keyword2"],
    "author": "Author name",
    "ogImage": "https://example.com/image.jpg"
  },
  "blocks": [
    {
      "id": "block-1",
      "type": "heading",
      "level": 1,
      "text": "Main Heading",
      "order": 1
    },
    {
      "id": "block-2",
      "type": "paragraph",
      "text": "Paragraph content...",
      "order": 2
    }
  ],
  "structure": {
    "layout": "multi-column",
    "hasNavigation": true,
    "hasHeader": true,
    "hasFooter": true,
    "hasSidebar": false
  },
  "parsedAt": "2024-01-01T00:00:00.000Z"
}
```

## Architecture

### Parser (`src/parser/html-parser.ts`)

- Uses Cheerio for fast, jQuery-like HTML parsing
- Recursive traversal with configurable depth limits
- Intelligent layout detection (single, multi-column, grid, flex)
- Metadata extraction from meta tags and Open Graph protocol
- Attribute preservation for styling and data attributes

### Type System (`src/types/parser.ts`)

- Comprehensive TypeScript types for all block types
- Discriminated unions for type-safe block handling
- Extensible structure for adding new block types

### Next.js App (`src/app/`)

- Modern Next.js 14 with App Router
- Tailwind CSS for styling
- Block-based content renderer
- Responsive design
- JSON export functionality

### API Route (`src/app/api/parse/route.ts`)

- RESTful API endpoint
- Zod validation for request bodies
- Error handling and logging
- Configurable parser options

## Development

### Project Structure

```
website-content-parser/
├── src/
│   ├── app/                    # Next.js app directory
│   │   ├── api/
│   │   │   └── parse/
│   │   │       └── route.ts    # API endpoint
│   │   ├── globals.css         # Global styles
│   │   ├── layout.tsx          # Root layout
│   │   └── page.tsx            # Home page
│   ├── components/             # React components
│   │   ├── blocks/
│   │   │   └── BlockRenderer.tsx
│   │   └── ContentRenderer.tsx
│   ├── parser/                 # Parser logic
│   │   ├── html-parser.ts      # Main parser class
│   │   └── cli.ts              # CLI tool
│   └── types/                  # TypeScript types
│       └── parser.ts
├── package.json
├── tsconfig.json
├── next.config.js
└── tailwind.config.js
```

### Scripts

- `npm run dev` - Start Next.js development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run parse <url>` - Parse URL from CLI

## Best Practices Implemented

1. **Type Safety**: Full TypeScript coverage with strict mode
2. **Error Handling**: Comprehensive error handling and validation
3. **Performance**: Efficient parsing with configurable depth limits
4. **Security**: Input validation with Zod schemas
5. **Modularity**: Separated concerns (parser, types, UI, API)
6. **Extensibility**: Easy to add new block types and features
7. **Testing Ready**: Clean architecture suitable for unit testing

## Use Cases

- **Content Migration**: Extract content from old websites
- **Web Scraping**: Structure unstructured web content
- **Content Analysis**: Analyze page structure and layout
- **Documentation**: Generate documentation from web pages
- **Archiving**: Preserve web content in structured format
- **SEO Analysis**: Extract and analyze page metadata

## Limitations

- JavaScript-rendered content requires the page to be pre-rendered
- Some dynamic content may not be captured
- Complex layouts may be simplified in the structure analysis
- Large pages may hit depth limits (configurable)

## Future Enhancements

- Support for JavaScript-rendered pages (Puppeteer integration)
- Table extraction and formatting
- Form element parsing
- CSS extraction and preservation
- Multi-page crawling
- Content similarity detection
- Advanced layout analysis

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit issues or pull requests.
