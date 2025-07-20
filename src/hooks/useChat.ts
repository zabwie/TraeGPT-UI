import { useRef } from 'react';
import { useApp } from '../contexts/AppContext';
import { useFirebase } from './useFirebase';
import { uploadImageAndGetUrl } from '../app/firebase';
import { Message, ImageResult } from '../types';

export function useChat() {
  const { state, dispatch } = useApp();
  const { createNewSession } = useFirebase();
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const buildSystemPrompt = () => {
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

  const sendMessage = async () => {
    if (!state.input.trim() && !state.image) return;
    
    const userMessage: Message = {
      role: 'user',
      content: state.input.trim(),
      imageUrl: state.image ? state.imagePreviewUrl || undefined : undefined
    };
    
    const newMessages = [...state.messages, userMessage];
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
      const startTime = Date.now();
      
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
          const searchResponse = await fetch('/api/search', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query: state.input, numResults: 3 })
          });
          
          if (searchResponse.ok) {
            const searchData = await searchResponse.json();
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
          const imageUrl = await uploadImageAndGetUrl(state.image, state.user?.uid || 'anonymous');
          
          // Analyze image
          const formData = new FormData();
          formData.append('file', state.image);
          
          const [captionRes, detectRes, classifyRes, analyzeRes] = await Promise.all([
            fetch('/api/image/caption', { method: 'POST', body: formData }),
            fetch('/api/image/detect', { method: 'POST', body: formData }),
            fetch('/api/image/classify', { method: 'POST', body: formData }),
            fetch('/api/image/analyze', { method: 'POST', body: formData })
          ]);
          
          const imageResult: ImageResult = {};
          
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
          dispatch({ type: 'SET_MESSAGES', payload: [...state.messages, userMessage] });
          
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
            ...state.messages,
            { role: 'user', content: finalContent }
          ]
        })
      });
      
      if (!togetherResponse.ok) {
        throw new Error(`API error: ${togetherResponse.status}`);
      }
      
      const togetherData = await togetherResponse.json();
      const assistantMessage: Message = {
        role: 'assistant',
        content: togetherData.choices[0]?.message?.content || 'Sorry, I encountered an error.'
      };
      
      const finalMessages = [...state.messages, userMessage, assistantMessage];
      dispatch({ type: 'SET_MESSAGES', payload: finalMessages });
      dispatch({ type: 'SET_RESPONSE_TIME', payload: Date.now() - startTime });
      
    } catch (error) {
      console.error('Error sending message:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to send message. Please try again.' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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

  const handleKeyDown = (e: React.KeyboardEvent) => {
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