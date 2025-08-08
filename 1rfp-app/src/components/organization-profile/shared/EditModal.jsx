import React from 'react';
import { X } from 'lucide-react';

const EditModal = ({ 
  isOpen, 
  onClose, 
  title, 
  subtitle, 
  children, 
  footer,
  maxWidth = 'max-w-4xl',
  gradientColors = ['purple-300', 'pink-300', 'blue-300'] 
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
      <div className={`bg-white rounded-2xl ${maxWidth} w-full shadow-2xl transform transition-all overflow-hidden max-h-[90vh] overflow-y-auto`}>
        {/* Header with Organic Gradient */}
        <div className="relative p-6 overflow-hidden">
          <div className="absolute inset-0">
            <div className={`absolute top-0 left-0 w-32 h-32 bg-gradient-to-br from-${gradientColors[0]} to-${gradientColors[1]} rounded-full blur-2xl opacity-60 -translate-x-8 -translate-y-8`}></div>
            <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-${gradientColors[1]} to-${gradientColors[2]} rounded-full blur-xl opacity-50 translate-x-4 -translate-y-4`}></div>
          </div>
          
          <div className="relative z-10 flex items-center justify-between">
            <div>
              <h3 className="text-2xl font-bold text-slate-800">{title}</h3>
              {subtitle && <p className="text-slate-600 text-sm mt-1">{subtitle}</p>}
            </div>
            <button
              onClick={onClose}
              className="text-slate-600 hover:text-slate-800 transition-colors p-1 bg-white bg-opacity-50 rounded-lg backdrop-blur-sm"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="bg-slate-50 px-6 py-4">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

export default EditModal;