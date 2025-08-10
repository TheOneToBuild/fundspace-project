// src/components/organization-profile/north-star/constants.js - Configuration & Templates
import { 
  Target, Eye, Zap, Star, Compass, Lightbulb, Rocket, Crown, Gift,
  Heart, Shield, Handshake, Award, Globe, TrendingUp, MapPin,
  GraduationCap, Home, Leaf, Users, Building, Palette, Music, 
  Camera, Book, Coffee, Map
} from 'lucide-react';

// Comprehensive icon library for maximum flexibility
export const ICON_LIBRARY = {
  // Strategy & Vision
  Target, Eye, Zap, Star, Compass, Lightbulb, Rocket, Crown,
  // Values & Impact  
  Heart, Shield, Handshake, Award, Gift, Globe, TrendingUp,
  // Focus Areas & Location
  MapPin, GraduationCap, Home, Leaf, Users, Building,
  // Creative & Culture
  Palette, Music, Camera, Book, Coffee, Map
};

// Rich color palette with gradients and themes
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
    bg: 'from-green-50 via-emerald-50 to-teal-50', 
    border: 'border-green-200', 
    text: 'text-green-900', 
    icon: 'from-green-500 to-emerald-500',
    accent: 'bg-green-500',
    name: 'Forest'
  },
  sunset: { 
    bg: 'from-orange-50 via-red-50 to-pink-50', 
    border: 'border-orange-200', 
    text: 'text-orange-900', 
    icon: 'from-orange-500 to-red-500',
    accent: 'bg-orange-500',
    name: 'Sunset'
  },
  royal: { 
    bg: 'from-purple-50 via-violet-50 to-indigo-50', 
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

// Updated block templates (removed mission and team, added strategic elements and location)
export const BLOCK_TEMPLATES = {
  vision: {
    type: 'text',
    title: 'Our Vision',
    content: 'We envision a world where every community has access to opportunities that foster growth, equity, and sustainable prosperity for all.',
    icon: 'Eye',
    color: 'royal',
    size: 'large'
  },
  
  strategic_priorities: {
    type: 'priorities',
    title: 'Strategic Priorities',
    content: [
      {
        title: 'Community Engagement',
        description: 'Building lasting partnerships with local communities to ensure sustainable impact.',
        icon: 'Users',
        color: 'ocean'
      },
      {
        title: 'Innovation & Growth',
        description: 'Developing cutting-edge solutions that address emerging challenges.',
        icon: 'Lightbulb',
        color: 'earth'
      },
      {
        title: 'Equity & Inclusion',
        description: 'Ensuring equal access and opportunities for all community members.',
        icon: 'Heart',
        color: 'rose'
      }
    ],
    icon: 'Target',
    color: 'emerald',
    size: 'full'
  },
  
  strategic_focus: {
    type: 'text',
    title: 'Strategic Focus',
    content: 'We concentrate our efforts on high-impact initiatives that create lasting change, focusing on education, economic empowerment, and community development through evidence-based approaches.',
    icon: 'Compass',
    color: 'forest',
    size: 'large'
  },
  
  focus_areas: {
    type: 'locations',
    title: 'Focus Areas',
    content: [
      {
        location: 'San Francisco Bay Area',
        description: 'Serving 15+ communities with education and workforce development programs.',
        impact: '50,000+ residents reached'
      },
      {
        location: 'Central Valley',
        description: 'Supporting agricultural communities with sustainability initiatives.',
        impact: '200+ farms assisted'
      },
      {
        location: 'Los Angeles County',
        description: 'Youth development and mentorship programs in underserved neighborhoods.',
        impact: '5,000+ youth served'
      }
    ],
    icon: 'MapPin',
    color: 'sunset',
    size: 'full'
  },
  
  values: {
    type: 'list',
    title: 'Our Core Values',
    content: [
      'Integrity - We act with honesty and transparency in all our endeavors',
      'Innovation - We embrace creative solutions to complex challenges',
      'Impact - We measure success by the positive change we create',
      'Inclusion - We ensure everyone has a voice and a place at the table',
      'Sustainability - We build for the long-term health of our communities'
    ],
    icon: 'Heart',
    color: 'rose',
    size: 'medium'
  },
  
  impact: {
    type: 'stats',
    title: 'Our Impact',
    content: [
      { label: 'Lives Transformed', value: '25,000+' },
      { label: 'Programs Active', value: '42' },
      { label: 'Community Partners', value: '150+' },
      { label: 'Years of Service', value: '18' }
    ],
    icon: 'TrendingUp',
    color: 'forest',
    size: 'medium'
  },
  
  story: {
    type: 'text',
    title: 'Our Story',
    content: 'Founded in 2006 with a vision to bridge opportunity gaps in underserved communities, we began as a grassroots initiative led by local educators and community leaders. Today, we\'ve grown into a comprehensive organization that continues to honor our roots while expanding our reach.',
    icon: 'Book',
    color: 'earth',
    size: 'large'
  },

  approach: {
    type: 'text',
    title: 'Our Approach',
    content: 'We believe in collaborative, community-driven solutions that address root causes rather than symptoms. Our methodology combines data-driven insights with grassroots wisdom to create programs that are both effective and culturally responsive.',
    icon: 'Handshake',
    color: 'midnight',
    size: 'medium'
  }
};

// Block size configurations
export const BLOCK_SIZES = {
  small: {
    className: 'col-span-1',
    name: 'Small'
  },
  medium: {
    className: 'md:col-span-1',
    name: 'Medium'
  },
  large: {
    className: 'md:col-span-2',
    name: 'Large'
  },
  full: {
    className: 'md:col-span-3',
    name: 'Full Width'
  }
};

// Block type configurations
export const BLOCK_TYPES = {
  text: {
    name: 'Text Block',
    description: 'Rich text content for stories, descriptions, and narratives'
  },
  list: {
    name: 'List Block',
    description: 'Bulleted lists for values, principles, or key points'
  },
  stats: {
    name: 'Statistics Block',
    description: 'Numerical data and impact metrics'
  },
  priorities: {
    name: 'Strategic Priorities',
    description: 'Grid of strategic priorities with icons and descriptions'
  },
  locations: {
    name: 'Focus Areas',
    description: 'Geographic locations where you operate'
  }
};