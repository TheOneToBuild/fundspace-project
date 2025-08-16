// src/components/portal/track-funds/components/DocumentManager.jsx
import React from 'react';
import { Folder, FileText, Download, Upload, X } from '../../../Icons.jsx';

const DocumentManager = ({ phases, applicationId, showDocuments, onClose }) => {
  const getPhaseDocuments = (phaseId) => {
    const docs = {
      1: [
        { id: 1, name: "Requirements Checklist.pdf", uploadDate: "7/28/2025", size: "2.4 MB", type: "checklist" },
        { id: 2, name: "Budget Template.xlsx", uploadDate: "7/29/2025", size: "1.8 MB", type: "budget" }
      ],
      2: [
        { id: 3, name: "Draft Application v1.docx", uploadDate: "7/30/2025", size: "5.2 MB", type: "draft" },
        { id: 4, name: "Supporting Materials.pdf", uploadDate: "8/1/2025", size: "3.1 MB", type: "support" }
      ],
      3: [
        { id: 5, name: "Final Application.pdf", uploadDate: "8/4/2025", size: "4.7 MB", type: "final" },
        { id: 6, name: "Submission Confirmation.pdf", uploadDate: "8/4/2025", size: "856 KB", type: "confirmation" }
      ]
    };
    return docs[phaseId] || [];
  };

  const getPhaseGradient = (status, index) => {
    const gradients = [
      'from-blue-400 to-blue-500',
      'from-green-400 to-green-500', 
      'from-purple-400 to-purple-500',
      'from-orange-400 to-orange-500',
      'from-pink-400 to-pink-500',
      'from-indigo-400 to-indigo-500',
      'from-teal-400 to-teal-500'
    ];
    return `bg-gradient-to-br ${gradients[index % gradients.length]}`;
  };

  if (!Object.keys(showDocuments).some(key => key.startsWith(applicationId.toString()) && showDocuments[key])) {
    return null;
  }

  return (
    <div className="mt-4 bg-gradient-to-r from-slate-50 to-blue-50 rounded-lg p-4 border border-slate-200">
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-semibold text-slate-700 flex items-center gap-2">
          <Folder size={16} />
          Phase Documents
        </h4>
        <button 
          onClick={onClose}
          className="text-slate-400 hover:text-slate-600"
        >
          <X size={16} />
        </button>
      </div>
      
      {phases.map(phase => {
        const key = `${applicationId}-${phase.id}`;
        if (!showDocuments[key]) return null;
        
        const docs = getPhaseDocuments(phase.id);
        return (
          <div key={phase.id} className="mb-4">
            <h5 className="font-medium text-slate-600 mb-2 flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${getPhaseGradient(phase.status, phase.id - 1)}`}></div>
              {phase.name}
            </h5>
            <div className="space-y-2">
              {docs.map(doc => (
                <div key={doc.id} className="flex items-center justify-between bg-white rounded-md p-3 border border-slate-200 hover:border-blue-300 transition-colors">
                  <div className="flex items-center gap-3">
                    <FileText size={16} className="text-blue-500" />
                    <div>
                      <span className="text-sm font-medium text-slate-900">{doc.name}</span>
                      <div className="text-xs text-slate-500">{doc.size} • {doc.uploadDate}</div>
                    </div>
                  </div>
                  <button className="text-blue-600 hover:text-blue-700 p-1 hover:bg-blue-50 rounded transition-colors">
                    <Download size={16} />
                  </button>
                </div>
              ))}
              <button className="w-full border-2 border-dashed border-slate-300 rounded-md p-4 text-sm text-slate-600 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50/50 transition-all flex items-center justify-center gap-2">
                <Upload size={16} />
                Upload Document for {phase.name}
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default DocumentManager;