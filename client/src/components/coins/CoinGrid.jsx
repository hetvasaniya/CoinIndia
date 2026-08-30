import CoinCard from './CoinCard';
import EmptyState from '../common/EmptyState';

const CoinGrid = ({ coins, loading }) => {
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="animate-pulse bg-white border border-gray-100 p-4 h-96 rounded-sm">
            <div className="bg-gray-200 h-48 w-full mb-4"></div>
            <div className="bg-gray-200 h-6 w-3/4 mx-auto mb-2"></div>
            <div className="bg-gray-200 h-4 w-1/2 mx-auto mb-6"></div>
            <div className="bg-gray-200 h-6 w-1/3 mx-auto mt-auto"></div>
          </div>
        ))}
      </div>
    );
  }

  if (!coins || coins.length === 0) {
    return <EmptyState />;
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {coins.map(coin => (
        <CoinCard key={coin._id} coin={coin} />
      ))}
    </div>
  );
};

export default CoinGrid;
