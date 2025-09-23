// src/components/community-hub/constants.js

export const BAY_AREA_COUNTIES = {
  'alameda': { name: 'Alameda County', icon: '🌉', color: 'blue', gradient: 'from-blue-500 to-cyan-600' },
  'contra-costa': { name: 'Contra Costa County', icon: '🏔️', color: 'green', gradient: 'from-green-500 to-emerald-600' },
  'marin': { name: 'Marin County', icon: '🌲', color: 'emerald', gradient: 'from-emerald-500 to-teal-600' },
  'napa': { name: 'Napa County', icon: '🍇', color: 'purple', gradient: 'from-purple-500 to-violet-600' },
  'san-francisco': { name: 'San Francisco County', icon: '🌁', color: 'indigo', gradient: 'from-indigo-500 to-purple-600' },
  'san-mateo': { name: 'San Mateo County', icon: '🏖️', color: 'cyan', gradient: 'from-cyan-500 to-blue-600' },
  'santa-clara': { name: 'Santa Clara County', icon: '💻', color: 'rose', gradient: 'from-rose-500 to-pink-600' },
  'solano': { name: 'Solano County', icon: '🌾', color: 'amber', gradient: 'from-amber-500 to-orange-600' },
  'sonoma': { name: 'Sonoma County', icon: '🍷', color: 'red', gradient: 'from-red-500 to-rose-600' }
};

export const ORGANIZATION_CHANNELS = {
  'nonprofit': { 
    name: 'Nonprofit Community', 
    icon: '🏛️', 
    color: 'rose',
    gradient: 'from-rose-500 to-pink-600',
    channelTag: '#nonprofit-community',
    dbChannel: 'nonprofit-community'
  },
  'foundation': { 
    name: 'Foundation Community', 
    icon: '💰',
    color: 'purple',
    gradient: 'from-purple-500 to-violet-600',
    channelTag: '#foundation-community',
    dbChannel: 'foundation-community'
  },
  'education': { 
    name: 'Education Community', 
    icon: '🎓',
    color: 'blue',
    gradient: 'from-blue-500 to-indigo-600',
    channelTag: '#education-community',
    dbChannel: 'education-community'
  },
  'healthcare': { 
    name: 'Healthcare Community', 
    icon: '🏥',
    color: 'emerald',
    gradient: 'from-emerald-500 to-teal-600',
    channelTag: '#healthcare-community',
    dbChannel: 'healthcare-community'
  },
  'government': { 
    name: 'Government Community', 
    icon: '🏛️',
    color: 'slate',
    gradient: 'from-slate-500 to-gray-600',
    channelTag: '#government-community',
    dbChannel: 'government-community'
  },
  'religious': { 
    name: 'Religious Community', 
    icon: '⛪',
    color: 'amber',
    gradient: 'from-amber-500 to-yellow-600',
    channelTag: '#religious-community',
    dbChannel: 'religious-community'
  },
  'forprofit': { 
    name: 'Social Enterprise Community', 
    icon: '🏢',
    color: 'green',
    gradient: 'from-green-500 to-emerald-600',
    channelTag: '#social-enterprise-community',
    dbChannel: 'forprofit-community'
  }
};

export const POSTS_PER_PAGE = 10;

export const getOrgBaseType = (organizationType) => {
  if (!organizationType) return null;
  return organizationType.split('.')[0].toLowerCase();
};