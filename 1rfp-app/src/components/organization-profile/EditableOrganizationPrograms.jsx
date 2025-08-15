// src/components/organization-profile/EditableOrganizationPrograms.jsx
import React, { useState, useEffect } from 'react';
import { 
  Plus, Edit3, Trash2, Users, MapPin, Target, Calendar, ExternalLink, 
  Loader2, X, Zap, Eye, Clock, TrendingUp, Building2 
} from 'lucide-react';
import { supabase } from '../../supabaseClient.js';
import ProgramDetailModal from './ProgramDetailModal.jsx';
import OrganizationSearch from './OrganizationSearch.jsx';

const EditableOrganizationPrograms = ({ 
  organization, 
  session, 
  userMembership, 
  isEditMode = false 
}) => {
  const [editablePrograms, setEditablePrograms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingProgram, setEditingProgram] = useState(null);
  const [deletingProgram, setDeletingProgram] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // Modal states
  const [selectedProgram, setSelectedProgram] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    target_population: '',
    location: '',
    goals: '',
    impact_metrics: '',
    start_date: '',
    end_date: '',
    status: 'Active',
    external_url: '',
    funded_by_organizations: []
  });

  // Check if user can edit
  const canEdit = userMembership && ['super_admin', 'admin'].includes(userMembership.role);

  useEffect(() => {
    if (organization?.id) {
      fetchPrograms();
    }
  }, [organization?.id]);

  const fetchPrograms = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('organization_programs')
        .select('*')
        .eq('organization_id', organization.id)
        .order('display_order', { ascending: true });

      if (error) throw error;

      // Fetch funding organizations for each program
      const programsWithFunding = await Promise.all(
        (data || []).map(async (program) => {
          if (program.funded_by_organization_ids && program.funded_by_organization_ids.length > 0) {
            const { data: fundingOrgs, error: fundingError } = await supabase
              .from('organizations')
              .select('id, name, image_url, type')
              .in('id', program.funded_by_organization_ids);
            
            if (!fundingError) {
              program.funded_by_organizations = fundingOrgs || [];
            }
          } else {
            program.funded_by_organizations = [];
          }
          return program;
        })
      );

      setEditablePrograms(programsWithFunding);
    } catch (err) {
      console.error('Error fetching programs:', err);
      setError('Failed to load programs');
    } finally {
      setLoading(false);
    }
  };

  // Enhanced status styling helpers
  const getStatusDot = (status) => {
    switch (status) {
      case 'Active':
        return 'bg-emerald-500';
      case 'Planned':
        return 'bg-sky-500';
      case 'Completed':
        return 'bg-slate-500';
      case 'Paused':
        return 'bg-orange-500';
      default:
        return 'bg-emerald-500';
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      target_population: '',
      location: '',
      goals: '',
      impact_metrics: '',
      start_date: '',
      end_date: '',
      status: 'Active',
      external_url: '',
      funded_by_organizations: []
    });
    setEditingProgram(null);
  };

  const openAddForm = () => {
    resetForm();
    setShowForm(true);
  };

  const autofillSample = () => {
    setFormData({
      name: 'Youth Leadership Development Program',
      description: 'A comprehensive 12-month leadership program designed to empower young adults with the skills and confidence needed to become effective community leaders.',
      target_population: 'Ages 16-24, high school graduates and college students',
      location: 'San Francisco Bay Area',
      goals: 'Develop leadership skills, foster civic engagement, create mentorship opportunities, and build a network of young leaders committed to positive social change.',
      impact_metrics: 'Trained 150+ youth leaders, 85% secured leadership roles within 6 months, 40+ community projects initiated, 95% participant satisfaction rate.',
      start_date: '2024-01-15',
      end_date: '2024-12-15',
      status: 'Active',
      external_url: 'https://example.org/youth-leadership',
      funded_by_organizations: []
    });
  };

  const saveProgram = async () => {
    if (!formData.name.trim()) {
      alert('Program name is required');
      return;
    }

    setIsLoading(true);
    try {
      // Clean up data - convert empty strings to null for optional fields
      const cleanData = {
        ...formData,
        organization_id: organization.id,
        start_date: formData.start_date || null,
        end_date: formData.end_date || null,
        target_population: formData.target_population || null,
        location: formData.location || null,
        goals: formData.goals || null,
        impact_metrics: formData.impact_metrics || null,
        external_url: formData.external_url || null,
        status: formData.status.toLowerCase(), // Convert to lowercase for database
        funded_by_organization_ids: formData.funded_by_organizations.map(org => org.id),
        display_order: editingProgram ? editingProgram.display_order : editablePrograms.length + 1,
        is_active: true
      };

      // Remove the client-side organizations array before saving
      delete cleanData.funded_by_organizations;

      let result;
      if (editingProgram) {
        result = await supabase
          .from('organization_programs')
          .update(cleanData)
          .eq('id', editingProgram.id)
          .select();
      } else {
        result = await supabase
          .from('organization_programs')
          .insert([cleanData])
          .select();
      }

      if (result.error) throw result.error;

      await fetchPrograms();
      setShowForm(false);
      resetForm();
    } catch (err) {
      console.error('Error saving program:', err);
      alert(`Failed to save program: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteProgram = async (programId) => {
    if (!programId) {
      console.error('No program ID provided for deletion');
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('organization_programs')
        .delete()
        .eq('id', programId);

      if (error) throw error;

      await fetchPrograms();
      setDeletingProgram(null);
    } catch (err) {
      console.error('Error deleting program:', err);
      alert(`Failed to delete program: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteFromForm = async () => {
    if (!editingProgram?.id) return;
    
    if (!confirm(`Are you sure you want to delete "${editingProgram.name}"? This action cannot be undone.`)) {
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('organization_programs')
        .delete()
        .eq('id', editingProgram.id);

      if (error) throw error;

      await fetchPrograms();
      setShowForm(false);
      resetForm();
    } catch (err) {
      console.error('Error deleting program:', err);
      alert(`Failed to delete program: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const openDetailModal = (program) => {
    setSelectedProgram(program);
    setShowDetailModal(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-slate-500">Loading programs...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-20">
        <div className="text-red-600 mb-4">{error}</div>
        <button
          onClick={fetchPrograms}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header with Add Button */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Programs</h2>
          <p className="text-slate-600 mt-1">Manage your organization's programs and initiatives</p>
        </div>
        
        {canEdit && (
          <button
            onClick={openAddForm}
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl font-medium"
          >
            <Plus className="w-5 h-5" />
            Add Program
          </button>
        )}
      </div>

      {/* Programs Grid */}
      {editablePrograms.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {editablePrograms.map((program) => (
            <div
              key={program.id}
              className="group relative overflow-hidden transition-all duration-300 hover:scale-[1.02]"
            >
              {deletingProgram === program.id ? (
                // Embedded Delete Confirmation
                <div className="bg-white/95 backdrop-blur-xl rounded-3xl border border-red-200/50 overflow-hidden shadow-lg">
                  <div className="relative p-6 overflow-hidden">
                    <div className="absolute inset-0">
                      <div className="absolute top-0 left-0 w-32 h-32 bg-gradient-to-br from-red-100 to-orange-100 rounded-full blur-3xl opacity-30 -translate-x-8 -translate-y-8"></div>
                      <div className="absolute bottom-0 right-0 w-24 h-24 bg-gradient-to-br from-pink-100 to-red-100 rounded-full blur-2xl opacity-25 translate-x-4 translate-y-4"></div>
                    </div>
                    
                    <div className="relative z-10">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-red-100 to-red-200 rounded-2xl flex items-center justify-center">
                          <Trash2 className="w-6 h-6 text-red-600" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-slate-900">Delete Program</h3>
                          <p className="text-slate-600 text-sm">
                            Delete <span className="font-medium text-slate-800">"{program.name}"</span>?
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex gap-3">
                        <button
                          onClick={() => setDeletingProgram(null)}
                          className="flex-1 px-4 py-2.5 text-slate-700 bg-white/80 backdrop-blur-sm border border-slate-200 rounded-xl hover:bg-white hover:border-slate-300 transition-all duration-200 font-medium"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleDeleteProgram(program.id)}
                          disabled={isLoading}
                          className="flex-1 px-4 py-2.5 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl hover:from-red-600 hover:to-red-700 transition-all duration-200 disabled:opacity-50 flex items-center justify-center gap-2 font-medium shadow-lg"
                        >
                          {isLoading ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <>
                              <Trash2 className="w-4 h-4" />
                              Delete
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                // Program Card
                <div className="bg-white/95 backdrop-blur-xl rounded-3xl border border-white/20 overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-300 relative">
                  
                  {/* Floating Action Buttons - Outside clickable area */}
                  <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-all duration-300 flex gap-2 z-20">
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setEditingProgram(program);
                        setFormData({
                          name: program.name || '',
                          description: program.description || '',
                          target_population: program.target_population || '',
                          location: program.location || '',
                          goals: program.goals || '',
                          impact_metrics: program.impact_metrics || '',
                          start_date: program.start_date || '',
                          end_date: program.end_date || '',
                          status: program.status || 'Active',
                          external_url: program.external_url || '',
                          funded_by_organizations: program.funded_by_organizations || []
                        });
                        setShowForm(true);
                      }}
                      className="p-2.5 bg-white/90 backdrop-blur-sm shadow-lg border border-white/40 rounded-xl hover:bg-white hover:scale-105 transition-all duration-200"
                      title="Edit Program"
                    >
                      <Edit3 className="w-4 h-4 text-slate-600" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setDeletingProgram(program.id);
                      }}
                      className="p-2.5 bg-white/90 backdrop-blur-sm shadow-lg border border-red-200/50 rounded-xl hover:bg-red-50 hover:scale-105 transition-all duration-200"
                      title="Delete Program"
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </button>
                  </div>

                  {/* Card Content */}
                  <div
                    onClick={() => openDetailModal(program)}
                    className="p-6 cursor-pointer relative z-10"
                  >
                    {/* Header with Status */}
                    <div className="flex items-center gap-3 mb-4">
                      <div className={`w-3 h-3 rounded-full ${getStatusDot(program.status)} shadow-lg`}></div>
                      <span className="text-sm font-medium text-slate-600 capitalize">
                        {program.status || 'active'} program
                      </span>
                    </div>
                    
                    {/* Program Title */}
                    <h3 className="text-xl font-bold text-slate-900 mb-4 leading-tight group-hover:text-slate-800 transition-colors">
                      {program.name}
                    </h3>
                    
                    {/* Description */}
                    <p className="text-slate-600 text-sm mb-6 line-clamp-3 leading-relaxed">
                      {program.description}
                    </p>

                    {/* Funded By Section */}
                    {program.funded_by_organizations && program.funded_by_organizations.length > 0 && (
                      <div className="mb-6">
                        <div className="flex items-center gap-2 mb-3">
                          <Building2 className="w-4 h-4 text-slate-500" />
                          <span className="text-sm font-medium text-slate-700">Funded By</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {program.funded_by_organizations.slice(0, 3).map((funder) => (
                            <div key={funder.id} className="flex items-center gap-2 px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg">
                              {funder.image_url ? (
                                <img
                                  src={funder.image_url}
                                  alt={funder.name}
                                  className="w-4 h-4 rounded-full object-cover"
                                />
                              ) : (
                                <div className="w-4 h-4 rounded-full bg-slate-300 flex items-center justify-center">
                                  <Building2 className="w-2 h-2 text-slate-600" />
                                </div>
                              )}
                              <span className="text-xs font-medium text-slate-700 truncate max-w-20">
                                {funder.name}
                              </span>
                            </div>
                          ))}
                          {program.funded_by_organizations.length > 3 && (
                            <div className="px-2 py-1 bg-slate-100 border border-slate-200 rounded-lg">
                              <span className="text-xs text-slate-600">
                                +{program.funded_by_organizations.length - 3} more
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                    
                    {/* Key Information Cards */}
                    <div className="grid grid-cols-1 gap-4">
                      {/* Target Population */}
                      {program.target_population && (
                        <div className="bg-gradient-to-br from-purple-50/50 to-indigo-50/30 rounded-2xl p-4 border border-purple-100/50 backdrop-blur-sm">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-purple-100 rounded-xl flex items-center justify-center">
                              <Users className="w-4 h-4 text-purple-600" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <h4 className="text-xs font-semibold text-purple-700 uppercase tracking-wider mb-1">Target Population</h4>
                              <p className="text-sm text-purple-800 font-medium line-clamp-1">{program.target_population}</p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Location */}
                      {program.location && (
                        <div className="bg-gradient-to-br from-blue-50/50 to-cyan-50/30 rounded-2xl p-4 border border-blue-100/50 backdrop-blur-sm">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-blue-100 rounded-xl flex items-center justify-center">
                              <MapPin className="w-4 h-4 text-blue-600" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <h4 className="text-xs font-semibold text-blue-700 uppercase tracking-wider mb-1">Location</h4>
                              <p className="text-sm text-blue-800 font-medium line-clamp-1">{program.location}</p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Duration */}
                      {(program.start_date || program.end_date) && (
                        <div className="bg-gradient-to-br from-emerald-50/50 to-teal-50/30 rounded-2xl p-4 border border-emerald-100/50 backdrop-blur-sm">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-emerald-100 rounded-xl flex items-center justify-center">
                              <Calendar className="w-4 h-4 text-emerald-600" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <h4 className="text-xs font-semibold text-emerald-700 uppercase tracking-wider mb-1">Duration</h4>
                              <p className="text-sm text-emerald-800 font-medium">
                                {program.start_date && new Date(program.start_date).toLocaleDateString('en-US', { 
                                  month: 'short', 
                                  day: 'numeric',
                                  year: 'numeric' 
                                })}
                                {program.start_date && program.end_date && ' — '}
                                {program.end_date && new Date(program.end_date).toLocaleDateString('en-US', { 
                                  month: 'short', 
                                  day: 'numeric',
                                  year: 'numeric' 
                                })}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Impact Metrics */}
                      {program.impact_metrics && (
                        <div className="bg-gradient-to-br from-amber-50/50 to-orange-50/30 rounded-2xl p-4 border border-amber-100/50 backdrop-blur-sm">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-amber-100 rounded-xl flex items-center justify-center">
                              <Target className="w-4 h-4 text-amber-600" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <h4 className="text-xs font-semibold text-amber-700 uppercase tracking-wider mb-1">Impact Metrics</h4>
                              <p className="text-sm text-amber-800 font-medium line-clamp-2">{program.impact_metrics}</p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        /* Empty State */
        <div className="text-center py-20">
          <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <Target className="w-10 h-10 text-white" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-4">No Programs Yet</h3>
          <p className="text-gray-600 mb-8 max-w-md mx-auto">
            Get started by adding your first program to showcase your organization's impactful initiatives.
          </p>
          
          {canEdit && (
            <button
              onClick={openAddForm}
              className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-2xl hover:from-blue-700 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 font-medium text-lg shadow-xl"
            >
              <Plus className="w-5 h-5 inline mr-2" />
              Add Your First Program
            </button>
          )}
        </div>
      )}

      {/* Add/Edit Program Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
            {/* Header with organic gradient */}
            <div className="relative overflow-hidden">
              {/* Organic background shapes */}
              <div className="absolute inset-0">
                <div className="absolute top-0 left-0 w-64 h-64 bg-gradient-to-br from-blue-200/40 to-indigo-200/40 rounded-full blur-3xl -translate-x-16 -translate-y-16"></div>
                <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-br from-purple-200/30 to-pink-200/30 rounded-full blur-2xl translate-x-8 -translate-y-8"></div>
                <div className="absolute bottom-0 left-1/3 w-56 h-56 bg-gradient-to-br from-indigo-200/25 to-cyan-200/25 rounded-full blur-3xl -translate-y-12"></div>
              </div>
              
              {/* Header content */}
              <div className="relative z-10 p-8">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900">
                      {editingProgram ? 'Edit Program' : 'Add New Program'}
                    </h2>
                    <p className="text-slate-600 mt-1">
                      {editingProgram ? 'Update program details' : 'Create a new program for your organization'}
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    {!editingProgram && (
                      <button
                        onClick={autofillSample}
                        className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-500 to-blue-600 text-white rounded-xl hover:from-purple-600 hover:to-blue-700 transition-all duration-200 shadow-lg hover:scale-105 font-medium"
                      >
                        <Zap className="w-4 h-4" />
                        Autofill Sample
                      </button>
                    )}
                    
                    <button
                      onClick={() => setShowForm(false)}
                      className="p-2.5 bg-white/80 backdrop-blur-sm border border-white/30 rounded-xl hover:bg-white/90 transition-all duration-200 shadow-lg text-slate-700"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Form Content */}
            <div className="p-8 overflow-y-auto max-h-[60vh]">
              <div className="space-y-6">
                {/* Program Name */}
                <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-2">
                    Program Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    placeholder="Enter program name"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-2">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={4}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 resize-none"
                    placeholder="Describe what this program does and its purpose"
                  />
                </div>

                {/* Funded By Organizations */}
                <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-2">
                    Funded By
                  </label>
                  <OrganizationSearch
                    selectedOrganizations={formData.funded_by_organizations}
                    onOrganizationsChange={(orgs) => setFormData({ ...formData, funded_by_organizations: orgs })}
                    placeholder="Search for funding organizations..."
                    maxSelections={5}
                  />
                </div>

                {/* Two-column layout for smaller fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Target Population */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-900 mb-2">
                      Target Population
                    </label>
                    <input
                      type="text"
                      value={formData.target_population}
                      onChange={(e) => setFormData({ ...formData, target_population: e.target.value })}
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      placeholder="Who does this program serve?"
                    />
                  </div>

                  {/* Location */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-900 mb-2">
                      Location
                    </label>
                    <input
                      type="text"
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      placeholder="Where is this program located?"
                    />
                  </div>

                  {/* Start Date */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-900 mb-2">
                      Start Date
                    </label>
                    <input
                      type="date"
                      value={formData.start_date}
                      onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    />
                  </div>

                  {/* End Date */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-900 mb-2">
                      End Date
                    </label>
                    <input
                      type="date"
                      value={formData.end_date}
                      onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    />
                  </div>

                  {/* Status */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-900 mb-2">
                      Status
                    </label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    >
                      <option value="Active">Active</option>
                      <option value="Planned">Planned</option>
                      <option value="Completed">Completed</option>
                      <option value="Paused">Paused</option>
                    </select>
                  </div>

                  {/* External URL */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-900 mb-2">
                      External URL
                    </label>
                    <input
                      type="url"
                      value={formData.external_url}
                      onChange={(e) => setFormData({ ...formData, external_url: e.target.value })}
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      placeholder="https://example.org/program"
                    />
                  </div>
                </div>

                {/* Goals & Objectives */}
                <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-2">
                    Goals & Objectives
                  </label>
                  <textarea
                    value={formData.goals}
                    onChange={(e) => setFormData({ ...formData, goals: e.target.value })}
                    rows={4}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 resize-none"
                    placeholder="What are the main goals and objectives of this program?"
                  />
                </div>

                {/* Impact Metrics */}
                <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-2">
                    Impact Metrics
                  </label>
                  <textarea
                    value={formData.impact_metrics}
                    onChange={(e) => setFormData({ ...formData, impact_metrics: e.target.value })}
                    rows={4}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 resize-none"
                    placeholder="What measurable impact has this program achieved?"
                  />
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-8 border-t border-slate-200/50 bg-slate-50/30 backdrop-blur-sm">
              <div className="flex justify-between items-center">
                {/* Delete Button for Editing */}
                <div>
                  {editingProgram && (
                    <button
                      onClick={handleDeleteFromForm}
                      disabled={isLoading}
                      className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl hover:from-red-600 hover:to-red-700 transition-all duration-200 disabled:opacity-50 font-medium shadow-lg"
                    >
                      {isLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <Trash2 className="w-4 h-4" />
                          Delete Program
                        </>
                      )}
                    </button>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex gap-4">
                  <button
                    onClick={() => setShowForm(false)}
                    disabled={isLoading}
                    className="px-6 py-3 text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 hover:border-slate-300 transition-all duration-200 font-medium disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={saveProgram}
                    disabled={isLoading || !formData.name.trim()}
                    className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 disabled:opacity-50 flex items-center gap-2 font-medium shadow-lg"
                  >
                    {isLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        {editingProgram ? 'Update Program' : 'Create Program'}
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Program Detail Modal */}
      {showDetailModal && selectedProgram && (
        <ProgramDetailModal
          program={selectedProgram}
          isOpen={showDetailModal}
          onClose={() => {
            setShowDetailModal(false);
            setSelectedProgram(null);
          }}
          canEdit={canEdit}
          onEdit={(program) => {
            setEditingProgram(program);
            setFormData({
              name: program.name || '',
              description: program.description || '',
              target_population: program.target_population || '',
              location: program.location || '',
              goals: program.goals || '',
              impact_metrics: program.impact_metrics || '',
              start_date: program.start_date || '',
              end_date: program.end_date || '',
              status: program.status || 'Active',
              external_url: program.external_url || '',
              funded_by_organizations: program.funded_by_organizations || []
            });
            setShowForm(true);
          }}
        />
      )}
    </div>
  );
};

export default EditableOrganizationPrograms;