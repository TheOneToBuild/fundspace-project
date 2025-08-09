// src/components/organization-profile/OrganizationNorthStar.jsx - Redesigned Flexible Version
import React, { useState, useEffect, useCallback } from 'react';
import { 
  Target, Eye, Zap, Edit3, Save, X, Plus, Trash2, Move, GripVertical,
  GraduationCap, Home, Leaf, Heart, Users, Building, Globe, Award,
  Star, Compass, Lightbulb, TrendingUp, Shield, Handshake, Book,
  Coffee, Music, Camera, Palette, Rocket, Crown, Gift, Map,
  ChevronDown, ChevronUp, MoreHorizontal, Copy, Settings
} from 'lucide-react';
import { supabase } from '../../supabaseClient.js';
import { hasPermission, PERMISSIONS } from '../../utils/organizationPermissions.js';

// Comprehensive icon library for maximum flexibility
const ICON_LIBRARY = {
  // Core
  Target, Eye, Zap, Star, Compass, Lightbulb, Rocket, Crown,
  // Mission & Values  
  Heart, Shield, Handshake, Award, Gift, Globe,
  // Impact Areas
  GraduationCap, Home, Leaf, Users, Building, TrendingUp,
  // Creative
  Palette, Music, Camera, Book, Coffee, Map
};

// Rich color palette with gradients and themes
const COLOR_THEMES = {
  ocean: { 
    bg: 'from-blue-50 via-cyan-50 to-blue-50', 
    border: 'border-blue-200', 
    text: 'text-blue-900', 
    icon: 'from-blue-500 to-cyan-500',
    accent: 'bg-blue-500',
    name: 'Ocean'
  },
  forest: { 
    bg: 'from-green-50 via-emerald-50 to-teal-50', 
    border: 'border-green-200', 
    text: 'text-green-900', 
    icon: 'from-green-500 to-emerald-500',
    accent: 'bg-green-500',
    name: 'Forest'
  },
  sunset: { 
    bg: 'from-orange-50 via-red-50 to-pink-50', 
    border: 'border-orange-200', 
    text: 'text-orange-900', 
    icon: 'from-orange-500 to-red-500',
    accent: 'bg-orange-500',
    name: 'Sunset'
  },
  royal: { 
    bg: 'from-purple-50 via-violet-50 to-indigo-50', 
    border: 'border-purple-200', 
    text: 'text-purple-900', 
    icon: 'from-purple-500 to-indigo-500',
    accent: 'bg-purple-500',
    name: 'Royal'
  },
  earth: { 
    bg: 'from-amber-50 via-yellow-50 to-orange-50', 
    border: 'border-amber-200', 
    text: 'text-amber-900', 
    icon: 'from-amber-500 to-orange-500',
    accent: 'bg-amber-500',
    name: 'Earth'
  },
  midnight: { 
    bg: 'from-slate-50 via-gray-50 to-slate-50', 
    border: 'border-slate-200', 
    text: 'text-slate-900', 
    icon: 'from-slate-500 to-gray-500',
    accent: 'bg-slate-500',
    name: 'Midnight'
  },
  rose: {
    bg: 'from-rose-50 via-pink-50 to-rose-50',
    border: 'border-rose-200',
    text: 'text-rose-900',
    icon: 'from-rose-500 to-pink-500',
    accent: 'bg-rose-500',
    name: 'Rose'
  },
  emerald: {
    bg: 'from-emerald-50 via-teal-50 to-emerald-50',
    border: 'border-emerald-200',
    text: 'text-emerald-900',
    icon: 'from-emerald-500 to-teal-500',
    accent: 'bg-emerald-500',
    name: 'Emerald'
  }
};

// Predefined block templates for quick start
const BLOCK_TEMPLATES = {
  mission: {
    type: 'text',
    title: 'Our Mission',
    content: 'We exist to create meaningful change in our community through...',
    icon: 'Target',
    color: 'ocean',
    size: 'large'
  },
  vision: {
    type: 'text',
    title: 'Our Vision',
    content: 'We envision a world where...',
    icon: 'Eye',
    color: 'royal',
    size: 'large'
  },
  values: {
    type: 'list',
    title: 'Our Values',
    content: ['Integrity', 'Innovation', 'Impact', 'Inclusion'],
    icon: 'Heart',
    color: 'rose',
    size: 'medium'
  },
  impact: {
    type: 'stats',
    title: 'Our Impact',
    content: [
      { label: 'Lives Changed', value: '10,000+' },
      { label: 'Programs Running', value: '25' },
      { label: 'Years of Service', value: '15' }
    ],
    icon: 'TrendingUp',
    color: 'forest',
    size: 'medium'
  },
  story: {
    type: 'text',
    title: 'Our Story',
    content: 'Founded in [year], we began with a simple belief that...',
    icon: 'Book',
    color: 'earth',
    size: 'large'
  },
  team: {
    type: 'text',
    title: 'Our Team',
    content: 'We are a diverse group of passionate individuals united by...',
    icon: 'Users',
    color: 'emerald',
    size: 'medium'
  }
};

