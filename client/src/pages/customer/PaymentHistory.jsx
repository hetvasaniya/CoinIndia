import { useState, useEffect } from 'react';
import paymentService from '../../services/paymentService';
import { formatPrice, formatDate } from '../../utils/helpers';
import Loader from '../../components/common/Loader';
import { FiCreditCard, FiAlertCircle } from 'react-icons/fi';
import EmptyState from '../../components/common/EmptyState';

const PaymentHistory = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPayments = async () => {
      try {
        const data = await paymentService.getPaymentHistory();
        const paymentList = Array.isArray(data) ? data : (data?.payments || []);
        const formatted = paymentList.map(p => ({
          id: p._id,
          date: p.createdAt,
          orderId: p.order?.orderNumber || p.order?._id || p.order || 'N/A',
          amount: p.amount,
          method: 'Razorpay',
          status: p.status === 'captured' ? 'Successful' : (p.status || 'Successful')
        }));
        setPayments(formatted);
      } catch (error) {
        console.error('Failed to fetch payment history', error);
      } finally {
        setLoading(false);
      }
    };
    fetchPayments();
  }, []);

  if (loading) return <Loader fullScreen />;

  if (payments.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <EmptyState 
          title="No Payment History" 
          message="You have no successful payments on record."
          icon={<FiAlertCircle className="h-12 w-12 text-gray-300" />}
        />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-serif text-[#1a1a1a] mb-8">Payment History</h1>
      
      <div className="bg-white border border-gray-200 rounded-sm overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-[#FAFAF7]">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order ID</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Method</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {payments.map((payment) => (
              <tr key={payment.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatDate(payment.date)}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">#{payment.orderId.substring(payment.orderId.length - 8).toUpperCase()}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 flex items-center">
                  <FiCreditCard className="mr-2 text-gray-400" /> {payment.method}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                    {payment.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-gray-900">
                  {formatPrice(payment.amount)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PaymentHistory;
