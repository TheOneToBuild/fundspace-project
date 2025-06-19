// src/sorting.js - FIXED VERSION
import { parseFundingAmount } from './utils.js';

export const sortGrants = (list, sortCriteria) => {
  if (!Array.isArray(list)) {
    console.warn('sortGrants: list is not an array:', list);
    return [];
  }

  const sortedList = [...list]; // Create a copy to avoid mutating original

  switch (sortCriteria) {
    case 'dueDate_asc':
      sortedList.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
      break;
    case 'dueDate_desc':
      sortedList.sort((a, b) => new Date(b.dueDate) - new Date(a.dueDate));
      break;
    case 'funding_asc':
      sortedList.sort((a, b) => parseFundingAmount(a.fundingAmount) - parseFundingAmount(b.fundingAmount));
      break;
    case 'funding_desc':
      sortedList.sort((a, b) => parseFundingAmount(b.fundingAmount) - parseFundingAmount(a.fundingAmount));
      break;
    case 'title_asc':
      sortedList.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
      break;
    case 'title_desc':
      sortedList.sort((a, b) => (b.title || '').localeCompare(a.title || ''));
      break;
    default:
      break;
  }
  return sortedList;
};

export const sortFunders = (list, sortCriteria) => {
  if (!Array.isArray(list)) {
    console.warn('sortFunders: list is not an array:', list);
    return [];
  }

  console.log('Sorting funders with criteria:', sortCriteria);
  const sortedList = [...list]; // Create a copy to avoid mutating original

  switch (sortCriteria) {
    case 'name_asc':
      sortedList.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
      break;
    case 'name_desc':
      sortedList.sort((a, b) => (b.name || '').localeCompare(a.name || ''));
      break;
    case 'funding_desc':
    case 'grantsOffered_desc':
      // Sort by total funding annually (highest first)
      sortedList.sort((a, b) => {
        const aAmount = parseFundingAmount(a.total_funding_annually) || 0;
        const bAmount = parseFundingAmount(b.total_funding_annually) || 0;
        return bAmount - aAmount;
      });
      break;
    case 'funding_asc':
    case 'grantsOffered_asc':
      // Sort by total funding annually (lowest first)
      sortedList.sort((a, b) => {
        const aAmount = parseFundingAmount(a.total_funding_annually) || 0;
        const bAmount = parseFundingAmount(b.total_funding_annually) || 0;
        return aAmount - bAmount;
      });
      break;
    default:
      // Default to name ascending
      sortedList.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
      break;
  }
  
  console.log('Sorted funders count:', sortedList.length);
  return sortedList;
};

export const sortNonprofits = (list, sortCriteria) => {
  if (!Array.isArray(list)) {
    console.warn('sortNonprofits: list is not an array:', list);
    return [];
  }

  const sortedList = [...list]; // Create a copy to avoid mutating original

  switch (sortCriteria) {
    case 'name_asc':
      sortedList.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
      break;
    case 'name_desc':
      sortedList.sort((a, b) => (b.name || '').localeCompare(a.name || ''));
      break;
    case 'staffCount_desc':
      sortedList.sort((a, b) => (b.staffCount || 0) - (a.staffCount || 0));
      break;
    case 'staffCount_asc':
      sortedList.sort((a, b) => (a.staffCount || 0) - (b.staffCount || 0));
      break;
    case 'yearFounded_desc':
      sortedList.sort((a, b) => (b.yearFounded || 0) - (a.yearFounded || 0));
      break;
    case 'yearFounded_asc':
      sortedList.sort((a, b) => (a.yearFounded || 0) - (b.yearFounded || 0));
      break;
    default:
      break;
  }
  return sortedList;
};