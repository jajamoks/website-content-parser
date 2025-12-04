import React from 'react';
import {
  ContentBlock,
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
} from '@/types/parser';
import { BlockRenderer } from './blocks/BlockRenderer';

interface ContentRendererProps {
  blocks: ContentBlock[];
}

export function ContentRenderer({ blocks }: ContentRendererProps) {
  return (
    <div className="space-y-4">
      {blocks.map((block) => (
        <BlockRenderer key={block.id} block={block} />
      ))}
    </div>
  );
}
