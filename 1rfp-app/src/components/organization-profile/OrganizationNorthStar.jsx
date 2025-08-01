// src/components/organization-profile/OrganizationNorthStar.jsx
import React, { useState, useEffect } from 'react';
import { 
  Target, Eye, Zap, Edit3, Save, X, Plus, Trash2, 
  GraduationCap, Home, Leaf, Heart, Users, Building,
  ChevronUp, ChevronDown, AlertTriangle
} from 'lucide-react';
import { supabase } from '../../supabaseClient.js';

// Icon mapping for strategic priorities
const PRIORITY_ICONS = {
  GraduationCap, Home, Leaf, Heart, Users, Building, Target, Zap, Eye
};

// Color themes for priorities
const COLOR_THEMES = {
  blue: { bg: 'from-blue-50 to-indigo-50', border: 'border-blue-100', text: 'text-blue-800', icon: 'from-blue-500 to-indigo-600' },
  green: { bg: 'from-green-50 to-emerald-50', border: 'border-green-100', text: 'text-green-800', icon: 'from-green-500 to-emerald-600' },
  emerald: { bg: 'from-emerald-50 to-teal-50', border: 'border-emerald-100', text: 'text-emerald-800', icon: 'from-emerald-500 to-teal-600' },
  purple: { bg: 'from-purple-50 to-pink-50', border: 'border-purple-100', text: 'text-purple-800', icon: 'from-purple-500 to-pink-600' },
  orange: { bg: 'from-orange-50 to-red-50', border: 'border-orange-100', text: 'text-orange-800', icon: 'from-orange-500 to-red-600' },
  slate: { bg: 'from-slate-50 to-gray-50', border: 'border-slate-100', text: 'text-slate-800', icon: 'from-slate-500 to-gray-600' }
};

