import { useTheme } from '../../context/ThemeContext';

const Pagination = ({ currentPage, totalPages, onPageChange }) => {
  const { isDark } = useTheme();
  
  if (totalPages <= 1) return null;

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

  return (
    <nav className="flex justify-center mt-8">
      <ul className="flex space-x-2">
        <li>
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className={`px-3 py-1.5 rounded-lg border text-sm transition-all ${
              currentPage === 1
                ? isDark 
                  ? 'bg-dark-700 text-gray-600 cursor-not-allowed border-dark-600'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed border-gray-200'
                : isDark
                  ? 'bg-dark-700 text-gray-300 hover:bg-dark-600 hover:text-gold-400 border-dark-600'
                  : 'bg-white text-gray-700 hover:bg-gray-50 hover:text-gold-600 border-gray-300'
            }`}
          >
            Previous
          </button>
        </li>
        {pages.map((page) => (
          <li key={page}>
            <button
              onClick={() => onPageChange(page)}
              className={`px-3 py-1.5 rounded-lg border text-sm transition-all ${
                currentPage === page
                  ? 'bg-gradient-to-r from-gold-600 to-gold-500 text-white border-gold-500 shadow-gold'
                  : isDark
                    ? 'bg-dark-700 text-gray-300 hover:bg-dark-600 hover:text-gold-400 border-dark-600'
                    : 'bg-white text-gray-700 hover:bg-gray-50 hover:text-gold-600 border-gray-300'
              }`}
            >
              {page}
            </button>
          </li>
        ))}
        <li>
          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className={`px-3 py-1.5 rounded-lg border text-sm transition-all ${
              currentPage === totalPages
                ? isDark
                  ? 'bg-dark-700 text-gray-600 cursor-not-allowed border-dark-600'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed border-gray-200'
                : isDark
                  ? 'bg-dark-700 text-gray-300 hover:bg-dark-600 hover:text-gold-400 border-dark-600'
                  : 'bg-white text-gray-700 hover:bg-gray-50 hover:text-gold-600 border-gray-300'
            }`}
          >
            Next
          </button>
        </li>
      </ul>
    </nav>
  );
};

export default Pagination;
