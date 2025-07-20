import { useEffect, useRef } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, signInUser, saveChatSession, loadChatSessions, deleteChatSession, saveUserPreferences, loadUserPreferences } from '../app/firebase';
import { useApp } from '../contexts/AppContext';
import { generateSessionTitle } from '../utils';
import { 
  Message, 
  ChatSession, 
  UserPreferences, 
  UserMessage,
  ValidationResult 
} from '../types';
import { 
  handleError, 
  validateChatSession, 
  validateUserPreferences,
  withRetry,
  withTimeout 
} from '../utils/errorHandling';

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
        try {
          const sessions = await withRetry(() => loadChatSessions(user.uid));
          dispatch({ type: 'SET_CHAT_SESSIONS', payload: sessions });
          chatSessionsRef.current = sessions;
        } catch (error) {
          console.error('Error loading chat sessions:', error);
          const appError = handleError(error);
          dispatch({ type: 'SET_ERROR', payload: appError.message });
        }
      }
    });

    return () => unsubscribe();
  }, [dispatch]);

  // Auto-sign in if not authenticated
  useEffect(() => {
    if (!state.authLoading && !state.user) {
      signInUser().catch((error) => {
        console.error('Auto sign-in failed:', error);
        const appError = handleError(error);
        dispatch({ type: 'SET_ERROR', payload: appError.message });
      });
    }
  }, [state.authLoading, state.user, dispatch]);

  // Update current session when messages change - with debounced save
  useEffect(() => {
    if (state.currentSessionId && state.messages.length > 0 && state.user) {
      const updatedSession = chatSessionsRef.current.find(s => s.id === state.currentSessionId);
      if (updatedSession) {
        const newSession: ChatSession = { 
          ...updatedSession, 
          messages: state.messages, 
          title: generateSessionTitle(state.messages),
          updatedAt: new Date() 
        };
        
        // Validate the session before saving
        const validation: ValidationResult = validateChatSession(newSession);
        if (!validation.isValid) {
          console.error('Invalid session data:', validation.errors);
          return;
        }
        
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
            await withRetry(() => saveChatSession(state.user!.uid, newSession));
            // Update the sessions state
            dispatch({ type: 'SET_CHAT_SESSIONS', payload: chatSessionsRef.current });
          } catch (error) {
            console.error('Error saving chat session:', error);
            const appError = handleError(error);
            dispatch({ type: 'SET_ERROR', payload: appError.message });
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
      
      withRetry(() => loadUserPreferences(state.user!.uid))
        .then((prefs: UserPreferences) => {
          // Validate preferences before setting
          const validation: ValidationResult = validateUserPreferences(prefs);
          if (!validation.isValid) {
            console.warn('Invalid preferences data:', validation.errors);
            // Use default values for invalid preferences
            prefs = {};
          }
          
          // Ensure answerStyle is a valid type
          const validAnswerStyle: UserPreferences['answerStyle'] = 
            prefs.answerStyle && 
            ['friendly', 'formal', 'concise', 'detailed'].includes(prefs.answerStyle) 
            ? (prefs.answerStyle as 'friendly' | 'formal' | 'concise' | 'detailed')
            : undefined;
          
          dispatch({ type: 'SET_USER_NAME', payload: prefs.userName || '' });
          dispatch({ type: 'SET_USER_INTERESTS', payload: prefs.userInterests || '' });
          dispatch({ type: 'SET_ANSWER_STYLE', payload: validAnswerStyle });
          dispatch({ type: 'SET_CUSTOM_PERSONALITY', payload: prefs.customPersonality || '' });
        })
        .catch((error) => {
          console.error('Error loading user preferences:', error);
          const appError = handleError(error);
          dispatch({ type: 'SET_ERROR', payload: appError.message });
        })
        .finally(() => dispatch({ type: 'SET_PREFS_LOADING', payload: false }));
    }
  }, [state.user, dispatch]);

  // Firebase operations
  const handleNewChat = (): void => {
    dispatch({ type: 'RESET_CHAT' });
  };

  const loadChatSession = async (sessionId: string): Promise<void> => {
    const session = state.chatSessions.find(s => s.id === sessionId);
    if (session) {
      // Validate the session before loading
      const validation: ValidationResult = validateChatSession(session);
      if (!validation.isValid) {
        console.error('Invalid session data:', validation.errors);
        dispatch({ type: 'SET_ERROR', payload: 'Invalid session data' });
        return;
      }
      
      dispatch({ type: 'SET_MESSAGES', payload: session.messages });
      dispatch({ type: 'SET_CURRENT_SESSION_ID', payload: sessionId });
      dispatch({ type: 'SET_IMAGE', payload: null });
      dispatch({ type: 'SET_IMAGE_PREVIEW_URL', payload: null });
      dispatch({ type: 'CLEAR_ERROR' });
    }
  };

  const handleDeleteChatSession = async (sessionId: string): Promise<void> => {
    if (state.user) {
      try {
        await withRetry(() => deleteChatSession(state.user!.uid, sessionId));
        const updatedSessions = state.chatSessions.filter(s => s.id !== sessionId);
        dispatch({ type: 'SET_CHAT_SESSIONS', payload: updatedSessions });
        chatSessionsRef.current = updatedSessions;
        
        if (state.currentSessionId === sessionId) {
          handleNewChat();
        }
      } catch (error) {
        console.error('Error deleting chat session:', error);
        const appError = handleError(error);
        dispatch({ type: 'SET_ERROR', payload: appError.message });
      }
    }
  };

  const handleSaveSettings = async (): Promise<void> => {
    if (!state.user) return;
    
    try {
      const prefs: UserPreferences = {
        userName: state.userName,
        userInterests: state.userInterests,
        answerStyle: state.answerStyle,
        customPersonality: state.customPersonality
      };
      
      // Validate preferences before saving
      const validation: ValidationResult = validateUserPreferences(prefs);
      if (!validation.isValid) {
        console.error('Invalid preferences data:', validation.errors);
        dispatch({ type: 'SET_ERROR', payload: validation.errors[0].message });
        return;
      }
      
      await withRetry(() => saveUserPreferences(state.user!.uid, prefs));
      
      dispatch({ type: 'SET_SETTINGS_SAVED', payload: true });
      setTimeout(() => dispatch({ type: 'SET_SETTINGS_SAVED', payload: false }), 2000);
    } catch (error) {
      console.error('Error saving preferences:', error);
      const appError = handleError(error);
      dispatch({ type: 'SET_ERROR', payload: appError.message });
    }
  };

  const createNewSession = (userMessage: UserMessage): ChatSession | null => {
    if (!state.user) return null;
    
    const sessionId = Date.now().toString();
    const newSession: ChatSession = {
      id: sessionId,
      title: generateSessionTitle([userMessage]),
      messages: [...state.messages, userMessage],
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    // Validate the session before creating
    const validation: ValidationResult = validateChatSession(newSession);
    if (!validation.isValid) {
      console.error('Invalid session data:', validation.errors);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to create session' });
      return null;
    }
    
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