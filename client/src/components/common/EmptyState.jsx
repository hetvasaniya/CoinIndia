import { FiSearch } from 'react-icons/fi';
import { useTheme } from '../../context/ThemeContext';

const EmptyState = ({ 
  title = 'No results found', 
  message = 'We could not find anything matching your criteria. Try adjusting your filters or search term.',
  icon = null,
  action = null
}) => {
  const { isDark } = useTheme();

  return (
    <div className="text-center py-12 px-4">
      <div className={`inline-flex items-center justify-center w-24 h-24 rounded-full mb-4 ${
        isDark ? 'bg-dark-700' : 'bg-gray-50'
      }`}>
        {icon || <FiSearch className={`h-12 w-12 ${isDark ? 'text-gray-600' : 'text-gray-300'}`} />}
      </div>
      <h3 className={`text-lg font-medium mb-2 font-serif ${
        isDark ? 'text-white' : 'text-gray-900'
      }`}>{title}</h3>
      <p className={`text-sm max-w-sm mx-auto mb-6 ${
        isDark ? 'text-gray-400' : 'text-gray-500'
      }`}>
        {message}
      </p>
      {action && (
        <div className="mt-4">
          {action}
        </div>
      )}
    </div>
  );
};

export default EmptyState;
