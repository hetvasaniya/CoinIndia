import { FiSearch } from 'react-icons/fi';

const EmptyState = ({ 
  title = 'No results found', 
  message = 'We could not find anything matching your criteria. Try adjusting your filters or search term.',
  icon = <FiSearch className="h-12 w-12 text-gray-300" />,
  action = null
}) => {
  return (
    <div className="text-center py-12 px-4">
      <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gray-50 mb-4">
        {icon}
      </div>
      <h3 className="text-lg font-medium text-gray-900 mb-2 font-serif">{title}</h3>
      <p className="text-sm text-gray-500 max-w-sm mx-auto mb-6">
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
