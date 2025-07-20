import React from 'react';

// Language detection function
function detectLanguage(code: string): string {
  const firstLine = code.trim().split('\n')[0].toLowerCase();
  
  if (firstLine.includes('import ') || firstLine.includes('from ') || firstLine.includes('def ') || firstLine.includes('class ')) return 'python';
  if (firstLine.includes('function ') || firstLine.includes('const ') || firstLine.includes('let ') || firstLine.includes('var ')) return 'javascript';
  if (firstLine.includes('public class') || firstLine.includes('private ') || firstLine.includes('public ')) return 'java';
  if (firstLine.includes('<?php') || firstLine.includes('$')) return 'php';
  if (firstLine.includes('package ') || firstLine.includes('import "') || firstLine.includes('func ')) return 'go';
  if (firstLine.includes('fn ') || firstLine.includes('let ') || firstLine.includes('struct ')) return 'rust';
  if (firstLine.includes('using ') || firstLine.includes('namespace ') || firstLine.includes('public class')) return 'csharp';
  if (firstLine.includes('html') || firstLine.includes('<!DOCTYPE')) return 'html';
  if (firstLine.includes('css') || firstLine.includes('{') && firstLine.includes(':')) return 'css';
  if (firstLine.includes('sql') || firstLine.includes('SELECT') || firstLine.includes('INSERT')) return 'sql';
  if (firstLine.includes('dockerfile') || firstLine.includes('FROM ') || firstLine.includes('RUN ')) return 'dockerfile';
  if (firstLine.includes('yaml') || firstLine.includes('---')) return 'yaml';
  if (firstLine.includes('json') || firstLine.includes('{') && firstLine.includes('"')) return 'json';
  
  return 'text';
}

interface CodeBlockProps {
  children: string;
  className?: string;
}

export default function CodeBlock({ children, className }: CodeBlockProps) {
  const language = className?.replace('language-', '') || detectLanguage(children);
  
  const copyToClipboard = () => {
    navigator.clipboard.writeText(children);
  };
  
  return (
    <div className="code-block">
      <div className="code-header">
        <span className="code-language">{language}</span>
        <div className="code-actions">
          <button className="code-action-btn" onClick={copyToClipboard}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
            </svg>
            Copy
          </button>
          <button className="code-action-btn">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
            </svg>
            Edit
          </button>
        </div>
      </div>
      <div className="code-content">
        <pre style={{ margin: 0, padding: 0, background: 'none', color: 'inherit' }}>
          <code>{children}</code>
        </pre>
      </div>
    </div>
  );
} 