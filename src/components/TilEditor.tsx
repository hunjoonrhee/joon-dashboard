'use client'

import { useTranslations } from 'next-intl'
import { useRef, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import rehypeRaw from 'rehype-raw'

interface Props {
  value: string
  onChange: (v: string) => void
  minHeight?: string
}

type Tab = 'write' | 'preview'

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
]

// 백틱 인라인 코드를 <code> 태그로 수동 변환
function preprocessMarkdown(text: string): string {
  return text.replace(/`([^`\n]+)`/g, '<code class="til-inline-code">$1</code>')
}

export default function TilEditor({
  value,
  onChange,
  minHeight = '240px',
}: Props) {
  const t = useTranslations('til')
  const [tab, setTab] = useState<Tab>('write')
  const ref = useRef<HTMLTextAreaElement>(null)

  const applyFormat = (syntax: string, wrap: boolean) => {
    const ta = ref.current
    if (!ta) return
    const start = ta.selectionStart
    const end = ta.selectionEnd
    const selected = value.slice(start, end)

    let newVal: string
    let newStart: number
    let newEnd: number

    if (wrap) {
      newVal =
        value.slice(0, start) + syntax + selected + syntax + value.slice(end)
      newStart = start + syntax.length
      newEnd = end + syntax.length
    } else {
      newVal = value.slice(0, start) + syntax + selected + value.slice(end)
      newStart = start + syntax.length
      newEnd = newStart + selected.length
    }

    onChange(newVal)
    setTimeout(() => {
      ta.focus()
      ta.setSelectionRange(newStart, newEnd)
    }, 0)
  }

  const processed = preprocessMarkdown(value)

  return (
    <div className="flex flex-col border border-gray-200 rounded-xl overflow-hidden">
      <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50 px-2 py-1.5 gap-2">
        <div className="flex items-center gap-0.5 flex-wrap">
          {TOOLBAR.map((btn) => (
            <button
              key={btn.label}
              type="button"
              title={btn.title}
              onClick={() => applyFormat(btn.syntax, btn.wrap)}
              className="px-2 py-1 rounded text-xs font-mono text-gray-500 hover:bg-gray-200 hover:text-gray-800 transition-colors"
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
              tab === 'write'
                ? 'bg-white text-gray-800 border border-gray-200'
                : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            {t('write')}
          </button>
          <button
            type="button"
            onClick={() => setTab('preview')}
            className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
              tab === 'preview'
                ? 'bg-white text-gray-800 border border-gray-200'
                : 'text-gray-400 hover:text-gray-600'
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
          className="w-full p-3 text-sm text-gray-800 bg-white outline-none resize-none font-mono leading-relaxed"
          style={{ minHeight }}
        />
      ) : (
        <div className="p-4 bg-white overflow-auto" style={{ minHeight }}>
          <style>{`
            .til-preview .til-inline-code {
              background: #ede9fe;
              color: #4f46e5;
              padding: 1px 5px;
              border-radius: 4px;
              font-size: 0.85em;
              font-family: ui-monospace, monospace;
              border: 1px solid #c4b5fd;
            }
            .til-preview h1 { font-size: 1.4em; font-weight: 700; margin: 0.6em 0; }
            .til-preview h2 { font-size: 1.2em; font-weight: 700; margin: 0.5em 0; }
            .til-preview strong { font-weight: 700; }
            .til-preview em { font-style: italic; }
            .til-preview blockquote { border-left: 3px solid #e5e7eb; padding-left: 12px; color: #6b7280; margin: 8px 0; }
            .til-preview ul { list-style: disc; padding-left: 20px; margin: 6px 0; }
            .til-preview ol { list-style: decimal; padding-left: 20px; margin: 6px 0; }
            .til-preview li { margin: 2px 0; }
            .til-preview hr { border: none; border-top: 1px solid #e5e7eb; margin: 12px 0; }
            .til-preview pre { background: #1e1e1e; color: #d4d4d4; padding: 12px; border-radius: 6px; overflow-x: auto; margin: 8px 0; }
            .til-preview pre code { background: none; border: none; padding: 0; color: inherit; font-size: 0.85em; }
            .til-preview p { margin: 4px 0; line-height: 1.6; }
          `}</style>
          {value.trim() ? (
            <div className="til-preview text-sm text-gray-800">
              <ReactMarkdown rehypePlugins={[rehypeRaw]}>
                {processed}
              </ReactMarkdown>
            </div>
          ) : (
            <p className="text-gray-300 text-sm">{t('previewEmpty')}</p>
          )}
        </div>
      )}
    </div>
  )
}
