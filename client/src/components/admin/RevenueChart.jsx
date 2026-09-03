import { useTheme } from '../../context/ThemeContext';

const RevenueChart = ({ data }) => {
  const { isDark } = useTheme();
  const maxVal = Math.max(...data.map(d => d.value));

  return (
    <div className={`border rounded-lg p-6 shadow-sm ${
      isDark ? 'bg-dark-800 border-dark-600' : 'bg-white border-gray-200'
    }`}>
      <h2 className={`text-lg font-serif mb-6 ${isDark ? 'text-white' : 'text-gray-900'}`}>Revenue Over Time</h2>
      <div className="h-64 flex items-end justify-between space-x-3 pt-6 pb-2">
        {data.map((item, i) => {
          const height = maxVal === 0 ? 0 : (item.value / maxVal) * 100;
          return (
            <div key={i} className="w-full h-full flex flex-col items-center justify-end group relative">
              <div className={`opacity-0 group-hover:opacity-100 absolute -top-8 text-white text-xs py-1 px-2 rounded shadow-md transition-opacity pointer-events-none z-10 ${
                isDark ? 'bg-dark-600' : 'bg-gray-800'
              }`}>
                {item.value}
              </div>
              <div className="w-full flex-1 flex items-end justify-center">
                <div 
                  className="w-full max-w-[28px] bg-gradient-to-t from-gold-600 via-gold-500 to-gold-400 rounded-t-md transition-all duration-500 hover:brightness-110 shadow-sm" 
                  style={{ height: `${height}%`, minHeight: '4px' }}
                ></div>
              </div>
              <span className={`text-xs mt-3 font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{item.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default RevenueChart;
