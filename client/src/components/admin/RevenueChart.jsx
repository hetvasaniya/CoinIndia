const RevenueChart = ({ data }) => {
  const maxVal = Math.max(...data.map(d => d.value));

  return (
    <div className="bg-white border border-gray-200 rounded-sm p-6 shadow-sm">
      <h2 className="text-lg font-serif text-[#1a1a1a] mb-6">Revenue Over Time</h2>
      <div className="h-64 flex items-end justify-between space-x-2 pt-4">
        {data.map((item, i) => {
          const height = maxVal === 0 ? 0 : (item.value / maxVal) * 100;
          return (
            <div key={i} className="w-full flex flex-col items-center group relative">
              <div className="opacity-0 group-hover:opacity-100 absolute -top-8 bg-black text-white text-xs py-1 px-2 rounded transition-opacity">
                {item.value}
              </div>
              <div 
                className="w-full bg-[#B8860B] rounded-t-sm transition-all duration-500 chart-bar cursor-pointer" 
                style={{ height: `${height}%` }}
              ></div>
              <span className="text-xs text-gray-400 mt-2">{item.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default RevenueChart;
