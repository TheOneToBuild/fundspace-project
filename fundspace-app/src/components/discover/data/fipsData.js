// src/components/discover/data/fipsData.js

// FIPS codes for Bay Area counties
// The key is the slug used in your app, e.g., 'alameda'
export const COUNTY_FIPS_CODES = {
    'alameda': '001',
    'contra-costa': '013',
    'marin': '041',
    'napa': '055',
    'san-francisco': '075',
    'san-mateo': '081',
    'santa-clara': '085',
    'solano': '095',
    'sonoma': '097'
};

// We only need the state FIPS code for California
export const STATE_FIPS_CODE = '06';