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
    
    // Apply the filter function
    if (filterFunction && typeof filterFunction === 'function') {
      try {
        // First try as array function
        const arrayResult = filterFunction(processedItems, filterConfig);
        if (Array.isArray(arrayResult)) {
          processedItems = arrayResult;
        } else {
          // If it doesn't return an array, use as predicate function
          processedItems = processedItems.filter(item => filterFunction(item, filterConfig));
        }
      } catch (error) {
        // Fallback to using as predicate function on error
        processedItems = processedItems.filter(item => {
          try {
            return filterFunction(item, filterConfig);
          } catch (err) {
            return true; // Include item if filtering fails on a specific item
          }
        });
      }
    }

    // Apply the sort function
    if (sortFunction && typeof sortFunction === 'function') {
      const sortedResult = sortFunction([...processedItems], sortCriteria);
      processedItems = Array.isArray(sortedResult) ? sortedResult : processedItems;
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