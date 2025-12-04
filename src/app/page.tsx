'use client';

import { useState } from 'react';
import { ParsedContent } from '@/types/parser';
import { ContentRenderer } from '@/components/ContentRenderer';

export default function Home() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [parsedContent, setParsedContent] = useState<ParsedContent | null>(null);

  const handleParse = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setParsedContent(null);

    try {
      const response = await fetch('/api/parse', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to parse URL');
      }

      const data = await response.json();
      setParsedContent(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Website Content Parser
          </h1>
          <p className="text-gray-600">
            Parse any website and view its content structure as blocks
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <form onSubmit={handleParse} className="flex gap-4">
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Enter website URL (e.g., https://example.com)"
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
              required
            />
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Parsing...' : 'Parse'}
            </button>
          </form>

          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700">{error}</p>
            </div>
          )}
        </div>

        {parsedContent && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Metadata
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-semibold text-gray-700">Title:</span>{' '}
                  <span className="text-gray-900">{parsedContent.title}</span>
                </div>
                <div>
                  <span className="font-semibold text-gray-700">URL:</span>{' '}
                  <span className="text-gray-900 break-all">{parsedContent.url}</span>
                </div>
                {parsedContent.metadata.description && (
                  <div className="md:col-span-2">
                    <span className="font-semibold text-gray-700">Description:</span>{' '}
                    <span className="text-gray-900">{parsedContent.metadata.description}</span>
                  </div>
                )}
                {parsedContent.metadata.author && (
                  <div>
                    <span className="font-semibold text-gray-700">Author:</span>{' '}
                    <span className="text-gray-900">{parsedContent.metadata.author}</span>
                  </div>
                )}
                <div>
                  <span className="font-semibold text-gray-700">Layout:</span>{' '}
                  <span className="text-gray-900">{parsedContent.structure.layout}</span>
                </div>
                <div>
                  <span className="font-semibold text-gray-700">Total Blocks:</span>{' '}
                  <span className="text-gray-900">{parsedContent.blocks.length}</span>
                </div>
                <div>
                  <span className="font-semibold text-gray-700">Parsed At:</span>{' '}
                  <span className="text-gray-900">
                    {new Date(parsedContent.parsedAt).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-gray-900">
                  Rendered Content
                </h2>
                <button
                  onClick={() => {
                    const dataStr = JSON.stringify(parsedContent, null, 2);
                    const dataBlob = new Blob([dataStr], { type: 'application/json' });
                    const url = URL.createObjectURL(dataBlob);
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = 'parsed-content.json';
                    link.click();
                  }}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  Download JSON
                </button>
              </div>
              <div className="border-t border-gray-200 pt-6">
                <ContentRenderer blocks={parsedContent.blocks} />
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
