import { cn } from '@/lib/utils';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

export interface ChatMessageProps {
  role: 'user' | 'assistant';
  content: string;
}

export function ChatMessage({ role, content }: ChatMessageProps) {
  const isUser = role === 'user';

  const components = {
    code({ node, inline, className, children, ...props }) {
      const match = /language-(\w+)/.exec(className || '');
      return !inline && match ? (
        <SyntaxHighlighter
          style={oneDark}
          language={match[1]}
          PreTag="div"
          className="rounded my-2"
          {...props}
        >
          {String(children).replace(/\n$/, '')}
        </SyntaxHighlighter>
      ) : (
        <code className="bg-gray-800 text-gray-100 px-1.5 py-0.5 rounded text-sm font-mono" {...props}>
          {children}
        </code>
      );
    },
    a({ node, children, href, ...props }) {
      return (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 dark:text-blue-400 hover:underline"
          {...props}
        >
          {children}
        </a>
      );
    },
    p({ node, children, ...props }) {
      return <p className="mb-3 last:mb-0" {...props}>{children}</p>;
    },
    ul({ node, children, ...props }) {
      return <ul className="list-disc list-inside mb-3 space-y-1" {...props}>{children}</ul>;
    },
    ol({ node, children, ...props }) {
      return <ol className="list-decimal list-inside mb-3 space-y-1" {...props}>{children}</ol>;
    },
    li({ node, children, ...props }) {
      return <li className="leading-relaxed" {...props}>{children}</li>;
    },
    blockquote({ node, children, ...props }) {
      return <blockquote className="border-l-4 border-gray-400 pl-4 italic my-3 text-gray-700 dark:text-gray-300" {...props}>{children}</blockquote>;
    },
    h1({ node, children, ...props }) {
      return <h1 className="text-2xl font-bold mb-3 mt-4 first:mt-0" {...props}>{children}</h1>;
    },
    h2({ node, children, ...props }) {
      return <h2 className="text-xl font-bold mb-2 mt-3 first:mt-0" {...props}>{children}</h2>;
    },
    h3({ node, children, ...props }) {
      return <h3 className="text-lg font-semibold mb-2 mt-2 first:mt-0" {...props}>{children}</h3>;
    },
    strong({ node, children, ...props }) {
      return <strong className="font-bold" {...props}>{children}</strong>;
    },
    em({ node, children, ...props }) {
      return <em className="italic" {...props}>{children}</em>;
    },
  };

  return (
    <div
      className={cn(
        'flex w-full mb-4',
        isUser ? 'justify-end' : 'justify-start'
      )}
    >
      <div
        className={cn(
          'max-w-[80%] rounded-lg px-4 py-2',
          isUser
            ? 'bg-blue-500 text-white'
            : 'bg-gray-200 text-gray-900 dark:bg-gray-700 dark:text-gray-100'
        )}
      >
        {isUser ? (
          <div className="whitespace-pre-wrap break-words">{content}</div>
        ) : (
          <div className="markdown-content">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={components}
            >
              {content}
            </ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  );
}
