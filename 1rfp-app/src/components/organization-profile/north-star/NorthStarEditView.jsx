// src/components/organization-profile/north-star/NorthStarEditView.jsx - Structured Layout
import React, { useState, useEffect, useRef } from 'react';
import { Plus, Save, X, Target, Eye, Compass, Heart, TrendingUp, Calendar, Clock, MapPin, Users, CheckCircle } from 'lucide-react';
import { BLOCK_TEMPLATES } from './constants.js';

const NorthStarEditView = ({ 
  editData, 
  setEditData, 
  onSave, 
  onCancel, 
  saving,
  organization
}) => {

  // Define the structured layout sections
  const [showClearModal, setShowClearModal] = useState(false);
  const [storyProgress, setStoryProgress] = useState(0);
  const [saveConfirmation, setSaveConfirmation] = useState({
    visible: false,
    message: '',
    timestamp: null
  });
  const saveTimeoutRef = useRef(null);

  // Calculate story completion progress
  useEffect(() => {
    const totalSections = 10; // Total possible sections
    const completedSections = (editData.blocks || []).length;
    setStoryProgress(Math.round((completedSections / totalSections) * 100));
  }, [editData.blocks]);

  // Persist editData to sessionStorage when it changes
  useEffect(() => {
    if (editData && editData.blocks) {
      const storageKey = `editData_${organization?.id || 'temp'}`;
      sessionStorage.setItem(storageKey, JSON.stringify(editData));
    }
  }, [editData, organization?.id]);

  // Load editData from sessionStorage on component mount
  useEffect(() => {
    if (!editData && organization?.id) {
      const storageKey = `editData_${organization.id}`;
      const savedData = sessionStorage.getItem(storageKey);
      if (savedData) {
        try {
          const parsedData = JSON.parse(savedData);
          if (parsedData && parsedData.blocks) {
            setEditData(parsedData);
          }
        } catch (error) {
          console.warn('Failed to parse saved edit data:', error);
        }
      }
    }
  }, [organization?.id]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  // Clear all content
  const clearAllContent = () => {
    setEditData({
      ...editData,
      blocks: []
    });
    setShowClearModal(false);
    
    // Clear from sessionStorage too
    const storageKey = `editData_${organization?.id || 'temp'}`;
    sessionStorage.removeItem(storageKey);
  };

  // Handle save with visual feedback - CLEAN VERSION
  const handleSave = async () => {
    try {
      if (onSave) {
        await onSave();
      }
      
      // Clear any existing timeout
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      
      // Show save confirmation
      setSaveConfirmation({
        visible: true,
        message: 'Content has been saved successfully!',
        timestamp: Date.now()
      });
      
      // Clear saved edit data from sessionStorage since we've saved
      const storageKey = `editData_${organization?.id || 'temp'}`;
      sessionStorage.removeItem(storageKey);
      
      // Hide confirmation after 4 seconds
      saveTimeoutRef.current = setTimeout(() => {
        setSaveConfirmation(prev => ({ ...prev, visible: false }));
      }, 4000);
      
    } catch (error) {
      console.error('Save failed:', error);
      setSaveConfirmation({
        visible: true,
        message: 'Failed to save content. Please try again.',
        timestamp: Date.now()
      });
      
      // Hide error message after 4 seconds
      saveTimeoutRef.current = setTimeout(() => {
        setSaveConfirmation(prev => ({ ...prev, visible: false }));
      }, 4000);
    }
  };

  // Section-specific writing guidance
  const writingGuidance = {
    mission: "💡 Clearly state why your organization exists. Focus on the problem you solve and the change you create. Keep it concise and inspiring.",
    vision: "🔮 Paint a picture of the future you're working toward. Be ambitious but achievable. What does success look like?",
    approach: "🧭 Explain your unique methodology. What makes your approach different? How do you ensure sustainable impact?",
    values: "❤️ List 3-5 core principles that guide decisions. Each value should be actionable with a brief explanation of what it means in practice.",
    strategic_priorities: "🎯 Highlight 3-5 key focus areas. Be specific about what you're prioritizing and why these areas matter most right now.",
    short_term_goals: "⚡ Set 3-5 concrete goals for the next 1-2 years. Make them specific, measurable, and aligned with your mission.",
    long_term_goals: "🏔️ Define 3-5 ambitious goals for 5-10 years. Think big picture transformation and systemic change you want to achieve.",
    impact: "📈 Showcase concrete results with numbers, stories, and outcomes. Include both quantitative metrics and qualitative stories.",
    focus_areas_location: "🗺️ Define the geographic areas you serve. Be specific about regions, communities, or populations you prioritize.",
    partnerships: "🤝 Highlight key collaborations that amplify your impact. Explain how partnerships strengthen your work and extend your reach."
  };

  const layoutSections = [
    {
      id: 'line1',
      title: 'Foundation Overview',
      description: 'Core purpose and direction',
      layout: 'grid-cols-3',
      templates: [
        { key: 'mission', title: 'Mission', icon: Target, color: 'purple' },
        { key: 'vision', title: 'Vision', icon: Eye, color: 'blue' },
        { key: 'approach', title: 'Approach', icon: Compass, color: 'green' }
      ]
    },
    {
      id: 'line2',
      title: 'Core Values',
      description: 'Guiding principles',
      layout: 'grid-cols-1',
      templates: [
        { key: 'values', title: 'Core Values', icon: Heart, color: 'red' }
      ]
    },
    {
      id: 'line3',
      title: 'Strategic Focus',
      description: 'Key strategic priorities',
      layout: 'grid-cols-1',
      templates: [
        { key: 'strategic_priorities', title: 'Strategic Priorities', icon: Target, color: 'orange' }
      ]
    },
    {
      id: 'line4',
      title: 'Goals & Timeline',
      description: 'Short and long-term objectives',
      layout: 'grid-cols-2',
      templates: [
        { key: 'short_term_goals', title: 'Short-Term Goals', icon: Clock, color: 'blue' },
        { key: 'long_term_goals', title: 'Long-Term Goals', icon: Calendar, color: 'green' }
      ]
    },
    {
      id: 'line5',
      title: 'Impact & Results',
      description: 'Current achievements and metrics',
      layout: 'grid-cols-1',
      templates: [
        { key: 'impact', title: 'Our Impact', icon: TrendingUp, color: 'emerald' }
      ]
    },
    {
      id: 'line6',
      title: 'Community & Reach',
      description: 'Geographic focus and partnerships',
      layout: 'grid-cols-2',
      templates: [
        { key: 'focus_areas_location', title: 'Geographic Focus', icon: MapPin, color: 'teal' },
        { key: 'partnerships', title: 'Community Partnerships', icon: Users, color: 'indigo' }
      ]
    }
  ];

  // Get block by template key
  const getBlockByTemplate = (templateKey) => {
    return (editData.blocks || []).find(block => {
      const template = BLOCK_TEMPLATES[templateKey];
      return template && block.title === template.title;
    });
  };
  
  // Add a template block
  const addTemplate = (templateKey) => {
    const template = BLOCK_TEMPLATES[templateKey];
    if (!template) return;

    const newBlock = {
      ...template,
      id: `block_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      order: (editData.blocks || []).length + 1
    };

    setEditData({
      ...editData,
      blocks: [...(editData.blocks || []), newBlock]
    });
  };

  // Remove a block
  const removeBlock = (blockId) => {
    setEditData({
      ...editData,
      blocks: (editData.blocks || []).filter(b => b.id !== blockId)
    });
  };

  // Update block content
  const updateBlock = (blockId, field, value) => {
    setEditData({
      ...editData,
      blocks: (editData.blocks || []).map(b => 
        b.id === blockId ? { ...b, [field]: value } : b
      )
    });
  };

  // Create Foundation Template (all sections)
  const createFoundationTemplate = () => {
    const foundationBlocks = [
      'mission', 'vision', 'approach', 'values', 'strategic_priorities',
      'short_term_goals', 'long_term_goals', 'impact', 
      'focus_areas_location', 'partnerships'
    ].map((templateKey, index) => {
      const template = BLOCK_TEMPLATES[templateKey];
      return {
        ...template,
        id: `block_${Date.now()}_${index}_${Math.random().toString(36).substr(2, 9)}`,
        order: index + 1
      };
    });

    setEditData({
      ...editData,
      blocks: foundationBlocks
    });
  };

  const colorClasses = {
    blue: 'bg-blue-100 border-blue-200 text-blue-700',
    purple: 'bg-purple-100 border-purple-200 text-purple-700',
    green: 'bg-green-100 border-green-200 text-green-700',
    red: 'bg-red-100 border-red-200 text-red-700',
    orange: 'bg-orange-100 border-orange-200 text-orange-700',
    emerald: 'bg-emerald-100 border-emerald-200 text-emerald-700',
    teal: 'bg-teal-100 border-teal-200 text-teal-700',
    indigo: 'bg-indigo-100 border-indigo-200 text-indigo-700'
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-slate-900 mb-4">Build Your Organization's Story</h2>
        <p className="text-slate-600 mb-8">Create a compelling narrative using our structured storytelling layout</p>
        
        {/* Controls */}
        <div className="flex flex-wrap justify-center items-center gap-4 mb-4">
          <button
            onClick={createFoundationTemplate}
            className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-3 rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 font-medium shadow-lg hover:shadow-xl"
          >
            Create Sample Template
          </button>
          <div className="h-6 w-px bg-gray-300"></div>
          <button
            onClick={() => setShowClearModal(true)}
            className="bg-slate-100 border border-slate-300 text-slate-600 px-6 py-3 rounded-xl hover:bg-slate-200 hover:border-slate-400 transition-colors font-medium"
          >
            <X size={18} className="inline mr-2" />
            All Clear
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className={`px-8 py-3 rounded-xl font-medium disabled:opacity-50 transition-all duration-300 ${
              saveConfirmation.visible && saveConfirmation.message.includes('successfully')
                ? 'bg-green-600 hover:bg-green-700 text-white transform scale-105' 
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            {saving ? (
              <>
                <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full inline mr-2"></div>
                Saving...
              </>
            ) : saveConfirmation.visible && saveConfirmation.message.includes('successfully') ? (
              <>
                <CheckCircle size={18} className="inline mr-2" />
                Saved!
              </>
            ) : (
              <>
                <Save size={18} className="inline mr-2" />
                Save Changes
              </>
            )}
          </button>
        </div>

        {/* Save Confirmation Message - ALWAYS VISIBLE CONTAINER */}
        <div className="mb-8 min-h-[80px] flex items-center justify-center">
          {saveConfirmation.visible && (
            <div className={`border-2 px-8 py-4 rounded-2xl flex items-center gap-4 shadow-lg animate-pulse ${
              saveConfirmation.message.includes('successfully') 
                ? 'bg-green-50 border-green-400 text-green-800' 
                : 'bg-red-50 border-red-400 text-red-800'
            }`}>
              <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
                {saveConfirmation.message.includes('successfully') ? (
                  <CheckCircle className="w-5 h-5 text-green-600" />
                ) : (
                  <X className="w-5 h-5 text-red-600" />
                )}
              </div>
              <div className="font-medium text-lg">{saveConfirmation.message}</div>
              <button 
                onClick={() => setSaveConfirmation(prev => ({ ...prev, visible: false }))}
                className="ml-4 text-current hover:opacity-70"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Structured Layout Sections */}
      <div className="space-y-12 relative">
        {/* Subtle background pattern */}
        <div className="absolute inset-0 opacity-5 pointer-events-none">
          <div className="absolute top-20 left-10 w-32 h-32 bg-blue-500 rounded-full blur-3xl"></div>
          <div className="absolute top-40 right-20 w-40 h-40 bg-purple-500 rounded-full blur-3xl"></div>
          <div className="absolute bottom-40 left-1/4 w-36 h-36 bg-pink-500 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-1/3 w-28 h-28 bg-indigo-500 rounded-full blur-3xl"></div>
        </div>

        {layoutSections.map((section) => (
          <div key={section.id} className="relative bg-white rounded-2xl border border-slate-200 p-8 shadow-sm hover:shadow-md transition-all duration-300 hover:border-slate-300 group">
            {/* Hover animation background */}
            <div className="absolute inset-0 bg-gradient-to-r from-blue-50/0 via-purple-50/0 to-pink-50/0 group-hover:from-blue-50/30 group-hover:via-purple-50/20 group-hover:to-pink-50/30 rounded-2xl transition-all duration-500"></div>
            
            {/* Section Header */}
            <div className="relative z-10 flex items-center justify-between mb-8">
              <div>
                <h3 className="text-xl font-bold text-slate-900">{section.title}</h3>
                <p className="text-slate-600">{section.description}</p>
              </div>
            </div>

            {/* Section Content Grid */}
            <div className={`relative z-10 grid ${section.layout} gap-6`}>
              {section.templates.map((template) => {
                const block = getBlockByTemplate(template.key);
                const IconComponent = template.icon;
                const colorClass = colorClasses[template.color];

                return (
                  <div key={template.key} className="space-y-4 group/template">
                    {/* Template Header */}
                    <div className={`border-2 border-dashed rounded-xl p-4 transition-all duration-300 hover:scale-105 ${colorClass}`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="transform transition-transform duration-300 group-hover/template:rotate-12">
                            <IconComponent className="w-5 h-5" />
                          </div>
                          <span className="font-medium">{template.title}</span>
                        </div>
                        {!block ? (
                          <button
                            onClick={() => addTemplate(template.key)}
                            className="bg-white border border-slate-300 text-slate-700 px-3 py-2 rounded-lg hover:bg-slate-50 transition-all duration-300 text-sm font-medium hover:scale-105 hover:shadow-sm"
                          >
                            <Plus size={16} className="inline mr-1" />
                            Add
                          </button>
                        ) : (
                          <button
                            onClick={() => removeBlock(block.id)}
                            className="text-red-500 hover:text-red-700 p-2 hover:bg-red-50 rounded-lg transition-all duration-300 hover:scale-110"
                          >
                            <X size={16} />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Block Content Editor */}
                    {block && (
                      <div className="bg-slate-50 rounded-xl p-6 border border-slate-200 hover:shadow-sm transition-all duration-300">
                        <div className="space-y-4">
                          {/* Title Editor */}
                          <div>
                            <label className="block text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">Section Title</label>
                            <input
                              type="text"
                              value={block.title || ''}
                              onChange={(e) => updateBlock(block.id, 'title', e.target.value)}
                              className="w-full text-2xl font-black text-slate-900 bg-white border border-slate-300 rounded-xl px-4 py-3 placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                              placeholder="Section Title"
                            />
                          </div>

                          {/* Content Editor */}
                          <div>
                            <label className="block text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">Content</label>
                            {block.type === 'list' && Array.isArray(block.content) ? (
                              <div className="space-y-3">
                                {/* Simple Toolbar - Bullets Only */}
                                <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-lg">
                                  <button
                                    onClick={() => {
                                      const newContent = [...(block.content || []), ''];
                                      updateBlock(block.id, 'content', newContent);
                                      
                                      setTimeout(() => {
                                        const textareas = document.querySelectorAll(`[data-block-id="${block.id}"] textarea`);
                                        const lastTextarea = textareas[textareas.length - 1];
                                        if (lastTextarea) {
                                          lastTextarea.focus();
                                        }
                                      }, 100);
                                    }}
                                    className="flex items-center gap-2 px-3 py-2 text-sm bg-white border border-slate-300 rounded hover:bg-slate-50 transition-colors"
                                    title="Add Bullet Point"
                                  >
                                    <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                                    Add Bullet
                                  </button>
                                  
                                  <button
                                    onClick={() => updateBlock(block.id, 'content', [])}
                                    className="px-3 py-2 text-xs text-slate-500 hover:text-slate-700 transition-colors"
                                    title="Clear All Content"
                                  >
                                    Clear All
                                  </button>
                                </div>
                                
                                {/* Bullet Point Editor with Improved Alignment */}
                                <div className="space-y-2" data-block-id={block.id}>
                                  {(block.content || []).map((item, index) => (
                                    <div key={index} className="flex items-start gap-3 p-4 bg-white border border-slate-200 rounded-lg hover:border-slate-300 transition-colors">
                                      {/* Perfectly aligned bullet */}
                                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2.5 flex-shrink-0"></div>
                                      
                                      {/* Content input with better alignment */}
                                      <div className="flex-1 min-w-0">
                                        <textarea
                                          value={item || ''}
                                          onChange={(e) => {
                                            const newContent = [...(block.content || [])];
                                            newContent[index] = e.target.value;
                                            updateBlock(block.id, 'content', newContent);
                                          }}
                                          onKeyDown={(e) => {
                                            e.stopPropagation();
                                            
                                            if (e.key === 'Enter' && e.shiftKey === false) {
                                              e.preventDefault();
                                              const newContent = [...(block.content || [])];
                                              newContent.splice(index + 1, 0, '');
                                              updateBlock(block.id, 'content', newContent);
                                              
                                              setTimeout(() => {
                                                const textareas = document.querySelectorAll(`[data-block-id="${block.id}"] textarea`);
                                                const nextTextarea = textareas[index + 1];
                                                if (nextTextarea) {
                                                  nextTextarea.focus();
                                                }
                                              }, 100);
                                            }
                                            
                                            if (e.key === 'Backspace' && e.target.value === '' && block.content.length > 1) {
                                              e.preventDefault();
                                              const newContent = block.content.filter((_, i) => i !== index);
                                              updateBlock(block.id, 'content', newContent);
                                              
                                              setTimeout(() => {
                                                const textareas = document.querySelectorAll(`[data-block-id="${block.id}"] textarea`);
                                                const prevTextarea = textareas[Math.max(0, index - 1)];
                                                if (prevTextarea) {
                                                  prevTextarea.focus();
                                                  prevTextarea.setSelectionRange(prevTextarea.value.length, prevTextarea.value.length);
                                                }
                                              }, 100);
                                            }
                                          }}
                                          placeholder="Type your bullet point here..."
                                          className="w-full p-0 border-none outline-none resize-none text-slate-700 leading-relaxed bg-transparent placeholder-slate-400"
                                          rows={1}
                                          style={{ 
                                            minHeight: '20px',
                                            lineHeight: '1.5'
                                          }}
                                          onInput={(e) => {
                                            // Auto-resize textarea
                                            e.target.style.height = 'auto';
                                            e.target.style.height = e.target.scrollHeight + 'px';
                                          }}
                                        />
                                      </div>
                                      
                                      {/* Remove button */}
                                      <button
                                        onClick={() => {
                                          if (block.content.length > 1) {
                                            const newContent = block.content.filter((_, i) => i !== index);
                                            updateBlock(block.id, 'content', newContent);
                                          } else {
                                            updateBlock(block.id, 'content', ['']);
                                          }
                                        }}
                                        className="text-red-400 hover:text-red-600 p-1 hover:bg-red-50 rounded transition-colors flex-shrink-0 mt-1"
                                        title="Remove bullet point"
                                      >
                                        <X size={14} />
                                      </button>
                                    </div>
                                  ))}
                                  
                                  {/* Empty state */}
                                  {(!block.content || block.content.length === 0) && (
                                    <div className="text-center py-12 text-slate-500">
                                      <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <span className="w-3 h-3 bg-blue-500 rounded-full"></span>
                                      </div>
                                      <p className="mb-4 font-medium">No bullet points yet</p>
                                      <button
                                        onClick={() => {
                                          updateBlock(block.id, 'content', ['']);
                                        }}
                                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm"
                                      >
                                        Add Your First Bullet Point
                                      </button>
                                    </div>
                                  )}
                                </div>
                                
                                <div className="text-xs text-slate-500">
                                  💡 Press Enter to add new bullet points. Press Shift+Enter for line breaks within a bullet. Use Backspace on empty bullets to remove them.
                                </div>
                              </div>
                            ) : block.type === 'stats' && Array.isArray(block.content) ? (
                              <div className="space-y-4">
                                {/* Visual Stats Builder */}
                                <div className="grid grid-cols-1 gap-3">
                                  {block.content.map((stat, index) => (
                                    <div key={index} className="flex gap-3 items-center bg-slate-50 p-3 rounded-lg border border-slate-200">
                                      <input
                                        type="text"
                                        value={stat.label || ''}
                                        onChange={(e) => {
                                          const newContent = [...block.content];
                                          newContent[index] = { ...stat, label: e.target.value };
                                          updateBlock(block.id, 'content', newContent);
                                        }}
                                        placeholder="Metric name (e.g., Lives Impacted)"
                                        className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                      />
                                      <span className="text-slate-400 font-bold">:</span>
                                      <input
                                        type="text"
                                        value={stat.value || ''}
                                        onChange={(e) => {
                                          const newContent = [...block.content];
                                          newContent[index] = { ...stat, value: e.target.value };
                                          updateBlock(block.id, 'content', newContent);
                                        }}
                                        placeholder="Value (e.g., 50,000+)"
                                        className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                      />
                                      <button
                                        onClick={() => {
                                          const newContent = block.content.filter((_, i) => i !== index);
                                          updateBlock(block.id, 'content', newContent);
                                        }}
                                        className="text-red-500 hover:text-red-700 p-1 hover:bg-red-50 rounded transition-colors"
                                      >
                                        <X size={16} />
                                      </button>
                                    </div>
                                  ))}
                                  
                                  {/* Add New Stat Button */}
                                  <button
                                    onClick={() => {
                                      const newContent = [...block.content, { label: '', value: '' }];
                                      updateBlock(block.id, 'content', newContent);
                                    }}
                                    className="flex items-center justify-center gap-2 p-3 border-2 border-dashed border-slate-300 rounded-lg text-slate-500 hover:border-slate-400 hover:text-slate-600 transition-colors"
                                  >
                                    <Plus size={16} />
                                    Add Impact Metric
                                  </button>
                                </div>
                                
                                <div className="text-xs text-slate-500">
                                  💡 Add metrics that showcase your impact with numbers, percentages, or achievements.
                                </div>
                              </div>
                            ) : (
                              <textarea
                                value={block.content || ''}
                                onChange={(e) => {
                                  updateBlock(block.id, 'content', e.target.value);
                                }}
                                onKeyDown={(e) => {
                                  // Allow all normal typing including Enter
                                  e.stopPropagation();
                                }}
                                className="w-full p-4 border border-slate-300 rounded-xl text-slate-700 leading-relaxed resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white transition-all duration-300"
                                rows={6}
                                placeholder="Tell your story with clarity and purpose. Focus on your impact, use specific examples, and share your unique narrative..."
                              />
                            )}
                            <div className="text-xs text-slate-500 mt-2">{writingGuidance[template.key] || "💡 Write with clarity and purpose."}</div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Enhanced Clear All Confirmation Modal */}
      {showClearModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-md mx-4 shadow-2xl transform transition-all overflow-hidden">
            <div className="relative p-6 overflow-hidden">
              <div className="absolute inset-0">
                <div className="absolute top-0 left-0 w-24 h-24 bg-gradient-to-br from-orange-200 to-red-200 rounded-full blur-2xl opacity-60 -translate-x-4 -translate-y-4 animate-pulse"></div>
                <div className="absolute bottom-0 right-0 w-32 h-32 bg-gradient-to-br from-red-200 to-pink-200 rounded-full blur-2xl opacity-50 translate-x-4 translate-y-4 animate-pulse"></div>
              </div>
              <div className="relative z-10 text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <X className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">Clear All Content?</h3>
                <p className="text-slate-600">This will remove all sections and content from your North Star page. This action cannot be undone.</p>
              </div>
            </div>
            <div className="px-6 pb-6">
              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => setShowClearModal(false)}
                  className="px-6 py-3 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition-all duration-300 font-medium"
                >
                  Keep Content
                </button>
                <button
                  onClick={clearAllContent}
                  className="px-6 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl hover:from-orange-600 hover:to-red-600 transition-all duration-300 font-medium shadow-lg transform hover:scale-105"
                >
                  Clear All
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Debug Panel - Remove in production */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed bottom-4 right-4 bg-gray-900 text-white p-3 rounded-lg text-xs">
          <div>Save Confirmation: {saveConfirmation.visible ? 'visible' : 'hidden'}</div>
          <div>Saving: {saving ? 'true' : 'false'}</div>
          <div>Blocks Count: {editData?.blocks?.length || 0}</div>
        </div>
      )}
    </div>
  );
};

export default NorthStarEditView;