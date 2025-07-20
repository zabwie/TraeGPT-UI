import React from 'react';
import { ChatSession } from '../../app/firebase';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  chatSessions: ChatSession[];
  currentSessionId: string | null;
  onNewChat: () => void;
  onLoadSession: (sessionId: string) => void;
  onDeleteSession: (sessionId: string) => void;
}

export default function Sidebar({
  isOpen,
  onClose,
  chatSessions,
  currentSessionId,
  onNewChat,
  onLoadSession,
  onDeleteSession
}: SidebarProps) {
  if (!isOpen) return null;

  return (
    <div
      className="w-64 sidebar"
      style={{
        position: 'fixed',
        left: 0,
        top: 0,
        height: '100vh',
        background: 'var(--sidebar-bg)',
        borderRight: '1px solid var(--sidebar-border)',
        color: 'var(--text-main)',
        zIndex: 10
      }}
    >
      <div className="p-4" style={{ borderBottom: '1px solid var(--sidebar-border)' }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2" style={{ color: 'var(--text-main)' }}>
            <div style={{ background: 'var(--sidebar-icon-bg)', color: 'var(--sidebar-icon-color)', width: 32, height: 32, borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <span className="text-lg font-semibold">TraeGPT</span>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
          <button onClick={onClose} style={{ color: 'var(--text-secondary)' }} className="p-1 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
      
      <div className="flex-1 p-4 space-y-1 overflow-y-auto">
        <button onClick={onNewChat} style={{ color: 'var(--text-secondary)', background: 'none' }} className="w-full p-3 rounded-lg flex items-center gap-3 transition-colors sidebar-newchat">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
          <span className="text-sm">New chat</span>
        </button>
        
        {/* Chat History */}
        <div className="mt-4 space-y-1">
          {chatSessions.map((session) => (
            <div
              key={session.id}
              onClick={() => onLoadSession(session.id)}
              style={{ background: currentSessionId === session.id ? 'var(--sidebar-selected-bg)' : 'none', color: currentSessionId === session.id ? 'var(--text-main)' : 'var(--text-secondary)' }}
              className={`w-full p-3 rounded-lg flex items-center justify-between group cursor-pointer transition-colors sidebar-session${currentSessionId === session.id ? ' selected' : ''}`}
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <span className="text-sm truncate">{session.title}</span>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteSession(session.id);
                }}
                style={{ color: 'var(--text-secondary)' }}
                className="opacity-0 group-hover:opacity-100 p-1 transition-all"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 