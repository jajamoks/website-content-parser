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

interface BlockRendererProps {
  block: ContentBlock;
}

export function BlockRenderer({ block }: BlockRendererProps) {
  const renderBlock = () => {
    switch (block.type) {
      case 'heading':
        return <HeadingBlockComponent block={block as HeadingBlock} />;
      case 'paragraph':
        return <ParagraphBlockComponent block={block as ParagraphBlock} />;
      case 'image':
        return <ImageBlockComponent block={block as ImageBlock} />;
      case 'video':
        return <VideoBlockComponent block={block as VideoBlock} />;
      case 'iframe':
        return <IframeBlockComponent block={block as IframeBlock} />;
      case 'list':
        return <ListBlockComponent block={block as ListBlock} />;
      case 'code':
        return <CodeBlockComponent block={block as CodeBlock} />;
      case 'blockquote':
        return <BlockquoteBlockComponent block={block as BlockquoteBlock} />;
      case 'div':
        return <DivBlockComponent block={block as DivBlock} />;
      case 'section':
        return <SectionBlockComponent block={block as SectionBlock} />;
      case 'article':
        return <ArticleBlockComponent block={block as ArticleBlock} />;
      default:
        return null;
    }
  };

  return (
    <div className="block-wrapper" data-block-id={block.id} data-block-type={block.type}>
      {renderBlock()}
    </div>
  );
}

function HeadingBlockComponent({ block }: { block: HeadingBlock }) {
  const Tag = `h${block.level}` as keyof JSX.IntrinsicElements;
  const sizes = {
    1: 'text-4xl font-bold',
    2: 'text-3xl font-bold',
    3: 'text-2xl font-bold',
    4: 'text-xl font-bold',
    5: 'text-lg font-semibold',
    6: 'text-base font-semibold',
  };

  return (
    <Tag className={`${sizes[block.level]} text-gray-900 mb-2`}>
      {block.text}
    </Tag>
  );
}

function ParagraphBlockComponent({ block }: { block: ParagraphBlock }) {
  return (
    <p className="text-gray-700 leading-relaxed mb-4">
      {block.text}
    </p>
  );
}

function ImageBlockComponent({ block }: { block: ImageBlock }) {
  return (
    <div className="my-4">
      <img
        src={block.src}
        alt={block.alt || 'Image'}
        width={block.width}
        height={block.height}
        className="max-w-full h-auto rounded-lg shadow-md"
      />
      {block.alt && (
        <p className="text-sm text-gray-500 mt-2 italic">{block.alt}</p>
      )}
    </div>
  );
}

function VideoBlockComponent({ block }: { block: VideoBlock }) {
  return (
    <div className="my-4">
      <video
        controls
        poster={block.poster}
        width={block.width}
        height={block.height}
        className="max-w-full h-auto rounded-lg shadow-md"
      >
        <source src={block.src} />
        Your browser does not support the video tag.
      </video>
    </div>
  );
}

function IframeBlockComponent({ block }: { block: IframeBlock }) {
  return (
    <div className="my-4">
      <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
        <iframe
          src={block.src}
          title={block.title || 'Embedded content'}
          className="absolute top-0 left-0 w-full h-full rounded-lg shadow-md"
          allowFullScreen
        />
      </div>
    </div>
  );
}

function ListBlockComponent({ block }: { block: ListBlock }) {
  const Tag = block.ordered ? 'ol' : 'ul';
  const listStyle = block.ordered ? 'list-decimal' : 'list-disc';

  return (
    <Tag className={`${listStyle} ml-6 mb-4 text-gray-700 space-y-1`}>
      {block.items.map((item, index) => (
        <li key={index}>{item}</li>
      ))}
    </Tag>
  );
}

function CodeBlockComponent({ block }: { block: CodeBlock }) {
  return (
    <div className="my-4">
      <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
        <code className={block.language ? `language-${block.language}` : ''}>
          {block.code}
        </code>
      </pre>
    </div>
  );
}

function BlockquoteBlockComponent({ block }: { block: BlockquoteBlock }) {
  return (
    <blockquote className="border-l-4 border-blue-500 pl-4 italic text-gray-700 my-4">
      {block.text}
      {block.cite && (
        <footer className="text-sm text-gray-500 mt-2">— {block.cite}</footer>
      )}
    </blockquote>
  );
}

function DivBlockComponent({ block }: { block: DivBlock }) {
  const layoutClasses = {
    'single': 'space-y-4',
    'multi-column': 'grid grid-cols-1 md:grid-cols-2 gap-4',
    'grid': 'grid grid-cols-1 md:grid-cols-3 gap-4',
    'flex': 'flex flex-wrap gap-4',
  };

  return (
    <div className={`${layoutClasses[block.layout || 'single']} p-4 border border-gray-200 rounded-lg`}>
      {block.children.map((child) => (
        <BlockRenderer key={child.id} block={child} />
      ))}
    </div>
  );
}

function SectionBlockComponent({ block }: { block: SectionBlock }) {
  const layoutClasses = {
    'single': 'space-y-4',
    'multi-column': 'grid grid-cols-1 md:grid-cols-2 gap-4',
    'grid': 'grid grid-cols-1 md:grid-cols-3 gap-4',
    'flex': 'flex flex-wrap gap-4',
  };

  return (
    <section className={`${layoutClasses[block.layout || 'single']} p-6 bg-gray-50 rounded-lg`}>
      {block.children.map((child) => (
        <BlockRenderer key={child.id} block={child} />
      ))}
    </section>
  );
}

function ArticleBlockComponent({ block }: { block: ArticleBlock }) {
  const layoutClasses = {
    'single': 'space-y-4',
    'multi-column': 'grid grid-cols-1 md:grid-cols-2 gap-4',
    'grid': 'grid grid-cols-1 md:grid-cols-3 gap-4',
    'flex': 'flex flex-wrap gap-4',
  };

  return (
    <article className={`${layoutClasses[block.layout || 'single']} p-6 bg-white border border-gray-200 rounded-lg shadow-sm`}>
      {block.children.map((child) => (
        <BlockRenderer key={child.id} block={child} />
      ))}
    </article>
  );
}
