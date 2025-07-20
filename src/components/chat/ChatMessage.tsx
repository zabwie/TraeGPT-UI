import React from 'react';
import { Message, UserMessage } from '../../types';
import CodeBlock from '../ui/CodeBlock';
import TypewriterMarkdown from '../ui/TypewriterMarkdown';

interface ChatMessageProps {
  message: Message;
  isLatestAssistant: boolean;
}

export default function ChatMessage({ message, isLatestAssistant }: ChatMessageProps) {
  const isUser = message.role === 'user';
  const userMessage = message as UserMessage; // Type assertion for user messages

  return (
    <div className={`message-row ${isUser ? 'user' : 'assistant'}`}>
      <div className="chat-bubble">
        {/* User message with image */}
        {isUser && userMessage.imageUrl && (
          <div className="mb-3">
            <img 
              src={userMessage.imageUrl} 
              alt="User uploaded" 
              className="max-w-xs rounded-lg"
              style={{ maxHeight: '200px', objectFit: 'cover' }}
            />
          </div>
        )}

        {/* Image analysis results for user messages */}
        {isUser && userMessage.imageResult && (
          <div className="mb-3 p-3 rounded-lg" style={{ background: 'var(--input-bar-bg)', border: '1px solid var(--input-bar-border)' }}>
            <h4 className="text-sm font-semibold mb-2" style={{ color: 'var(--text-label)' }}>Image Analysis:</h4>
            
            {userMessage.imageResult.caption && (
              <div className="mb-2">
                <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>Caption: </span>
                <span className="text-sm">{userMessage.imageResult.caption}</span>
              </div>
            )}
            
            {userMessage.imageResult.description && (
              <div className="mb-2">
                <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>Description: </span>
                <span className="text-sm">{userMessage.imageResult.description}</span>
              </div>
            )}
            
            {userMessage.imageResult.object_detection && userMessage.imageResult.object_detection.length > 0 && (
              <div className="mb-2">
                <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>Objects: </span>
                <span className="text-sm">
                  {userMessage.imageResult.object_detection.map((obj, i) => (
                    <span key={i} className="inline-block bg-gray-700 rounded px-2 py-1 mr-1 mb-1 text-xs">
                      {obj.class} ({(obj.confidence * 100).toFixed(1)}%)
                    </span>
                  ))}
                </span>
              </div>
            )}
            
            {userMessage.imageResult.classification && userMessage.imageResult.classification.length > 0 && (
              <div className="mb-2">
                <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>Classification: </span>
                <span className="text-sm">
                  {userMessage.imageResult.classification.map((cls, i) => (
                    <span key={i} className="inline-block bg-gray-700 rounded px-2 py-1 mr-1 mb-1 text-xs">
                      {cls.class} ({(cls.confidence * 100).toFixed(1)}%)
                    </span>
                  ))}
                </span>
              </div>
            )}
            
            {userMessage.imageResult.text_extraction && userMessage.imageResult.text_extraction.length > 0 && (
              <div className="mb-2">
                <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>Extracted Text: </span>
                <div className="text-sm bg-gray-800 p-2 rounded mt-1">
                  {userMessage.imageResult.text_extraction.map((text, i) => (
                    <div key={i} className="mb-1">
                      &quot;{text.text}&quot; ({(text.confidence * 100).toFixed(1)}%)
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {userMessage.imageResult.analysis_time && (
              <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                Analysis time: {userMessage.imageResult.analysis_time.toFixed(2)}s
              </div>
            )}
          </div>
        )}

        {/* Message content */}
        <div className="prose prose-invert max-w-none">
          {isLatestAssistant ? (
            <TypewriterMarkdown text={message.content} />
          ) : (
            <CodeBlock>{message.content}</CodeBlock>
          )}
        </div>

        {/* File attachment for user messages */}
        {isUser && userMessage.fileUrl && (
          <div className="mt-3 p-3 rounded-lg" style={{ background: 'var(--input-bar-bg)', border: '1px solid var(--input-bar-border)' }}>
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
              </svg>
              <a 
                href={userMessage.fileUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-sm hover:underline"
                style={{ color: 'var(--text-label)' }}
              >
                {userMessage.fileName || 'Download file'}
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 