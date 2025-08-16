// src/components/organization-profile/north-star/NorthStarBlock.jsx
import React, { useState } from 'react';
import { ChevronUp, ChevronDown, Copy, Trash2, Palette, Type, List, BarChart3, Move } from 'lucide-react';
import { COLOR_THEMES, ICON_LIBRARY, BLOCK_SIZES } from './constants.js';

const NorthStarBlock = ({ 
  block, 
  isEditing = false, 
  onUpdate, 
  onRemove, 
  onDuplicate, 
  onMove,
  onDragStart,
  onDragOver,
  onDrop,
  isDragging = false
}) => {
  const [showCustomization, setShowCustomization] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  
  const IconComponent = ICON_LIBRARY[block.icon] || ICON_LIBRARY.Star;
  const colorTheme = COLOR_THEMES[block.color] || COLOR_THEMES.ocean;
  const sizeClasses = BLOCK_SIZES[block.size]?.cols || 'md:col-span-1';

  // Handle delete with custom modal
  const handleDelete = () => {
    setShowDeleteModal(true);
  };

  const confirmDelete = () => {
    onRemove(block.id);
    setShowDeleteModal(false);
  };

  // Handle content updates based on block type
  const handleContentUpdate = (value) => {
    if (block.type === 'list') {
      // Handle list items
      const items = value.split('\n').filter(item => item.trim());
      onUpdate(block.id, 'content', items);
    } else if (block.type === 'stats') {
      // Handle stats - parse from textarea format
      try {
        const lines = value.split('\n').filter(line => line.trim());
        const stats = lines.map(line => {
          const [label, value] = line.split(':').map(part => part.trim());
          return { label: label || 'Metric', value: value || '0' };
        });
        onUpdate(block.id, 'content', stats);
      } catch (error) {
        console.warn('Error parsing stats:', error);
      }
    } else {
      onUpdate(block.id, 'content', value);
    }
  };

  // Format content for display in textarea
  const getFormattedContent = () => {
    if (block.type === 'list' && Array.isArray(block.content)) {
      return block.content.join('\n');
    } else if (block.type === 'stats' && Array.isArray(block.content)) {
      return block.content.map(stat => `${stat.label}: ${stat.value}`).join('\n');
    }
    return block.content || '';
  };

  const renderContent = () => {
    switch (block.type) {
      case 'list':
        if (!Array.isArray(block.content)) return <p className="text-gray-500">No items added yet</p>;
        return (
          <ul className="space-y-3">
            {block.content.map((item, index) => (
              <li key={index} className="flex items-start gap-3">
                <div className={`w-2 h-2 rounded-full ${colorTheme.accent} mt-2 flex-shrink-0`}></div>
                <span className="leading-relaxed">{item}</span>
              </li>
            ))}
          </ul>
        );

      case 'stats':
        if (!Array.isArray(block.content)) return <p className="text-gray-500">No statistics added yet</p>;
        return (
          <div className="grid grid-cols-1 gap-6">
            {block.content.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl font-bold text-gray-900 mb-1">{stat.value}</div>
                <div className="text-sm text-gray-600 font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        );

      default:
        return (
          <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ 
            __html: block.content?.replace(/\n/g, '<br>') || '' 
          }} />
        );
    }
  };

  const renderEditContent = () => {
    switch (block.type) {
      case 'list':
        return (
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              List Items (one per line)
            </label>
            <textarea
              value={getFormattedContent()}
              onChange={(e) => handleContentUpdate(e.target.value)}
              placeholder="• First item&#10;• Second item&#10;• Third item"
              className="w-full p-3 border border-gray-300 rounded-lg text-sm"
              rows={6}
            />
          </div>
        );

      case 'stats':
        return (
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Statistics (format: Label: Value)
            </label>
            <textarea
              value={getFormattedContent()}
              onChange={(e) => handleContentUpdate(e.target.value)}
              placeholder="Lives Changed: 10,000+&#10;Programs: 25&#10;Years of Service: 15"
              className="w-full p-3 border border-gray-300 rounded-lg text-sm"
              rows={4}
            />
          </div>
        );

      default:
        return (
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Content</label>
            <textarea
              value={block.content || ''}
              onChange={(e) => onUpdate(block.id, 'content', e.target.value)}
              placeholder="Enter your content here..."
              className="w-full p-3 border border-gray-300 rounded-lg text-sm"
              rows={4}
            />
          </div>
        );
    }
  };

  return (
    <>
      <div
        className={`${sizeClasses} relative group cursor-move`}
        draggable={isEditing}
        onDragStart={(e) => isEditing && onDragStart(e, block.id)}
        onDragOver={onDragOver}
        onDrop={(e) => onDrop(e, block.id)}
      >
        <div className={`
          bg-gradient-to-br ${colorTheme.bg} p-6 rounded-2xl border ${colorTheme.border} 
          shadow-sm hover:shadow-md transition-all duration-300 h-full
          ${isEditing ? 'ring-2 ring-blue-200 hover:ring-blue-300' : ''}
          ${isDragging ? 'opacity-50 scale-95 rotate-2' : ''}
        `}>
          
          {/* Edit Controls */}
          {isEditing && (
            <div className="absolute -top-2 -right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={() => onMove(block.id, 'up')}
                className="w-8 h-8 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center justify-center shadow-sm"
                title="Move Up"
              >
                <ChevronUp size={14} />
              </button>
              <button
                onClick={() => onMove(block.id, 'down')}
                className="w-8 h-8 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center justify-center shadow-sm"
                title="Move Down"
              >
                <ChevronDown size={14} />
              </button>
              <button
                onClick={() => onDuplicate(block.id)}
                className="w-8 h-8 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center justify-center shadow-sm"
                title="Duplicate"
              >
                <Copy size={14} />
              </button>
              <button
                onClick={() => setShowCustomization(!showCustomization)}
                className="w-8 h-8 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center justify-center shadow-sm"
                title="Customize"
              >
                <Palette size={14} />
              </button>
              <button
                onClick={handleDelete}
                className="w-8 h-8 bg-red-500 text-white rounded-lg hover:bg-red-600 flex items-center justify-center shadow-sm"
                title="Delete"
              >
                <Trash2 size={14} />
              </button>
            </div>
          )}

          {/* Drag Handle */}
          {isEditing && (
            <div className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="w-6 h-6 bg-white/20 rounded-lg flex items-center justify-center cursor-move">
                <Move size={12} className="text-gray-600" />
              </div>
            </div>
          )}

          {/* Block Header */}
          <div className="flex items-start gap-4 mb-6">
            <div className={`w-12 h-12 bg-gradient-to-r ${colorTheme.icon} rounded-xl flex items-center justify-center flex-shrink-0`}>
              <IconComponent className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              {isEditing ? (
                <input
                  type="text"
                  value={block.title || ''}
                  onChange={(e) => onUpdate(block.id, 'title', e.target.value)}
                  className="w-full text-xl font-bold bg-transparent border-none outline-none text-gray-900 placeholder-gray-400"
                  placeholder="Section Title"
                />
              ) : (
                <h3 className={`text-xl font-bold ${colorTheme.text}`}>{block.title}</h3>
              )}
            </div>
          </div>

          {/* Block Content */}
          <div className={`${colorTheme.text}`}>
            {isEditing ? renderEditContent() : renderContent()}
          </div>

          {/* Customization Panel */}
          {isEditing && showCustomization && (
            <div className="mt-6 pt-6 border-t border-gray-200 space-y-4">
              
              {/* Block Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Block Type</label>
                <div className="flex gap-2">
                  {[
                    { type: 'text', icon: Type, label: 'Text' },
                    { type: 'list', icon: List, label: 'List' },
                    { type: 'stats', icon: BarChart3, label: 'Stats' }
                  ].map(({ type, icon: Icon, label }) => (
                    <button
                      key={type}
                      onClick={() => onUpdate(block.id, 'type', type)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        block.type === type 
                          ? 'bg-blue-100 text-blue-700 border border-blue-200' 
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      <Icon size={16} />
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Color Theme */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Color Theme</label>
                <div className="grid grid-cols-4 gap-2">
                  {Object.entries(COLOR_THEMES).map(([key, theme]) => (
                    <button
                      key={key}
                      onClick={() => onUpdate(block.id, 'color', key)}
                      className={`aspect-square rounded-lg bg-gradient-to-br ${theme.bg} border-2 transition-all ${
                        block.color === key 
                          ? 'border-gray-400 scale-105' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      title={theme.name}
                    />
                  ))}
                </div>
              </div>

              {/* Size */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Size</label>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(BLOCK_SIZES).map(([key, size]) => (
                    <button
                      key={key}
                      onClick={() => onUpdate(block.id, 'size', key)}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        block.size === key 
                          ? 'bg-blue-100 text-blue-700 border border-blue-200' 
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {size.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Icon */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Icon</label>
                <div className="grid grid-cols-6 gap-2 max-h-32 overflow-y-auto">
                  {Object.entries(ICON_LIBRARY).slice(0, 18).map(([key, Icon]) => (
                    <button
                      key={key}
                      onClick={() => onUpdate(block.id, 'icon', key)}
                      className={`aspect-square rounded-lg border-2 transition-all flex items-center justify-center ${
                        block.icon === key 
                          ? 'border-blue-400 bg-blue-50' 
                          : 'border-gray-200 hover:border-gray-300 bg-white'
                      }`}
                      title={key}
                    >
                      <Icon size={16} />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Custom Delete Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 max-w-md mx-4 shadow-2xl">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Trash2 className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Delete Section</h3>
              <p className="text-gray-600 mb-8">
                Are you sure you want to delete "<strong>{block.title}</strong>"? This action cannot be undone.
              </p>
              <div className="flex gap-4 justify-center">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  className="px-6 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors font-medium"
                >
                  Delete Section
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default NorthStarBlock;