// src/components/organization-profile/north-star/constants.js
import {
  Star, Target, Eye, Heart, TrendingUp, Users, Book, MapPin, Focus, Compass,
  Award, Globe, Lightbulb, Shield, Zap, Crown, Rocket, Diamond, Flame, 
  Mountain, TreePine, Building, Calendar, Clock, Home, Move
} from 'lucide-react';

// Icon library for blocks
export const ICON_LIBRARY = {
  Star, Target, Eye, Heart, TrendingUp, Users, Book, MapPin, Focus, Compass,
  Award, Globe, Lightbulb, Shield, Zap, Crown, Rocket, Diamond, Flame,
  Mountain, TreePine, Building, Calendar, Clock, Home, Move
};

// Color themes for blocks
export const COLOR_THEMES = {
  ocean: { 
    bg: 'from-blue-50 via-cyan-50 to-blue-50', 
    border: 'border-blue-200', 
    text: 'text-blue-900', 
    icon: 'from-blue-500 to-cyan-500',
    accent: 'bg-blue-500',
    name: 'Ocean'
  },
  forest: { 
    bg: 'from-green-50 via-emerald-50 to-green-50', 
    border: 'border-green-200', 
    text: 'text-green-900', 
    icon: 'from-green-500 to-emerald-500',
    accent: 'bg-green-500',
    name: 'Forest'
  },
  sunset: { 
    bg: 'from-orange-50 via-red-50 to-orange-50', 
    border: 'border-orange-200', 
    text: 'text-orange-900', 
    icon: 'from-orange-500 to-red-500',
    accent: 'bg-orange-500',
    name: 'Sunset'
  },
  royal: { 
    bg: 'from-purple-50 via-indigo-50 to-purple-50', 
    border: 'border-purple-200', 
    text: 'text-purple-900', 
    icon: 'from-purple-500 to-indigo-500',
    accent: 'bg-purple-500',
    name: 'Royal'
  },
  earth: { 
    bg: 'from-amber-50 via-yellow-50 to-orange-50', 
    border: 'border-amber-200', 
    text: 'text-amber-900', 
    icon: 'from-amber-500 to-orange-500',
    accent: 'bg-amber-500',
    name: 'Earth'
  },
  midnight: { 
    bg: 'from-slate-50 via-gray-50 to-slate-50', 
    border: 'border-slate-200', 
    text: 'text-slate-900', 
    icon: 'from-slate-500 to-gray-500',
    accent: 'bg-slate-500',
    name: 'Midnight'
  },
  rose: {
    bg: 'from-rose-50 via-pink-50 to-rose-50',
    border: 'border-rose-200',
    text: 'text-rose-900',
    icon: 'from-rose-500 to-pink-500',
    accent: 'bg-rose-500',
    name: 'Rose'
  },
  emerald: {
    bg: 'from-emerald-50 via-teal-50 to-emerald-50',
    border: 'border-emerald-200',
    text: 'text-emerald-900',
    icon: 'from-emerald-500 to-teal-500',
    accent: 'bg-emerald-500',
    name: 'Emerald'
  }
};

// Hero background themes
export const HERO_BACKGROUNDS = {
  ocean: {
    bg: 'from-blue-600 via-cyan-600 to-blue-700',
    name: 'Ocean'
  },
  forest: {
    bg: 'from-green-600 via-emerald-600 to-green-700',
    name: 'Forest'
  },
  sunset: {
    bg: 'from-orange-500 via-red-500 to-pink-600',
    name: 'Sunset'
  },
  royal: {
    bg: 'from-purple-600 via-indigo-600 to-purple-700',
    name: 'Royal'
  },
  earth: {
    bg: 'from-amber-600 via-orange-600 to-red-600',
    name: 'Earth'
  },
  midnight: {
    bg: 'from-slate-700 via-gray-800 to-slate-900',
    name: 'Midnight'
  }
};

