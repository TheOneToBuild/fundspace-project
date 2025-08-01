// src/components/organization-profile/OrganizationGrantsFixed.jsx
import React, { useState, useEffect } from 'react';
import { DollarSign, Plus, Search, Filter } from 'lucide-react';
import { supabase } from '../../supabaseClient.js';
import GrantCard from '../GrantCard.jsx';
import GrantDetailModal from '../../GrantDetailModal.jsx';

const OrganizationGrantsFixed = ({ organization, userMembership, session }) => {
  const [grants, setGrants] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGrant, setSelectedGrant] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  useEffect(() => {
    const fetchGrants = async () => {
      if (!organization?.id) {
        console.log('OrganizationGrantsFixed: No organization ID');
        setGrants([]);
        return;
      }

      console.log('OrganizationGrantsFixed: Fetching for org ID:', organization.id);
      setLoading(true);

      try {
        // CORRECT QUERY: Using organization_id, NOT foundation_name
        const { data, error } = await supabase
          .from('grants')
          .select('*')
          .eq('organization_id', organization.id)
          .order('deadline', { ascending: true });

        console.log('OrganizationGrantsFixed: Result:', { data, error });

        if (error) {
          console.error('OrganizationGrantsFixed: Error:', error);
          setGrants([]);
          return;
        }

        const formatted = (data || []).map(grant => ({
          ...grant,
          foundationName: organization.name,
          fundingAmount: grant.funding_amount_text,
          dueDate: grant.deadline,
          dateAdded: grant.date_added,
          grantType: grant.grant_type,
          startDate: grant.start_date,
          // Add organization data for GrantCard
          organization: {
            image_url: organization.image_url,
            banner_image_url: organization.banner_image_url
          },
          funderSlug: organization.slug
        }));

        console.log('OrganizationGrantsFixed: Found', formatted.length, 'grants');
        setGrants(formatted);

      } catch (err) {
        console.error('OrganizationGrantsFixed: Catch error:', err);
        setGrants([]);
      } finally {
        setLoading(false);
      }
    };

    fetchGrants();
  }, [organization?.id]);

  const handleGrantClick = (grant) => {
    setSelectedGrant(grant);
    setIsDetailModalOpen(true);
  };

  const handleCloseModal = () => {
    setSelectedGrant(null);
    setIsDetailModalOpen(false);
  };

  const handleSave = (grantId) => {
    // TODO: Implement save functionality
    console.log('Save grant:', grantId);
  };

  const handleUnsave = (grantId) => {
    // TODO: Implement unsave functionality
    console.log('Unsave grant:', grantId);
  };

  const handleFilterByCategory = (category) => {
    // TODO: Implement category filtering
    console.log('Filter by category:', category);
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

  if (grants.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
        <DollarSign className="w-16 h-16 mx-auto text-slate-300 mb-4" />
        <h3 className="text-xl font-medium text-slate-900 mb-2">No Active Grants</h3>
        <p className="text-slate-600 mb-8">
          {organization?.name} doesn't have any active grant opportunities at the moment. Check back soon for new funding opportunities.
        </p>
      </div>
    );
  }

  // Filter grants based on search
  const filteredGrants = grants.filter(grant => 
    searchTerm === '' || 
    grant.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    grant.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search grants..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div className="mt-4 text-sm text-slate-600">
          {filteredGrants.length === grants.length 
            ? `Showing all ${grants.length} grant${grants.length !== 1 ? 's' : ''}`
            : `Showing ${filteredGrants.length} of ${grants.length} grant${grants.length !== 1 ? 's' : ''}`
          }
        </div>
      </div>

      {/* Grants Grid using GrantCard */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredGrants.map((grant) => (
          <GrantCard
            key={grant.id}
            grant={grant}
            onOpenDetailModal={handleGrantClick}
            onFilterByCategory={handleFilterByCategory}
            onSave={handleSave}
            onUnsave={handleUnsave}
            isSaved={false} // TODO: Implement saved state
            session={session}
            userOrganizationType={session?.user?.organization_type}
          />
        ))}
      </div>

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

export default OrganizationGrantsFixed;