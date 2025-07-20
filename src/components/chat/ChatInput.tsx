import React from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from "framer-motion";

interface ChatInputProps {
  input: string;
  setInput: (value: string) => void;
  loading: boolean;
  onSendMessage: () => void;
  imagePreviewUrl: string | null;
  showPlusMenu: boolean;
  setShowPlusMenu: (value: boolean) => void;
  fileType: 'images' | 'attachments' | 'documents';
  setFileType: (value: 'images' | 'attachments' | 'documents') => void;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
  textareaRef: React.RefObject<HTMLTextAreaElement>;
  fileInputRef: React.RefObject<HTMLInputElement>;
}

export default function ChatInput({
  input,
  setInput,
  loading,
  onSendMessage,
  imagePreviewUrl,
  showPlusMenu,
  setShowPlusMenu,
  setFileType,
  onFileChange,
  onKeyDown,
  textareaRef,
  fileInputRef
}: ChatInputProps) {
  return (
    <div style={{ background: 'var(--chat-bg)', borderTop: '1px solid var(--sidebar-border)' }} className="border-t border-gray-700 bg-gray-900 p-6 sticky bottom-0">
      <div className="max-w-4xl mx-auto">
        <div style={{ background: 'var(--input-bar-bg)', border: '1px solid var(--input-bar-border)' }} className="flex items-end gap-3 rounded-2xl px-4 py-3">
          <div className="relative">
            <button 
              onClick={() => setShowPlusMenu(!showPlusMenu)}
              className="p-2 text-gray-400 hover:text-gray-300 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
            
            {showPlusMenu && (
              <AnimatePresence>
                <motion.div
                  initial={{ opacity: 0, scale: 0.8, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.8, y: 20 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  className="absolute bottom-full left-0 mb-2 bg-gray-800/90 backdrop-blur-lg rounded-xl shadow-2xl border border-gray-700 p-2 min-w-48 z-50"
                >
                  <div className="space-y-1">
                    <button 
                      onClick={() => {
                        setFileType('images');
                        if (fileInputRef.current) {
                          fileInputRef.current.accept = 'image/*';
                          fileInputRef.current.click();
                        }
                        setShowPlusMenu(false);
                      }}
                      className="w-full p-2 text-gray-300 hover:text-white hover:bg-gray-600 rounded flex items-center gap-2 text-sm"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      Images
                    </button>
                    <button 
                      onClick={() => {
                        setFileType('attachments');
                        if (fileInputRef.current) {
                          fileInputRef.current.accept = '';
                          fileInputRef.current.click();
                        }
                        setShowPlusMenu(false);
                      }}
                      className="w-full p-2 text-gray-300 hover:text-white hover:bg-gray-600 rounded flex items-center gap-2 text-sm"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                      </svg>
                      Attachments
                    </button>
                    <button 
                      onClick={() => {
                        setFileType('documents');
                        if (fileInputRef.current) {
                          fileInputRef.current.accept = '.pdf,.doc,.docx,.txt,.ppt,.pptx,.xls,.xlsx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document';
                          fileInputRef.current.click();
                        }
                        setShowPlusMenu(false);
                      }}
                      className="w-full p-2 text-gray-300 hover:text-white hover:bg-gray-600 rounded flex items-center gap-2 text-sm"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Documents
                    </button>
                  </div>
                </motion.div>
              </AnimatePresence>
            )}
          </div>
          
          <div className="flex-1">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder="Message TraeGPT..."
              className="w-full resize-none bg-transparent border-none outline-none text-white placeholder-gray-400 text-base text-center"
              rows={1}
              disabled={loading}
              style={{ minHeight: '44px', maxHeight: '200px' }}
            />
          </div>
          
          <div className="flex items-center gap-2">
            <button className="p-2 text-gray-400 hover:text-gray-300 transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
            </button>
            
            <button
              onClick={() => {
                console.log('[Send Button] Clicked');
                onSendMessage();
              }}
              disabled={loading || (!input.trim() && !imagePreviewUrl)}
              className="p-2 bg-gray-600 text-white rounded-lg hover:bg-gray-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              title="Send message"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </div>
        </div>
        
        {/* Disclaimer */}
        <div style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.95rem', margin: '8px 0 0 0', opacity: 0.8 }}>
          Note: For some reason it&apos;s a bit sensetive so if you send a message immediately after the AI, it will show an error. To prevent this, please wait 3-5 seconds.
        </div>
        
        {/* Image Preview */}
        {imagePreviewUrl && (
          <div className="mt-3 flex items-center gap-2 text-sm text-gray-400">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span>Image ready to upload</span>
            <Image src={imagePreviewUrl} alt="preview" width={80} height={60} className="rounded ml-2" />
          </div>
        )}
      </div>
    </div>
  );
} 