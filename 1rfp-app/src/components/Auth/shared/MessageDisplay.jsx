// src/components/auth/shared/MessageDisplay.jsx - Correct Version
import React from 'react';
import { CheckCircle, X } from 'lucide-react';

export default function MessageDisplay({ message, error }) {
  if (!message && !error) return null;

  return (
    <>
      {message && (
        <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700 text-center">
          <div className="flex items-center justify-center space-x-2">
            <CheckCircle className="w-5 h-5" />
            <span>{message}</span>
          </div>
        </div>
      )}

      {error && (
        <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-center">
          <div className="flex items-center justify-center space-x-2">
            <X className="w-5 h-5" />
            <span>{error}</span>
          </div>
        </div>
      )}
    </>
  );
}