"use client";
import React, { useRef, useState, useEffect } from "react";
import { auth, signInUser, saveChatSession, loadChatSessions, deleteChatSession as fbDeleteChatSession, Message, ChatSession, uploadImageAndGetUrl, saveUserPreferences, loadUserPreferences } from './firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { generateSessionTitle } from '../utils';
import { Message as MessageType, ChatSession as ChatSessionType, UserPreferences, FileType } from '../types';
import {
  ChatMessage,
  ChatInput,
  Sidebar,
  ToolsPanel,
  LoadingIndicator,
  ErrorMessage
} from '../components';

export default function Home() {
  const [messages, setMessages] = useState<MessageType[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [responseTime, setResponseTime] = useState<number | null>(null);
  const [image, setImage] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [ocrLang, setOcrLang] = useState("en");
  const [categories, setCategories] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [showTools, setShowTools] = useState(false);
  const [showPlusMenu, setShowPlusMenu] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [chatSessions, setChatSessions] = useState<ChatSessionType[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [fileType, setFileType] = useState<FileType>('images');
  
  // Add new state for personalization
  const [userName, setUserName] = useState("");
  const [userInterests, setUserInterests] = useState("");
  const [answerStyle, setAnswerStyle] = useState("");
  const [customPersonality, setCustomPersonality] = useState("");
  const [settingsSaved, setSettingsSaved] = useState(false);
  
  // Add state to hold the last saved personalization settings
  const [savedUserName, setSavedUserName] = useState("");
  const [savedUserInterests, setSavedUserInterests] = useState("");
  const [savedAnswerStyle, setSavedAnswerStyle] = useState("");
  const [savedCustomPersonality, setSavedCustomPersonality] = useState("");
  
  // Add loading state for preferences
  const [prefsLoading, setPrefsLoading] = useState(false);
  
  // Add debounce ref for Firebase saves
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Add state to track web search
  const [isWebSearching, setIsWebSearching] = useState(false);
  
  // Add ref to track current chat sessions to avoid infinite loops
  const chatSessionsRef = useRef<ChatSessionType[]>([]);

  // Handle authentication state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      setAuthLoading(false);
      
      if (user) {
        // Load chat sessions for authenticated user
        const sessions = await loadChatSessions(user.uid);
        setChatSessions(sessions as ChatSessionType[]);
        chatSessionsRef.current = sessions as ChatSessionType[];
      }
    });

    return () => unsubscribe();
  }, []);

  // Auto-sign in if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      signInUser().catch(console.error);
    }
  }, [authLoading, user]);

  // Update current session when messages change - with debounced save
  useEffect(() => {
    if (currentSessionId && messages.length > 0 && user) {
      const updatedSession = chatSessionsRef.current.find(s => s.id === currentSessionId);
      if (updatedSession) {
        const newSession = { 
          ...updatedSession, 
          messages, 
          title: generateSessionTitle(messages),
          updatedAt: new Date() 
        };
        
        // Update the session in the ref
        chatSessionsRef.current = chatSessionsRef.current.map(s => 
          s.id === currentSessionId ? newSession : s
        );
        
        // Debounce the save to avoid too many Firebase writes
        if (saveTimeoutRef.current) {
          clearTimeout(saveTimeoutRef.current);
        }
        
        saveTimeoutRef.current = setTimeout(async () => {
          try {
            await saveChatSession(user.uid, newSession);
            // Update the sessions state
            setChatSessions(chatSessionsRef.current);
          } catch (error) {
            console.error('Error saving chat session:', error);
          }
        }, 1000); // Save after 1 second of inactivity
      }
    }
    
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [messages, currentSessionId, user]);

  // Load user preferences when user changes
  useEffect(() => {
    if (user) {
      setPrefsLoading(true);
      loadUserPreferences(user.uid)
        .then((prefs: UserPreferences) => {
          setUserName(prefs.userName || '');
          setUserInterests(prefs.userInterests || '');
          setAnswerStyle(prefs.answerStyle || '');
          setCustomPersonality(prefs.customPersonality || '');
          
          // Set saved values for comparison
          setSavedUserName(prefs.userName || '');
          setSavedUserInterests(prefs.userInterests || '');
          setSavedAnswerStyle(prefs.answerStyle || '');
          setSavedCustomPersonality(prefs.customPersonality || '');
        })
        .catch(console.error)
        .finally(() => setPrefsLoading(false));
    }
  }, [user]);

  function handleNewChat() {
    setMessages([]);
    setCurrentSessionId(null);
    setImage(null);
    setImagePreviewUrl(null);
    setError(null);
  }

  async function loadChatSession(sessionId: string) {
    const session = chatSessions.find(s => s.id === sessionId);
    if (session) {
      setMessages(session.messages);
      setCurrentSessionId(sessionId);
      setImage(null);
      setImagePreviewUrl(null);
      setError(null);
    }
  }

  async function handleDeleteChatSession(sessionId: string) {
    if (user) {
      try {
        await fbDeleteChatSession(user.uid, sessionId);
        const updatedSessions = chatSessions.filter(s => s.id !== sessionId);
        setChatSessions(updatedSessions);
        chatSessionsRef.current = updatedSessions;
        
        if (currentSessionId === sessionId) {
          handleNewChat();
        }
      } catch (error) {
        console.error('Error deleting chat session:', error);
      }
    }
  }

  async function handleSaveSettings() {
    if (!user) return;
    
    try {
      const prefs: UserPreferences = {
        userName,
        userInterests,
        answerStyle,
        customPersonality
      };
      
      await saveUserPreferences(user.uid, prefs);
      
      // Update saved values
      setSavedUserName(userName);
      setSavedUserInterests(userInterests);
      setSavedAnswerStyle(answerStyle);
      setSavedCustomPersonality(customPersonality);
      
      setSettingsSaved(true);
      setTimeout(() => setSettingsSaved(false), 2000);
    } catch (error) {
      console.error('Error saving preferences:', error);
    }
  }

  function buildSystemPrompt() {
    let systemPrompt = "You are TraeGPT, a helpful AI assistant. You can help with various tasks including coding, analysis, and general questions.";
    
    // Add personalization based on user preferences
    if (userName) {
      systemPrompt += ` The user's name is ${userName}.`;
    }
    
    if (userInterests) {
      systemPrompt += ` The user is interested in: ${userInterests}.`;
    }
    
    if (answerStyle) {
      switch (answerStyle) {
        case 'friendly':
          systemPrompt += " Always respond in a friendly and conversational tone.";
          break;
        case 'formal':
          systemPrompt += " Always respond in a formal and professional tone.";
          break;
        case 'concise':
          systemPrompt += " Always provide concise and to-the-point responses.";
          break;
        case 'detailed':
          systemPrompt += " Always provide detailed and comprehensive responses.";
          break;
      }
    }
    
    if (customPersonality) {
      systemPrompt += ` ${customPersonality}`;
    }
    
    return systemPrompt;
  }

  async function sendMessage() {
    if (!input.trim() && !image) return;
    
    const userMessage: MessageType = {
      role: 'user',
      content: input.trim(),
      imageUrl: image ? imagePreviewUrl || undefined : undefined
    };
    
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput("");
    setImage(null);
    setImagePreviewUrl(null);
    setError(null);
    setLoading(true);
    setResponseTime(null);
    
    // Create new session if none exists
    if (!currentSessionId && user) {
      const sessionId = Date.now().toString();
      const newSession: ChatSessionType = {
        id: sessionId,
        title: generateSessionTitle([userMessage]),
        messages: newMessages,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      setCurrentSessionId(sessionId);
      setChatSessions([newSession, ...chatSessions]);
      chatSessionsRef.current = [newSession, ...chatSessions];
    }
    
    try {
      const startTime = Date.now();
      
      // Prepare messages for API
      const apiMessages = [
        { role: 'system', content: buildSystemPrompt() },
        ...newMessages
      ];
      
      // Check if we need to do web search
      const shouldWebSearch = input.toLowerCase().includes('search') || 
                             input.toLowerCase().includes('find') || 
                             input.toLowerCase().includes('latest') ||
                             input.toLowerCase().includes('news') ||
                             input.toLowerCase().includes('current');
      
      let searchResults = '';
      if (shouldWebSearch) {
        setIsWebSearching(true);
        try {
          const searchResponse = await fetch('/api/search', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query: input, numResults: 3 })
          });
          
          if (searchResponse.ok) {
            const searchData = await searchResponse.json();
            searchResults = searchData.results;
          }
        } catch (error) {
          console.error('Web search error:', error);
        } finally {
          setIsWebSearching(false);
        }
      }
      
      // Prepare the final message content
      let finalContent = input;
      if (searchResults) {
        finalContent = `${searchResults}\n\nBased on the above search results, please answer: ${input}`;
      }
      
      // Add image analysis if image is present
      if (image) {
        try {
          // Upload image to Firebase
          const imageUrl = await uploadImageAndGetUrl(image, user?.uid || 'anonymous');
          
          // Analyze image
          const formData = new FormData();
          formData.append('file', image);
          
          const [captionRes, detectRes, classifyRes, analyzeRes] = await Promise.all([
            fetch('/api/image/caption', { method: 'POST', body: formData }),
            fetch('/api/image/detect', { method: 'POST', body: formData }),
            fetch('/api/image/classify', { method: 'POST', body: formData }),
            fetch('/api/image/analyze', { method: 'POST', body: formData })
          ]);
          
          const imageResult: any = {};
          
          if (captionRes.ok) {
            const captionData = await captionRes.json();
            if (captionData[0]?.generated_text) {
              imageResult.caption = captionData[0].generated_text;
            }
          }
          
          if (detectRes.ok) {
            const detectData = await detectRes.json();
            if (detectData.length > 0) {
              imageResult.object_detection = detectData.slice(0, 5);
            }
          }
          
          if (classifyRes.ok) {
            const classifyData = await classifyRes.json();
            if (classifyData.length > 0) {
              imageResult.classification = classifyData.slice(0, 5);
            }
          }
          
          if (analyzeRes.ok) {
            const analyzeData = await analyzeRes.json();
            if (analyzeData.description) {
              imageResult.description = analyzeData.description;
            }
            if (analyzeData.analysis_time) {
              imageResult.analysis_time = analyzeData.analysis_time;
            }
          }
          
          // Update user message with image URL and results
          userMessage.imageUrl = imageUrl;
          userMessage.imageResult = imageResult;
          
          // Update messages with the image results
          setMessages([...messages, userMessage]);
          
          // Add image context to the prompt
          finalContent += `\n\nImage Analysis: ${JSON.stringify(imageResult)}`;
        } catch (error) {
          console.error('Image processing error:', error);
        }
      }
      
      // Call TogetherAI API
      const togetherResponse = await fetch('/api/togetherai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            { role: 'system', content: buildSystemPrompt() },
            ...messages,
            { role: 'user', content: finalContent }
          ]
        })
      });
      
      if (!togetherResponse.ok) {
        throw new Error(`API error: ${togetherResponse.status}`);
      }
      
      const togetherData = await togetherResponse.json();
      const assistantMessage: MessageType = {
        role: 'assistant',
        content: togetherData.choices[0]?.message?.content || 'Sorry, I encountered an error.'
      };
      
      const finalMessages = [...messages, userMessage, assistantMessage];
      setMessages(finalMessages);
      setResponseTime(Date.now() - startTime);
      
    } catch (error) {
      console.error('Error sending message:', error);
      setError('Failed to send message. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      if (fileType === 'images') {
        setImage(file);
        const reader = new FileReader();
        reader.onload = (e) => {
          setImagePreviewUrl(e.target?.result as string);
        };
        reader.readAsDataURL(file);
      } else {
        // Handle other file types
        console.log('File uploaded:', file.name, file.type, file.size);
      }
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  if (authLoading) {
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
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        chatSessions={chatSessions}
        currentSessionId={currentSessionId}
        onNewChat={handleNewChat}
        onLoadSession={loadChatSession}
        onDeleteSession={handleDeleteChatSession}
      />

      {/* Main Content */}
      <div className={`flex-1 flex flex-col ${sidebarOpen ? 'ml-64' : ''}`}>
        {/* Top Bar */}
        <div style={{ background: 'var(--chat-bg)', borderBottom: '1px solid var(--sidebar-border)', color: 'var(--text-main)' }} className="px-6 py-3 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-4">
            {!sidebarOpen && (
              <button onClick={() => setSidebarOpen(true)} style={{ color: 'var(--text-secondary)' }} className="p-2 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            )}
            <h1 className="text-lg font-semibold" style={{ color: 'var(--text-main)' }}>TraeGPT</h1>
          </div>
          
          <div className="flex items-center gap-4">
            <button onClick={() => setShowTools(!showTools)} style={{ color: 'var(--text-secondary)' }} className="flex items-center gap-1 transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span className="text-sm">Tools</span>
            </button>
            {!user && (
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
            {messages.length === 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', minHeight: '60vh', width: '100%' }}>
                <p style={{ color: 'var(--text-main)', fontSize: '2rem', fontWeight: 500, textAlign: 'center', margin: 0 }}>
                  How can I help?
                </p>
              </div>
            )}
            
            {messages.map((msg, i) => (
              <ChatMessage
                key={i}
                message={msg}
                index={i}
                isLatestAssistant={i === messages.length - 1 && msg.role === "assistant"}
                imagePreviewUrl={imagePreviewUrl}
              />
            ))}
            
            {loading && (
              <LoadingIndicator
                isWebSearching={isWebSearching}
                responseTime={responseTime}
              />
            )}
          </div>
        </div>

        {/* Tools Panel */}
        <ToolsPanel
          isVisible={showTools}
          prefsLoading={prefsLoading}
          user={user}
          userName={userName}
          setUserName={setUserName}
          userInterests={userInterests}
          setUserInterests={setUserInterests}
          answerStyle={answerStyle}
          setAnswerStyle={setAnswerStyle}
          customPersonality={customPersonality}
          setCustomPersonality={setCustomPersonality}
          ocrLang={ocrLang}
          setOcrLang={setOcrLang}
          categories={categories}
          setCategories={setCategories}
          loading={loading}
          onSaveSettings={handleSaveSettings}
          settingsSaved={settingsSaved}
        />

        {/* Error Message */}
        {error && <ErrorMessage message={error} />}

        {/* Chat Input */}
        <ChatInput
          input={input}
          setInput={setInput}
          loading={loading}
          onSendMessage={sendMessage}
          imagePreviewUrl={imagePreviewUrl}
          showPlusMenu={showPlusMenu}
          setShowPlusMenu={setShowPlusMenu}
          fileType={fileType}
          setFileType={setFileType}
          onFileChange={handleFileChange}
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