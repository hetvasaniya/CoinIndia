import { useState, useEffect } from 'react';
import orderService from '../../services/orderService';
import { formatPrice } from '../../utils/helpers';
import Loader from '../../components/common/Loader';
import EmptyState from '../../components/common/EmptyState';
import { FiCreditCard } from 'react-icons/fi';
import { useTheme } from '../../context/ThemeContext';

const PaymentHistory = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const { isDark } = useTheme();

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    try {
      const orders = await orderService.getMyOrders();
      const list = Array.isArray(orders) ? orders : (orders?.orders || []);
      const payList = list.map(o => ({
        id: o._id,
        orderNumber: o.orderNumber || o._id.slice(-8).toUpperCase(),
        amount: o.totalAmount,
        date: o.createdAt,
        status: o.paymentStatus || 'completed',
        method: o.paymentMethod || 'Online Payment'
      }));
      setPayments(payList);
    } catch (error) {
      console.error('Error fetching payments', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Loader fullScreen />;

  const cardBg = isDark ? 'bg-dark-800 border-dark-700' : 'bg-white border-gray-200';

  return (
    <div className={`min-h-screen py-12 transition-colors ${isDark ? 'bg-dark-900 text-gray-100' : 'bg-[#FAF8F5] text-gray-900'}`}>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className={`text-3xl font-serif mb-8 ${isDark ? 'text-white' : 'text-gray-900'}`}>Payment History</h1>

        {payments.length === 0 ? (
          <EmptyState 
            title="No Payment History" 
            message="Your payment transactions will appear here once you place orders."
            icon={<FiCreditCard className={`h-12 w-12 ${isDark ? 'text-gray-600' : 'text-gray-300'}`} />}
          />
        ) : (
          <div className={`border rounded-xl shadow-sm overflow-hidden ${cardBg}`}>
            <div className="overflow-x-auto">
              <table className={`min-w-full divide-y ${isDark ? 'divide-dark-700' : 'divide-gray-200'}`}>
                <thead className={isDark ? 'bg-dark-700/50' : 'bg-gray-50'}>
                  <tr>
                    <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Order #</th>
                    <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Date</th>
                    <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Method</th>
                    <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Amount</th>
                    <th className={`px-6 py-3 text-right text-xs font-medium uppercase tracking-wider ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Status</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${isDark ? 'divide-dark-700' : 'divide-gray-200'}`}>
                  {payments.map((p) => (
                    <tr key={p.id} className={`transition-colors ${isDark ? 'hover:bg-dark-700/50' : 'hover:bg-gray-50'}`}>
                      <td className={`px-6 py-4 text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{p.orderNumber}</td>
                      <td className={`px-6 py-4 text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{new Date(p.date).toLocaleDateString()}</td>
                      <td className={`px-6 py-4 text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{p.method}</td>
                      <td className="px-6 py-4 text-sm font-bold text-gold-500">{formatPrice(p.amount)}</td>
                      <td className="px-6 py-4 text-right text-xs font-semibold">
                        <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 capitalize">
                          {p.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentHistory;
