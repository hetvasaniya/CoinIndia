import { useTheme } from '../../context/ThemeContext';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';

const Pagination = ({ currentPage, totalPages, onPageChange }) => {
  const { isDark } = useTheme();
  
  if (totalPages <= 1) return null;

  // Compute pagination window with ellipsis
  const getPageNumbers = () => {
    const delta = 1; // Number of pages to show around current page
    const range = [];
    const rangeWithDots = [];
    let l;

    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || (i >= currentPage - delta && i <= currentPage + delta)) {
        range.push(i);
      }
    }

    for (const i of range) {
      if (l) {
        if (i - l === 2) {
          rangeWithDots.push(l + 1);
        } else if (i - l !== 1) {
          rangeWithDots.push('...');
        }
      }
      rangeWithDots.push(i);
      l = i;
    }

    return rangeWithDots;
  };

  const pages = getPageNumbers();

  return (
    <nav className="flex justify-center mt-8 px-2" aria-label="Pagination Navigation">
      <ul className="flex flex-wrap items-center justify-center gap-1 sm:gap-1.5 max-w-full">
        {/* Previous Button */}
        <li>
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            aria-label="Previous Page"
            className={`px-2.5 sm:px-3 py-1.5 rounded-lg border text-xs sm:text-sm font-medium transition-all flex items-center gap-1 ${
              currentPage === 1
                ? isDark 
                  ? 'bg-dark-800 text-gray-600 cursor-not-allowed border-dark-700'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed border-gray-200'
                : isDark
                  ? 'bg-dark-800 text-gray-300 hover:bg-dark-700 hover:text-gold-400 border-dark-600'
                  : 'bg-white text-gray-700 hover:bg-gray-50 hover:text-gold-600 border-gray-300'
            }`}
          >
            <FiChevronLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Prev</span>
          </button>
        </li>

        {/* Page Buttons & Dots */}
        {pages.map((page, idx) => {
          if (page === '...') {
            return (
              <li key={`dots-${idx}`} className="px-1.5 py-1 text-xs text-gray-500 font-mono">
                &hellip;
              </li>
            );
          }

          const isCurrent = currentPage === page;
          return (
            <li key={page}>
              <button
                onClick={() => onPageChange(page)}
                aria-current={isCurrent ? 'page' : undefined}
                className={`min-w-[32px] sm:min-w-[36px] h-8 sm:h-9 px-2 rounded-lg border text-xs sm:text-sm font-semibold transition-all ${
                  isCurrent
                    ? 'bg-gradient-to-r from-gold-600 to-gold-500 text-white border-gold-500 shadow-gold'
                    : isDark
                      ? 'bg-dark-800 text-gray-300 hover:bg-dark-700 hover:text-gold-400 border-dark-600'
                      : 'bg-white text-gray-700 hover:bg-gray-50 hover:text-gold-600 border-gray-300'
                }`}
              >
                {page}
              </button>
            </li>
          );
        })}

        {/* Next Button */}
        <li>
          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            aria-label="Next Page"
            className={`px-2.5 sm:px-3 py-1.5 rounded-lg border text-xs sm:text-sm font-medium transition-all flex items-center gap-1 ${
              currentPage === totalPages
                ? isDark 
                  ? 'bg-dark-800 text-gray-600 cursor-not-allowed border-dark-700'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed border-gray-200'
                : isDark
                  ? 'bg-dark-800 text-gray-300 hover:bg-dark-700 hover:text-gold-400 border-dark-600'
                  : 'bg-white text-gray-700 hover:bg-gray-50 hover:text-gold-600 border-gray-300'
            }`}
          >
            <span className="hidden sm:inline">Next</span>
            <FiChevronRight className="w-4 h-4" />
          </button>
        </li>
      </ul>
    </nav>
  );
};

export default Pagination;