const OrganizationNorthStar = ({ organization, userMembership, session }) => {
  const [pageData, setPageData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [draggedItem, setDraggedItem] = useState(null);
  const [showTemplates, setShowTemplates] = useState(false);

  // Enhanced permission check
  const canEdit = userMembership && hasPermission(
    userMembership.role, 
    PERMISSIONS.EDIT_ORGANIZATION, 
    session?.user?.is_omega_admin
  );

  // Fetch page data
  useEffect(() => {
    const fetchPageData = async () => {
      if (!organization?.id) return;

      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('organization_north_stars')
          .select('*')
          .eq('organization_id', organization.id)
          .eq('is_published', true)
          .maybeSingle();

        if (error && error.code !== 'PGRST116') {
          throw error;
        }

        setPageData(data);
      } catch (err) {
        console.error('Error fetching North Star data:', err);
        setError('Failed to load page data');
      } finally {
        setLoading(false);
      }
    };

    fetchPageData();
  }, [organization?.id]);

  // Initialize edit mode with flexible structure
  const startEditing = () => {
    setEditData(pageData || {
      hero: {
        title: `Welcome to ${organization?.name}`,
        subtitle: 'Discover our mission, vision, and the impact we\'re making together.',
        background: 'ocean'
      },
      blocks: []
    });
    setIsEditing(true);
    setError(null);
    setShowTemplates(false);
  };

  // Cancel editing with confirmation
  const cancelEditing = () => {
    if (editData && JSON.stringify(editData) !== JSON.stringify(pageData)) {
      if (!window.confirm('You have unsaved changes. Are you sure you want to discard them?')) {
        return;
      }
    }
    setIsEditing(false);
    setEditData(null);
    setError(null);
    setShowTemplates(false);
  };

  // Save page data
  const savePage = async () => {
    if (!editData || !session?.user?.id) return;

    if (!editData.hero?.title?.trim()) {
      setError('Page title is required');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const dataToSave = {
        organization_id: organization.id,
        hero: editData.hero,
        blocks: editData.blocks || [],
        is_published: true,
        updated_by_user_id: session.user.id
      };

      let result;
      if (pageData?.id) {
        result = await supabase
          .from('organization_north_stars')
          .update(dataToSave)
          .eq('id', pageData.id)
          .select()
          .single();
      } else {
        result = await supabase
          .from('organization_north_stars')
          .insert({ ...dataToSave, created_by_user_id: session.user.id })
          .select()
          .single();
      }

      if (result.error) throw result.error;

      setPageData(result.data);
      setIsEditing(false);
      setEditData(null);
      setShowTemplates(false);
    } catch (err) {
      console.error('Error saving page:', err);
      setError(`Failed to save: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  // Add new block
  const addBlock = (template = null) => {
    const newBlock = template ? { 
      ...BLOCK_TEMPLATES[template],
      id: `block_${Date.now()}`,
      order: editData.blocks.length + 1
    } : {
      id: `block_${Date.now()}`,
      type: 'text',
      title: 'New Section',
      content: 'Add your content here...',
      icon: 'Star',
      color: 'ocean',
      size: 'medium',
      order: editData.blocks.length + 1
    };

    setEditData({
      ...editData,
      blocks: [...editData.blocks, newBlock]
    });
    setShowTemplates(false);
  };

  // Remove block
  const removeBlock = (id) => {
    if (window.confirm('Are you sure you want to remove this section?')) {
      const updatedBlocks = editData.blocks
        .filter(b => b.id !== id)
        .map((b, index) => ({ ...b, order: index + 1 }));
      
      setEditData({
        ...editData,
        blocks: updatedBlocks
      });
    }
  };

  // Update block
  const updateBlock = (id, field, value) => {
    setEditData({
      ...editData,
      blocks: editData.blocks.map(b => 
        b.id === id ? { ...b, [field]: value } : b
      )
    });
  };

  // Duplicate block
  const duplicateBlock = (id) => {
    const blockToDupe = editData.blocks.find(b => b.id === id);
    if (blockToDupe) {
      const newBlock = {
        ...blockToDupe,
        id: `block_${Date.now()}`,
        title: `${blockToDupe.title} (Copy)`,
        order: editData.blocks.length + 1
      };
      setEditData({
        ...editData,
        blocks: [...editData.blocks, newBlock]
      });
    }
  };

  // Move block
  const moveBlock = (id, direction) => {
    const blocks = [...editData.blocks];
    const index = blocks.findIndex(b => b.id === id);
    
    if (direction === 'up' && index > 0) {
      [blocks[index], blocks[index - 1]] = [blocks[index - 1], blocks[index]];
    } else if (direction === 'down' && index < blocks.length - 1) {
      [blocks[index], blocks[index + 1]] = [blocks[index + 1], blocks[index]];
    }
    
    blocks.forEach((b, i) => b.order = i + 1);
    setEditData({ ...editData, blocks });
  };

  // Drag and drop handlers
  const handleDragStart = (e, blockId) => {
    setDraggedItem(blockId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e, targetId) => {
    e.preventDefault();
    if (!draggedItem || draggedItem === targetId) return;

    const blocks = [...editData.blocks];
    const draggedIndex = blocks.findIndex(b => b.id === draggedItem);
    const targetIndex = blocks.findIndex(b => b.id === targetId);

    const [draggedBlock] = blocks.splice(draggedIndex, 1);
    blocks.splice(targetIndex, 0, draggedBlock);

    blocks.forEach((b, i) => b.order = i + 1);
    setEditData({ ...editData, blocks });
    setDraggedItem(null);
  };

  // Render different block types
  const renderBlock = (block, isEditing = false) => {
    const IconComponent = ICON_LIBRARY[block.icon] || Star;
    const colorTheme = COLOR_THEMES[block.color] || COLOR_THEMES.ocean;
    const sizeClasses = {
      small: 'col-span-1',
      medium: 'md:col-span-1',
      large: 'md:col-span-2',
      full: 'md:col-span-3'
    };

    return (
      <div
        key={block.id}
        className={`${sizeClasses[block.size]} relative group`}
        draggable={isEditing}
        onDragStart={(e) => handleDragStart(e, block.id)}
        onDragOver={handleDragOver}
        onDrop={(e) => handleDrop(e, block.id)}
      >
        <div className={`bg-gradient-to-br ${colorTheme.bg} p-6 rounded-2xl border ${colorTheme.border} shadow-sm hover:shadow-md transition-all duration-300 h-full ${isEditing ? 'cursor-move' : ''}`}>
          {/* Edit controls */}
          {isEditing && (
            <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="bg-white rounded-lg shadow-md flex">
                <button onClick={() => moveBlock(block.id, 'up')} className="p-1 hover:bg-gray-100 rounded-l">
                  <ChevronUp size={14} />
                </button>
                <button onClick={() => moveBlock(block.id, 'down')} className="p-1 hover:bg-gray-100">
                  <ChevronDown size={14} />
                </button>
                <button onClick={() => duplicateBlock(block.id)} className="p-1 hover:bg-gray-100">
                  <Copy size={14} />
                </button>
                <button onClick={() => removeBlock(block.id)} className="p-1 hover:bg-gray-100 text-red-600 rounded-r">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          )}

          {/* Drag handle */}
          {isEditing && (
            <div className="absolute top-3 left-3 opacity-0 group-hover:opacity-100 transition-opacity">
              <GripVertical size={16} className="text-gray-400" />
            </div>
          )}

          {/* Block header */}
          <div className="flex items-center gap-3 mb-4">
            <div className={`w-12 h-12 bg-gradient-to-r ${colorTheme.icon} rounded-xl flex items-center justify-center shadow-md`}>
              <IconComponent className="w-6 h-6 text-white" />
            </div>
            {isEditing ? (
              <input
                type="text"
                value={block.title}
                onChange={(e) => updateBlock(block.id, 'title', e.target.value)}
                className={`text-xl font-bold ${colorTheme.text} bg-transparent border-b-2 border-current/20 focus:border-current outline-none flex-1`}
              />
            ) : (
              <h3 className={`text-xl font-bold ${colorTheme.text}`}>{block.title}</h3>
            )}
          </div>

          {/* Block content based on type */}
          {block.type === 'text' && (
            isEditing ? (
              <textarea
                value={block.content}
                onChange={(e) => updateBlock(block.id, 'content', e.target.value)}
                className="w-full h-32 border border-gray-200 rounded-lg p-3 resize-none outline-none focus:border-blue-500"
                placeholder="Enter your content..."
              />
            ) : (
              <p className="text-gray-700 leading-relaxed">{block.content}</p>
            )
          )}

          {block.type === 'list' && (
            <div>
              {isEditing ? (
                <div className="space-y-2">
                  {(Array.isArray(block.content) ? block.content : []).map((item, index) => (
                    <div key={index} className="flex gap-2">
                      <input
                        type="text"
                        value={item}
                        onChange={(e) => {
                          const newContent = [...block.content];
                          newContent[index] = e.target.value;
                          updateBlock(block.id, 'content', newContent);
                        }}
                        className="flex-1 border border-gray-200 rounded px-3 py-2 outline-none focus:border-blue-500"
                      />
                      <button
                        onClick={() => {
                          const newContent = block.content.filter((_, i) => i !== index);
                          updateBlock(block.id, 'content', newContent);
                        }}
                        className="text-red-600 hover:text-red-800"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={() => updateBlock(block.id, 'content', [...block.content, 'New item'])}
                    className="text-blue-600 hover:text-blue-800 text-sm flex items-center gap-1"
                  >
                    <Plus size={14} /> Add item
                  </button>
                </div>
              ) : (
                <ul className="space-y-2">
                  {(Array.isArray(block.content) ? block.content : []).map((item, index) => (
                    <li key={index} className="flex items-center gap-3">
                      <div className={`w-2 h-2 ${colorTheme.accent} rounded-full`}></div>
                      <span className="text-gray-700">{item}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {block.type === 'stats' && (
            <div className="grid grid-cols-1 gap-4">
              {(Array.isArray(block.content) ? block.content : []).map((stat, index) => (
                <div key={index} className="text-center">
                  {isEditing ? (
                    <div className="space-y-2">
                      <input
                        type="text"
                        value={stat.value}
                        onChange={(e) => {
                          const newContent = [...block.content];
                          newContent[index] = { ...stat, value: e.target.value };
                          updateBlock(block.id, 'content', newContent);
                        }}
                        className="text-2xl font-bold text-center w-full border-b border-gray-200 focus:border-blue-500 outline-none"
                        placeholder="Value"
                      />
                      <input
                        type="text"
                        value={stat.label}
                        onChange={(e) => {
                          const newContent = [...block.content];
                          newContent[index] = { ...stat, label: e.target.value };
                          updateBlock(block.id, 'content', newContent);
                        }}
                        className="text-sm text-center w-full border-b border-gray-200 focus:border-blue-500 outline-none"
                        placeholder="Label"
                      />
                    </div>
                  ) : (
                    <>
                      <div className={`text-3xl font-bold ${colorTheme.text}`}>{stat.value}</div>
                      <div className="text-sm text-gray-600">{stat.label}</div>
                    </>
                  )}
                </div>
              ))}
              {isEditing && (
                <button
                  onClick={() => updateBlock(block.id, 'content', [...block.content, { value: '0', label: 'New stat' }])}
                  className="text-blue-600 hover:text-blue-800 text-sm flex items-center justify-center gap-1 py-2"
                >
                  <Plus size={14} /> Add stat
                </button>
              )}
            </div>
          )}

          {/* Block customization controls (editing only) */}
          {isEditing && (
            <div className="mt-4 pt-4 border-t border-gray-200 grid grid-cols-3 gap-2">
              <select
                value={block.icon}
                onChange={(e) => updateBlock(block.id, 'icon', e.target.value)}
                className="text-xs border rounded px-2 py-1"
              >
                {Object.keys(ICON_LIBRARY).map(iconName => (
                  <option key={iconName} value={iconName}>{iconName}</option>
                ))}
              </select>
              <select
                value={block.color}
                onChange={(e) => updateBlock(block.id, 'color', e.target.value)}
                className="text-xs border rounded px-2 py-1"
              >
                {Object.entries(COLOR_THEMES).map(([key, theme]) => (
                  <option key={key} value={key}>{theme.name}</option>
                ))}
              </select>
              <select
                value={block.size}
                onChange={(e) => updateBlock(block.id, 'size', e.target.value)}
                className="text-xs border rounded px-2 py-1"
              >
                <option value="small">Small</option>
                <option value="medium">Medium</option>
                <option value="large">Large</option>
                <option value="full">Full Width</option>
              </select>
            </div>
          )}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-6"></div>
          <p className="text-slate-600 text-lg">Loading your story...</p>
        </div>
      </div>
    );
  }

  const displayData = isEditing ? editData : pageData;

  // Enhanced empty state with onboarding
  if (!pageData && !isEditing) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-8">
        <div className="max-w-4xl mx-auto text-center">
          <div className="w-32 h-32 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-8 shadow-2xl">
            <Star className="w-16 h-16 text-white" />
          </div>
          <h1 className="text-5xl font-bold text-slate-900 mb-6">
            Tell Your Story
          </h1>
          <p className="text-xl text-slate-600 mb-12 max-w-2xl mx-auto leading-relaxed">
            {canEdit 
              ? `Create a compelling page that showcases ${organization?.name}'s mission, impact, and vision. This is where your story comes to life.`
              : `${organization?.name} is crafting their story. Check back soon to discover their mission and impact.`
            }
          </p>
          {canEdit && (
            <div className="space-y-6">
              <button
                onClick={startEditing}
                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-12 py-4 rounded-2xl hover:from-blue-700 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 font-medium text-lg shadow-xl"
              >
                <Plus size={24} className="inline mr-3" />
                Start Building Your Page
              </button>
              <p className="text-sm text-slate-500">
                Drag, drop, and customize - make it uniquely yours
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Enhanced Edit Controls */}
      {canEdit && !isEditing && (
        <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-sm border-b border-gray-200 p-4">
          <div className="flex justify-between items-center max-w-7xl mx-auto">
            <div className="text-sm text-gray-600">
              Last updated {new Date(displayData?.updated_at || displayData?.created_at).toLocaleDateString()}
            </div>
            <button
              onClick={startEditing}
              className="bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 transition-colors flex items-center gap-2 font-medium shadow-md"
            >
              <Edit3 size={18} />
              Edit Page
            </button>
          </div>
        </div>
      )}

      {/* Editing Controls Bar */}
      {isEditing && (
        <div className="sticky top-0 z-50 bg-blue-600 text-white p-4 shadow-lg">
          <div className="flex items-center justify-between max-w-7xl mx-auto">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Edit3 size={20} />
                <span className="font-medium">Editing Mode</span>
              </div>
              <div className="text-blue-200 text-sm">
                Drag blocks to reorder • Click + to add sections
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowTemplates(!showTemplates)}
                className="bg-blue-500 hover:bg-blue-400 px-4 py-2 rounded-lg transition-colors"
              >
                Templates
              </button>
              <button
                onClick={cancelEditing}
                className="text-blue-200 hover:text-white transition-colors px-4 py-2"
              >
                Cancel
              </button>
              <button
                onClick={savePage}
                disabled={saving}
                className="bg-white text-blue-600 px-6 py-2 rounded-lg hover:bg-blue-50 transition-colors flex items-center gap-2 disabled:opacity-50 font-medium"
              >
                <Save size={16} />
                {saving ? 'Saving...' : 'Save Page'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Template Selector */}
      {isEditing && showTemplates && (
        <div className="bg-gray-50 border-b border-gray-200 p-6">
          <div className="max-w-7xl mx-auto">
            <h3 className="text-lg font-semibold mb-4">Quick Start Templates</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {Object.entries(BLOCK_TEMPLATES).map(([key, template]) => {
                const IconComponent = ICON_LIBRARY[template.icon];
                return (
                  <button
                    key={key}
                    onClick={() => addBlock(key)}
                    className="bg-white p-4 rounded-lg border hover:border-blue-300 hover:shadow-md transition-all text-left"
                  >
                    <IconComponent className="w-6 h-6 text-blue-600 mb-2" />
                    <div className="font-medium text-sm">{template.title}</div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 p-4 m-6 rounded-lg flex items-center justify-between">
          <div className="text-red-800">{error}</div>
          <button onClick={() => setError(null)} className="text-red-600 hover:text-red-800">
            <X size={16} />
          </button>
        </div>
      )}

      {/* Hero Section */}
      <div className={`bg-gradient-to-br ${COLOR_THEMES[displayData?.hero?.background || 'ocean'].bg} py-20 px-6`}>
        <div className="max-w-6xl mx-auto text-center">
          {isEditing ? (
            <div className="space-y-6">
              <input
                type="text"
                value={editData?.hero?.title || ''}
                onChange={(e) => setEditData({
                  ...editData,
                  hero: { ...editData.hero, title: e.target.value }
                })}
                className="text-5xl font-bold text-center w-full bg-transparent border-b-2 border-gray-300 focus:border-blue-500 outline-none text-gray-900"
                placeholder="Your organization's main headline"
              />
              <textarea
                value={editData?.hero?.subtitle || ''}
                onChange={(e) => setEditData({
                  ...editData,
                  hero: { ...editData.hero, subtitle: e.target.value }
                })}
                className="text-xl text-center w-full bg-transparent border border-gray-300 rounded-lg p-4 focus:border-blue-500 outline-none resize-none text-gray-700"
                placeholder="A compelling subtitle that explains what you do"
                rows={3}
              />
              <select
                value={editData?.hero?.background || 'ocean'}
                onChange={(e) => setEditData({
                  ...editData,
                  hero: { ...editData.hero, background: e.target.value }
                })}
                className="mx-auto border border-gray-300 rounded-lg px-4 py-2 focus:border-blue-500 outline-none"
              >
                {Object.entries(COLOR_THEMES).map(([key, theme]) => (
                  <option key={key} value={key}>{theme.name} Theme</option>
                ))}
              </select>
            </div>
          ) : (
            <>
              <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
                {displayData?.hero?.title || `Welcome to ${organization?.name}`}
              </h1>
              <p className="text-xl md:text-2xl text-gray-700 max-w-4xl mx-auto leading-relaxed">
                {displayData?.hero?.subtitle || 'Discover our mission, vision, and the impact we\'re making together.'}
              </p>
            </>
          )}
        </div>
      </div>

      {/* Content Blocks */}
      <div className="max-w-7xl mx-auto p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-min">
          {(displayData?.blocks || []).map(block => renderBlock(block, isEditing))}
          
          {/* Add Block Button (Editing Mode) */}
          {isEditing && (
            <div className="md:col-span-1 flex items-center justify-center min-h-[200px]">
              <button
                onClick={() => addBlock()}
                className="w-full h-full border-2 border-dashed border-gray-300 rounded-2xl hover:border-blue-400 hover:bg-blue-50 transition-all duration-300 flex flex-col items-center justify-center gap-4 text-gray-500 hover:text-blue-600"
              >
                <Plus size={48} />
                <span className="text-lg font-medium">Add New Section</span>
                <span className="text-sm">Click to create a custom block</span>
              </button>
            </div>
          )}
        </div>

        {/* Empty State for Editing Mode */}
        {isEditing && displayData?.blocks?.length === 0 && (
          <div className="text-center py-20">
            <div className="w-24 h-24 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <Lightbulb className="w-12 h-12 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Ready to Build Your Story?</h3>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              Start by adding sections that showcase your mission, impact, team, and more. Use templates for quick setup or create custom blocks.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => setShowTemplates(true)}
                className="bg-blue-600 text-white px-8 py-3 rounded-xl hover:bg-blue-700 transition-colors font-medium"
              >
                Browse Templates
              </button>
              <button
                onClick={() => addBlock()}
                className="border border-gray-300 text-gray-700 px-8 py-3 rounded-xl hover:bg-gray-50 transition-colors font-medium"
              >
                Create Custom Block
              </button>
            </div>
          </div>
        )}

        {/* Public View Footer */}
        {!isEditing && displayData && (
          <div className="mt-20 text-center py-12 border-t border-gray-200">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <Heart className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Get Involved</h3>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              Ready to join our mission? There are many ways to get involved and make a difference.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="bg-blue-600 text-white px-8 py-3 rounded-xl hover:bg-blue-700 transition-colors font-medium">
                Learn More
              </button>
              <button className="border border-gray-300 text-gray-700 px-8 py-3 rounded-xl hover:bg-gray-50 transition-colors font-medium">
                Contact Us
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Keyboard Shortcuts Help (Editing Mode) */}
      {isEditing && (
        <div className="fixed bottom-6 right-6 bg-white rounded-lg shadow-lg border border-gray-200 p-4 text-sm">
          <div className="font-medium mb-2">Keyboard Shortcuts</div>
          <div className="space-y-1 text-gray-600">
            <div><kbd className="px-2 py-1 bg-gray-100 rounded text-xs">Ctrl+S</kbd> Save</div>
            <div><kbd className="px-2 py-1 bg-gray-100 rounded text-xs">Esc</kbd> Cancel</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrganizationNorthStar;