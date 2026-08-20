import type { Components } from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

export const markdownComponents: Components = {
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
          customStyle={{ borderRadius: '6px', fontSize: '0.8em', margin: '6px 0', padding: '10px' }}
        >
          {codeString}
        </SyntaxHighlighter>
      );
    }

    return (
      <code
        style={{
          background: 'var(--color-surf-2)',
          color: 'var(--color-pri)',
          padding: '1px 5px',
          borderRadius: '4px',
          fontSize: '0.85em',
          fontFamily: 'ui-monospace, monospace',
          border: '1px solid var(--color-border)',
        }}
        {...props}
      >
        {children}
      </code>
    );
  },
};
