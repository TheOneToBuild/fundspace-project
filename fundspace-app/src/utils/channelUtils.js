// src/utils/channelUtils.js
export const CHANNEL_TYPES = {
  GLOBAL: 'hello-world',
  COMMUNITY: 'hello-community',
  ORGANIZATION_TYPE: 'org-type',
  LOCATION: 'location',
  TOPIC: 'topic'
};

export const ORGANIZATION_CHANNELS = {
  // Top-level channels
  'nonprofit': {
    id: 'nonprofit',
    name: 'Nonprofit Community',
    description: 'Connect with fellow nonprofits',
    icon: '🏛️',
    bgGradient: 'from-rose-50 to-pink-50',
    borderColor: 'border-rose-200',
    buttonColor: 'bg-rose-600 hover:bg-rose-700',
    tagColor: 'bg-rose-50 text-rose-700 border-rose-200',
    channelTag: '#nonprofit-community',
    includes: ['nonprofit.501c3', 'nonprofit.501c4', 'nonprofit.501c6', 'nonprofit.501c5', 'nonprofit.501c7', 'nonprofit.501c8', 'nonprofit.501c10', 'nonprofit.501c19']
  },
  'foundation': {
    id: 'foundation',
    name: 'Foundation Community', 
    description: 'Connect with other foundations and funders',
    icon: '💰',
    bgGradient: 'from-purple-50 to-indigo-50',
    borderColor: 'border-purple-200',
    buttonColor: 'bg-purple-600 hover:bg-purple-700',
    tagColor: 'bg-purple-50 text-purple-700 border-purple-200',
    channelTag: '#foundation-community',
    includes: ['foundation.family', 'foundation.community', 'foundation.corporate']
  },
  'education': {
    id: 'education',
    name: 'Education Community',
    description: 'Connect with educational institutions',
    icon: '🎓',
    bgGradient: 'from-blue-50 to-indigo-50',
    borderColor: 'border-blue-200', 
    buttonColor: 'bg-blue-600 hover:bg-blue-700',
    tagColor: 'bg-blue-50 text-blue-700 border-blue-200',
    channelTag: '#education-community',
    includes: ['education.university', 'education.university.research', 'education.university.teaching', 'education.university.department', 'education.university.medical', 'education.k12.district.public', 'education.k12.school.charter']
  },
  'healthcare': {
    id: 'healthcare',
    name: 'Healthcare Community',
    description: 'Connect with healthcare organizations',
    icon: '🏥',
    bgGradient: 'from-emerald-50 to-green-50',
    borderColor: 'border-emerald-200',
    buttonColor: 'bg-emerald-600 hover:bg-emerald-700', 
    tagColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    channelTag: '#healthcare-community',
    includes: ['healthcare.hospital.public', 'healthcare.clinic.fqhc', 'healthcare.mental_health.center']
  },
  'government': {
    id: 'government',
    name: 'Government Community',
    description: 'Connect with government agencies',
    icon: '🏛️',
    bgGradient: 'from-slate-50 to-gray-50',
    borderColor: 'border-slate-200',
    buttonColor: 'bg-slate-600 hover:bg-slate-700',
    tagColor: 'bg-slate-50 text-slate-700 border-slate-200', 
    channelTag: '#government-community',
    includes: ['government.federal', 'government.federal.agency', 'government.state', 'government.state.department', 'government.city', 'government.city.department']
  },
  'religious': {
    id: 'religious',
    name: 'Religious Community',
    description: 'Connect with faith-based organizations',
    icon: '⛪',
    bgGradient: 'from-amber-50 to-yellow-50',
    borderColor: 'border-amber-200',
    buttonColor: 'bg-amber-600 hover:bg-amber-700',
    tagColor: 'bg-amber-50 text-amber-700 border-amber-200',
    channelTag: '#religious-community',
    includes: ['religious.church', 'religious.church.denomination', 'religious.interfaith.council']
  },
  'forprofit': {
    id: 'forprofit',
    name: 'Social Enterprise Community', 
    description: 'Connect with for-profit social impact organizations',
    icon: '🏢',
    bgGradient: 'from-green-50 to-emerald-50',
    borderColor: 'border-green-200',
    buttonColor: 'bg-green-600 hover:bg-green-700',
    tagColor: 'bg-green-50 text-green-700 border-green-200',
    channelTag: '#social-enterprise-community',
    includes: ['forprofit.startup', 'forprofit.startup.social', 'forprofit.socialenterprise', 'forprofit.socialenterprise.bcorp', 'forprofit.corporation.csr', 'forprofit.corporation', 'forprofit.smallbusiness']
  }
};

// Helper function to determine user's channel access
export const getUserChannelAccess = (userProfile) => {
  if (!userProfile?.organization_type) return ['hello-world'];
  
  const channels = ['hello-world']; // Everyone gets global
  
  // Find which community channels user can access
  Object.entries(ORGANIZATION_CHANNELS).forEach(([channelId, channelInfo]) => {
    if (channelInfo.includes.includes(userProfile.organization_type) || 
        userProfile.organization_type.startsWith(channelId + '.')) {
      channels.push(`hello-community-${channelId}`);
    }
  });
  
  return channels;
};

// Helper to get channel info for display
export const getChannelInfo = (channelId, userProfile) => {
  if (channelId === 'hello-world') {
    return {
      id: 'hello-world',
      name: 'Hello World',
      description: 'Global community - all welcome',
      icon: '🌍',
      bgGradient: 'from-sky-50 to-blue-50',
      borderColor: 'border-sky-200',
      buttonColor: 'bg-sky-600 hover:bg-sky-700',
      tagColor: 'bg-sky-50 text-sky-700 border-sky-200',
      channelTag: '#hello-world'
    };
  }
  
  // Extract organization type from channel ID
  const orgType = channelId.replace('hello-community-', '');
  return ORGANIZATION_CHANNELS[orgType] || null;
};

// Database functions for channel filtering
export const getChannelFilterForPosts = (channelId) => {
  if (channelId === 'hello-world') {
    return { channel: 'hello-world' };
  }
  
  const orgType = channelId.replace('hello-community-', '');
  const channelInfo = ORGANIZATION_CHANNELS[orgType];
  
  if (!channelInfo) return null;
  
  return {
    channel: 'hello-community',
    organization_types: channelInfo.includes
  };
};

// News service mapping for different communities
export const getNewsServiceForChannel = (channelId) => {
  const newsMap = {
    'hello-world': 'getGlobalBreakingNews',
    'hello-community-nonprofit': 'getNonprofitNews',
    'hello-community-foundation': 'getFunderNews', 
    'hello-community-education': 'getEducationNews',
    'hello-community-healthcare': 'getHealthcareNews',
    'hello-community-government': 'getGovernmentNews',
    'hello-community-religious': 'getReligiousNews',
    'hello-community-forprofit': 'getSocialEnterpriseNews'
  };
  
  return newsMap[channelId] || 'getGlobalBreakingNews';
};