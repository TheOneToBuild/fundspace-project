// src/components/CreatePost/PostEditor.jsx
import React from 'react';
import { EditorContent } from '@tiptap/react';
import { usePostEditor } from './hooks/usePostEditor';

export default function PostEditor({ 
  placeholderText, 
  profile, 
  onUpdate,
  editor // Allow passing external editor
}) {
  // Use external editor if provided, otherwise create new one
  const internalEditor = usePostEditor(placeholderText, profile, onUpdate);
  const activeEditor = editor || internalEditor;

  if (!activeEditor) return null;

  return (
    <div className="relative">
      <div className="w-full p-4 bg-slate-50 rounded-lg border border-slate-200 focus-within:ring-2 focus-within:ring-blue-500 transition-all">
        <style>
          {`
          .post-modal-editor .ProseMirror {
            outline: none;
            border: none;
            padding: 0;
            margin: 0;
            background: transparent;
            min-height: 180px;
          }
          .post-modal-editor .mention {
            background-color: #e0e7ff;
            color: #3730a3;
            padding: 1px 4px;
            border-radius: 4px;
            font-weight: 500;
            text-decoration: none;
            cursor: pointer;
          }
          .post-modal-editor .mention:hover {
            background-color: #c7d2fe;
          }
          .post-modal-editor p {
            margin: 0;
            line-height: 1.5;
          }
          .post-modal-editor .ProseMirror-focused {
            outline: none;
          }
          .post-modal-editor .is-editor-empty:first-child::before {
            color: #9ca3af;
            content: attr(data-placeholder);
            float: left;
            height: 0;
            pointer-events: none;
          }
          `}
        </style>
        <EditorContent 
          editor={activeEditor}
          className="post-modal-editor"
        />
      </div>
    </div>
  );
}