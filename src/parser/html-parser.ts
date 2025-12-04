import * as cheerio from 'cheerio';
import axios from 'axios';
import {
  ParsedContent,
  ContentBlock,
  ParserOptions,
  HeadingBlock,
  ParagraphBlock,
  ImageBlock,
  VideoBlock,
  IframeBlock,
  ListBlock,
  CodeBlock,
  BlockquoteBlock,
  DivBlock,
  SectionBlock,
  ArticleBlock,
  LayoutType,
} from '../types/parser';

export class HTMLParser {
  private blockCounter = 0;
  private options: Required<ParserOptions>;

  constructor(options: ParserOptions = {}) {
    this.options = {
      includeMetadata: options.includeMetadata ?? true,
      includeStructure: options.includeStructure ?? true,
      maxDepth: options.maxDepth ?? 10,
      ignoreSelectors: options.ignoreSelectors ?? ['script', 'style', 'noscript'],
      includeAttributes: options.includeAttributes ?? true,
    };
  }

  /**
   * Fetch and parse HTML from a URL
   */
  async parseFromUrl(url: string): Promise<ParsedContent> {
    try {
      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
          'Accept-Encoding': 'gzip, deflate, br',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1',
          'Sec-Fetch-Dest': 'document',
          'Sec-Fetch-Mode': 'navigate',
          'Sec-Fetch-Site': 'none',
          'Cache-Control': 'max-age=0',
        },
        timeout: 30000,
      });

      const html = response.data;
      return this.parseHTML(html, url);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(`Failed to fetch URL: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * Parse HTML string
   */
  parseHTML(html: string, url: string): ParsedContent {
    const $ = cheerio.load(html);
    this.blockCounter = 0;

    // Remove ignored elements
    this.options.ignoreSelectors.forEach((selector) => {
      $(selector).remove();
    });

    const title = $('title').text() || '';
    const metadata = this.options.includeMetadata ? this.extractMetadata($) : {};
    const structure = this.options.includeStructure ? this.analyzeStructure($) : {
      layout: 'single' as LayoutType,
      hasNavigation: false,
      hasHeader: false,
      hasFooter: false,
      hasSidebar: false,
    };

    // Try to find main content area first
    let contentElement = $(
      'main, [role="main"], article, .post-content, .blog-content, .entry-content, .content-area, .blog__post-content-wrapper'
    ).first();

    // If no main content area found, fall back to body
    if (contentElement.length === 0) {
      contentElement = $('body');
    }

    // Parse main content
    const blocks = this.parseElement($, contentElement, 0);

    return {
      url,
      title,
      metadata,
      blocks,
      structure,
      parsedAt: new Date().toISOString(),
    };
  }

  /**
   * Extract metadata from HTML
   */
  private extractMetadata($: cheerio.CheerioAPI): ParsedContent['metadata'] {
    return {
      description: $('meta[name="description"]').attr('content'),
      keywords: $('meta[name="keywords"]').attr('content')?.split(',').map(k => k.trim()),
      author: $('meta[name="author"]').attr('content'),
      ogImage: $('meta[property="og:image"]').attr('content'),
      ogTitle: $('meta[property="og:title"]').attr('content'),
      ogDescription: $('meta[property="og:description"]').attr('content'),
    };
  }

  /**
   * Analyze page structure
   */
  private analyzeStructure($: cheerio.CheerioAPI): ParsedContent['structure'] {
    const hasNavigation = $('nav').length > 0;
    const hasHeader = $('header').length > 0;
    const hasFooter = $('footer').length > 0;
    const hasSidebar = $('aside, .sidebar, [class*="sidebar"]').length > 0;

    // Detect layout type
    let layout: LayoutType = 'single';
    const body = $('body');

    if (body.css('display') === 'grid' || body.find('[style*="display: grid"]').length > 0) {
      layout = 'grid';
    } else if (body.css('display') === 'flex' || body.find('[style*="display: flex"]').length > 0) {
      layout = 'flex';
    } else if (body.find('.column, [class*="col-"]').length > 1) {
      layout = 'multi-column';
    }

    return {
      layout,
      hasNavigation,
      hasHeader,
      hasFooter,
      hasSidebar,
    };
  }

  /**
   * Parse an element and its children recursively
   */
  private parseElement(
    $: cheerio.CheerioAPI,
    element: cheerio.Cheerio<any>,
    depth: number,
    parent?: string
  ): ContentBlock[] {
    if (depth > this.options.maxDepth) {
      return [];
    }

    const blocks: ContentBlock[] = [];
    const children = element.children();

    children.each((index, child) => {
      const $child = $(child);
      const tagName = child.tagName?.toLowerCase();

      if (!tagName) return;

      const block = this.parseNode($, $child, tagName, depth, parent);
      if (block) {
        blocks.push(block);
      }
    });

    return blocks;
  }

  /**
   * Parse a single node into a ContentBlock
   */
  private parseNode(
    $: cheerio.CheerioAPI,
    element: cheerio.Cheerio<any>,
    tagName: string,
    depth: number,
    parent?: string
  ): ContentBlock | null {
    const id = `block-${++this.blockCounter}`;
    const order = this.blockCounter;
    const attributes = this.options.includeAttributes ? this.getAttributes(element) : {};

    switch (tagName) {
      case 'h1':
      case 'h2':
      case 'h3':
      case 'h4':
      case 'h5':
      case 'h6': {
        const level = parseInt(tagName[1]) as 1 | 2 | 3 | 4 | 5 | 6;
        return {
          id,
          type: 'heading',
          level,
          text: element.text().trim(),
          order,
          parent,
          attributes,
        } as HeadingBlock;
      }

      case 'p': {
        const text = element.text().trim();
        if (!text) return null;
        return {
          id,
          type: 'paragraph',
          text,
          order,
          parent,
          attributes,
        } as ParagraphBlock;
      }

      case 'img': {
        // Handle lazy loading: check multiple possible src attributes
        // Priority: data-amsrc, data-src, data-lazy-src, data-original, data-lazy, srcset, then src
        let src = element.attr('data-amsrc')
          || element.attr('data-src')
          || element.attr('data-lazy-src')
          || element.attr('data-original')
          || element.attr('data-lazy');

        // Check parent picture element for source srcset
        if (!src) {
          const parent = element.parent();
          if (parent && parent.prop('tagName')?.toLowerCase() === 'picture') {
            const source = parent.find('source').first();
            if (source.length) {
              src = source.attr('data-srcset') || source.attr('srcset');
              if (src && src.includes(',')) {
                src = src.split(',')[0].trim().split(' ')[0];
              }
            }
          }
        }

        // Check srcset on img itself
        if (!src) {
          const srcset = element.attr('srcset') || element.attr('data-srcset');
          if (srcset) {
            src = srcset.split(',')[0].trim().split(' ')[0];
          }
        }

        // Finally check src (skip data URIs)
        if (!src) {
          const srcAttr = element.attr('src');
          if (srcAttr && !srcAttr.startsWith('data:')) {
            src = srcAttr;
          }
        }

        // If still no valid src found, skip this image
        if (!src || src.startsWith('data:')) return null;

        return {
          id,
          type: 'image',
          src,
          alt: element.attr('alt'),
          width: this.parseNumber(element.attr('width')),
          height: this.parseNumber(element.attr('height')),
          order,
          parent,
          attributes,
        } as ImageBlock;
      }

      case 'picture': {
        // Skip picture elements - we'll parse the img inside them directly
        const children = this.parseElement($, element, depth + 1, parent);
        return children.length > 0 ? children[0] : null;
      }

      case 'video': {
        const src = element.attr('src') || element.find('source').first().attr('src');
        if (!src) return null;
        return {
          id,
          type: 'video',
          src,
          poster: element.attr('poster'),
          width: this.parseNumber(element.attr('width')),
          height: this.parseNumber(element.attr('height')),
          order,
          parent,
          attributes,
        } as VideoBlock;
      }

      case 'iframe': {
        const src = element.attr('src');
        if (!src) return null;
        return {
          id,
          type: 'iframe',
          src,
          width: this.parseNumber(element.attr('width')),
          height: this.parseNumber(element.attr('height')),
          title: element.attr('title'),
          order,
          parent,
          attributes,
        } as IframeBlock;
      }

      case 'ul':
      case 'ol': {
        const items = element.find('li').map((_, li) => $(li).text().trim()).get();
        if (items.length === 0) return null;
        return {
          id,
          type: 'list',
          ordered: tagName === 'ol',
          items,
          order,
          parent,
          attributes,
        } as ListBlock;
      }

      case 'pre':
      case 'code': {
        const code = element.text().trim();
        if (!code) return null;
        return {
          id,
          type: 'code',
          code,
          language: element.attr('class')?.replace('language-', ''),
          order,
          parent,
          attributes,
        } as CodeBlock;
      }

      case 'blockquote': {
        const text = element.text().trim();
        if (!text) return null;
        return {
          id,
          type: 'blockquote',
          text,
          cite: element.attr('cite'),
          order,
          parent,
          attributes,
        } as BlockquoteBlock;
      }

      case 'div': {
        const children = this.parseElement($, element, depth + 1, id);

        // If no children found but div has direct text content, treat as paragraph
        if (children.length === 0) {
          const text = element.text().trim();
          if (text && text.length > 0) {
            return {
              id,
              type: 'paragraph',
              text,
              order,
              parent,
              attributes,
            } as ParagraphBlock;
          }
          return null;
        }

        const layout = this.detectLayout(element);
        return {
          id,
          type: 'div',
          children,
          layout,
          className: element.attr('class'),
          order,
          parent,
          attributes,
        } as DivBlock;
      }

      case 'section': {
        const children = this.parseElement($, element, depth + 1, id);
        if (children.length === 0) return null;

        const layout = this.detectLayout(element);
        return {
          id,
          type: 'section',
          children,
          layout,
          className: element.attr('class'),
          order,
          parent,
          attributes,
        } as SectionBlock;
      }

      case 'article': {
        const children = this.parseElement($, element, depth + 1, id);
        if (children.length === 0) return null;

        const layout = this.detectLayout(element);
        return {
          id,
          type: 'article',
          children,
          layout,
          className: element.attr('class'),
          order,
          parent,
          attributes,
        } as ArticleBlock;
      }

      // Common HTML5 container elements - preserve all children
      case 'figure':
      case 'main':
      case 'header':
      case 'footer':
      case 'nav':
      case 'aside':
      case 'form':
      case 'fieldset':
      case 'details':
      case 'summary': {
        const children = this.parseElement($, element, depth + 1, id);
        if (children.length === 0) return null;

        const layout = this.detectLayout(element);
        return {
          id,
          type: 'div',  // Treat as generic container
          children,
          layout,
          className: element.attr('class'),
          order,
          parent,
          attributes,
        } as DivBlock;
      }

      case 'span':
      case 'a':
      case 'strong':
      case 'em':
      case 'b':
      case 'i': {
        // For inline elements, check if they have significant standalone content
        const text = element.text().trim();
        if (text && text.length > 20 && !parent) {
          return {
            id,
            type: 'paragraph',
            text,
            order,
            parent,
            attributes,
          } as ParagraphBlock;
        }
        // Otherwise, recursively parse children
        const children = this.parseElement($, element, depth + 1, parent);
        return children.length > 0 ? children[0] : null;
      }

      default: {
        // For other unknown elements, recursively parse children
        const children = this.parseElement($, element, depth + 1, parent);
        return children.length > 0 ? children[0] : null;
      }
    }
  }

  /**
   * Detect layout type from element
   */
  private detectLayout(element: cheerio.Cheerio<any>): LayoutType {
    const className = element.attr('class') || '';
    const style = element.attr('style') || '';

    if (style.includes('display: grid') || className.includes('grid')) {
      return 'grid';
    }
    if (style.includes('display: flex') || className.includes('flex')) {
      return 'flex';
    }
    if (className.match(/col-|column/i)) {
      return 'multi-column';
    }
    return 'single';
  }

  /**
   * Get all attributes from an element
   */
  private getAttributes(element: cheerio.Cheerio<any>): Record<string, string> {
    const attrs: Record<string, string> = {};
    const attribs = element.attr();

    if (attribs) {
      Object.keys(attribs).forEach((key) => {
        if (!['src', 'href', 'alt', 'width', 'height', 'title'].includes(key)) {
          attrs[key] = attribs[key];
        }
      });
    }

    return attrs;
  }

  /**
   * Parse a string to number
   */
  private parseNumber(value?: string): number | undefined {
    if (!value) return undefined;
    const num = parseInt(value, 10);
    return isNaN(num) ? undefined : num;
  }
}

// Export a default instance
export const parser = new HTMLParser();
