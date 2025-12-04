export type BlockType =
  | 'heading'
  | 'paragraph'
  | 'image'
  | 'video'
  | 'iframe'
  | 'list'
  | 'code'
  | 'blockquote'
  | 'link'
  | 'div'
  | 'section'
  | 'article';

export type LayoutType = 'single' | 'multi-column' | 'grid' | 'flex';

export interface BaseBlock {
  id: string;
  type: BlockType;
  order: number;
  parent?: string;
}

export interface HeadingBlock extends BaseBlock {
  type: 'heading';
  level: 1 | 2 | 3 | 4 | 5 | 6;
  text: string;
  attributes?: Record<string, string>;
}

export interface ParagraphBlock extends BaseBlock {
  type: 'paragraph';
  text: string;
  attributes?: Record<string, string>;
}

export interface ImageBlock extends BaseBlock {
  type: 'image';
  src: string;
  alt?: string;
  width?: number;
  height?: number;
  attributes?: Record<string, string>;
}

export interface VideoBlock extends BaseBlock {
  type: 'video';
  src: string;
  poster?: string;
  width?: number;
  height?: number;
  attributes?: Record<string, string>;
}

export interface IframeBlock extends BaseBlock {
  type: 'iframe';
  src: string;
  width?: number;
  height?: number;
  title?: string;
  attributes?: Record<string, string>;
}

export interface ListBlock extends BaseBlock {
  type: 'list';
  ordered: boolean;
  items: string[];
  attributes?: Record<string, string>;
}

export interface CodeBlock extends BaseBlock {
  type: 'code';
  language?: string;
  code: string;
  attributes?: Record<string, string>;
}

export interface BlockquoteBlock extends BaseBlock {
  type: 'blockquote';
  text: string;
  cite?: string;
  attributes?: Record<string, string>;
}

export interface LinkBlock extends BaseBlock {
  type: 'link';
  href: string;
  text: string;
  attributes?: Record<string, string>;
}

export interface DivBlock extends BaseBlock {
  type: 'div';
  children: ContentBlock[];
  layout?: LayoutType;
  className?: string;
  attributes?: Record<string, string>;
}

export interface SectionBlock extends BaseBlock {
  type: 'section';
  children: ContentBlock[];
  layout?: LayoutType;
  className?: string;
  attributes?: Record<string, string>;
}

export interface ArticleBlock extends BaseBlock {
  type: 'article';
  children: ContentBlock[];
  layout?: LayoutType;
  className?: string;
  attributes?: Record<string, string>;
}

export type ContentBlock =
  | HeadingBlock
  | ParagraphBlock
  | ImageBlock
  | VideoBlock
  | IframeBlock
  | ListBlock
  | CodeBlock
  | BlockquoteBlock
  | LinkBlock
  | DivBlock
  | SectionBlock
  | ArticleBlock;

export interface ParsedContent {
  url: string;
  title: string;
  metadata: {
    description?: string;
    keywords?: string[];
    author?: string;
    ogImage?: string;
    ogTitle?: string;
    ogDescription?: string;
  };
  blocks: ContentBlock[];
  structure: {
    layout: LayoutType;
    hasNavigation: boolean;
    hasHeader: boolean;
    hasFooter: boolean;
    hasSidebar: boolean;
  };
  parsedAt: string;
}

export interface ParserOptions {
  includeMetadata?: boolean;
  includeStructure?: boolean;
  maxDepth?: number;
  ignoreSelectors?: string[];
  includeAttributes?: boolean;
}
