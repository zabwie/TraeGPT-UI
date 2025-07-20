"use client";
import React from "react";
import { signInUser } from './firebase';
import {
  ChatMessage,
  ChatInput,
  Sidebar,
  ToolsPanel,
  LoadingIndicator,
  ErrorMessage
} from '../components';
import { AppProvider, useApp } from '../contexts/AppContext';
import { useFirebase } from '../hooks/useFirebase';
import { useChat } from '../hooks/useChat';

function HomeContent() {
  const { state, dispatch } = useApp();
  const { 
    handleNewChat, 
    loadChatSession, 
    handleDeleteChatSession, 
    handleSaveSettings 
  } = useFirebase();
  const { 
    sendMessage, 
    handleFileChange, 
    handleKeyDown, 
    chatContainerRef, 
    textareaRef, 
    fileInputRef 
  } = useChat();

  if (state.authLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex" style={{ background: 'var(--chat-bg)' }}>
      {/* Sidebar */}
      <Sidebar
        isOpen={state.sidebarOpen}
        onClose={() => dispatch({ type: 'SET_SIDEBAR_OPEN', payload: false })}
        chatSessions={state.chatSessions}
        currentSessionId={state.currentSessionId}
        onNewChat={handleNewChat}
        onLoadSession={loadChatSession}
        onDeleteSession={handleDeleteChatSession}
      />

      {/* Main Content */}
      <div className={`flex-1 flex flex-col ${state.sidebarOpen ? 'ml-64' : ''}`}>
        {/* Top Bar */}
        <div style={{ background: 'var(--chat-bg)', borderBottom: '1px solid var(--sidebar-border)', color: 'var(--text-main)' }} className="px-6 py-3 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-4">
            {!state.sidebarOpen && (
              <button onClick={() => dispatch({ type: 'SET_SIDEBAR_OPEN', payload: true })} style={{ color: 'var(--text-secondary)' }} className="p-2 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            )}
            <h1 className="text-lg font-semibold" style={{ color: 'var(--text-main)' }}>TraeGPT</h1>
          </div>
          
          <div className="flex items-center gap-4">
            <button onClick={() => dispatch({ type: 'SET_SHOW_TOOLS', payload: !state.showTools })} style={{ color: 'var(--text-secondary)' }} className="flex items-center gap-1 transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span className="text-sm">Tools</span>
            </button>
            {!state.user && (
              <button
                onClick={signInUser}
                style={{ background: 'var(--button-bg)', color: 'var(--text-main)', border: 'none', borderRadius: 'var(--radius)', padding: '8px 18px', fontWeight: 500, fontSize: '1rem', cursor: 'pointer', transition: 'background 0.2s' }}
              >
                Sign up / Log in
              </button>
            )}
          </div>
        </div>

        {/* Chat Container */}
        <div className="flex-1 flex flex-col pt-0">
          <div
            ref={chatContainerRef}
            className="flex-1 overflow-y-auto px-6 py-6 space-y-4 pb-0"
          >
            {state.messages.length === 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', minHeight: '60vh', width: '100%' }}>
                <p style={{ color: 'var(--text-main)', fontSize: '2rem', fontWeight: 500, textAlign: 'center', margin: 0 }}>
                  How can I help?
                </p>
              </div>
            )}
            
            {state.messages.map((msg, i) => (
              <ChatMessage
                key={i}
                message={msg}
                isLatestAssistant={i === state.messages.length - 1 && msg.role === "assistant"}
              />
            ))}
            
            {state.loading && (
              <LoadingIndicator
                isWebSearching={state.isWebSearching}
                responseTime={state.responseTime}
              />
            )}
          </div>
        </div>

        {/* Tools Panel */}
        <ToolsPanel
          isVisible={state.showTools}
          prefsLoading={state.prefsLoading}
          user={state.user}
          userName={state.userName}
          setUserName={(value: string) => dispatch({ type: 'SET_USER_NAME', payload: value })}
          userInterests={state.userInterests}
          setUserInterests={(value: string) => dispatch({ type: 'SET_USER_INTERESTS', payload: value })}
          answerStyle={state.answerStyle || undefined}
          setAnswerStyle={(value: 'friendly' | 'formal' | 'concise' | 'detailed' | undefined) => dispatch({ type: 'SET_ANSWER_STYLE', payload: value })}
          customPersonality={state.customPersonality}
          setCustomPersonality={(value: string) => dispatch({ type: 'SET_CUSTOM_PERSONALITY', payload: value })}
          ocrLang={state.ocrLang}
          setOcrLang={(value: string) => dispatch({ type: 'SET_OCR_LANG', payload: value })}
          categories={state.categories}
          setCategories={(value: string) => dispatch({ type: 'SET_CATEGORIES', payload: value })}
          loading={state.loading}
          onSaveSettings={handleSaveSettings}
          settingsSaved={state.settingsSaved}
        />

        {/* Error Message */}
        {state.error && <ErrorMessage message={state.error} />}

        {/* Chat Input */}
        <ChatInput
          input={state.input}
          setInput={(value: string) => dispatch({ type: 'SET_INPUT', payload: value })}
          loading={state.loading}
          onSendMessage={sendMessage}
          imagePreviewUrl={state.imagePreviewUrl}
          showPlusMenu={state.showPlusMenu}
          setShowPlusMenu={(value: boolean) => dispatch({ type: 'SET_SHOW_PLUS_MENU', payload: value })}
          fileType={state.fileType}
          setFileType={(value: 'images' | 'attachments' | 'documents') => dispatch({ type: 'SET_FILE_TYPE', payload: value })}
          onKeyDown={handleKeyDown}
          textareaRef={textareaRef}
          fileInputRef={fileInputRef}
        />
      </div>
      
      {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  );
}

export default function Home() {
  return (
    <AppProvider>
      <HomeContent />
    </AppProvider>
  );
} 