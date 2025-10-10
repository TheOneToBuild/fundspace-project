import React from 'react';
import ExploreOrganizations from '../../ExploreOrganizations';

const ExploreOrganizationsTab = ({ searchParams }) => {
  // The ExploreOrganizations component has its own internal state management
  // for filters and search. For this integrated view, we can pass down
  // the initial search query from the main ExplorePage search bar.
  // We'll need to adapt ExploreOrganizations to accept these as initial props.
  // For now, we can render it and it will use its own state.

  // A more advanced implementation would involve lifting state or using context
  // if you want the main search bar to *continuously* control the child component's filters.

  // For now, we'll just render the component. It's already a full-featured page.
  // We can pass `isProfileView={true}` to get a more compact layout suitable for a tab.
  return (
    <div>
      <ExploreOrganizations isProfileView={true} />
    </div>
  );
};

export default ExploreOrganizationsTab;