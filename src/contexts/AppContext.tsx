import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { User } from 'firebase/auth';
import { Message, ChatSession, FileType } from '../types';

// State interface
interface AppState {
  // Chat state
  messages: Message[];
  currentSessionId: string | null;
  chatSessions: ChatSession[];
  
  // UI state
  input: string;
  loading: boolean;
  responseTime: number | null;
  isWebSearching: boolean;
  error: string | null;
  sidebarOpen: boolean;
  showTools: boolean;
  showPlusMenu: boolean;
  
  // File/Image state
  image: File | null;
  imagePreviewUrl: string | null;
  fileType: FileType;
  
  // User state
  user: User | null;
  authLoading: boolean;
  
  // User preferences
  userName: string;
  userInterests: string;
  answerStyle: string;
  customPersonality: string;
  settingsSaved: boolean;
  prefsLoading: boolean;
  
  // Settings
  ocrLang: string;
  categories: string;
}

// Action types
type AppAction =
  | { type: 'SET_MESSAGES'; payload: Message[] }
  | { type: 'ADD_MESSAGE'; payload: Message }
  | { type: 'SET_CURRENT_SESSION_ID'; payload: string | null }
  | { type: 'SET_CHAT_SESSIONS'; payload: ChatSession[] }
  | { type: 'ADD_CHAT_SESSION'; payload: ChatSession }
  | { type: 'UPDATE_CHAT_SESSION'; payload: { id: string; session: ChatSession } }
  | { type: 'DELETE_CHAT_SESSION'; payload: string }
  | { type: 'SET_INPUT'; payload: string }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_RESPONSE_TIME'; payload: number | null }
  | { type: 'SET_WEB_SEARCHING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_SIDEBAR_OPEN'; payload: boolean }
  | { type: 'SET_SHOW_TOOLS'; payload: boolean }
  | { type: 'SET_SHOW_PLUS_MENU'; payload: boolean }
  | { type: 'SET_IMAGE'; payload: File | null }
  | { type: 'SET_IMAGE_PREVIEW_URL'; payload: string | null }
  | { type: 'SET_FILE_TYPE'; payload: FileType }
  | { type: 'SET_USER'; payload: User | null }
  | { type: 'SET_AUTH_LOADING'; payload: boolean }
  | { type: 'SET_USER_NAME'; payload: string }
  | { type: 'SET_USER_INTERESTS'; payload: string }
  | { type: 'SET_ANSWER_STYLE'; payload: string }
  | { type: 'SET_CUSTOM_PERSONALITY'; payload: string }
  | { type: 'SET_SETTINGS_SAVED'; payload: boolean }
  | { type: 'SET_PREFS_LOADING'; payload: boolean }
  | { type: 'SET_OCR_LANG'; payload: string }
  | { type: 'SET_CATEGORIES'; payload: string }
  | { type: 'RESET_CHAT' }
  | { type: 'CLEAR_ERROR' };

// Initial state
const initialState: AppState = {
  messages: [],
  currentSessionId: null,
  chatSessions: [],
  input: '',
  loading: false,
  responseTime: null,
  isWebSearching: false,
  error: null,
  sidebarOpen: true,
  showTools: false,
  showPlusMenu: false,
  image: null,
  imagePreviewUrl: null,
  fileType: 'images',
  user: null,
  authLoading: true,
  userName: '',
  userInterests: '',
  answerStyle: '',
  customPersonality: '',
  settingsSaved: false,
  prefsLoading: false,
  ocrLang: 'en',
  categories: '',
};

// Reducer function
function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_MESSAGES':
      return { ...state, messages: action.payload };
    case 'ADD_MESSAGE':
      return { ...state, messages: [...state.messages, action.payload] };
    case 'SET_CURRENT_SESSION_ID':
      return { ...state, currentSessionId: action.payload };
    case 'SET_CHAT_SESSIONS':
      return { ...state, chatSessions: action.payload };
    case 'ADD_CHAT_SESSION':
      return { ...state, chatSessions: [action.payload, ...state.chatSessions] };
    case 'UPDATE_CHAT_SESSION':
      return {
        ...state,
        chatSessions: state.chatSessions.map(session =>
          session.id === action.payload.id ? action.payload.session : session
        ),
      };
    case 'DELETE_CHAT_SESSION':
      return {
        ...state,
        chatSessions: state.chatSessions.filter(session => session.id !== action.payload),
      };
    case 'SET_INPUT':
      return { ...state, input: action.payload };
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_RESPONSE_TIME':
      return { ...state, responseTime: action.payload };
    case 'SET_WEB_SEARCHING':
      return { ...state, isWebSearching: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'SET_SIDEBAR_OPEN':
      return { ...state, sidebarOpen: action.payload };
    case 'SET_SHOW_TOOLS':
      return { ...state, showTools: action.payload };
    case 'SET_SHOW_PLUS_MENU':
      return { ...state, showPlusMenu: action.payload };
    case 'SET_IMAGE':
      return { ...state, image: action.payload };
    case 'SET_IMAGE_PREVIEW_URL':
      return { ...state, imagePreviewUrl: action.payload };
    case 'SET_FILE_TYPE':
      return { ...state, fileType: action.payload };
    case 'SET_USER':
      return { ...state, user: action.payload };
    case 'SET_AUTH_LOADING':
      return { ...state, authLoading: action.payload };
    case 'SET_USER_NAME':
      return { ...state, userName: action.payload };
    case 'SET_USER_INTERESTS':
      return { ...state, userInterests: action.payload };
    case 'SET_ANSWER_STYLE':
      return { ...state, answerStyle: action.payload };
    case 'SET_CUSTOM_PERSONALITY':
      return { ...state, customPersonality: action.payload };
    case 'SET_SETTINGS_SAVED':
      return { ...state, settingsSaved: action.payload };
    case 'SET_PREFS_LOADING':
      return { ...state, prefsLoading: action.payload };
    case 'SET_OCR_LANG':
      return { ...state, ocrLang: action.payload };
    case 'SET_CATEGORIES':
      return { ...state, categories: action.payload };
    case 'RESET_CHAT':
      return {
        ...state,
        messages: [],
        currentSessionId: null,
        image: null,
        imagePreviewUrl: null,
        error: null,
      };
    case 'CLEAR_ERROR':
      return { ...state, error: null };
    default:
      return state;
  }
}

// Context interface
interface AppContextType {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
}

// Create context
const AppContext = createContext<AppContextType | undefined>(undefined);

// Provider component
interface AppProviderProps {
  children: ReactNode;
}

export function AppProvider({ children }: AppProviderProps) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
}

// Custom hook to use the context
export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
} 