const OrganizationNorthStar = ({ organization, userMembership, session }) => {
  const [northStarData, setNorthStarData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  // Check if user can edit
  const canEdit = userMembership && ['admin', 'editor'].includes(userMembership.role);

  // Fetch North Star data
  useEffect(() => {
    const fetchNorthStar = async () => {
      if (!organization?.id) return;

      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('organization_north_stars')
          .select('*')
          .eq('organization_id', organization.id)
          .eq('is_published', true)
          .single();

        if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
          throw error;
        }

        setNorthStarData(data);
      } catch (err) {
        console.error('Error fetching North Star:', err);
        setError('Failed to load North Star data');
      } finally {
        setLoading(false);
      }
    };

    fetchNorthStar();
  }, [organization?.id]);

  // Initialize edit data
  const startEditing = () => {
    setEditData(northStarData || {
      title: 'Our North Star',
      description: '',
      vision_title: 'Our Vision',
      vision_text: '',
      focus_title: 'Strategic Focus',
      focus_text: '',
      priorities: []
    });
    setIsEditing(true);
  };

  // Cancel editing
  const cancelEditing = () => {
    setIsEditing(false);
    setEditData(null);
    setError(null);
  };

  // Save North Star data
  const saveNorthStar = async () => {
    if (!editData || !session?.user?.id) return;

    setSaving(true);
    setError(null);

    try {
      const dataToSave = {
        organization_id: organization.id,
        title: editData.title || 'Our North Star',
        description: editData.description || '',
        vision_title: editData.vision_title || 'Our Vision',
        vision_text: editData.vision_text || '',
        focus_title: editData.focus_title || 'Strategic Focus',
        focus_text: editData.focus_text || '',
        priorities: editData.priorities || [],
        is_published: true,
        updated_by_user_id: session.user.id
      };

      let result;
      if (northStarData?.id) {
        // Update existing
        result = await supabase
          .from('organization_north_stars')
          .update({ ...dataToSave, updated_at: new Date().toISOString() })
          .eq('id', northStarData.id)
          .select()
          .single();
      } else {
        // Create new
        result = await supabase
          .from('organization_north_stars')
          .insert({ ...dataToSave, created_by_user_id: session.user.id })
          .select()
          .single();
      }

      if (result.error) throw result.error;

      setNorthStarData(result.data);
      setIsEditing(false);
      setEditData(null);
    } catch (err) {
      console.error('Error saving North Star:', err);
      setError('Failed to save North Star data');
    } finally {
      setSaving(false);
    }
  };

  // Add new priority
  const addPriority = () => {
    const newPriority = {
      id: Date.now().toString(),
      title: '',
      description: '',
      icon: 'Target',
      color: 'blue',
      order: editData.priorities.length + 1
    };
    setEditData({
      ...editData,
      priorities: [...editData.priorities, newPriority]
    });
  };

  // Remove priority
  const removePriority = (id) => {
    setEditData({
      ...editData,
      priorities: editData.priorities.filter(p => p.id !== id)
    });
  };

  // Update priority
  const updatePriority = (id, field, value) => {
    setEditData({
      ...editData,
      priorities: editData.priorities.map(p => 
        p.id === id ? { ...p, [field]: value } : p
      )
    });
  };

  // Move priority up/down
  const movePriority = (id, direction) => {
    const priorities = [...editData.priorities];
    const index = priorities.findIndex(p => p.id === id);
    
    if (direction === 'up' && index > 0) {
      [priorities[index], priorities[index - 1]] = [priorities[index - 1], priorities[index]];
    } else if (direction === 'down' && index < priorities.length - 1) {
      [priorities[index], priorities[index + 1]] = [priorities[index + 1], priorities[index]];
    }
    
    // Update order values
    priorities.forEach((p, i) => p.order = i + 1);
    
    setEditData({ ...editData, priorities });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading North Star...</p>
        </div>
      </div>
    );
  }

  // Empty state for organizations without North Star
  if (!northStarData && !isEditing) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
        <div className="text-6xl mb-4">🌟</div>
        <h3 className="text-xl font-medium text-slate-900 mb-2">North Star Coming Soon</h3>
        <p className="text-slate-600 mb-8">
          {canEdit 
            ? "Define your organization's strategic vision and priorities."
            : "We're working on defining our strategic vision and priorities."
          }
        </p>
        {canEdit && (
          <button
            onClick={startEditing}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 mx-auto"
          >
            <Plus size={20} />
            Create North Star
          </button>
        )}
      </div>
    );
  }

  const displayData = isEditing ? editData : northStarData;

  return (
    <div className="space-y-6">
      {/* Edit Controls */}
      {canEdit && !isEditing && (
        <div className="flex justify-end">
          <button
            onClick={startEditing}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <Edit3 size={16} />
            Edit North Star
          </button>
        </div>
      )}

      {isEditing && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center justify-between">
          <div className="flex items-center gap-2 text-blue-800">
            <Edit3 size={16} />
            <span className="font-medium">Editing North Star</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={cancelEditing}
              className="px-4 py-2 text-slate-600 hover:text-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={saveNorthStar}
              disabled={saving}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              <Save size={16} />
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-2 text-red-800">
          <AlertTriangle size={16} />
          {error}
        </div>
      )}

      {/* Main Content */}
      <div className="bg-white rounded-2xl p-10 border border-slate-200 shadow-sm">
        {/* Header */}
        <div className="text-center mb-12 max-w-3xl mx-auto">
          <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Target className="w-8 h-8 text-white" />
          </div>
          
          {isEditing ? (
            <div className="space-y-4">
              <input
                type="text"
                value={editData.title || ''}
                onChange={(e) => setEditData({ ...editData, title: e.target.value })}
                className="text-4xl font-bold text-slate-900 text-center w-full border-b-2 border-slate-200 focus:border-blue-500 outline-none bg-transparent"
                placeholder="North Star Title"
              />
              <textarea
                value={editData.description || ''}
                onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                className="text-xl text-slate-600 text-center w-full border border-slate-200 rounded-lg p-3 focus:border-blue-500 outline-none resize-none"
                placeholder="North Star Description"
                rows={3}
              />
            </div>
          ) : (
            <>
              <h2 className="text-4xl font-bold text-slate-900 mb-4">{displayData?.title}</h2>
              <p className="text-xl text-slate-600">{displayData?.description}</p>
            </>
          )}
        </div>

        {/* Vision and Focus */}
        <div className="grid md:grid-cols-2 gap-8 mb-8">
          {/* Vision */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-100">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center mb-4">
              <Eye className="w-6 h-6 text-white" />
            </div>
            
            {isEditing ? (
              <div className="space-y-3">
                <input
                  type="text"
                  value={editData.vision_title || ''}
                  onChange={(e) => setEditData({ ...editData, vision_title: e.target.value })}
                  className="text-xl font-bold text-slate-900 w-full border-b border-blue-200 focus:border-blue-500 outline-none bg-transparent"
                  placeholder="Vision Title"
                />
                <textarea
                  value={editData.vision_text || ''}
                  onChange={(e) => setEditData({ ...editData, vision_text: e.target.value })}
                  className="text-slate-700 w-full border border-blue-200 rounded-lg p-3 focus:border-blue-500 outline-none resize-none"
                  placeholder="Vision Description"
                  rows={3}
                />
              </div>
            ) : (
              <>
                <h3 className="text-xl font-bold text-slate-900 mb-3">{displayData?.vision_title}</h3>
                <p className="text-slate-700">{displayData?.vision_text}</p>
              </>
            )}
          </div>

          {/* Strategic Focus */}
          <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-6 rounded-xl border border-purple-100">
            <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-600 rounded-xl flex items-center justify-center mb-4">
              <Zap className="w-6 h-6 text-white" />
            </div>
            
            {isEditing ? (
              <div className="space-y-3">
                <input
                  type="text"
                  value={editData.focus_title || ''}
                  onChange={(e) => setEditData({ ...editData, focus_title: e.target.value })}
                  className="text-xl font-bold text-slate-900 w-full border-b border-purple-200 focus:border-purple-500 outline-none bg-transparent"
                  placeholder="Focus Title"
                />
                <textarea
                  value={editData.focus_text || ''}
                  onChange={(e) => setEditData({ ...editData, focus_text: e.target.value })}
                  className="text-slate-700 w-full border border-purple-200 rounded-lg p-3 focus:border-purple-500 outline-none resize-none"
                  placeholder="Focus Description"
                  rows={3}
                />
              </div>
            ) : (
              <>
                <h3 className="text-xl font-bold text-slate-900 mb-3">{displayData?.focus_title}</h3>
                <p className="text-slate-700">{displayData?.focus_text}</p>
              </>
            )}
          </div>
        </div>

        {/* Strategic Priorities */}
        {(displayData?.priorities?.length > 0 || isEditing) && (
          <div className="bg-gradient-to-r from-emerald-50 to-teal-50 p-8 rounded-xl border border-emerald-100">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-slate-900">Strategic Priorities</h3>
              {isEditing && (
                <button
                  onClick={addPriority}
                  className="bg-emerald-600 text-white px-3 py-1 rounded-lg hover:bg-emerald-700 transition-colors flex items-center gap-1 text-sm"
                >
                  <Plus size={14} />
                  Add Priority
                </button>
              )}
            </div>
            
            <div className="grid md:grid-cols-3 gap-6">
              {(displayData?.priorities || []).map((priority, index) => {
                const IconComponent = PRIORITY_ICONS[priority.icon] || Target;
                const colorTheme = COLOR_THEMES[priority.color] || COLOR_THEMES.blue;
                
                return (
                  <div 
                    key={priority.id || index}
                    className={`bg-gradient-to-br ${colorTheme.bg} p-4 rounded-lg border ${colorTheme.border} relative`}
                  >
                    {isEditing && (
                      <div className="absolute top-2 right-2 flex gap-1">
                        <button
                          onClick={() => movePriority(priority.id, 'up')}
                          disabled={index === 0}
                          className="p-1 hover:bg-white/50 rounded disabled:opacity-50"
                        >
                          <ChevronUp size={14} />
                        </button>
                        <button
                          onClick={() => movePriority(priority.id, 'down')}
                          disabled={index === displayData.priorities.length - 1}
                          className="p-1 hover:bg-white/50 rounded disabled:opacity-50"
                        >
                          <ChevronDown size={14} />
                        </button>
                        <button
                          onClick={() => removePriority(priority.id)}
                          className="p-1 hover:bg-white/50 rounded text-red-600"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    )}
                    
                    <div className={`w-8 h-8 bg-gradient-to-r ${colorTheme.icon} rounded-lg flex items-center justify-center mb-3`}>
                      <IconComponent className="w-4 h-4 text-white" />
                    </div>
                    
                    {isEditing ? (
                      <div className="space-y-2">
                        <input
                          type="text"
                          value={priority.title || ''}
                          onChange={(e) => updatePriority(priority.id, 'title', e.target.value)}
                          className={`font-semibold ${colorTheme.text} w-full border-b border-current/20 focus:border-current outline-none bg-transparent`}
                          placeholder="Priority Title"
                        />
                        <textarea
                          value={priority.description || ''}
                          onChange={(e) => updatePriority(priority.id, 'description', e.target.value)}
                          className="text-sm text-slate-700 w-full border border-slate-200 rounded p-2 focus:border-blue-500 outline-none resize-none"
                          placeholder="Priority Description"
                          rows={2}
                        />
                        <div className="flex gap-2">
                          <select
                            value={priority.icon || 'Target'}
                            onChange={(e) => updatePriority(priority.id, 'icon', e.target.value)}
                            className="text-xs border border-slate-200 rounded p-1 focus:border-blue-500 outline-none"
                          >
                            {Object.keys(PRIORITY_ICONS).map(iconName => (
                              <option key={iconName} value={iconName}>{iconName}</option>
                            ))}
                          </select>
                          <select
                            value={priority.color || 'blue'}
                            onChange={(e) => updatePriority(priority.id, 'color', e.target.value)}
                            className="text-xs border border-slate-200 rounded p-1 focus:border-blue-500 outline-none"
                          >
                            {Object.keys(COLOR_THEMES).map(colorName => (
                              <option key={colorName} value={colorName}>{colorName}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    ) : (
                      <>
                        <h4 className={`font-semibold ${colorTheme.text} mb-2`}>{priority.title}</h4>
                        <p className="text-sm text-slate-700">{priority.description}</p>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
            
            {isEditing && displayData?.priorities?.length === 0 && (
              <div className="text-center py-8 text-slate-500">
                <Target className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No strategic priorities yet. Click "Add Priority" to get started.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default OrganizationNorthStar;