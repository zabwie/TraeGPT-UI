import { useRef } from 'react';
import { useApp } from '../contexts/AppContext';
import { useFirebase } from './useFirebase';
import { uploadImageAndGetUrl } from '../app/firebase';
import { 
  Message, 
  ImageResult, 
  TogetherAIResponse, 
  WebSearchResponse,
  ImageCaptionResponse,
  ImageDetectionResponse,
  ImageClassificationResponse,
  ImageAnalyzeResponse,
  UserMessage,
  AssistantMessage,
  ChatRequest,
  SearchRequest
} from '../types';
import { 
  handleError, 
  createApiError, 
  withRetry, 
  withTimeout,
  validateMessage 
} from '../utils/errorHandling';
import { usePerformanceMeasurement } from '../utils/performance';

export function useChat() {
  const { state, dispatch } = useApp();
  const { createNewSession } = useFirebase();
  const { measureAsync } = usePerformanceMeasurement();
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const buildSystemPrompt = (): string => {
    let systemPrompt = "You are TraeGPT, a helpful AI assistant. You can help with various tasks including coding, analysis, and general questions.";
    
    // Add personalization based on user preferences
    if (state.userName) {
      systemPrompt += ` The user's name is ${state.userName}.`;
    }
    
    if (state.userInterests) {
      systemPrompt += ` The user is interested in: ${state.userInterests}.`;
    }
    
    if (state.answerStyle) {
      switch (state.answerStyle) {
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
    
    if (state.customPersonality) {
      systemPrompt += ` ${state.customPersonality}`;
    }
    
    return systemPrompt;
  };

  const createUserMessage = (content: string, imageUrl?: string, imageResult?: ImageResult): UserMessage => {
    return {
      role: 'user',
      content: content.trim(),
      imageUrl,
      imageResult
    };
  };

  const createAssistantMessage = (content: string): AssistantMessage => {
    return {
      role: 'assistant',
      content
    };
  };

  const sendMessage = async (): Promise<void> => {
    if (!state.input.trim() && !state.image) return;
    
    const userMessage: UserMessage = createUserMessage(
      state.input.trim(),
      state.image ? state.imagePreviewUrl || undefined : undefined
    );
    
    // Validate the message before sending
    const validation = validateMessage(userMessage);
    if (!validation.isValid) {
      dispatch({ type: 'SET_ERROR', payload: validation.errors[0].message });
      return;
    }
    
    const newMessages: Message[] = [...state.messages, userMessage];
    dispatch({ type: 'SET_MESSAGES', payload: newMessages });
    dispatch({ type: 'SET_INPUT', payload: "" });
    dispatch({ type: 'SET_IMAGE', payload: null });
    dispatch({ type: 'SET_IMAGE_PREVIEW_URL', payload: null });
    dispatch({ type: 'CLEAR_ERROR' });
    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'SET_RESPONSE_TIME', payload: null });
    
    // Create new session if none exists
    if (!state.currentSessionId && state.user) {
      createNewSession(userMessage);
    }
    
    try {
      // Check if we need to do web search
      const shouldWebSearch = state.input.toLowerCase().includes('search') || 
                             state.input.toLowerCase().includes('find') || 
                             state.input.toLowerCase().includes('latest') ||
                             state.input.toLowerCase().includes('news') ||
                             state.input.toLowerCase().includes('current');
      
      let searchResults = '';
      if (shouldWebSearch) {
        dispatch({ type: 'SET_WEB_SEARCHING', payload: true });
        try {
          const searchRequest: SearchRequest = {
            query: state.input,
            numResults: 3
          };
          
          const searchResponse = await measureAsync(
            () => withTimeout(
              fetch('/api/search', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(searchRequest)
              }),
              10000,
              'Web search timed out'
            ),
            'web-search'
          );
          
          if (searchResponse.ok) {
            const searchData: WebSearchResponse = await searchResponse.json();
            searchResults = searchData.results;
          }
        } catch (error) {
          console.error('Web search error:', error);
        } finally {
          dispatch({ type: 'SET_WEB_SEARCHING', payload: false });
        }
      }
      
      // Prepare the final message content
      let finalContent = state.input;
      if (searchResults) {
        finalContent = `${searchResults}\n\nBased on the above search results, please answer: ${state.input}`;
      }
      
      // Add image analysis if image is present
      if (state.image) {
        try {
          // Upload image to Firebase
          const imageUrl = await measureAsync(
            () => withRetry(() => 
              uploadImageAndGetUrl(state.image!, state.user?.uid || 'anonymous')
            ),
            'image-upload'
          );
          
          // Analyze image
          const formData = new FormData();
          formData.append('file', state.image);
          
          const [captionRes, detectRes, classifyRes, analyzeRes] = await Promise.all([
            measureAsync(() => withTimeout(fetch('/api/image/caption', { method: 'POST', body: formData }), 15000), 'image-caption'),
            measureAsync(() => withTimeout(fetch('/api/image/detect', { method: 'POST', body: formData }), 15000), 'image-detect'),
            measureAsync(() => withTimeout(fetch('/api/image/classify', { method: 'POST', body: formData }), 15000), 'image-classify'),
            measureAsync(() => withTimeout(fetch('/api/image/analyze', { method: 'POST', body: formData }), 15000), 'image-analyze')
          ]);
          
          const imageResult: ImageResult = {};
          
          if (captionRes.ok) {
            const captionData: ImageCaptionResponse[] = await captionRes.json();
            if (captionData[0]?.generated_text) {
              imageResult.caption = captionData[0].generated_text;
            }
          }
          
          if (detectRes.ok) {
            const detectData: ImageDetectionResponse = await detectRes.json();
            if (detectData.length > 0) {
              imageResult.object_detection = detectData.slice(0, 5);
            }
          }
          
          if (classifyRes.ok) {
            const classifyData: ImageClassificationResponse = await classifyRes.json();
            if (classifyData.length > 0) {
              imageResult.classification = classifyData.slice(0, 5);
            }
          }
          
          if (analyzeRes.ok) {
            const analyzeData: ImageAnalyzeResponse = await analyzeRes.json();
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
          dispatch({ type: 'SET_MESSAGES', payload: [...state.messages, userMessage] });
          
          // Add image context to the prompt
          finalContent += `\n\nImage Analysis: ${JSON.stringify(imageResult)}`;
        } catch (error) {
          console.error('Image processing error:', error);
          const appError = handleError(error);
          dispatch({ type: 'SET_ERROR', payload: appError.message });
        }
      }
      
      // Call TogetherAI API
      const chatRequest: ChatRequest = {
        messages: [
          { role: 'system', content: buildSystemPrompt() },
          ...state.messages,
          { role: 'user', content: finalContent }
        ]
      };
      
      const togetherResponse = await measureAsync(
        () => withTimeout(
          fetch('/api/togetherai', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(chatRequest)
          }),
          30000,
          'AI response timed out'
        ),
        'together-ai'
      );
      
      if (!togetherResponse.ok) {
        throw createApiError(`API error: ${togetherResponse.status}`, togetherResponse.status);
      }
      
      const togetherData: TogetherAIResponse = await togetherResponse.json();
      const assistantMessage: AssistantMessage = createAssistantMessage(
        togetherData.choices[0]?.message?.content || 'Sorry, I encountered an error.'
      );
      
      const finalMessages: Message[] = [...state.messages, userMessage, assistantMessage];
      dispatch({ type: 'SET_MESSAGES', payload: finalMessages });
      
      // The performance metrics are already recorded by measureAsync
      // We just need to set the response time for UI display
      dispatch({ type: 'SET_RESPONSE_TIME', payload: Date.now() - (Date.now() - (togetherResponse.headers.get('x-response-time') ? parseInt(togetherResponse.headers.get('x-response-time')!) : 0)) });
      
    } catch (error) {
      console.error('Error sending message:', error);
      const appError = handleError(error);
      dispatch({ type: 'SET_ERROR', payload: appError.message });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const file = e.target.files?.[0];
    if (file) {
      if (state.fileType === 'images') {
        dispatch({ type: 'SET_IMAGE', payload: file });
        const reader = new FileReader();
        reader.onload = (e) => {
          dispatch({ type: 'SET_IMAGE_PREVIEW_URL', payload: e.target?.result as string });
        };
        reader.readAsDataURL(file);
      } else {
        // Handle other file types
        console.log('File uploaded:', file.name, file.type, file.size);
      }
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleKeyDown = (e: React.KeyboardEvent): void => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return {
    sendMessage,
    handleFileChange,
    handleKeyDown,
    buildSystemPrompt,
    chatContainerRef,
    textareaRef,
    fileInputRef
  };
} 