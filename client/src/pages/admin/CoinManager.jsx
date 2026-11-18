import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import adminService from '../../services/adminService';
import { formatPrice } from '../../utils/helpers';
import Button from '../../components/common/Button';
import Loader from '../../components/common/Loader';
import { FiEdit2, FiTrash2, FiPlus, FiStar, FiCpu } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { STATIC_IMAGES } from '../../data/staticImages';
import { useTheme } from '../../context/ThemeContext';

const CoinManager = () => {
  const [coins, setCoins] = useState([]);
  const [loading, setLoading] = useState(true);
  const { isDark } = useTheme();

  useEffect(() => {
    fetchCoins();
  }, []);

  const fetchCoins = async () => {
    try {
      const res = await adminService.getCoins();
      const coinList = Array.isArray(res) ? res : (res?.coins || res?.data || []);
      setCoins(coinList);
    } catch (error) {
      toast.error('Failed to fetch coins');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this coin?')) {
      const prevCoins = coins;
      // Optimistic delete
      setCoins((prev) => prev.filter((c) => c._id !== id));
      try {
        await adminService.deleteCoin(id);
        toast.success('Coin deleted successfully');
      } catch (error) {
        setCoins(prevCoins);
        toast.error('Failed to delete coin');
      }
    }
  };

  const handleToggleFeatured = async (id) => {
    const prevCoins = coins;
    // Optimistic toggle
    setCoins((prev) =>
      prev.map((c) => (c._id === id ? { ...c, isFeatured: !c.isFeatured } : c))
    );
    try {
      await adminService.toggleFeatured(id);
      toast.success('Featured status updated');
    } catch (error) {
      setCoins(prevCoins);
      toast.error('Failed to update featured status');
    }
  };

  if (loading) return <Loader fullScreen />;

  const cardBg = isDark ? 'bg-dark-800 border-dark-700' : 'bg-white border-gray-200';

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 sm:gap-4 mb-6 sm:mb-8">
        <h1 className={`text-xl sm:text-2xl font-serif ${isDark ? 'text-white' : 'text-gray-900'}`}>Coin Catalog</h1>
        <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
          <Link to="/admin/coins/ai" className="flex-1 sm:flex-initial">
            <Button variant="outline" className="w-full flex items-center justify-center border-gold-500 text-gold-500 hover:bg-gold-500/10 text-xs sm:text-sm py-2">
              <FiCpu className="mr-1.5" /> Add with AI
            </Button>
          </Link>
          <Link to="/admin/coins/new" className="flex-1 sm:flex-initial">
            <Button className="w-full flex items-center justify-center shadow-gold text-xs sm:text-sm py-2">
              <FiPlus className="mr-1.5" /> Add New Coin
            </Button>
          </Link>
        </div>
      </div>

      {/* Mobile Card List (< md) */}
      <div className="block md:hidden space-y-3 mb-6">
        {coins.length === 0 ? (
          <div className={`p-8 text-center rounded-xl border ${cardBg}`}>
            <p className="text-sm text-gray-500">No coins in catalog.</p>
          </div>
        ) : (
          coins.map((coin) => (
            <div key={coin._id} className={`p-3.5 border rounded-xl shadow-sm ${cardBg} space-y-3`}>
              <div className="flex items-start gap-3">
                <div className={`h-14 w-14 flex-shrink-0 p-1 rounded-lg border ${isDark ? 'bg-dark-700 border-dark-600' : 'bg-gray-100 border-gray-200'}`}>
                  <img 
                    className={`h-full w-full object-contain ${isDark ? '' : 'mix-blend-multiply'}`} 
                    src={coin.images && coin.images[0]?.url ? coin.images[0].url : (typeof coin.images?.[0] === 'string' ? coin.images[0] : STATIC_IMAGES.placeholders.thumbnail)} 
                    alt={coin.name} 
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-1">
                    <h3 className={`text-sm font-semibold truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>{coin.name}</h3>
                    <button 
                      onClick={() => handleToggleFeatured(coin._id)}
                      className={`p-1 -mt-1 rounded-full ${coin.isFeatured ? 'text-gold-400' : 'text-gray-400'}`}
                      aria-label="Toggle Featured"
                    >
                      <FiStar className={`w-4 h-4 ${coin.isFeatured ? 'fill-current' : ''}`} />
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">{coin.sku || 'No SKU'} &bull; {coin.category?.name || 'Artifact'}</p>
                  <p className="text-xs text-gray-400">{coin.era}</p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-dark-700">
                <div>
                  <span className="text-sm font-bold text-gold-500">
                    {formatPrice(coin.sellingPrice !== undefined ? coin.sellingPrice : coin.price)}
                  </span>
                  <span className={`ml-2 px-2 py-0.5 inline-flex text-[10px] font-semibold rounded-full ${
                    coin.quantity > 0 
                      ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' 
                      : 'bg-red-500/10 text-red-500 border border-red-500/20'
                  }`}>
                    {coin.quantity} in stock
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <Link 
                    to={`/admin/coins/${coin._id}/edit`} 
                    className="p-1.5 rounded-lg border border-gold-500/30 text-gold-500 hover:bg-gold-500/10"
                    aria-label="Edit coin"
                  >
                    <FiEdit2 className="w-4 h-4" />
                  </Link>
                  <button 
                    onClick={() => handleDelete(coin._id)} 
                    className="p-1.5 rounded-lg border border-red-500/30 text-red-500 hover:bg-red-500/10"
                    aria-label="Delete coin"
                  >
                    <FiTrash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Desktop Table (>= md) */}
      <div className={`hidden md:block border rounded-xl shadow-sm overflow-hidden ${cardBg}`}>
        <div className="overflow-x-auto touch-scroll">
          <table className={`min-w-full divide-y ${isDark ? 'divide-dark-700' : 'divide-gray-200'}`}>
            <thead className={isDark ? 'bg-dark-700/50' : 'bg-gray-50'}>
              <tr>
                <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Artifact</th>
                <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Category & Era</th>
                <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Price</th>
                <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Stock</th>
                <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Featured</th>
                <th className={`px-6 py-3 text-right text-xs font-medium uppercase tracking-wider ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Actions</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${isDark ? 'divide-dark-700' : 'divide-gray-200'}`}>
              {coins.map((coin) => (
                <tr key={coin._id} className={`transition-colors ${isDark ? 'hover:bg-dark-700/50' : 'hover:bg-gray-50'}`}>
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div className={`h-10 w-10 flex-shrink-0 p-1 rounded border ${isDark ? 'bg-dark-700 border-dark-600' : 'bg-gray-100 border-gray-200'}`}>
                        <img 
                          className={`h-full w-full object-contain ${isDark ? '' : 'mix-blend-multiply'}`} 
                          src={coin.images && coin.images[0]?.url ? coin.images[0].url : (typeof coin.images?.[0] === 'string' ? coin.images[0] : STATIC_IMAGES.placeholders.thumbnail)} 
                          alt="" 
                        />
                      </div>
                      <div className="ml-4">
                        <div className={`text-sm font-medium line-clamp-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>{coin.name}</div>
                        <div className="text-xs text-gray-500">{coin.sku || 'No SKU'}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className={`text-sm ${isDark ? 'text-gray-200' : 'text-gray-900'}`}>{coin.category?.name || 'N/A'}</div>
                    <div className="text-xs text-gray-500">{coin.era}</div>
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-gold-500">
                    {formatPrice(coin.sellingPrice !== undefined ? coin.sellingPrice : coin.price)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      coin.quantity > 0 
                        ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' 
                        : 'bg-red-500/10 text-red-500 border border-red-500/20'
                    }`}>
                      {coin.quantity} in stock
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button 
                      onClick={() => handleToggleFeatured(coin._id)}
                      className={`p-1 rounded-full transition-colors ${coin.isFeatured ? 'text-gold-400 hover:text-gold-300' : 'text-gray-500 hover:text-gray-400'}`}
                    >
                      <FiStar className={coin.isFeatured ? 'fill-current' : ''} />
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <Link to={`/admin/coins/${coin._id}/edit`} className="text-gold-500 hover:text-gold-400 mr-4 inline-block">
                      <FiEdit2 className="w-4 h-4" />
                    </Link>
                    <button onClick={() => handleDelete(coin._id)} className="text-red-500 hover:text-red-400 inline-block">
                      <FiTrash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default CoinManager;
