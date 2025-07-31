// src/components/organization-profile/OrganizationGrants.jsx
import React, { useState, useEffect } from 'react';
import { DollarSign, MapPin, Calendar, ExternalLink, Filter, Search, Plus } from 'lucide-react';
import { supabase } from '../../supabaseClient.js';
import GrantCard from '../GrantCard.jsx';
import GrantDetailModal from '../../GrantDetailModal.jsx';
import { hasPermission, PERMISSIONS } from '../../utils/organizationPermissions.js';

const OrganizationGrants = ({ organization, userMembership, session }) => {
  const [grants, setGrants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedGrant, setSelectedGrant] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Check if user can manage grants (must be admin/super_admin)
  const canManageGrants = userMembership && hasPermission(
    userMembership.role, 
    PERMISSIONS.EDIT_ORGANIZATION, 
    session?.user?.is_omega_admin
  );

  useEffect(() => {
    const fetchOrganizationGrants = async () => {
      if (!organization?.name) {
        setLoading(false);
        return;
      }
      
      setLoading(true);
      setError(null);
      
      try {
        const { data, error } = await supabase
          .from('grants')
          .select('*')
          .eq('foundation_name', organization.name)
          .order('due_date', { ascending: true });

        if (error) {
          console.error('Supabase error:', error);
          throw error;
        }

        // Format grants for display - data could be empty array, that's fine
        const formattedGrants = (data || []).map(grant => ({
          ...grant,
          foundationName: grant.foundation_name,
          fundingAmount: grant.funding_amount_text,
          dueDate: grant.due_date,
          dateAdded: grant.date_added,
          grantType: grant.grant_type,
          startDate: grant.start_date,
        }));

        setGrants(formattedGrants);
      } catch (err) {
        console.error('Error fetching organization grants:', err);
        // Only set error for actual failures, not empty results
        setError('Failed to load grants. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchOrganizationGrants();
  }, [organization?.name]);

  // Filter grants based on search and filters
  const filteredGrants = grants.filter(grant => {
    const matchesSearch = searchTerm === '' || 
      grant.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      grant.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = categoryFilter === '' || grant.category === categoryFilter;
    const matchesStatus = statusFilter === '' || grant.status === statusFilter;
    
    return matchesSearch && matchesCategory && matchesStatus;
  });

  // Get unique categories and statuses for filters
  const uniqueCategories = [...new Set(grants.map(g => g.category).filter(Boolean))].sort();
  const uniqueStatuses = [...new Set(grants.map(g => g.status).filter(Boolean))].sort();

  const handleGrantClick = (grant) => {
    setSelectedGrant(grant);
    setIsDetailModalOpen(true);
  };

  const handleCloseModal = () => {
    setSelectedGrant(null);
    setIsDetailModalOpen(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading grants...</p>
        </div>
      </div>
    );
  }

  // Always show empty state if no grants, never show error to user
  if (grants.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
        <DollarSign className="w-16 h-16 mx-auto text-slate-300 mb-4" />
        <h3 className="text-xl font-medium text-slate-900 mb-2">No Active Grants</h3>
        <p className="text-slate-600 mb-8">
          {canManageGrants 
            ? `${organization?.name} hasn't posted any grant opportunities yet. Create your first grant to start funding impactful projects.`
            : `${organization?.name} doesn't have any active grant opportunities at the moment. Check back soon for new funding opportunities.`
          }
        </p>
        
        {canManageGrants && (
          <button className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors shadow-lg hover:shadow-xl">
            <Plus className="w-5 h-5" />
            Create First Grant
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 mb-3">Grant Opportunities</h2>
          <p className="text-slate-600 text-lg">
            Current funding opportunities from {organization?.name}
          </p>
        </div>
        
        {canManageGrants && (
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            <Plus className="w-4 h-4" />
            Add Grant
          </button>
        )}
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search grants..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">All Categories</option>
            {uniqueCategories.map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
          
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">All Statuses</option>
            {uniqueStatuses.map(status => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>
        </div>
        
        {/* Results count */}
        <div className="mt-4 text-sm text-slate-600">
          {filteredGrants.length === grants.length 
            ? `Showing all ${grants.length} grant${grants.length !== 1 ? 's' : ''}`
            : `Showing ${filteredGrants.length} of ${grants.length} grant${grants.length !== 1 ? 's' : ''}`
          }
        </div>
      </div>

      {/* Grants Grid */}
      {filteredGrants.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredGrants.map((grant) => (
            <GrantCard
              key={grant.id}
              grant={grant}
              onClick={() => handleGrantClick(grant)}
              showFoundation={false} // Don't show foundation name since we're on their page
            />
          ))}
        </div>
      ) : (
        <div className="bg-slate-50 rounded-xl p-12 text-center">
          <Filter className="w-12 h-12 mx-auto text-slate-300 mb-4" />
          <h3 className="text-lg font-medium text-slate-900 mb-2">No Matching Grants</h3>
          <p className="text-slate-600">
            Try adjusting your search terms or filters to find more grants.
          </p>
          <button
            onClick={() => {
              setSearchTerm('');
              setCategoryFilter('');
              setStatusFilter('');
            }}
            className="mt-4 text-blue-600 hover:text-blue-700 font-medium"
          >
            Clear all filters
          </button>
        </div>
      )}

      {/* Grant Detail Modal */}
      {selectedGrant && (
        <GrantDetailModal
          grant={selectedGrant}
          isOpen={isDetailModalOpen}
          onClose={handleCloseModal}
          session={session}
        />
      )}
    </div>
  );
};

export default OrganizationGrants;