// src/sorting.js
import { parseFundingAmount } from './utils.js';

export const sortGrants = (list, sortCriteria) => {
  switch (sortCriteria) {
    case 'dueDate_asc':
      list.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
      break;
    case 'dueDate_desc':
      list.sort((a, b) => new Date(b.dueDate) - new Date(a.dueDate));
      break;
    case 'funding_asc':
      list.sort((a, b) => parseFundingAmount(a.fundingAmount) - parseFundingAmount(b.fundingAmount));
      break;
    case 'funding_desc':
      list.sort((a, b) => parseFundingAmount(b.fundingAmount) - parseFundingAmount(a.fundingAmount));
      break;
    case 'title_asc':
      list.sort((a, b) => a.title.localeCompare(b.title));
      break;
    case 'title_desc':
      list.sort((a, b) => b.title.localeCompare(a.title));
      break;
    default:
      break;
  }
  return list;
};

export const sortFunders = (list, sortCriteria) => {
  switch (sortCriteria) {
    case 'name_asc':
      list.sort((a, b) => a.name.localeCompare(b.name));
      break;
    case 'name_desc':
      list.sort((a, b) => b.name.localeCompare(a.name));
      break;
    case 'grantsOffered_desc':
      list.sort((a, b) => (b.grantsOffered || 0) - (a.grantsOffered || 0));
      break;
    case 'grantsOffered_asc':
      list.sort((a, b) => (a.grantsOffered || 0) - (b.grantsOffered || 0));
      break;
    default:
      break;
  }
  return list;
};

export const sortNonprofits = (list, sortCriteria) => {
  switch (sortCriteria) {
    case 'name_asc':
      list.sort((a, b) => a.name.localeCompare(b.name));
      break;
    case 'name_desc':
      list.sort((a, b) => b.name.localeCompare(a.name));
      break;
    case 'staffCount_desc':
      list.sort((a, b) => b.staffCount - a.staffCount);
      break;
    case 'staffCount_asc':
      list.sort((a, b) => a.staffCount - b.staffCount);
      break;
    case 'yearFounded_desc':
      list.sort((a, b) => b.yearFounded - a.yearFounded);
      break;
    case 'yearFounded_asc':
      list.sort((a, b) => a.yearFounded - b.yearFounded);
      break;
    default:
      break;
  }
  return list;
};