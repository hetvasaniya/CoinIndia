import { FiTrendingUp, FiTrendingDown } from 'react-icons/fi';
import { useTheme } from '../../context/ThemeContext';

const StatsCard = ({ title, value, icon, change, isPositive, bgColor, textColor }) => {
  const { isDark } = useTheme();

  return (
    <div className={`p-6 border rounded-lg flex items-center shadow-sm transition-all ${
      isDark ? 'bg-dark-800 border-dark-600 hover:border-gold-500/30' : 'bg-white border-gray-200 hover:border-gold-500/30'
    }`}>
      <div className={`p-3 rounded-full ${bgColor || (isDark ? 'bg-gold-500/10' : 'bg-amber-50')} ${textColor || 'text-gold-500'} mr-4`}>
        {icon}
      </div>
      <div className="flex-1">
        <p className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{title}</p>
        <p className={`text-2xl font-serif ${isDark ? 'text-white' : 'text-gray-900'}`}>{value}</p>
      </div>
      {change && (
        <div className={`flex items-center text-sm ${isPositive ? 'text-emerald-500' : 'text-red-500'}`}>
          {isPositive ? <FiTrendingUp className="mr-1" /> : <FiTrendingDown className="mr-1" />}
          {change}%
        </div>
      )}
    </div>
  );
};

export default StatsCard;
