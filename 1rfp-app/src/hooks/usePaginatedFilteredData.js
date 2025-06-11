// src/hooks/usePaginatedFilteredData.js
import { useMemo } from 'react';

/**
 * A custom hook to handle filtering, sorting, and pagination of data.
 *
 * @param {Array} allItems - The full array of items to process.
 * @param {Object} filterConfig - An object containing the current filter values.
 * @param {Function} filterFunction - A function that takes an item and filterConfig, and returns true if the item matches.
 * @param {string} sortCriteria - The current criteria to sort by.
 * @param {Function} sortFunction - A function that takes an array of items and sortCriteria, and returns a new sorted array.
 * @param {number} currentPage - The current active page (1-indexed).
 * @param {number} itemsPerPage - The number of items to display per page.
 * @returns {Object} An object containing:
 * - paginatedItems: The items for the current page.
 * - totalPages: The total number of pages.
 * - totalFilteredItems: The total number of items after filtering.
 * - filteredAndSortedItems: The full array of items after filtering and sorting.
 */
const usePaginatedFilteredData = (
  allItems,
  filterConfig,
  filterFunction,
  sortCriteria,
  sortFunction,
  currentPage,
  itemsPerPage
) => {
  const filteredItems = useMemo(() => {
    if (!Array.isArray(allItems)) return [];
    if (!filterConfig || !filterFunction) { // If no filter config or function, return all items
      return allItems;
    }
    return allItems.filter(item => filterFunction(item, filterConfig));
  }, [allItems, filterConfig, filterFunction]);

  const sortedItems = useMemo(() => {
    if (!sortFunction) return filteredItems; // If no sort function, return as is
    // sortFunction should return a new sorted array
    return sortFunction([...filteredItems], sortCriteria);
  }, [filteredItems, sortCriteria, sortFunction]);

  const totalFilteredItems = sortedItems.length;

  const totalPages = useMemo(() => {
    if (itemsPerPage <= 0) return 0; // Avoid division by zero or negative
    return Math.ceil(totalFilteredItems / itemsPerPage);
  }, [totalFilteredItems, itemsPerPage]);

  const paginatedItems = useMemo(() => {
    if (itemsPerPage <= 0 || totalFilteredItems === 0) return []; // Avoid issues and handle no items
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    return sortedItems.slice(indexOfFirstItem, indexOfLastItem);
  }, [sortedItems, currentPage, itemsPerPage, totalFilteredItems]);

  return {
    paginatedItems,
    totalPages,
    totalFilteredItems,
    filteredAndSortedItems: sortedItems, // FIX: Return the full sorted list
  };
};

export default usePaginatedFilteredData;