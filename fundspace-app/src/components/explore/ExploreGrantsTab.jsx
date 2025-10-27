// fundspace-app/src/components/explore/ExploreGrantsTab.jsx
import React, { useMemo } from 'react';
import GrantsPageContent from '../../GrantsPageContent';

const ExploreGrantsTab = ({ searchParams }) => {
  // Pass the current filter config directly
  const filterConfig = useMemo(() => ({
    searchTerm: searchParams?.searchTerm || '',
    locationFilter: searchParams?.locationFilter || [],
    categoryFilter: searchParams?.categoryFilter || [],
    grantStatusFilter: searchParams?.grantStatusFilter || 'active',
    grantTypeFilter: searchParams?.grantTypeFilter || '',
    sortCriteria: searchParams?.sortCriteria || 'dueDate_asc',
    viewMode: searchParams?.viewMode || 'grid' // Add this line
  }), [searchParams]);

  return (
    <div>
      <GrantsPageContent 
        isProfileView={true} 
        isExploreTab={true}
        hideFilterBar={true}
        externalFilterConfig={filterConfig}
        onFilterChange={searchParams?.onFilterChange}
        viewMode={searchParams?.viewMode}
        // Pass the categories and other data from parent
        availableCategories={searchParams?.uniqueGrantCategories || []}
        uniqueGrantLocations={searchParams?.uniqueGrantLocations || []}
        uniqueGrantTypes={searchParams?.uniqueGrantTypes || []}
        allGrants={searchParams?.allGrants || []}
      />
    </div>
  );
};

export default ExploreGrantsTab;