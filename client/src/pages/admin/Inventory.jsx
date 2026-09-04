import { useState, useEffect } from 'react';
import adminService from '../../services/adminService';
import { formatPrice } from '../../utils/helpers';
import { useTheme } from '../../context/ThemeContext';
import toast from 'react-hot-toast';
import { FiCheck } from 'react-icons/fi';

const Inventory = () => {
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editQty, setEditQty] = useState({});
  const [search, setSearch] = useState('');
  const { isDark } = useTheme();

  useEffect(() => {
    fetchInventory();
  }, []);

  const fetchInventory = async () => {
    try {
      const res = await adminService.getCoins();
      const parseArray = (r) => (Array.isArray(r) ? r : (r?.coins || r?.data || []));
      setInventory(parseArray(res));
    } catch (error) {
      toast.error('Failed to fetch inventory');
    } finally {
      setLoading(false);
    }
  };

  const [updatingId, setUpdatingId] = useState(null);

  const handleQtyChange = (id, val) => {
    setEditQty({ ...editQty, [id]: val });
  };

  const updateQuantity = async (id) => {
    const rawVal = editQty[id];
    const qty = parseInt(rawVal, 10);
    if (isNaN(qty) || qty < 0) {
      toast.error('Please enter a valid non-negative quantity number');
      return;
    }
    setUpdatingId(id);
    try {
      await adminService.updateQuantity(id, qty);
      toast.success(`Quantity updated to ${qty}`);
      const newInventory = inventory.map(item => item._id === id ? { ...item, quantity: qty } : item);
      setInventory(newInventory);
      const newEditQty = { ...editQty };
      delete newEditQty[id];
      setEditQty(newEditQty);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update quantity');
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredInventory = inventory.filter(item => 
    (item.name && item.name.toLowerCase().includes(search.toLowerCase())) ||
    (item.sku && item.sku.toLowerCase().includes(search.toLowerCase()))
  );

  if (loading) return <div className={`p-8 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Loading inventory records...</div>;

  const cardBg = isDark ? 'bg-dark-800 border-dark-700' : 'bg-white border-gray-200';

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h1 className={`text-2xl font-serif ${isDark ? 'text-white' : 'text-gray-900'}`}>Inventory Management</h1>
        <div className="w-full sm:w-72">
          <input
            type="text"
            placeholder="Search by artifact name or SKU..."
            className={`w-full px-3 py-2 border rounded-lg text-sm transition-all focus:outline-none focus:ring-1 focus:ring-gold-500 focus:border-gold-500 ${
              isDark ? 'bg-dark-700 border-dark-600 text-white placeholder-gray-500' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
            }`}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>
      
      <div className={`border rounded-xl shadow-sm overflow-hidden ${cardBg}`}>
        <div className="overflow-x-auto">
          <table className={`min-w-full divide-y ${isDark ? 'divide-dark-700' : 'divide-gray-200'}`}>
            <thead className={isDark ? 'bg-dark-700/50' : 'bg-gray-50'}>
              <tr>
                <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>SKU</th>
                <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Artefact</th>
                <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Price</th>
                <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Status</th>
                <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Stock Qty</th>
                <th className={`px-6 py-3 text-right text-xs font-medium uppercase tracking-wider ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Quick Update</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${isDark ? 'divide-dark-700' : 'divide-gray-200'}`}>
              {filteredInventory.length === 0 ? (
                <tr>
                  <td colSpan="6" className={`px-6 py-8 text-center text-sm ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                    No matching inventory items found.
                  </td>
                </tr>
              ) : (
                filteredInventory.map((item) => (
                  <tr key={item._id} className={`transition-colors ${isDark ? 'hover:bg-dark-700/50' : 'hover:bg-gray-50'}`}>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{item.sku || 'N/A'}</td>
                    <td className={`px-6 py-4 text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{item.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gold-500">{formatPrice(item.price || item.sellingPrice)}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {item.quantity > 5 ? (
                        <span className="px-2 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">In Stock</span>
                      ) : item.quantity > 0 ? (
                        <span className="px-2 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/20">Low Stock</span>
                      ) : (
                        <span className="px-2 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-500/10 text-red-500 border border-red-500/20">Out of Stock</span>
                      )}
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {item.quantity}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end">
                        <input 
                          type="number" 
                          min="0"
                          placeholder="Qty"
                          className={`w-20 px-2 py-1 text-sm border rounded-l-lg focus:outline-none focus:ring-1 focus:ring-gold-500 ${
                            isDark ? 'bg-dark-700 border-dark-600 text-white' : 'bg-white border-gray-300 text-gray-900'
                          }`}
                          value={editQty[item._id] !== undefined ? editQty[item._id] : item.quantity}
                          onChange={(e) => handleQtyChange(item._id, e.target.value)}
                        />
                        <button 
                          onClick={() => updateQuantity(item._id)}
                          disabled={updatingId === item._id || editQty[item._id] === undefined || editQty[item._id] == item.quantity}
                          className="bg-gold-500 text-white px-3 py-1 border border-gold-500 rounded-r-lg disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gold-600 transition-colors flex items-center justify-center min-w-[36px]"
                          title="Save quantity"
                        >
                          {updatingId === item._id ? (
                            <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                          ) : (
                            <FiCheck className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Inventory;
