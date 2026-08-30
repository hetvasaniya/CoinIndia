import { FiTrendingUp, FiTrendingDown } from 'react-icons/fi';

const StatsCard = ({ title, value, icon, change, isPositive, bgColor, textColor }) => {
  return (
    <div className="bg-white p-6 border border-gray-200 rounded-sm flex items-center shadow-sm">
      <div className={`p-3 rounded-full ${bgColor} ${textColor} mr-4`}>
        {icon}
      </div>
      <div className="flex-1">
        <p className="text-sm font-medium text-gray-500">{title}</p>
        <p className="text-2xl font-serif text-[#1a1a1a]">{value}</p>
      </div>
      {change && (
        <div className={`flex items-center text-sm ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
          {isPositive ? <FiTrendingUp className="mr-1" /> : <FiTrendingDown className="mr-1" />}
          {change}%
        </div>
      )}
    </div>
  );
};

export default StatsCard;
