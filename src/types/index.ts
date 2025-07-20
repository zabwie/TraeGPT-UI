// Type definitions

// API Response Types
export interface TogetherAIResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export interface WebSearchResponse {
  results: string;
  query: string;
  numResults: number;
}

export interface ImageAnalysisResponse {
  caption?: string;
  object_detection?: Array<{
    class: string;
    confidence: number;
  }>;
  text_extraction?: Array<{
    text: string;
    confidence: number;
  }>;
  classification?: Array<{
    class: string;
    confidence: number;
  }>;
  description?: string;
  analysis_time?: number;
}

export interface ImageCaptionResponse {
  generated_text: string;
}

export type ImageDetectionResponse = Array<{
  class: string;
  confidence: number;
}>;

export type ImageClassificationResponse = Array<{
  class: string;
  confidence: number;
}>;

export interface ImageAnalyzeResponse {
  description?: string;
  analysis_time?: number;
}

// Error Types
export interface ApiError {
  message: string;
  status?: number;
  code?: string;
}

export interface FirebaseError {
  code: string;
  message: string;
  stack?: string;
}

export interface ValidationError {
  field: string;
  message: string;
}

export type AppError = ApiError | FirebaseError | ValidationError;

// Message Types with Discriminated Unions
export type MessageRole = 'user' | 'assistant' | 'system';

export interface BaseMessage {
  role: MessageRole;
  content: string;
}

export interface UserMessage extends BaseMessage {
  role: 'user';
  imageUrl?: string;
  imageResult?: ImageResult;
  fileUrl?: string;
  fileName?: string;
  fileType?: string;
}

export interface AssistantMessage extends BaseMessage {
  role: 'assistant';
}

export interface SystemMessage extends BaseMessage {
  role: 'system';
}

export type Message = UserMessage | AssistantMessage | SystemMessage;

// Image Analysis Types
export interface ImageResult {
  caption?: string;
  description?: string;
  object_detection?: Array<{
    class: string;
    confidence: number;
  }>;
  text_extraction?: Array<{
    text: string;
    confidence: number;
  }>;
  classification?: Array<{
    class: string;
    confidence: number;
  }>;
  analysis_time?: number;
}

// Chat Session Types
export interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
}

// User Preferences Types
export interface UserPreferences {
  userName?: string;
  userInterests?: string;
  answerStyle?: 'friendly' | 'formal' | 'concise' | 'detailed';
  customPersonality?: string;
}

// File Types
export type FileType = 'images' | 'attachments' | 'documents';

export interface FileUpload {
  file: File;
  type: FileType;
  previewUrl?: string;
  uploadProgress?: number;
}

// UI State Types
export interface LoadingState {
  isLoading: boolean;
  message?: string;
  progress?: number;
}

export interface ErrorState {
  hasError: boolean;
  error: AppError | null;
  retry?: () => void;
}

// API Request Types
export interface ChatRequest {
  messages: Message[];
  model?: string;
  temperature?: number;
  max_tokens?: number;
}

export interface ImageUploadRequest {
  file: File;
  userId: string;
  sessionId?: string;
}

export interface SearchRequest {
  query: string;
  numResults: number;
}

// Performance Types
export interface PerformanceMetrics {
  responseTime: number;
  tokenCount?: number;
  modelUsed?: string;
  timestamp: Date;
}

// Validation Types
export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

// Utility Types
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>; 