// Updated block templates (added mission, long-term/short-term goals)
export const BLOCK_TEMPLATES = {
  mission: {
    type: 'text',
    title: 'Our Mission',
    content: 'We are dedicated to creating lasting positive change in our community by addressing systemic inequities and empowering individuals and families to thrive. Through strategic partnerships, innovative programs, and community-led solutions, we work to build a more just and equitable society where everyone has the opportunity to reach their full potential.',
    icon: 'Target',
    color: 'ocean',
    size: 'large'
  },
  vision: {
    type: 'text',
    title: 'Our Vision',
    content: 'We envision a world where every community has access to opportunities that enable individuals and families to thrive. Through collaborative partnerships and innovative programs, we work toward sustainable change that addresses root causes and creates lasting impact.',
    icon: 'Eye',
    color: 'royal',
    size: 'large'
  },
  values: {
    type: 'list',
    title: 'Our Core Values',
    content: [
      'Equity & Justice - We believe everyone deserves equal opportunities to succeed',
      'Community Partnership - We work with communities, not for them', 
      'Innovation - We embrace creative solutions to complex challenges',
      'Transparency - We operate with openness and accountability',
      'Collaboration - We achieve more when we work together'
    ],
    icon: 'Heart',
    color: 'rose',
    size: 'medium'
  },
  long_term_goals: {
    type: 'list',
    title: 'Long-Term Goals (5-10 Years)',
    content: [
      'Achieve measurable reduction in regional inequality gaps',
      'Establish sustainable funding models for community programs',
      'Build a network of 500+ community partners',
      'Create generational wealth-building programs',
      'Develop replicable models for other regions'
    ],
    icon: 'Mountain',
    color: 'forest',
    size: 'medium'
  },
  short_term_goals: {
    type: 'list',
    title: 'Short-Term Goals (1-2 Years)',
    content: [
      'Launch three new community health initiatives',
      'Increase annual grant distribution by 25%',
      'Expand digital literacy programs to 10 new locations',
      'Complete strategic partnership with local government',
      'Achieve 90% participant satisfaction in all programs'
    ],
    icon: 'Calendar',
    color: 'sunset',
    size: 'medium'
  },
  strategic_priorities: {
    type: 'list',
    title: 'Strategic Priorities',
    content: [
      'Education Equity - Ensuring all children have access to quality education',
      'Economic Mobility - Creating pathways to financial stability and wealth building',
      'Community Health - Addressing health disparities and promoting wellness',
      'Civic Engagement - Strengthening democracy through increased participation',
      'Environmental Justice - Protecting communities from environmental harm'
    ],
    icon: 'Target',
    color: 'forest',
    size: 'large'
  },
  strategic_focus: {
    type: 'text',
    title: 'Strategic Focus Areas',
    content: 'Our work is concentrated in three key areas that create the greatest impact for our community. We focus on systemic change through education reform, economic development initiatives, and community health programs. Each area is designed to address root causes while building long-term capacity for sustainable change.',
    icon: 'Focus',
    color: 'ocean',
    size: 'medium'
  },
  focus_areas_location: {
    type: 'list',
    title: 'Geographic Focus Areas',
    content: [
      'East Bay Region - Oakland, Berkeley, Richmond, and surrounding communities',
      'Rural Northern California - Supporting underserved agricultural communities',
      'Central Valley - Addressing urban and rural disparities',
      'Bay Area Partnerships - Collaborative initiatives across the greater Bay Area'
    ],
    icon: 'MapPin',
    color: 'earth',
    size: 'medium'
  },
  impact: {
    type: 'stats',
    title: 'Our Impact (2024)',
    content: [
      { label: 'Lives Impacted', value: '50,000+' },
      { label: 'Partner Organizations', value: '200+' },
      { label: 'Grants Awarded', value: '$15M' },
      { label: 'Programs Supported', value: '85' }
    ],
    icon: 'TrendingUp',
    color: 'forest',
    size: 'medium'
  },
  story: {
    type: 'text',
    title: 'Our Story',
    content: 'Founded in 1953, the East Bay Community Foundation emerged from a simple belief that communities thrive when neighbors invest in each other. What started as a small group of local philanthropists has grown into one of the largest community foundations in Northern California, managing over $500 million in assets and distributing more than $80 million annually to support community-led solutions.',
    icon: 'Book',
    color: 'earth',
    size: 'large'
  },
  approach: {
    type: 'text',
    title: 'Our Approach',
    content: 'We believe lasting change happens when communities lead the way. Our approach is rooted in trust-based philanthropy, centering the voices and leadership of those most impacted by the issues we aim to address. We provide flexible funding, capacity-building support, and advocacy to amplify community-driven solutions.',
    icon: 'Compass',
    color: 'royal',
    size: 'medium'
  },
  partnerships: {
    type: 'text',
    title: 'Community Partnerships',
    content: 'Strong partnerships are the foundation of our work. We collaborate with grassroots organizations, established nonprofits, government agencies, businesses, and individual donors to create a network of support that strengthens our entire community. Together, we leverage resources, share knowledge, and amplify impact.',
    icon: 'Users',
    color: 'emerald',
    size: 'medium'
  },
  innovation: {
    type: 'text',
    title: 'Innovation & Learning',
    content: 'We embrace experimentation and learning as pathways to greater impact. Our commitment to innovation means we continuously evaluate our strategies, adapt to changing community needs, and invest in emerging solutions that show promise for creating sustainable change.',
    icon: 'Lightbulb',
    color: 'sunset',
    size: 'medium'
  }
};

// Size options for blocks
export const BLOCK_SIZES = {
  small: { label: 'Small', cols: 'col-span-1' },
  medium: { label: 'Medium', cols: 'md:col-span-1' },
  large: { label: 'Large', cols: 'md:col-span-2' },
  full: { label: 'Full Width', cols: 'md:col-span-3' }
};