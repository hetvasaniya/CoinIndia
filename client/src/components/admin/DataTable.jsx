import { useTheme } from '../../context/ThemeContext';

const DataTable = ({ columns, data, onSort, onSearch }) => {
  const { isDark } = useTheme();

  return (
    <div className={`border rounded-xl shadow-sm overflow-hidden ${
      isDark ? 'bg-dark-800 border-dark-600' : 'bg-white border-gray-200'
    }`}>
      {onSearch && (
        <div className={`p-3 sm:p-4 border-b ${isDark ? 'border-dark-700 bg-dark-750' : 'border-gray-200 bg-gray-50'}`}>
          <input 
            type="text" 
            placeholder="Search..." 
            onChange={(e) => onSearch(e.target.value)}
            className={`w-full max-w-sm px-3.5 py-2 border rounded-lg focus:outline-none focus:border-gold-500 focus:ring-1 focus:ring-gold-500 text-sm ${
              isDark ? 'bg-dark-800 border-dark-600 text-white placeholder-gray-500' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
            }`}
          />
        </div>
      )}
      <div className="overflow-x-auto touch-scroll">
        <table className={`min-w-full divide-y ${isDark ? 'divide-dark-700' : 'divide-gray-200'}`}>
          <thead className={isDark ? 'bg-dark-750' : 'bg-gray-50'}>
            <tr>
              {columns.map((col, i) => (
                <th 
                  key={i} 
                  className={`px-4 sm:px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider cursor-pointer whitespace-nowrap ${
                    isDark ? 'text-gray-400 hover:text-gold-400' : 'text-gray-500 hover:text-gray-900'
                  }`}
                  onClick={() => onSort && col.sortable && onSort(col.key)}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className={`divide-y ${isDark ? 'divide-dark-700' : 'divide-gray-200'}`}>
            {data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className={`px-4 sm:px-6 py-8 text-center text-sm ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                  No records found.
                </td>
              </tr>
            ) : (
              data.map((row, i) => (
                <tr key={row.id || i} className={`transition-colors ${
                  isDark ? 'hover:bg-dark-700/50' : 'hover:bg-gray-50'
                }`}>
                  {columns.map((col, j) => (
                    <td key={j} className={`px-4 sm:px-6 py-3.5 whitespace-nowrap text-sm ${
                      isDark ? 'text-gray-300' : 'text-gray-900'
                    }`}>
                      {col.render ? col.render(row) : row[col.key]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DataTable;
