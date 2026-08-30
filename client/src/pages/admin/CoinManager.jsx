import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import adminService from '../../services/adminService';
import { formatPrice } from '../../utils/helpers';
import Button from '../../components/common/Button';
import Loader from '../../components/common/Loader';
import { FiEdit2, FiTrash2, FiPlus, FiStar } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { STATIC_IMAGES } from '../../data/staticImages';

const CoinManager = () => {
  const [coins, setCoins] = useState([]);
  const [loading, setLoading] = useState(true);

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
      try {
        await adminService.deleteCoin(id);
        toast.success('Coin deleted successfully');
        fetchCoins();
      } catch (error) {
        toast.error('Failed to delete coin');
      }
    }
  };

  const handleToggleFeatured = async (id) => {
    try {
      await adminService.toggleFeatured(id);
      fetchCoins();
    } catch (error) {
      toast.error('Failed to update featured status');
    }
  };

  if (loading) return <Loader fullScreen />;

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-serif text-[#1a1a1a]">Coin Catalog</h1>
        <Link to="/admin/coins/new">
          <Button className="flex items-center">
            <FiPlus className="mr-2" /> Add New Coin
          </Button>
        </Link>
      </div>

      <div className="bg-white border border-gray-200 rounded-sm shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-[#FAFAF7]">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Artifact</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category & Era</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Featured</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {coins.map((coin) => (
                <tr key={coin._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div className="h-10 w-10 flex-shrink-0 bg-gray-100 p-1">
                        <img 
                          className="h-full w-full object-contain mix-blend-multiply" 
                          src={coin.images && coin.images[0]?.url ? coin.images[0].url : (typeof coin.images?.[0] === 'string' ? coin.images[0] : STATIC_IMAGES.placeholders.thumbnail)} 
                          alt="" 
                        />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900 line-clamp-1">{coin.name}</div>
                        <div className="text-xs text-gray-500">{coin.sku || 'No SKU'}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">{coin.category?.name || 'N/A'}</div>
                    <div className="text-xs text-gray-500">{coin.era}</div>
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">
                    {formatPrice(coin.sellingPrice !== undefined ? coin.sellingPrice : coin.price)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${coin.quantity > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {coin.quantity}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button 
                      onClick={() => handleToggleFeatured(coin._id)}
                      className={`p-1 rounded-full transition-colors ${coin.isFeatured ? 'text-yellow-500 hover:text-yellow-600' : 'text-gray-300 hover:text-gray-400'}`}
                    >
                      <FiStar className={coin.isFeatured ? 'fill-current' : ''} />
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <Link to={`/admin/coins/${coin._id}/edit`} className="text-[#B8860B] hover:text-[#8B6914] mr-4 inline-block">
                      <FiEdit2 className="w-4 h-4" />
                    </Link>
                    <button onClick={() => handleDelete(coin._id)} className="text-red-600 hover:text-red-900 inline-block">
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
