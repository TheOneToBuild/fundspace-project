// src/components/organization-profile/OrganizationImpact.jsx
import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, Edit3, Save, X, Plus, Trash2, Upload, Image as ImageIcon,
  ChevronUp, ChevronDown, AlertTriangle, Users, Building, Truck, 
  GraduationCap, School, Laptop, Heart, Star, Award, Target, Zap
} from 'lucide-react';
import { supabase } from '../../supabaseClient.js';

// Icon mapping for metrics
const METRIC_ICONS = {
  Users, Building, Truck, GraduationCap, School, Laptop, Heart, Star, Award, Target, Zap
};

const OrganizationImpact = ({ organization, userMembership, session, photos = [] }) => {
  const [impactData, setImpactData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  // Check if user can edit
  const canEdit = userMembership && ['admin', 'editor'].includes(userMembership.role);

  // Photo Gallery Component
  const PhotoGallery = ({ photos, title }) => (
    <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold text-slate-900">{title}</h3>
        <button className="text-sm text-purple-600 hover:text-purple-700 font-medium">View All</button>
      </div>
      <div className="flex overflow-x-auto space-x-4 pb-4 -mb-4">
        {photos.map((photo, index) => (
          <div 
            key={index} 
            className="flex-shrink-0 w-72 h-52 rounded-lg overflow-hidden bg-slate-100 hover:scale-105 transition-transform cursor-pointer shadow-md"
          >
            <img src={photo} alt={`Photo ${index + 1}`} className="w-full h-full object-cover" />
          </div>
        ))}
      </div>
    </div>
  );

  // Fetch Impact data
  useEffect(() => {
    const fetchImpact = async () => {
      if (!organization?.id) return;

      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('organization_impacts')
          .select('*')
          .eq('organization_id', organization.id)
          .eq('is_published', true)
          .single();

        if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
          throw error;
        }

        setImpactData(data);
      } catch (err) {
        console.error('Error fetching Impact:', err);
        setError('Failed to load Impact data');
      } finally {
        setLoading(false);
      }
    };

    fetchImpact();
  }, [organization?.id]);

  // Initialize edit data
  const startEditing = () => {
    setEditData(impactData || {
      spotlights: [],
      testimonials: []
    });
    setIsEditing(true);
  };

  // Cancel editing
  const cancelEditing = () => {
    setIsEditing(false);
    setEditData(null);
    setError(null);
  };

  // Save Impact data
  const saveImpact = async () => {
    if (!editData || !session?.user?.id) return;

    setSaving(true);
    setError(null);

    try {
      const dataToSave = {
        organization_id: organization.id,
        spotlights: editData.spotlights || [],
        testimonials: editData.testimonials || [],
        is_published: true,
        updated_by_user_id: session.user.id
      };

      let result;
      if (impactData?.id) {
        // Update existing
        result = await supabase
          .from('organization_impacts')
          .update({ ...dataToSave, updated_at: new Date().toISOString() })
          .eq('id', impactData.id)
          .select()
          .single();
      } else {
        // Create new
        result = await supabase
          .from('organization_impacts')
          .insert({ ...dataToSave, created_by_user_id: session.user.id })
          .select()
          .single();
      }

      if (result.error) throw result.error;

      setImpactData(result.data);
      setIsEditing(false);
      setEditData(null);
    } catch (err) {
      console.error('Error saving Impact:', err);
      setError('Failed to save Impact data');
    } finally {
      setSaving(false);
    }
  };

  // Spotlight management functions
  const addSpotlight = () => {
    const newSpotlight = {
      id: Date.now().toString(),
      title: '',
      description: '',
      image_url: '',
      metrics: [],
      order: editData.spotlights.length + 1,
      featured: false
    };
    setEditData({
      ...editData,
      spotlights: [...editData.spotlights, newSpotlight]
    });
  };

  const removeSpotlight = (id) => {
    setEditData({
      ...editData,
      spotlights: editData.spotlights.filter(s => s.id !== id)
    });
  };

  const updateSpotlight = (id, field, value) => {
    setEditData({
      ...editData,
      spotlights: editData.spotlights.map(s => 
        s.id === id ? { ...s, [field]: value } : s
      )
    });
  };

  const moveSpotlight = (id, direction) => {
    const spotlights = [...editData.spotlights];
    const index = spotlights.findIndex(s => s.id === id);
    
    if (direction === 'up' && index > 0) {
      [spotlights[index], spotlights[index - 1]] = [spotlights[index - 1], spotlights[index]];
    } else if (direction === 'down' && index < spotlights.length - 1) {
      [spotlights[index], spotlights[index + 1]] = [spotlights[index + 1], spotlights[index]];
    }
    
    // Update order values
    spotlights.forEach((s, i) => s.order = i + 1);
    
    setEditData({ ...editData, spotlights });
  };

  // Metric management for spotlights
  const addMetric = (spotlightId) => {
    const newMetric = {
      label: '',
      value: '',
      icon: 'Users'
    };
    updateSpotlight(spotlightId, 'metrics', [
      ...(editData.spotlights.find(s => s.id === spotlightId)?.metrics || []),
      newMetric
    ]);
  };

  const removeMetric = (spotlightId, metricIndex) => {
    const spotlight = editData.spotlights.find(s => s.id === spotlightId);
    const updatedMetrics = spotlight.metrics.filter((_, index) => index !== metricIndex);
    updateSpotlight(spotlightId, 'metrics', updatedMetrics);
  };

  const updateMetric = (spotlightId, metricIndex, field, value) => {
    const spotlight = editData.spotlights.find(s => s.id === spotlightId);
    const updatedMetrics = spotlight.metrics.map((metric, index) =>
      index === metricIndex ? { ...metric, [field]: value } : metric
    );
    updateSpotlight(spotlightId, 'metrics', updatedMetrics);
  };

  // Testimonial management functions
  const addTestimonial = () => {
    const newTestimonial = {
      id: Date.now().toString(),
      quote: '',
      author_name: '',
      author_title: '',
      author_organization: '',
      author_image_url: '',
      order: editData.testimonials.length + 1,
      featured: false
    };
    setEditData({
      ...editData,
      testimonials: [...editData.testimonials, newTestimonial]
    });
  };

  const removeTestimonial = (id) => {
    setEditData({
      ...editData,
      testimonials: editData.testimonials.filter(t => t.id !== id)
    });
  };

  const updateTestimonial = (id, field, value) => {
    setEditData({
      ...editData,
      testimonials: editData.testimonials.map(t => 
        t.id === id ? { ...t, [field]: value } : t
      )
    });
  };

  const moveTestimonial = (id, direction) => {
    const testimonials = [...editData.testimonials];
    const index = testimonials.findIndex(t => t.id === id);
    
    if (direction === 'up' && index > 0) {
      [testimonials[index], testimonials[index - 1]] = [testimonials[index - 1], testimonials[index]];
    } else if (direction === 'down' && index < testimonials.length - 1) {
      [testimonials[index], testimonials[index + 1]] = [testimonials[index + 1], testimonials[index]];
    }
    
    // Update order values
    testimonials.forEach((t, i) => t.order = i + 1);
    
    setEditData({ ...editData, testimonials });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading Impact...</p>
        </div>
      </div>
    );
  }

  // Empty state for organizations without Impact
  if (!impactData && !isEditing) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
        <div className="text-6xl mb-4">📊</div>
        <h3 className="text-xl font-medium text-slate-900 mb-2">Impact Stories Coming Soon</h3>
        <p className="text-slate-600 mb-8">
          {canEdit 
            ? "Start showcasing your organization's impact and community testimonials."
            : `We're working on showcasing the impact of ${organization?.name}.`
          }
        </p>
        {canEdit && (
          <button
            onClick={startEditing}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 mx-auto"
          >
            <Plus size={20} />
            Create Impact Stories
          </button>
        )}
      </div>
    );
  }

  const displayData = isEditing ? editData : impactData;
  const spotlights = displayData?.spotlights || [];
  const testimonials = displayData?.testimonials || [];

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
            Edit Impact
          </button>
        </div>
      )}

      {isEditing && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center justify-between">
          <div className="flex items-center gap-2 text-blue-800">
            <Edit3 size={16} />
            <span className="font-medium">Editing Impact Stories</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={cancelEditing}
              className="px-4 py-2 text-slate-600 hover:text-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={saveImpact}
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

      <div className="space-y-16">
        {/* Impact Spotlights Section */}
        <div>
          <div className="flex justify-between items-center mb-8">
            <div>
              <h2 className="text-3xl font-bold text-slate-900 mb-2">Impact Spotlights</h2>
              <p className="text-lg text-slate-600 max-w-4xl">
                Diving deeper into our strategic initiatives and their effect on the community.
              </p>
            </div>
            {isEditing && (
              <button
                onClick={addSpotlight}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
              >
                <Plus size={16} />
                Add Spotlight
              </button>
            )}
          </div>

          {spotlights.length > 0 ? (
            <div className="space-y-12">
              {spotlights.map((spotlight, index) => (
                <div 
                  key={spotlight.id || index} 
                  className="grid md:grid-cols-2 gap-8 items-center bg-white p-8 rounded-2xl border border-slate-200 relative"
                >
                  {isEditing && (
                    <div className="absolute top-4 right-4 flex gap-2">
                      <button
                        onClick={() => moveSpotlight(spotlight.id, 'up')}
                        disabled={index === 0}
                        className="p-2 hover:bg-slate-100 rounded disabled:opacity-50"
                      >
                        <ChevronUp size={16} />
                      </button>
                      <button
                        onClick={() => moveSpotlight(spotlight.id, 'down')}
                        disabled={index === spotlights.length - 1}
                        className="p-2 hover:bg-slate-100 rounded disabled:opacity-50"
                      >
                        <ChevronDown size={16} />
                      </button>
                      <button
                        onClick={() => removeSpotlight(spotlight.id)}
                        className="p-2 hover:bg-slate-100 rounded text-red-600"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  )}
                  
                  <div className={index % 2 === 1 ? 'md:order-2' : ''}>
                    {isEditing ? (
                      <div className="space-y-4">
                        <input
                          type="text"
                          value={spotlight.title || ''}
                          onChange={(e) => updateSpotlight(spotlight.id, 'title', e.target.value)}
                          className="text-2xl font-bold text-slate-800 w-full border-b-2 border-slate-200 focus:border-blue-500 outline-none bg-transparent"
                          placeholder="Spotlight Title"
                        />
                        <textarea
                          value={spotlight.description || ''}
                          onChange={(e) => updateSpotlight(spotlight.id, 'description', e.target.value)}
                          className="text-slate-600 w-full border border-slate-200 rounded-lg p-3 focus:border-blue-500 outline-none resize-none"
                          placeholder="Spotlight Description"
                          rows={4}
                        />
                        
                        {/* Metrics Management */}
                        <div>
                          <div className="flex justify-between items-center mb-3">
                            <label className="text-sm font-medium text-slate-700">Impact Metrics</label>
                            <button
                              onClick={() => addMetric(spotlight.id)}
                              className="text-sm bg-blue-100 text-blue-700 px-2 py-1 rounded hover:bg-blue-200"
                            >
                              + Add Metric
                            </button>
                          </div>
                          <div className="space-y-2">
                            {(spotlight.metrics || []).map((metric, metricIndex) => (
                              <div key={metricIndex} className="flex gap-2 items-center">
                                <input
                                  type="text"
                                  value={metric.label || ''}
                                  onChange={(e) => updateMetric(spotlight.id, metricIndex, 'label', e.target.value)}
                                  className="flex-1 text-sm border border-slate-200 rounded p-2 focus:border-blue-500 outline-none"
                                  placeholder="Label"
                                />
                                <input
                                  type="text"
                                  value={metric.value || ''}
                                  onChange={(e) => updateMetric(spotlight.id, metricIndex, 'value', e.target.value)}
                                  className="w-20 text-sm border border-slate-200 rounded p-2 focus:border-blue-500 outline-none"
                                  placeholder="Value"
                                />
                                <select
                                  value={metric.icon || 'Users'}
                                  onChange={(e) => updateMetric(spotlight.id, metricIndex, 'icon', e.target.value)}
                                  className="text-sm border border-slate-200 rounded p-2 focus:border-blue-500 outline-none"
                                >
                                  {Object.keys(METRIC_ICONS).map(iconName => (
                                    <option key={iconName} value={iconName}>{iconName}</option>
                                  ))}
                                </select>
                                <button
                                  onClick={() => removeMetric(spotlight.id, metricIndex)}
                                  className="p-2 text-red-600 hover:bg-red-50 rounded"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <h3 className="text-2xl font-bold text-slate-800 mb-4">{spotlight.title}</h3>
                        <p className="text-slate-600 leading-relaxed mb-6">{spotlight.description}</p>
                        
                        {/* Display Metrics */}
                        {spotlight.metrics && spotlight.metrics.length > 0 && (
                          <div className="grid grid-cols-2 gap-4">
                            {spotlight.metrics.map((metric, metricIndex) => {
                              const IconComponent = METRIC_ICONS[metric.icon] || Users;
                              return (
                                <div key={metricIndex} className="flex items-center gap-3 bg-slate-50 p-3 rounded-lg">
                                  <IconComponent size={20} className="text-blue-600" />
                                  <div>
                                    <div className="font-bold text-slate-900">{metric.value}</div>
                                    <div className="text-sm text-slate-600">{metric.label}</div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  
                  <div className={index % 2 === 1 ? 'md:order-1' : ''}>
                    {isEditing ? (
                      <div className="space-y-2">
                        <input
                          type="text"
                          value={spotlight.image_url || ''}
                          onChange={(e) => updateSpotlight(spotlight.id, 'image_url', e.target.value)}
                          className="w-full border border-slate-200 rounded-lg p-3 focus:border-blue-500 outline-none"
                          placeholder="Image URL"
                        />
                        {spotlight.image_url && (
                          <img 
                            src={spotlight.image_url} 
                            alt={spotlight.title} 
                            className="rounded-xl object-cover w-full h-64" 
                            onError={(e) => {
                              e.target.style.display = 'none';
                            }}
                          />
                        )}
                        {!spotlight.image_url && (
                          <div className="h-64 bg-slate-100 rounded-xl flex items-center justify-center border-2 border-dashed border-slate-300">
                            <div className="text-center text-slate-500">
                              <ImageIcon size={32} className="mx-auto mb-2" />
                              <p>Add image URL above</p>
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <img 
                        src={spotlight.image_url} 
                        alt={spotlight.title} 
                        className="rounded-xl object-cover w-full h-64" 
                      />
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : isEditing ? (
            <div className="text-center py-12 bg-slate-50 rounded-xl border-2 border-dashed border-slate-300">
              <TrendingUp className="w-16 h-16 mx-auto mb-4 text-slate-400" />
              <p className="text-slate-600 mb-4">No impact spotlights yet</p>
              <button
                onClick={addSpotlight}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
              >
                Add Your First Spotlight
              </button>
            </div>
          ) : null}
        </div>

        {/* Photo Gallery */}
        {photos.length > 0 && (
          <PhotoGallery photos={photos} title="Our Work in Photos" />
        )}

        {/* Testimonials Section */}
        <div>
          <div className="flex justify-between items-center mb-8">
            <div>
              <h2 className="text-3xl font-bold text-slate-900 mb-2">Voices from the Community</h2>
              <p className="text-lg text-slate-600 max-w-4xl">
                Hear directly from the partners we are proud to support.
              </p>
            </div>
            {isEditing && (
              <button
                onClick={addTestimonial}
                className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2"
              >
                <Plus size={16} />
                Add Testimonial
              </button>
            )}
          </div>

          {testimonials.length > 0 ? (
            <div className="grid md:grid-cols-2 gap-8">
              {testimonials.map((testimonial, index) => (
                <div key={testimonial.id || index} className="bg-white p-8 rounded-2xl border border-slate-200 relative">
                  {isEditing && (
                    <div className="absolute top-4 right-4 flex gap-2">
                      <button
                        onClick={() => moveTestimonial(testimonial.id, 'up')}
                        disabled={index === 0}
                        className="p-2 hover:bg-slate-100 rounded disabled:opacity-50"
                      >
                        <ChevronUp size={16} />
                      </button>
                      <button
                        onClick={() => moveTestimonial(testimonial.id, 'down')}
                        disabled={index === testimonials.length - 1}
                        className="p-2 hover:bg-slate-100 rounded disabled:opacity-50"
                      >
                        <ChevronDown size={16} />
                      </button>
                      <button
                        onClick={() => removeTestimonial(testimonial.id)}
                        className="p-2 hover:bg-slate-100 rounded text-red-600"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  )}

                  {isEditing ? (
                    <div className="space-y-4">
                      <textarea
                        value={testimonial.quote || ''}
                        onChange={(e) => updateTestimonial(testimonial.id, 'quote', e.target.value)}
                        className="text-slate-700 text-lg w-full border border-slate-200 rounded-lg p-3 focus:border-blue-500 outline-none resize-none"
                        placeholder="Testimonial quote..."
                        rows={3}
                      />
                      
                      <div className="grid grid-cols-2 gap-3">
                        <input
                          type="text"
                          value={testimonial.author_name || ''}
                          onChange={(e) => updateTestimonial(testimonial.id, 'author_name', e.target.value)}
                          className="border border-slate-200 rounded-lg p-2 focus:border-blue-500 outline-none"
                          placeholder="Author Name"
                        />
                        <input
                          type="text"
                          value={testimonial.author_title || ''}
                          onChange={(e) => updateTestimonial(testimonial.id, 'author_title', e.target.value)}
                          className="border border-slate-200 rounded-lg p-2 focus:border-blue-500 outline-none"
                          placeholder="Author Title"
                        />
                      </div>
                      
                      <input
                        type="text"
                        value={testimonial.author_organization || ''}
                        onChange={(e) => updateTestimonial(testimonial.id, 'author_organization', e.target.value)}
                        className="w-full border border-slate-200 rounded-lg p-2 focus:border-blue-500 outline-none"
                        placeholder="Author Organization"
                      />
                      
                      <div className="space-y-2">
                        <input
                          type="text"
                          value={testimonial.author_image_url || ''}
                          onChange={(e) => updateTestimonial(testimonial.id, 'author_image_url', e.target.value)}
                          className="w-full border border-slate-200 rounded-lg p-2 focus:border-blue-500 outline-none"
                          placeholder="Author Image URL"
                        />
                        {testimonial.author_image_url && (
                          <img 
                            src={testimonial.author_image_url} 
                            alt={testimonial.author_name} 
                            className="w-14 h-14 rounded-full object-cover border-2 border-slate-200" 
                            onError={(e) => {
                              e.target.style.display = 'none';
                            }}
                          />
                        )}
                      </div>
                    </div>
                  ) : (
                    <>
                      <p className="text-slate-700 text-lg mb-6">"{testimonial.quote}"</p>
                      <div className="flex items-center gap-4">
                        <img 
                          src={testimonial.author_image_url} 
                          alt={testimonial.author_name} 
                          className="w-14 h-14 rounded-full object-cover" 
                        />
                        <div>
                          <p className="font-bold text-slate-900">{testimonial.author_name}</p>
                          <p className="text-sm text-slate-600">{testimonial.author_title}</p>
                          {testimonial.author_organization && (
                            <p className="text-sm text-slate-500">{testimonial.author_organization}</p>
                          )}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          ) : isEditing ? (
            <div className="text-center py-12 bg-slate-50 rounded-xl border-2 border-dashed border-slate-300">
              <Star className="w-16 h-16 mx-auto mb-4 text-slate-400" />
              <p className="text-slate-600 mb-4">No testimonials yet</p>
              <button
                onClick={addTestimonial}
                className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
              >
                Add Your First Testimonial
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default OrganizationImpact;