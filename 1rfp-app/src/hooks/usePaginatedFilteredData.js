// src/hooks/usePaginatedFilteredData.js
import { useMemo } from 'react';

const usePaginatedFilteredData = (
  allItems,
  filterConfig,
  filterFunction,
  sortCriteria,
  sortFunction,
  currentPage,
  itemsPerPage
) => {

  const filteredAndSortedItems = useMemo(() => {
    let processedItems = Array.isArray(allItems) ? [...allItems] : [];
    
    console.log('usePaginatedFilteredData - Initial items:', processedItems.length);

    // Apply the filter function
    if (filterFunction && typeof filterFunction === 'function') {
      console.log('usePaginatedFilteredData - Applying filter function');
      
      // Check if this is a predicate function (takes individual items) or array function
      // We can detect this by checking the function's parameter count or by trying both approaches
      try {
        // First try as array function (like your grants page)
        const arrayResult = filterFunction(processedItems, filterConfig);
        if (Array.isArray(arrayResult)) {
          console.log('usePaginatedFilteredData - Used as array function');
          processedItems = arrayResult;
        } else {
          // If it doesn't return an array, use as predicate function
          console.log('usePaginatedFilteredData - Using as predicate function');
          processedItems = processedItems.filter(item => filterFunction(item, filterConfig));
        }
      } catch (error) {
        console.error('usePaginatedFilteredData - Filter function error:', error);
        // Fallback to using as predicate function
        processedItems = processedItems.filter(item => {
          try {
            return filterFunction(item, filterConfig);
          } catch (err) {
            console.error('usePaginatedFilteredData - Item filter error:', err);
            return true; // Include item if filtering fails
          }
        });
      }
      
      console.log('usePaginatedFilteredData - Processed items after filter:', processedItems.length);
    }

    // Apply the sort function to the result of the filtering
    if (sortFunction && typeof sortFunction === 'function') {
      console.log('usePaginatedFilteredData - Applying sort function');
      // The sort function should mutate the array, so we pass a copy
      const sortedResult = sortFunction([...processedItems], sortCriteria);
      console.log('usePaginatedFilteredData - Sort result:', sortedResult);
      // Ensure the result is always an array
      processedItems = Array.isArray(sortedResult) ? sortedResult : processedItems;
      console.log('usePaginatedFilteredData - Final processed items:', processedItems.length);
    }
    
    return processedItems;
  }, [allItems, filterConfig, filterFunction, sortCriteria, sortFunction]);

  const totalFilteredItems = filteredAndSortedItems.length;

  const totalPages = useMemo(() => {
    if (itemsPerPage <= 0) return 0;
    return Math.ceil(totalFilteredItems / itemsPerPage);
  }, [totalFilteredItems, itemsPerPage]);

  const paginatedItems = useMemo(() => {
    if (itemsPerPage <= 0) return [];
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    return filteredAndSortedItems.slice(indexOfFirstItem, indexOfLastItem);
  }, [filteredAndSortedItems, currentPage, itemsPerPage]);

  return {
    paginatedItems,
    totalPages,
    totalFilteredItems,
    filteredAndSortedItems,
  };
};

export default usePaginatedFilteredData;