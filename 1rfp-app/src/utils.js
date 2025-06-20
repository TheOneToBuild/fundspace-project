// src/utils.js

export const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  const options = { year: 'numeric', month: 'long', day: 'numeric' };
  // Add timeZone to ensure date is parsed correctly regardless of user's timezone
  return new Date(dateString + 'T00:00:00').toLocaleDateString(undefined, options);
};

// NEW FUNCTION: Formats funding amounts for display
export const formatFundingDisplay = (amountValue) => {
  // Handles cases like "Not specified", "Varies", etc.
  if (typeof amountValue === 'string' && isNaN(parseFloat(amountValue))) {
    return amountValue;
  }
  
  const amount = parseFloat(amountValue);
  
  // If the value is null, undefined, or not a number, return 'Not specified'
  if (isNaN(amount)) {
    return 'Not specified';
  }

  // If amount is 1 million or more, format as $X.XM
  if (amount >= 1000000) {
    const millions = amount / 1000000;
    // Format to one decimal place, but remove .0 if it's a whole number (e.g., $5M not $5.0M)
    const formattedMillions = millions.toFixed(1).replace(/\.0$/, '');
    return `$${formattedMillions}M`;
  }

  // For amounts less than 1 million, format with commas
  return `$${amount.toLocaleString()}`;
};


export const parseFundingAmount = (amountString) => {
  if (typeof amountString !== 'string') return 0;
  if (amountString.toLowerCase().includes('significant')) return Infinity;
  const numbers = amountString.match(/\d[\d,.]*/g);
  if (!numbers) return 0;
  const parsed = numbers.map((n) => parseFloat(n.replace(/,/g, ''))).filter((n) => !isNaN(n));
  return parsed.length ? Math.min(...parsed) : 0;
};

export const parseMinFundingAmount = (amountString) => {
  if (typeof amountString !== 'string') return 0;
  const cleanedAmount = amountString.toLowerCase().replace('up to', '').trim();
  const numbers = cleanedAmount.match(/\d[\d,.]*/g);

  if (!numbers || numbers.length === 0) return 0;

  const parsedNumbers = numbers.map(n => parseFloat(n.replace(/,/g, ''))).filter(n => !isNaN(n));
  if (parsedNumbers.length === 0) return 0;

  return Math.min(...parsedNumbers);
};

export const parseMaxFundingAmount = (amountString) => {
  if (typeof amountString !== 'string') return 0;
  if (amountString.toLowerCase().includes('significant')) return Infinity;

  const cleanedAmount = amountString.toLowerCase().replace('up to', '').trim();
  const numbers = cleanedAmount.match(/\d[\d,.]*/g);

  if (!numbers) return 0;

  const parsedNumbers = numbers.map(n => parseFloat(n.replace(/,/g, ''))).filter(n => !isNaN(n));

  if (parsedNumbers.length === 0) return 0;
  return Math.max(...parsedNumbers);
};

export const parseNonprofitBudgetRange = (budgetString) => {
  if (typeof budgetString !== 'string') return { min: 0, max: 0 };
  const cleanedBudget = budgetString.toLowerCase().replace(/[$,]/g, '').trim();
  const numbers = cleanedBudget.match(/\d+\.?\d*[mk]*/g);

  if (!numbers || numbers.length === 0) return { min: 0, max: 0 };

  const parseNumberWithSuffix = (numStr) => {
    if (numStr.includes('m')) {
      return parseFloat(numStr.replace('m', '')) * 1000000;
    }
    if (numStr.includes('k')) {
      return parseFloat(numStr.replace('k', '')) * 1000;
    }
    return parseFloat(numStr);
  };

  const parsedNumbers = numbers.map(parseNumberWithSuffix).filter(n => !isNaN(n));

  if (parsedNumbers.length === 0) return { min: 0, max: 0 };

  if (parsedNumbers.length === 1) {
    return { min: parsedNumbers[0], max: parsedNumbers[0] };
  }

  return { min: Math.min(...parsedNumbers), max: Math.max(...parsedNumbers) };
};

const pillClassMap = {
    'health': 'bg-green-100 text-green-800 border border-green-200',
    'education': 'bg-blue-100 text-blue-800 border border-blue-200',
    'environment': 'bg-teal-100 text-teal-800 border border-teal-200',
    'arts & culture': 'bg-purple-100 text-purple-800 border border-purple-200',
    'arts': 'bg-purple-100 text-purple-800 border border-purple-200',
    'housing': 'bg-amber-100 text-amber-800 border border-amber-200',
    'social services': 'bg-indigo-100 text-indigo-800 border border-indigo-200',
    'community development': 'bg-pink-100 text-pink-800 border border-pink-200',
    'equity': 'bg-rose-100 text-rose-800 border border-rose-200',
    'innovation': 'bg-cyan-100 text-cyan-800 border border-cyan-200',
    'public health': 'bg-lime-100 text-lime-800 border border-lime-200',
    'homelessness': 'bg-orange-100 text-orange-800 border border-orange-200',
    'technology': 'bg-slate-200 text-slate-800 border border-slate-300',
    'default': 'bg-slate-100 text-slate-700 border border-slate-200'
};

