// src/components/Pagination.jsx
import React from 'react';

const Pagination = ({ currentPage, totalPages, onPageChange, activeColorClass, inactiveColorClass, disabledColorClass }) => {
  return (
    <div className="mt-10 flex justify-center items-center space-x-1 sm:space-x-2">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className={`px-3 py-1.5 sm:px-4 sm:py-2 border border-slate-300 rounded-md bg-white text-slate-700 hover:bg-slate-50 ${disabledColorClass} transition-colors text-xs sm:text-sm`}
      >
        Previous
      </button>
      {totalPages <= 7 ? (
        Array.from({ length: totalPages }, (_, i) => i + 1).map((number) => (
          <button
            key={number}
            onClick={() => onPageChange(number)}
            className={`px-3 py-1.5 sm:px-4 sm:py-2 border rounded-md transition-colors text-xs sm:text-sm ${
              currentPage === number
                ? activeColorClass
                : inactiveColorClass
            }`}
          >
            {number}
          </button>
        ))
      ) : (
          <>
            <button
              onClick={() => onPageChange(1)}
              className={`px-3 py-1.5 sm:px-4 sm:py-2 border rounded-md transition-colors text-xs sm:text-sm ${
                currentPage === 1
                  ? activeColorClass
                  : inactiveColorClass
              }`}
            >
              1
            </button>
            {currentPage > 3 && (
              <span className="px-2 py-2 text-slate-500 hidden sm:inline text-xs">...
              </span>
            )}
            {![
              1,
              2,
              totalPages - 1,
              totalPages
            ].includes(currentPage - 1) && currentPage > 2 && totalPages > 4 && (
              <button
                onClick={() => onPageChange(currentPage - 1)}
                className={`px-3 py-1.5 sm:px-4 sm:py-2 border rounded-md ${inactiveColorClass} text-xs sm:text-sm hidden md:inline`}
              >
                {currentPage - 1}
              </button>
            )}
            {![
              1,
              totalPages
            ].includes(currentPage) && (
              <button
                onClick={() => onPageChange(currentPage)}
                className={`px-3 py-1.5 sm:px-4 sm:py-2 border rounded-md ${activeColorClass} text-xs sm:text-sm`}
              >
                {currentPage}
              </button>
            )}
            {![
              1,
              2,
              totalPages - 1,
              totalPages
            ].includes(currentPage + 1) && currentPage < totalPages - 1 && totalPages > 4 && (
              <button
                onClick={() => onPageChange(currentPage + 1)}
                className={`px-3 py-1.5 sm:px-4 sm:py-2 border rounded-md ${inactiveColorClass} text-xs sm:text-sm hidden md:inline`}
              >
                {currentPage + 1}
              </button>
            )}
            {currentPage < totalPages - 2 && (
              <span className="px-2 py-2 text-slate-500 hidden sm:inline text-xs">...
              </span>
            )}
            <button
              onClick={() => onPageChange(totalPages)}
              className={`px-3 py-1.5 sm:px-4 sm:py-2 border rounded-md transition-colors text-xs sm:text-sm ${
                currentPage === totalPages
                  ? activeColorClass
                  : inactiveColorClass
              }`}
            >
              {totalPages}
            </button>
          </>
      )}
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages || totalPages === 0}
        className={`px-3 py-1.5 sm:px-4 sm:py-2 border border-slate-300 rounded-md bg-white text-slate-700 hover:bg-slate-50 ${disabledColorClass} transition-colors text-xs sm:text-sm`}
      >
        Next
      </button>
    </div>
  );
};

export default Pagination;