// src/components/auth/shared/NavigationButtons.jsx
import React from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';

export default function NavigationButtons({
  currentStep,
  totalSteps,
  onPrev,
  onNext,
  isValid,
  loading,
  prevLabel = 'Back',
  nextLabel = 'Next'
}) {
  return (
    <div className="flex justify-between items-center mt-8 pt-6 border-t border-slate-200">
      <button
        onClick={onPrev}
        className="flex items-center space-x-2 px-4 py-2 text-slate-600 hover:text-slate-900 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>{prevLabel}</span>
      </button>

      <button
        onClick={onNext}
        disabled={!isValid || loading}
        className="flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors font-medium"
      >
        <span>{loading ? 'Processing...' : nextLabel}</span>
        <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  );
}