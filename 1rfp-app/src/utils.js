// src/utils.js

export const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  const options = { year: 'numeric', month: 'long', day: 'numeric' };
  return new Date(dateString).toLocaleDateString(undefined, options);
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
    'health': 'bg-green-100 text-green-700 border border-green-200',
    'education': 'bg-blue-100 text-blue-700 border border-blue-200',
    'environment': 'bg-teal-100 text-teal-700 border border-teal-200',
    'arts & culture': 'bg-purple-100 text-purple-700 border border-purple-200',
    'arts': 'bg-purple-100 text-purple-700 border border-purple-200',
    'housing': 'bg-amber-100 text-amber-700 border border-amber-200',
    'social services': 'bg-indigo-100 text-indigo-700 border border-indigo-200',
    'economic development': 'bg-pink-100 text-pink-700 border border-pink-200',
    'civic engagement': 'bg-orange-100 text-orange-700 border border-orange-200',
    'animal welfare': 'bg-lime-100 text-lime-700 border border-lime-200',
    'youth development': 'bg-cyan-100 text-cyan-700 border border-cyan-200',
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

// UPDATED: Added more colors and keyword matching for grant types
export const getGrantTypePillClasses = (grantType) => {
    if (!grantType) return 'bg-gray-100 text-gray-700 border-gray-200';
    const typeLower = grantType.toLowerCase();

    if (typeLower.includes('operating')) return 'bg-sky-100 text-sky-700 border-sky-200';
    if (typeLower.includes('project')) return 'bg-rose-100 text-rose-700 border-rose-200';
    if (typeLower.includes('production')) return 'bg-rose-100 text-rose-700 border-rose-200';
    if (typeLower.includes('development')) return 'bg-orange-100 text-orange-700 border-orange-200';
    if (typeLower.includes('capacity building')) return 'bg-indigo-100 text-indigo-700 border-indigo-200';
    if (typeLower.includes('seed')) return 'bg-lime-100 text-lime-700 border-lime-200';
    if (typeLower.includes('emergency')) return 'bg-red-100 text-red-700 border-red-200';
    if (typeLower.includes('fellowship')) return 'bg-amber-100 text-amber-700 border-amber-200';
    if (typeLower.includes('award')) return 'bg-amber-100 text-amber-700 border-amber-200';
    if (typeLower.includes('research')) return 'bg-cyan-100 text-cyan-700 border-cyan-200';
    
    return 'bg-gray-100 text-gray-700 border-gray-200';
};