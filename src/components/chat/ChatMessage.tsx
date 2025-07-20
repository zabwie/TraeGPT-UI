import React from 'react';
import Image from 'next/image';
import ReactMarkdown from 'react-markdown';
import CodeBlock from '../ui/CodeBlock';
import TypewriterMarkdown from '../ui/TypewriterMarkdown';
import { Message } from '../../app/firebase';

interface ChatMessageProps {
  message: Message;
  isLatestAssistant: boolean;
  imagePreviewUrl?: string | null;
  isPreview?: boolean;
}

export default function ChatMessage({ 
  message, 
  isLatestAssistant, 
  imagePreviewUrl, 
  isPreview = false 
}: ChatMessageProps) {
  // Handle image preview
  if (isPreview && imagePreviewUrl) {
    return (
      <div className="message-row user">
        <div className="chat-bubble">
          <Image src={imagePreviewUrl} alt="preview" width={320} height={240} className="rounded-lg shadow-sm" />
        </div>
      </div>
    );
  }

  // Handle uploaded image
  if (message.imageUrl) {
    return (
      <div className="message-row user">
        <div className="chat-bubble">
          <Image src={message.imageUrl} alt="uploaded" width={320} height={240} className="rounded-lg shadow-sm" />
        </div>
      </div>
    );
  }

  // Handle image analysis results
  if (message.imageResult) {
    const result = message.imageResult;
    return (
      <div className="flex justify-start mb-4">
        <div style={{ background: 'var(--input-bar-bg)', border: '1px solid var(--input-bar-border)', color: 'var(--text-main)' }} className="max-w-3xl rounded-2xl shadow-sm border border-gray-700 p-4">
          <h3 className="text-lg font-medium text-gray-100 mb-3">Image Analysis Results</h3>
          
          {/* Classification */}
          {result.classification && result.classification.length > 0 && (
            <div className="mb-4">
              <h4 className="text-sm font-medium text-gray-300 mb-2">Classification:</h4>
              <div className="flex flex-wrap gap-2">
                {result.classification.map((item: { class: string; confidence: number }, idx: number) => (
                  <span key={idx} style={{ background: 'var(--success-bg)', color: 'var(--success-text)', borderRadius: '0.375rem', padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}>
                    {item.class}: {(item.confidence * 100).toFixed(1)}%
                  </span>
                ))}
              </div>
            </div>
          )}
          
          {/* Object Detection */}
          {result.object_detection && result.object_detection.length > 0 && (
            <div className="mb-4">
              <h4 className="text-sm font-medium text-gray-300 mb-2">Objects Detected:</h4>
              <div className="flex flex-wrap gap-2">
                {result.object_detection.map((obj: { class: string; confidence: number }, idx: number) => (
                  <span key={idx} style={{ background: 'var(--success-bg)', color: 'var(--success-text)', borderRadius: '0.375rem', padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}>
                    {obj.class}: {(obj.confidence * 100).toFixed(1)}%
                  </span>
                ))}
              </div>
            </div>
          )}
          
          {/* Caption */}
          {result.caption && (
            <div className="mb-4">
              <h4 className="text-sm font-medium text-gray-300 mb-2">Caption:</h4>
              <div style={{ background: 'var(--warning-bg)', border: '1px solid var(--warning-border)', borderRadius: '0.5rem', padding: '0.75rem' }}>
                <p className="text-sm text-gray-200">{result.caption}</p>
                {result.caption.includes('[Note:') && (
                  <p className="text-xs text-yellow-400 mt-1">⚠️ AI may have added details not visible in the image</p>
                )}
              </div>
            </div>
          )}
          
          {/* Text Extraction */}
          {result.text_extraction && result.text_extraction.length > 0 && (
            <div className="mb-4">
              <h4 className="text-sm font-medium text-gray-300 mb-2">Text Found:</h4>
              <div style={{ background: 'var(--input-bar-bg)', border: '1px solid var(--input-bar-border)', borderRadius: '0.5rem' }}>
                {result.text_extraction.map((text: { text: string; confidence: number }, idx: number) => (
                  <p key={idx} className="text-sm text-gray-200">
                    &quot;{text.text}&quot; ({(text.confidence * 100).toFixed(1)}% confidence)
                  </p>
                ))}
              </div>
            </div>
          )}
          
          {/* Analysis Time */}
          {result.analysis_time && (
            <div className="text-xs text-gray-500 mt-3">
              Analysis completed in {result.analysis_time.toFixed(2)} seconds
            </div>
          )}
        </div>
      </div>
    );
  }

  // Handle file attachments
  if (message.fileUrl) {
    return (
      <div className={`message-row ${message.role === "user" ? "user" : "assistant"}`}>
        <div className="chat-bubble">
          <a href={message.fileUrl} target="_blank" rel="noopener noreferrer" className="file-link">
            {message.fileName || 'Download file'}
          </a>
        </div>
      </div>
    );
  }

  // Handle regular text messages
  const isAssistant = message.role === "assistant";
  return (
    <div className={`message-row ${message.role === "user" ? "user" : "assistant"}`}>
      <div className="chat-bubble">
        <div className="prose prose-sm max-w-none prose-invert" style={{ 
          whiteSpace: 'pre-wrap',
          fontFamily: 'monospace',
          lineHeight: '1.6',
          wordBreak: 'break-word'
        }}>
          {isAssistant && isLatestAssistant ? (
            <TypewriterMarkdown text={message.content} />
          ) : (
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
              {message.content}
            </ReactMarkdown>
          )}
        </div>
      </div>
    </div>
  );
} 