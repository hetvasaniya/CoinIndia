import { useState, useEffect } from 'react';
import adminService from '../../services/adminService';
import { formatPrice } from '../../utils/helpers';
import toast from 'react-hot-toast';
import { FiCheck } from 'react-icons/fi';

const Inventory = () => {
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editQty, setEditQty] = useState({});
  const [search, setSearch] = useState('');

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

  const handleQtyChange = (id, val) => {
    setEditQty({ ...editQty, [id]: val });
  };

  const updateQuantity = async (id) => {
    const qty = parseInt(editQty[id], 10);
    if (isNaN(qty) || qty < 0) {
      toast.error('Invalid quantity');
      return;
    }
    try {
      await adminService.updateQuantity(id, qty);
      toast.success('Quantity updated');
      const newInventory = inventory.map(item => item._id === id ? { ...item, quantity: qty } : item);
      setInventory(newInventory);
      const newEditQty = { ...editQty };
      delete newEditQty[id];
      setEditQty(newEditQty);
    } catch (error) {
      toast.error('Failed to update quantity');
    }
  };

  const filteredInventory = inventory.filter(item => 
    (item.name && item.name.toLowerCase().includes(search.toLowerCase())) ||
    (item.sku && item.sku.toLowerCase().includes(search.toLowerCase()))
  );

  if (loading) return <div className="p-8 text-gray-500">Loading inventory records...</div>;

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h1 className="text-2xl font-serif text-[#1a1a1a]">Inventory Management</h1>
        <div className="w-full sm:w-72">
          <input
            type="text"
            placeholder="Search by artifact name or SKU..."
            className="w-full px-3 py-2 border border-gray-300 rounded-sm focus:outline-none focus:ring-1 focus:ring-[#B8860B] focus:border-[#B8860B] text-sm bg-white"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>
      
      <div className="bg-white border border-gray-200 rounded-sm shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-[#FAFAF7]">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SKU</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Artefact</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock Qty</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Quick Update</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredInventory.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-sm text-gray-500">
                    No matching inventory items found.
                  </td>
                </tr>
              ) : (
                filteredInventory.map((item) => (
                  <tr key={item._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.sku || 'N/A'}</td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{item.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatPrice(item.price || item.sellingPrice)}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {item.quantity > 5 ? (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">In Stock</span>
                      ) : item.quantity > 0 ? (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">Low Stock</span>
                      ) : (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">Out of Stock</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                      {item.quantity}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end">
                        <input 
                          type="number" 
                          min="0"
                          placeholder="Qty"
                          className="w-20 px-2 py-1 text-sm border border-gray-300 rounded-l focus:outline-none focus:ring-1 focus:ring-[#B8860B]"
                          value={editQty[item._id] !== undefined ? editQty[item._id] : item.quantity}
                          onChange={(e) => handleQtyChange(item._id, e.target.value)}
                        />
                        <button 
                          onClick={() => updateQuantity(item._id)}
                          disabled={editQty[item._id] === undefined || editQty[item._id] == item.quantity}
                          className="bg-[#B8860B] text-white px-3 py-1 border border-[#B8860B] rounded-r disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          <FiCheck />
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
