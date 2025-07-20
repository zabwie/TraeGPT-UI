import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import CodeBlock from './CodeBlock';

interface TypewriterMarkdownProps {
  text: string;
}

export default function TypewriterMarkdown({ text }: TypewriterMarkdownProps) {
  const [displayed, setDisplayed] = useState("");
  
  useEffect(() => {
    setDisplayed("");
    if (!text) return;
    
    let i = 0;
    const interval = setInterval(() => {
      i++;
      setDisplayed(text.slice(0, i));
      if (i >= text.length) clearInterval(interval);
    }, 14);
    
    return () => clearInterval(interval);
  }, [text]);
  
  return (
    <div style={{ 
      whiteSpace: 'pre-wrap',
      fontFamily: 'monospace',
      lineHeight: '1.6',
      wordBreak: 'break-word'
    }}>
      <ReactMarkdown 
        components={{
          pre: ({ children }) => <>{children}</>,
          code: ({ inline, className, children }: { inline?: boolean; className?: string; children?: React.ReactNode }) => {
            return !inline ? (
              <CodeBlock className={className}>
                {String(children || '').replace(/\n$/, '')}
              </CodeBlock>
            ) : (
              <code className={className}>
                {children}
              </code>
            );
          }
        }}
      >
        {displayed}
      </ReactMarkdown>
    </div>
  );
} 