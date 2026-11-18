import CoinCard from './CoinCard';
import EmptyState from '../common/EmptyState';
import { useTheme } from '../../context/ThemeContext';

const CoinGrid = ({ coins, loading }) => {
  const { isDark } = useTheme();

  if (loading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5 gap-2.5 sm:gap-4">
        {[...Array(8)].map((_, i) => (
          <div key={i} className={`animate-pulse border p-3 rounded-xl flex flex-col ${
            isDark ? 'bg-dark-800 border-dark-600' : 'bg-white border-gray-100'
          }`}>
            <div className={`aspect-square w-full mb-3 rounded-lg ${isDark ? 'bg-dark-700' : 'bg-gray-200'}`}></div>
            <div className={`h-4 w-3/4 mx-auto mb-2 rounded ${isDark ? 'bg-dark-700' : 'bg-gray-200'}`}></div>
            <div className={`h-3 w-1/2 mx-auto mb-3 rounded ${isDark ? 'bg-dark-700' : 'bg-gray-200'}`}></div>
            <div className={`h-4 w-1/3 mx-auto mt-auto mb-2 rounded ${isDark ? 'bg-dark-700' : 'bg-gray-200'}`}></div>
            <div className={`h-8 w-full rounded-lg ${isDark ? 'bg-dark-700' : 'bg-gray-200'}`}></div>
          </div>
        ))}
      </div>
    );
  }

  if (!coins || coins.length === 0) {
    return <EmptyState />;
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5 gap-2.5 sm:gap-4">
      {coins.map(coin => (
        <CoinCard key={coin._id} coin={coin} />
      ))}
    </div>
  );
};

export default CoinGrid;
