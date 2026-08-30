const DataTable = ({ columns, data, onSort, onSearch }) => {
  return (
    <div className="bg-white border border-gray-200 rounded-sm shadow-sm overflow-hidden">
      {onSearch && (
        <div className="p-4 border-b border-gray-200 bg-[#FAFAF7]">
          <input 
            type="text" 
            placeholder="Search..." 
            onChange={(e) => onSearch(e.target.value)}
            className="w-full max-w-sm px-3 py-2 border border-gray-300 rounded-sm focus:outline-none focus:border-[#B8860B] focus:ring-1 focus:ring-[#B8860B] text-sm"
          />
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-[#FAFAF7]">
            <tr>
              {columns.map((col, i) => (
                <th 
                  key={i} 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:text-[#1a1a1a]"
                  onClick={() => onSort && col.sortable && onSort(col.key)}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data.map((row, i) => (
              <tr key={row.id || i} className="hover:bg-gray-50">
                {columns.map((col, j) => (
                  <td key={j} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {col.render ? col.render(row) : row[col.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DataTable;
