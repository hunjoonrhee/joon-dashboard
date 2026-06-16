'use client';

import type { Session } from '@/types';
import { useLocale, useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import type { Components } from 'react-markdown';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface Props {
  sessions: Session[];
  onAddStudy: () => void;
}

const previewMarkdownComponents: Components = {
  code({ className, children }) {
    const match = /language-(\w+)/.exec(className ?? '');
    const isBlock = Boolean(match);
    const codeString = String(children).replace(/\n$/, '');
    const lines = codeString.split('\n');
    const clipped = lines.slice(0, 5).join('\n');
    const hasMore = lines.length > 5;

    if (isBlock) {
      return (
        <div style={{ position: 'relative' }}>
          <SyntaxHighlighter
            style={vscDarkPlus}
            language={match![1]}
            PreTag="div"
            customStyle={{
              borderRadius: '6px',
              fontSize: '0.75em',
              margin: '4px 0',
              padding: '8px 10px',
              maxHeight: '100px',
              overflow: 'hidden',
            }}
          >
            {clipped}
          </SyntaxHighlighter>
          {hasMore && (
            <div
              style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                height: '32px',
                background: 'linear-gradient(to bottom, transparent, #1e1e1e)',
                borderRadius: '0 0 6px 6px',
                display: 'flex',
                alignItems: 'flex-end',
                justifyContent: 'center',
                paddingBottom: '4px',
              }}
            >
              <span style={{ fontSize: '10px', color: '#9ca3af' }}>+{lines.length - 5}줄 더...</span>
            </div>
          )}
        </div>
      );
    }

    return (
      <code
        style={{
          background: '#ede9fe',
          color: '#4f46e5',
          padding: '1px 4px',
          borderRadius: '3px',
          fontSize: '0.8em',
          fontFamily: 'ui-monospace, monospace',
          border: '1px solid #c4b5fd',
        }}
      >
        {children}
      </code>
    );
  },
  p({ children }) {
    return <p style={{ margin: '2px 0', fontSize: '12px', color: '#6b7280', lineHeight: 1.5 }}>{children}</p>;
  },
  h1({ children }) {
    return <p style={{ margin: '2px 0', fontSize: '13px', fontWeight: 700, color: '#1f2937' }}>{children}</p>;
  },
  h2({ children }) {
    return <p style={{ margin: '2px 0', fontSize: '12px', fontWeight: 700, color: '#1f2937' }}>{children}</p>;
  },
  ul({ children }) {
    return <ul style={{ paddingLeft: '14px', margin: '2px 0', fontSize: '12px', color: '#6b7280' }}>{children}</ul>;
  },
  ol({ children }) {
    return <ol style={{ paddingLeft: '14px', margin: '2px 0', fontSize: '12px', color: '#6b7280' }}>{children}</ol>;
  },
  blockquote({ children }) {
    return (
      <blockquote style={{ borderLeft: '2px solid #e5e7eb', paddingLeft: '8px', margin: '2px 0', color: '#9ca3af' }}>
        {children}
      </blockquote>
    );
  },
};

export default function TilPreviewCard({ sessions, onAddStudy }: Props) {
  const t = useTranslations('home');
  const router = useRouter();
  const locale = useLocale();

  const tilSessions = sessions.filter((s) => s.til).slice(0, 2);

  const dateLabel = (d: string) =>
    new Date(d).toLocaleDateString(locale === 'ko' ? 'ko-KR' : locale === 'de' ? 'de-DE' : 'en-US', {
      month: 'short',
      day: 'numeric',
    });

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">{t('recentTil')}</p>
        <button
          onClick={() => router.push(`/${locale}/dashboard/study`)}
          className="text-xs text-indigo-500 font-medium hover:text-indigo-700"
        >
          {t('viewAll')}
        </button>
      </div>

      {tilSessions.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-4 text-center">
          <span className="text-2xl opacity-40">💡</span>
          <p className="text-sm font-semibold text-gray-700">{t('tilEmpty')}</p>
          <p className="text-xs text-gray-400 leading-relaxed">{t('tilEmptySub')}</p>
          <button
            onClick={onAddStudy}
            className="mt-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-indigo-600 bg-indigo-50 border border-indigo-100 hover:bg-indigo-100 transition-colors"
          >
            {t('addStudy')}
          </button>
        </div>
      ) : (
        <div className="flex flex-col divide-y divide-gray-100">
          {tilSessions.map((s) => (
            <div
              key={s.id}
              className="py-2.5 cursor-pointer hover:bg-gray-50 rounded-lg px-1 transition-colors"
              onClick={() => router.push(`/${locale}/dashboard/til/${s.id}`)}
            >
              <p className="text-xs text-gray-400 mb-1">{dateLabel(s.date)}</p>
              <p className="text-sm font-semibold text-gray-800 mb-1.5 truncate">{s.title}</p>
              <div className="overflow-hidden" style={{ maxHeight: '120px' }}>
                <ReactMarkdown components={previewMarkdownComponents}>{s.til!}</ReactMarkdown>
              </div>
              {s.tags.length > 0 && (
                <div className="flex gap-1 flex-wrap mt-1.5">
                  {s.tags.slice(0, 2).map((tag) => (
                    <span key={tag} className="text-xs px-1.5 py-0.5 rounded-full bg-indigo-50 text-indigo-600">
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
