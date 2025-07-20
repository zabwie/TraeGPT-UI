import { useEffect, useRef } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, signInUser, saveChatSession, loadChatSessions, deleteChatSession, saveUserPreferences, loadUserPreferences } from '../app/firebase';
import { useApp } from '../contexts/AppContext';
import { generateSessionTitle } from '../utils';
import { Message, ChatSession, UserPreferences } from '../types';

export function useFirebase() {
  const { state, dispatch } = useApp();
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const chatSessionsRef = useRef<ChatSession[]>([]);

  // Handle authentication state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      dispatch({ type: 'SET_USER', payload: user });
      dispatch({ type: 'SET_AUTH_LOADING', payload: false });
      
      if (user) {
        // Load chat sessions for authenticated user
        const sessions = await loadChatSessions(user.uid);
        dispatch({ type: 'SET_CHAT_SESSIONS', payload: sessions });
        chatSessionsRef.current = sessions;
      }
    });

    return () => unsubscribe();
  }, [dispatch]);

  // Auto-sign in if not authenticated
  useEffect(() => {
    if (!state.authLoading && !state.user) {
      signInUser().catch(console.error);
    }
  }, [state.authLoading, state.user]);

  // Update current session when messages change - with debounced save
  useEffect(() => {
    if (state.currentSessionId && state.messages.length > 0 && state.user) {
      const updatedSession = chatSessionsRef.current.find(s => s.id === state.currentSessionId);
      if (updatedSession) {
        const newSession = { 
          ...updatedSession, 
          messages: state.messages, 
          title: generateSessionTitle(state.messages),
          updatedAt: new Date() 
        };
        
        // Update the session in the ref
        chatSessionsRef.current = chatSessionsRef.current.map(s => 
          s.id === state.currentSessionId ? newSession : s
        );
        
        // Debounce the save to avoid too many Firebase writes
        if (saveTimeoutRef.current) {
          clearTimeout(saveTimeoutRef.current);
        }
        
        saveTimeoutRef.current = setTimeout(async () => {
          try {
            await saveChatSession(state.user!.uid, newSession);
            // Update the sessions state
            dispatch({ type: 'SET_CHAT_SESSIONS', payload: chatSessionsRef.current });
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
  }, [state.messages, state.currentSessionId, state.user, dispatch]);

  // Load user preferences when user changes
  useEffect(() => {
    if (state.user) {
      dispatch({ type: 'SET_PREFS_LOADING', payload: true });
      loadUserPreferences(state.user.uid)
        .then((prefs: UserPreferences) => {
          dispatch({ type: 'SET_USER_NAME', payload: prefs.userName || '' });
          dispatch({ type: 'SET_USER_INTERESTS', payload: prefs.userInterests || '' });
          dispatch({ type: 'SET_ANSWER_STYLE', payload: prefs.answerStyle || '' });
          dispatch({ type: 'SET_CUSTOM_PERSONALITY', payload: prefs.customPersonality || '' });
        })
        .catch(console.error)
        .finally(() => dispatch({ type: 'SET_PREFS_LOADING', payload: false }));
    }
  }, [state.user, dispatch]);

  // Firebase operations
  const handleNewChat = () => {
    dispatch({ type: 'RESET_CHAT' });
  };

  const loadChatSession = async (sessionId: string) => {
    const session = state.chatSessions.find(s => s.id === sessionId);
    if (session) {
      dispatch({ type: 'SET_MESSAGES', payload: session.messages });
      dispatch({ type: 'SET_CURRENT_SESSION_ID', payload: sessionId });
      dispatch({ type: 'SET_IMAGE', payload: null });
      dispatch({ type: 'SET_IMAGE_PREVIEW_URL', payload: null });
      dispatch({ type: 'CLEAR_ERROR' });
    }
  };

  const handleDeleteChatSession = async (sessionId: string) => {
    if (state.user) {
      try {
        await deleteChatSession(state.user.uid, sessionId);
        const updatedSessions = state.chatSessions.filter(s => s.id !== sessionId);
        dispatch({ type: 'SET_CHAT_SESSIONS', payload: updatedSessions });
        chatSessionsRef.current = updatedSessions;
        
        if (state.currentSessionId === sessionId) {
          handleNewChat();
        }
      } catch (error) {
        console.error('Error deleting chat session:', error);
      }
    }
  };

  const handleSaveSettings = async () => {
    if (!state.user) return;
    
    try {
      const prefs: UserPreferences = {
        userName: state.userName,
        userInterests: state.userInterests,
        answerStyle: state.answerStyle,
        customPersonality: state.customPersonality
      };
      
      await saveUserPreferences(state.user.uid, prefs);
      
      dispatch({ type: 'SET_SETTINGS_SAVED', payload: true });
      setTimeout(() => dispatch({ type: 'SET_SETTINGS_SAVED', payload: false }), 2000);
    } catch (error) {
      console.error('Error saving preferences:', error);
    }
  };

  const createNewSession = (userMessage: Message) => {
    if (!state.user) return null;
    
    const sessionId = Date.now().toString();
    const newSession: ChatSession = {
      id: sessionId,
      title: generateSessionTitle([userMessage]),
      messages: [...state.messages, userMessage],
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    dispatch({ type: 'SET_CURRENT_SESSION_ID', payload: sessionId });
    dispatch({ type: 'ADD_CHAT_SESSION', payload: newSession });
    chatSessionsRef.current = [newSession, ...state.chatSessions];
    
    return newSession;
  };

  return {
    handleNewChat,
    loadChatSession,
    handleDeleteChatSession,
    handleSaveSettings,
    createNewSession,
    chatSessionsRef
  };
} 