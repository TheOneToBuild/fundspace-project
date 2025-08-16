// src/components/organization-profile/north-star/NorthStarEditView.jsx
import React, { useState } from 'react';
import { Plus, Save, X, ChevronUp, ChevronDown, Copy, Trash2, Move, Palette, Layout } from 'lucide-react';
import { BLOCK_TEMPLATES, COLOR_THEMES, ICON_LIBRARY, HERO_BACKGROUNDS } from './constants.js';
import NorthStarBlock from './NorthStarBlock.jsx';
import TemplateSelector from './TemplateSelector.jsx';

const NorthStarEditView = ({ 
  editData, 
  setEditData, 
  onSave, 
  onCancel, 
  saving,
  draggedItem,
  setDraggedItem,
  showTemplates,
  setShowTemplates 
}) => {

  // Add new block
  const addBlock = (template = null) => {
    const newBlock = template ? {
      ...BLOCK_TEMPLATES[template],
      id: `block_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      order: (editData.blocks || []).length + 1
    } : {
      id: `block_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: 'text',
      title: 'New Section',
      content: 'Add your content here...',
      icon: 'Star',
      color: 'ocean',
      size: 'medium',
      order: (editData.blocks || []).length + 1
    };

    setEditData({
      ...editData,
      blocks: [...(editData.blocks || []), newBlock]
    });
    setShowTemplates(false);
  };

  // Add multiple blocks (for full page template)
  const addMultipleBlocks = (templateKeys) => {
    const newBlocks = templateKeys.map((templateKey, index) => {
      const template = BLOCK_TEMPLATES[templateKey];
      if (!template) return null;
      
      return {
        ...template,
        id: `block_${Date.now()}_${index}_${Math.random().toString(36).substr(2, 9)}`,
        order: (editData.blocks || []).length + index + 1
      };
    }).filter(Boolean);

    setEditData({
      ...editData,
      blocks: [...(editData.blocks || []), ...newBlocks]
    });
    setShowTemplates(false);
  };

  // Remove block - no longer shows browser confirm, handled by block component
  const removeBlock = (id) => {
    const updatedBlocks = (editData.blocks || [])
      .filter(b => b.id !== id)
      .map((b, index) => ({ ...b, order: index + 1 }));
    
    setEditData({
      ...editData,
      blocks: updatedBlocks
    });
  };

  // Update block
  const updateBlock = (id, field, value) => {
    setEditData({
      ...editData,
      blocks: (editData.blocks || []).map(b => 
        b.id === id ? { ...b, [field]: value } : b
      )
    });
  };

  // Duplicate block
  const duplicateBlock = (id) => {
    const blockToDupe = (editData.blocks || []).find(b => b.id === id);
    if (blockToDupe) {
      const newBlock = {
        ...blockToDupe,
        id: `block_${Date.now()}`,
        title: `${blockToDupe.title} (Copy)`,
        order: (editData.blocks || []).length + 1
      };
      setEditData({
        ...editData,
        blocks: [...(editData.blocks || []), newBlock]
      });
    }
  };

  // Move block
  const moveBlock = (id, direction) => {
    const blocks = [...(editData.blocks || [])];
    const index = blocks.findIndex(b => b.id === id);
    
    if (direction === 'up' && index > 0) {
      [blocks[index], blocks[index - 1]] = [blocks[index - 1], blocks[index]];
    } else if (direction === 'down' && index < blocks.length - 1) {
      [blocks[index], blocks[index + 1]] = [blocks[index + 1], blocks[index]];
    }
    
    blocks.forEach((b, i) => b.order = i + 1);
    setEditData({ ...editData, blocks });
  };

  // Drag and drop handlers - Fixed
  const handleDragStart = (e, blockId) => {
    setDraggedItem(blockId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', blockId);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e, targetId) => {
    e.preventDefault();
    e.stopPropagation();
    
    const draggedId = e.dataTransfer.getData('text/plain') || draggedItem;
    if (!draggedId || draggedId === targetId) {
      setDraggedItem(null);
      return;
    }

    const blocks = [...(editData.blocks || [])];
    const draggedIndex = blocks.findIndex(b => b.id === draggedId);
    const targetIndex = blocks.findIndex(b => b.id === targetId);

    if (draggedIndex === -1 || targetIndex === -1) {
      setDraggedItem(null);
      return;
    }

    const [draggedBlock] = blocks.splice(draggedIndex, 1);
    blocks.splice(targetIndex, 0, draggedBlock);

    blocks.forEach((b, i) => b.order = i + 1);
    setEditData({ ...editData, blocks });
    setDraggedItem(null);
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
  };

  // Ensure editData exists, with fallbacks
  if (!editData) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-500">Loading editor...</span>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Page Header */}
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">Edit North Star Page</h2>
        <p className="text-gray-600 mb-8">Create compelling sections to showcase your organization's mission, impact, and values</p>
        
        {/* Controls - All on same line */}
        <div className="flex flex-wrap justify-center items-center gap-4">
          <button
            onClick={() => setShowTemplates(true)}
            className="bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 transition-colors flex items-center gap-2 font-medium"
          >
            <Layout size={20} />
            Browse Templates
          </button>
          <button
            onClick={() => addBlock()}
            className="border border-gray-300 text-gray-700 px-6 py-3 rounded-xl hover:bg-gray-50 transition-colors flex items-center gap-2 font-medium"
          >
            <Plus size={20} />
            Create Custom Block
          </button>
          <div className="h-6 w-px bg-gray-300"></div>
          <button
            onClick={onCancel}
            className="bg-white border border-gray-300 text-gray-700 px-6 py-3 rounded-xl hover:bg-gray-50 transition-colors font-medium flex items-center gap-2"
          >
            <X size={18} />
            Cancel
          </button>
          <button
            onClick={onSave}
            disabled={saving}
            className="bg-blue-600 text-white px-8 py-3 rounded-xl hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 flex items-center gap-2"
          >
            {saving ? (
              <>
                <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                Saving...
              </>
            ) : (
              <>
                <Save size={18} />
                Save Changes
              </>
            )}
          </button>
        </div>
      </div>

      {/* Blocks Grid - Enhanced for drag and drop */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {(editData.blocks || [])
          .sort((a, b) => a.order - b.order)
          .map((block) => (
            <NorthStarBlock
              key={block.id}
              block={block}
              isEditing={true}
              onUpdate={updateBlock}
              onRemove={removeBlock}
              onDuplicate={duplicateBlock}
              onMove={moveBlock}
              onDragStart={handleDragStart}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onDragEnd={handleDragEnd}
              isDragging={draggedItem === block.id}
            />
          ))}
      </div>

      {/* Remove the problematic drop zone indicator */}

      {/* Empty State - Simplified */}
      {(!editData.blocks || editData.blocks.length === 0) && (
        <div className="text-center py-20">
          <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <Plus className="w-10 h-10 text-white" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-4">Ready to Start Building?</h3>
          <p className="text-gray-600 mb-8 max-w-md mx-auto">
            Use the template browser or create custom blocks to tell your organization's unique story.
          </p>
        </div>
      )}

      {/* Template Selector Modal */}
      {showTemplates && (
        <TemplateSelector
          onSelectTemplate={addBlock}
          onSelectMultipleTemplates={addMultipleBlocks}
          onClose={() => setShowTemplates(false)}
        />
      )}

      {/* Keyboard Shortcuts Help - Moved to left side only */}
      <div className="fixed bottom-6 left-6 bg-white rounded-lg shadow-lg border border-gray-200 p-4 text-sm">
        <div className="font-medium mb-2">Keyboard Shortcuts</div>
        <div className="space-y-1 text-gray-600">
          <div><kbd className="px-2 py-1 bg-gray-100 rounded text-xs">Ctrl+S</kbd> Save</div>
          <div><kbd className="px-2 py-1 bg-gray-100 rounded text-xs">Esc</kbd> Cancel</div>
        </div>
      </div>
    </div>
  );
};

export default NorthStarEditView;