'use client';

import { useTranslations } from 'next-intl';
import { useRef, useState } from 'react';
import type { Components } from 'react-markdown';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import rehypeRaw from 'rehype-raw';

interface Props {
  value: string;
  onChange: (v: string) => void;
  minHeight?: string;
}

type Tab = 'write' | 'preview';

const TOOLBAR = [
  { label: 'B', syntax: '**', wrap: true, title: 'Bold' },
  { label: 'I', syntax: '_', wrap: true, title: 'Italic' },
  { label: 'H1', syntax: '# ', wrap: false, title: 'Heading 1' },
  { label: 'H2', syntax: '## ', wrap: false, title: 'Heading 2' },
  { label: '—', syntax: '---\n', wrap: false, title: 'Divider' },
  { label: '❝', syntax: '> ', wrap: false, title: 'Quote' },
  { label: '•', syntax: '- ', wrap: false, title: 'List' },
  { label: '1.', syntax: '1. ', wrap: false, title: 'Ordered list' },
  { label: '`', syntax: '`', wrap: true, title: 'Inline code' },
  { label: '```', syntax: '```\n', wrap: false, title: 'Code block' },
];

const markdownComponents: Components = {
  code({ className, children, ...props }) {
    const match = /language-(\w+)/.exec(className ?? '');
    const isBlock = Boolean(match);
    const codeString = String(children).replace(/\n$/, '');

    if (isBlock) {
      return (
        <SyntaxHighlighter
          style={vscDarkPlus}
          language={match![1]}
          PreTag="div"
          customStyle={{
            borderRadius: '6px',
            fontSize: '0.85em',
            margin: '8px 0',
            padding: '12px',
          }}
        >
          {codeString}
        </SyntaxHighlighter>
      );
    }

    return (
      <code className="til-inline-code" {...props}>
        {children}
      </code>
    );
  },
};

export default function TilEditor({ value, onChange, minHeight = '240px' }: Props) {
  const t = useTranslations('til');
  const [tab, setTab] = useState<Tab>('write');
  const ref = useRef<HTMLTextAreaElement>(null);

  const applyFormat = (syntax: string, wrap: boolean) => {
    const ta = ref.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const selected = value.slice(start, end);

    let newVal: string;
    let newStart: number;
    let newEnd: number;

    if (wrap) {
      newVal = value.slice(0, start) + syntax + selected + syntax + value.slice(end);
      newStart = start + syntax.length;
      newEnd = end + syntax.length;
    } else {
      newVal = value.slice(0, start) + syntax + selected + value.slice(end);
      newStart = start + syntax.length;
      newEnd = newStart + selected.length;
    }

    onChange(newVal);
    setTimeout(() => {
      ta.focus();
      ta.setSelectionRange(newStart, newEnd);
    }, 0);
  };

  return (
    <div className="flex flex-col border border-border rounded-xl overflow-hidden">
      <div className="flex items-center justify-between border-b border-border bg-surf-2 px-2 py-1.5 gap-2">
        <div className="flex items-center gap-0.5 flex-wrap">
          {TOOLBAR.map((btn) => (
            <button
              key={btn.label}
              type="button"
              title={btn.title}
              onClick={() => applyFormat(btn.syntax, btn.wrap)}
              className="px-2 py-1 rounded text-xs font-mono text-ink-faint hover:bg-border hover:text-ink transition-colors"
            >
              {btn.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-0.5 flex-shrink-0">
          <button
            type="button"
            onClick={() => setTab('write')}
            className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
              tab === 'write' ? 'bg-surf text-ink border border-border' : 'text-ink-faint hover:text-ink-dim'
            }`}
          >
            {t('write')}
          </button>
          <button
            type="button"
            onClick={() => setTab('preview')}
            className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
              tab === 'preview' ? 'bg-surf text-ink border border-border' : 'text-ink-faint hover:text-ink-dim'
            }`}
          >
            {t('preview')}
          </button>
        </div>
      </div>

      {tab === 'write' ? (
        <textarea
          ref={ref}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={t('tilPlaceholder')}
          className="w-full p-3 text-sm text-ink bg-surf outline-none resize-none font-mono leading-relaxed"
          style={{ minHeight }}
        />
      ) : (
        <div className="p-4 bg-surf overflow-auto" style={{ minHeight }}>
          <style>{`
            .til-preview .til-inline-code {
              background: var(--color-surf-2);
              color: var(--color-pri);
              padding: 1px 5px;
              border-radius: 4px;
              font-size: 0.85em;
              font-family: ui-monospace, monospace;
              border: 1px solid var(--color-border);
            }
            .til-preview h1 { font-size: 1.4em; font-weight: 700; margin: 0.6em 0; }
            .til-preview h2 { font-size: 1.2em; font-weight: 700; margin: 0.5em 0; }
            .til-preview strong { font-weight: 700; }
            .til-preview em { font-style: italic; }
            .til-preview blockquote { border-left: 3px solid var(--color-border); padding-left: 12px; color: var(--color-ink-dim); margin: 8px 0; }
            .til-preview ul { list-style: disc; padding-left: 20px; margin: 6px 0; }
            .til-preview ol { list-style: decimal; padding-left: 20px; margin: 6px 0; }
            .til-preview li { margin: 2px 0; }
            .til-preview hr { border: none; border-top: 1px solid var(--color-border); margin: 12px 0; }
            .til-preview p { margin: 4px 0; line-height: 1.6; }
          `}</style>
          {value.trim() ? (
            <div className="til-preview text-sm text-ink">
              <ReactMarkdown rehypePlugins={[rehypeRaw]} components={markdownComponents}>
                {value}
              </ReactMarkdown>
            </div>
          ) : (
            <p className="text-ink-faint text-sm">{t('previewEmpty')}</p>
          )}
        </div>
      )}
    </div>
  );
}
