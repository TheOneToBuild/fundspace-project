// src/components/organization-profile/OrganizationPrograms.jsx
import React, { useState, useEffect } from 'react';
import { ClipboardList, MapPin, Users, Target, Calendar, ExternalLink, Plus, Edit3, Eye, Building2 } from 'lucide-react';
import { supabase } from '../../supabaseClient.js';
import ProgramDetailModal from './ProgramDetailModal.jsx';

const OrganizationPrograms = ({ 
  organization, 
  session, 
  userMembership, 
  isEditMode = false 
}) => {
  const [programs, setPrograms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedProgram, setSelectedProgram] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

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
        .eq('is_active', true)
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

      setPrograms(programsWithFunding);
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
      {/* Header */}
      <div className="text-center mb-12">
        <h2 className="text-4xl font-bold text-slate-900 mb-4">Our Programs</h2>
        <p className="text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
          Discover the impactful programs and initiatives that drive {organization?.name}'s mission forward
        </p>
        
        {/* Edit Button for Authorized Users */}
        {canEdit && isEditMode && (
          <div className="mt-8">
            <button className="inline-flex items-center gap-3 px-6 py-3 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors shadow-lg hover:shadow-xl">
              <Edit3 className="w-5 h-5" />
              Manage Programs
            </button>
          </div>
        )}
      </div>

      {/* Programs Grid */}
      {programs.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {programs.map((program) => (
            <div
              key={program.id}
              onClick={() => openDetailModal(program)}
              className="group relative overflow-hidden transition-all duration-300 hover:scale-[1.02] cursor-pointer"
            >
              {/* Program Card */}
              <div className="bg-white/95 backdrop-blur-xl rounded-3xl border border-white/20 overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-300 relative">
                
                {/* Card Content */}
                <div className="p-6 relative z-10">
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
                
                {/* Hover Indicator */}
                <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-all duration-300">
                  <div className="p-2 bg-white/90 backdrop-blur-sm shadow-lg border border-white/40 rounded-xl">
                    <Eye className="w-4 h-4 text-slate-600" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Empty State */
        <div className="text-center py-20">
          <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <ClipboardList className="w-10 h-10 text-white" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-4">No Programs Yet</h3>
          <p className="text-gray-600 mb-8 max-w-md mx-auto">
            {organization?.name} hasn't added any programs yet. Check back soon to see their impactful initiatives.
          </p>
          
          {/* Show "Add Programs" button only if in global edit mode AND can edit */}
          {canEdit && isEditMode && (
            <button className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-2xl hover:from-blue-700 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 font-medium text-lg shadow-xl">
              <Plus className="w-5 h-5 inline mr-2" />
              Add Your First Program
            </button>
          )}
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
          canEdit={false}
        />
      )}
    </div>
  );
};

export default OrganizationPrograms;