import React from 'react';

interface ErrorMessageProps {
  message: string;
}

export default function ErrorMessage({ message }: ErrorMessageProps) {
  return (
    <div style={{ color: 'var(--text-warning)' }} className="text-sm mb-3 text-center">
      {message}
    </div>
  );
} 