export const getPillClasses = (category) => {
    if (!category) return pillClassMap.default;
    const lowerCategory = category.toLowerCase();

    for (const key in pillClassMap) {
        if (lowerCategory.includes(key)) {
            return pillClassMap[key];
        }
    }
    return pillClassMap.default;
};

export const getGrantTypePillClasses = (grantType) => {
    if (!grantType) return 'bg-gray-100 text-gray-800 border-gray-200';
    const typeLower = grantType.toLowerCase();

    if (typeLower.includes('operating')) return 'bg-sky-100 text-sky-800 border-sky-200';
    if (typeLower.includes('program') || typeLower.includes('project')) return 'bg-rose-100 text-rose-800 border-rose-200';
    if (typeLower.includes('capacity building')) return 'bg-indigo-100 text-indigo-800 border-indigo-200';
    if (typeLower.includes('seed')) return 'bg-lime-100 text-lime-800 border-lime-200';
    if (typeLower.includes('emergency')) return 'bg-red-100 text-red-800 border-red-200';
    if (typeLower.includes('fellowship') || typeLower.includes('award')) return 'bg-amber-100 text-amber-800 border-amber-200';
    if (typeLower.includes('research')) return 'bg-cyan-100 text-cyan-800 border-cyan-200';
    
    return 'bg-gray-100 text-gray-800 border-gray-200';
};

export const debounce = (func, wait, immediate = false) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      timeout = null;
      if (!immediate) func(...args);
    };
    const callNow = immediate && !timeout;
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
    if (callNow) func(...args);
  };
};

export const getInitials = (name, maxInitials = 2) => {
  if (!name || typeof name !== 'string') return '?';
  
  const words = name.trim().split(/\s+/);
  const initials = words
    .slice(0, maxInitials)
    .map(word => word.charAt(0).toUpperCase())
    .join('');
  
  return initials || name.substring(0, maxInitials).toUpperCase();
};

export const getRelativeTime = (date) => {
  if (!date) return 'No date';
  
  const now = new Date();
  const targetDate = new Date(date);
  const diffInSeconds = Math.floor((targetDate - now) / 1000);
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  const diffInHours = Math.floor(diffInMinutes / 60);
  const diffInDays = Math.floor(diffInHours / 24);
  const diffInWeeks = Math.floor(diffInDays / 7);
  const diffInMonths = Math.floor(diffInDays / 30);
  
  if (Math.abs(diffInSeconds) < 60) {
    return 'Just now';
  } else if (Math.abs(diffInMinutes) < 60) {
    return diffInMinutes > 0 ? `in ${diffInMinutes} minutes` : `${Math.abs(diffInMinutes)} minutes ago`;
  } else if (Math.abs(diffInHours) < 24) {
    return diffInHours > 0 ? `in ${diffInHours} hours` : `${Math.abs(diffInHours)} hours ago`;
  } else if (Math.abs(diffInDays) < 7) {
    return diffInDays > 0 ? `in ${diffInDays} days` : `${Math.abs(diffInDays)} days ago`;
  } else if (Math.abs(diffInWeeks) < 4) {
    return diffInWeeks > 0 ? `in ${diffInWeeks} weeks` : `${Math.abs(diffInWeeks)} weeks ago`;
  } else {
    return diffInMonths > 0 ? `in ${diffInMonths} months` : `${Math.abs(diffInMonths)} months ago`;
  }
};

export const storage = {
  get: (key, defaultValue = null) => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.warn(`Error reading from localStorage for key "${key}":`, error);
      return defaultValue;
    }
  },
  
  set: (key, value) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.warn(`Error writing to localStorage for key "${key}":`, error);
      return false;
    }
  },
  
  remove: (key) => {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.warn(`Error removing from localStorage for key "${key}":`, error);
      return false;
    }
  }
};

export const prefersReducedMotion = () => {
  return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};

export const smoothScrollTo = (element, options = {}) => {
  const target = typeof element === 'string' ? document.querySelector(element) : element;
  if (!target) return;
  
  const shouldAnimate = !prefersReducedMotion();
  
  target.scrollIntoView({
    behavior: shouldAnimate ? 'smooth' : 'auto',
    block: options.block || 'start',
    inline: options.inline || 'nearest',
    ...options
  });
};
