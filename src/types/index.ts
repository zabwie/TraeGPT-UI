// Type definitions

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

export interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  imageUrl?: string;
  imageResult?: ImageResult;
  fileUrl?: string;
  fileName?: string;
  fileType?: string;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
}

export interface UserPreferences {
  userName?: string;
  userInterests?: string;
  answerStyle?: string;
  customPersonality?: string;
}

export type FileType = 'images' | 'attachments' | 'documents'; 