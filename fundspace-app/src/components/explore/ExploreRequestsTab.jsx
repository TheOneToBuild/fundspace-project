// fundspace-app/src/components/explore/ExploreRequestsTab.jsx
import React from 'react';
import { Search } from 'lucide-react';

const ExploreRequestsTab = ({ searchParams }) => {
  return (
    <div className="text-center py-20">
      <div className="text-gray-400 mb-4">
        <Search className="w-16 h-16 mx-auto" />
      </div>
      <h3 className="text-xl font-semibold text-gray-900 mb-2">Requests for Funds</h3>
      <p className="text-gray-600 mb-4">Content for funding requests will appear here</p>
      {searchParams?.searchQuery && (
        <p className="text-sm text-gray-500">Search: {searchParams.searchQuery}</p>
      )}
    </div>
  );
};

export default ExploreRequestsTab;