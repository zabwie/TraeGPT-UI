import React from 'react';
import { User } from 'firebase/auth';

interface ToolsPanelProps {
  isVisible: boolean;
  prefsLoading: boolean;
  user: User | null;
  userName: string;
  setUserName: (value: string) => void;
  userInterests: string;
  setUserInterests: (value: string) => void;
  answerStyle: string;
  setAnswerStyle: (value: string) => void;
  customPersonality: string;
  setCustomPersonality: (value: string) => void;
  ocrLang: string;
  setOcrLang: (value: string) => void;
  categories: string;
  setCategories: (value: string) => void;
  loading: boolean;
  onSaveSettings: () => void;
  settingsSaved: boolean;
}

export default function ToolsPanel({
  isVisible,
  prefsLoading,
  user,
  userName,
  setUserName,
  userInterests,
  setUserInterests,
  answerStyle,
  setAnswerStyle,
  customPersonality,
  setCustomPersonality,
  ocrLang,
  setOcrLang,
  categories,
  setCategories,
  loading,
  onSaveSettings,
  settingsSaved
}: ToolsPanelProps) {
  if (!isVisible) return null;

  return (
    <div style={{ background: 'var(--input-bar-bg)', border: '1px solid var(--input-bar-border)', color: 'var(--text-main)' }} className="mb-4 p-4 rounded-lg">
      {prefsLoading && (
        <div style={{ color: 'var(--text-secondary)', marginBottom: '1rem', textAlign: 'center', fontWeight: 500 }}>
          Loading preferences...
        </div>
      )}
      {!user && (
        <div style={{ color: 'var(--text-warning)', marginBottom: '1rem', textAlign: 'center', fontWeight: 500 }}>
          Please log in to save your preferences.
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Your Name</label>
          <input
            type="text"
            value={userName}
            onChange={e => setUserName(e.target.value)}
            className="w-full px-3 py-2 rounded-lg"
            style={{ background: 'var(--input-bar-bg)', border: '1px solid var(--input-bar-border)', color: 'var(--text-main)' }}
            placeholder="e.g. Zabi"
            disabled={loading || !user || prefsLoading}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Your Interests</label>
          <input
            type="text"
            value={userInterests}
            onChange={e => setUserInterests(e.target.value)}
            className="w-full px-3 py-2 rounded-lg"
            style={{ background: 'var(--input-bar-bg)', border: '1px solid var(--input-bar-border)', color: 'var(--text-main)' }}
            placeholder="e.g. coding, music, AI"
            disabled={loading || !user || prefsLoading}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Preferred Answer Style</label>
          <select
            value={answerStyle}
            onChange={e => setAnswerStyle(e.target.value)}
            className="w-full px-3 py-2 rounded-lg"
            style={{ background: 'var(--input-bar-bg)', border: '1px solid var(--input-bar-border)', color: 'var(--text-main)' }}
            disabled={loading || !user || prefsLoading}
          >
            <option value="">No preference</option>
            <option value="friendly">Friendly</option>
            <option value="formal">Formal</option>
            <option value="concise">Concise</option>
            <option value="detailed">Detailed</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Custom AI Personality Prompt</label>
          <textarea
            value={customPersonality}
            onChange={e => setCustomPersonality(e.target.value)}
            className="w-full px-3 py-2 rounded-lg"
            style={{ background: 'var(--input-bar-bg)', border: '1px solid var(--input-bar-border)', color: 'var(--text-main)', minHeight: '60px' }}
            placeholder="e.g. Always answer like a pirate!"
            disabled={loading || !user || prefsLoading}
          />
        </div>
        {/* Existing OCR and CLIP fields below */}
        <div>
          <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>OCR Languages</label>
          <input
            type="text"
            value={ocrLang}
            onChange={e => setOcrLang(e.target.value)}
            className="w-full px-3 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            style={{ background: 'var(--input-bar-bg)', border: '1px solid var(--input-bar-border)', color: 'var(--text-main)' }}
            placeholder="en,es,fr"
            disabled={loading}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>CLIP Categories</label>
          <input
            type="text"
            value={categories}
            onChange={e => setCategories(e.target.value)}
            className="w-full px-3 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            style={{ background: 'var(--input-bar-bg)', border: '1px solid var(--input-bar-border)', color: 'var(--text-main)' }}
            placeholder="cat,dog,car"
            disabled={loading}
          />
        </div>
      </div>
      <div className="col-span-full flex items-center gap-3 mt-4">
        <button
          onClick={onSaveSettings}
          style={{ background: 'var(--button-bg)', color: 'var(--text-main)', border: 'none', borderRadius: 'var(--radius)', padding: '10px 24px', cursor: !user ? 'not-allowed' : 'pointer', fontWeight: 500, fontSize: '1rem', transition: 'background 0.2s' }}
          disabled={loading || !user || prefsLoading}
        >
          Save
        </button>
        {settingsSaved && <span style={{ color: 'var(--text-success)', fontSize: '0.95rem' }}>Saved!</span>}
      </div>
    </div>
  );
} 