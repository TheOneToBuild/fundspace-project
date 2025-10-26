// fundspace-app/src/components/explore/ExploreGrantsTab.jsx
import React, { useMemo } from 'react';
import GrantsPageContent from '../../GrantsPageContent';

const ExploreGrantsTab = ({ searchParams }) => {
  // Create stable filter object to prevent unnecessary re-renders
  const filterProps = useMemo(() => ({
    searchTerm: searchParams?.searchTerm || '',
    locationFilter: searchParams?.locationFilter || [],
    categoryFilter: searchParams?.categoryFilter || [],
    grantStatusFilter: searchParams?.grantStatusFilter || '',
    grantTypeFilter: searchParams?.grantTypeFilter || '',
    sortCriteria: searchParams?.sortCriteria || 'dueDate_asc'
  }), [searchParams]);

  return (
    <div>
      <GrantsPageContent 
        isProfileView={true} 
        isExploreTab={true}
        hideFilterBar={true}
        initialFilters={filterProps}
      />
    </div>
  );
};

export default ExploreGrantsTab;