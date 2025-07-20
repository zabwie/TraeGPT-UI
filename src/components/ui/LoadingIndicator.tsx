import React from 'react';

interface LoadingIndicatorProps {
  isWebSearching?: boolean;
  responseTime?: number | null;
}

export default function LoadingIndicator({ isWebSearching, responseTime }: LoadingIndicatorProps) {
  return (
    <div className="flex justify-start mb-4">
      <div style={{ background: 'var(--input-bar-bg)', border: '1px solid var(--input-bar-border)', color: 'var(--text-secondary)' }} className="rounded-2xl shadow-sm px-4 py-3">
        <div className="flex items-center space-x-2">
          <div className="flex space-x-1">
            <div style={{ background: 'var(--text-secondary)' }} className="w-2 h-2 rounded-full animate-bounce"></div>
            <div style={{ background: 'var(--text-secondary)', animationDelay: '0.1s' }} className="w-2 h-2 rounded-full animate-bounce"></div>
            <div style={{ background: 'var(--text-secondary)', animationDelay: '0.2s' }} className="w-2 h-2 rounded-full animate-bounce"></div>
          </div>
          <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            {isWebSearching ? "Searching the web..." : "AI is thinking..."}
            {responseTime && <span style={{ color: 'var(--text-success)' }}> ({responseTime}ms)</span>}
          </span>
        </div>
      </div>
    </div>
  );
} 