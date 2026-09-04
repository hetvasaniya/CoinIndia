import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import orderService from '../../services/orderService';
import paymentService from '../../services/paymentService';
import authService from '../../services/authService';
import CartSummary from '../../components/cart/CartSummary';
import Input from '../../components/common/Input';
import toast from 'react-hot-toast';

const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

const Checkout = () => {
  const { cartItems, clearCart } = useCart();
  const { user, checkUser } = useAuth();
  const { isDark } = useTheme();
  const navigate = useNavigate();

  const [shippingAddress, setShippingAddress] = useState({
    street: '', city: '', state: '', zipCode: '', country: 'India', phone: ''
  });

  const [paymentMethod, setPaymentMethod] = useState('demo');
  const [saveToProfile, setSaveToProfile] = useState(true);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      const savedAddr = user.addresses?.[0] || {};
      setShippingAddress({
        street: savedAddr.street || '',
        city: savedAddr.city || '',
        state: savedAddr.state || '',
        zipCode: savedAddr.zipCode || '',
        country: savedAddr.country || 'India',
        phone: user.phone || ''
      });
    }
  }, [user]);

  const handleCheckout = async () => {
    if (!shippingAddress.street || !shippingAddress.city || !shippingAddress.state || !shippingAddress.zipCode || !shippingAddress.phone) {
      toast.error('Please fill all required address fields');
      return;
    }

    if (cartItems.length === 0) {
      toast.error('Your cart is empty');
      return;
    }

    setLoading(true);

    try {
      const formattedItems = cartItems.map((item) => ({
        coin: item.coin._id || item.coin,
        quantity: item.quantity
      }));

      if (saveToProfile) {
        authService.updateProfile({
          phone: shippingAddress.phone,
          addresses: [{
            street: shippingAddress.street,
            city: shippingAddress.city,
            state: shippingAddress.state,
            zipCode: shippingAddress.zipCode,
            country: shippingAddress.country,
            isDefault: true
          }]
        }).then(() => checkUser()).catch(() => {});
      }

      if (paymentMethod === 'demo') {
        const demoRes = await paymentService.demoCheckout({
          items: formattedItems,
          shippingAddress,
          billingAddress: shippingAddress
        });
        toast.success('Test payment successful!');
        await clearCart();
        navigate(`/orders/${demoRes.order._id}`);
        return;
      }

      const isLoaded = await loadRazorpayScript();
      if (!isLoaded) {
        toast.error('Razorpay SDK failed to load. Are you online?');
        setLoading(false);
        return;
      }

      const orderRes = await orderService.createOrder({
        items: formattedItems,
        shippingAddress
      });

      const razorpayOrderId = orderRes.razorpayOrder?.id || orderRes.order?.razorpayOrderId;
      const payableAmount = orderRes.totalAmount || orderRes.order?.totalAmount;

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_YourKeyHere',
        amount: Math.round(payableAmount * 100).toString(),
        currency: 'INR',
        name: 'Coinomart',
        description: 'Numismatic Artifacts',
        order_id: razorpayOrderId,
        handler: async (response) => {
          try {
            const verifyRes = await paymentService.verifyPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              items: formattedItems,
              shippingAddress,
              billingAddress: shippingAddress,
            });
            toast.success('Payment successful!');
            await clearCart();
            navigate(`/orders/${verifyRes.order._id}`);
          } catch (error) {
            toast.error(error.response?.data?.message || 'Payment verification failed');
          }
        },
        prefill: {
          name: user?.name || '',
          email: user?.email || '',
          contact: shippingAddress.phone || '',
        },
        theme: {
          color: '#B8860B',
        },
      };

      const paymentObject = new window.Razorpay(options);
      paymentObject.open();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to initialize checkout');
    } finally {
      setLoading(false);
    }
  };

  const cardBg = isDark ? 'bg-dark-800 border-dark-700' : 'bg-white border-gray-200';
  const labelClass = `block text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`;

  return (
    <div className={`min-h-screen py-12 transition-colors ${isDark ? 'bg-dark-900 text-gray-100' : 'bg-[#FAF8F5] text-gray-900'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className={`text-3xl font-serif mb-8 ${isDark ? 'text-white' : 'text-gray-900'}`}>Checkout</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          <div className="lg:col-span-2 space-y-8">
            {/* Shipping Address */}
            <div className={`border rounded-xl p-6 shadow-sm ${cardBg}`}>
              <h2 className={`text-xl font-serif mb-6 border-b pb-3 ${isDark ? 'text-white border-dark-700' : 'text-gray-900 border-gray-200'}`}>
                1. Delivery Shipping Address
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <Input label="Street Address" required placeholder="House/Flat No., Building Name, Street" value={shippingAddress.street} onChange={(e) => setShippingAddress({ ...shippingAddress, street: e.target.value })} />
                </div>
                <Input label="City" required placeholder="e.g., Mumbai, New Delhi" value={shippingAddress.city} onChange={(e) => setShippingAddress({ ...shippingAddress, city: e.target.value })} />
                <Input label="State" required placeholder="e.g., Maharashtra" value={shippingAddress.state} onChange={(e) => setShippingAddress({ ...shippingAddress, state: e.target.value })} />
                <Input label="PIN / Zip Code" required placeholder="e.g., 400001" value={shippingAddress.zipCode} onChange={(e) => setShippingAddress({ ...shippingAddress, zipCode: e.target.value })} />
                <Input label="Phone Number" required placeholder="+91 98765 43210" value={shippingAddress.phone} onChange={(e) => setShippingAddress({ ...shippingAddress, phone: e.target.value })} />
              </div>

              <div className="mt-4 flex items-center">
                <input id="saveProfile" type="checkbox" checked={saveToProfile} onChange={(e) => setSaveToProfile(e.target.checked)} className="h-4 w-4 text-gold-500 focus:ring-gold-500 border-gray-300 rounded accent-gold-500" />
                <label htmlFor="saveProfile" className={`ml-2 text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  Save this address to my profile for future orders
                </label>
              </div>
            </div>

            {/* Payment Method */}
            <div className={`border rounded-xl p-6 shadow-sm ${cardBg}`}>
              <h2 className={`text-xl font-serif mb-6 border-b pb-3 ${isDark ? 'text-white border-dark-700' : 'text-gray-900 border-gray-200'}`}>
                2. Select Payment Method
              </h2>

              <div className="space-y-4">
                <label className={`flex items-center p-4 border rounded-xl cursor-pointer transition-all ${
                  paymentMethod === 'demo'
                    ? 'border-gold-500 bg-gold-500/10'
                    : isDark ? 'border-dark-700 bg-dark-700/50' : 'border-gray-200 bg-gray-50'
                }`}>
                  <input type="radio" name="payment" value="demo" checked={paymentMethod === 'demo'} onChange={() => setPaymentMethod('demo')} className="w-4 h-4 text-gold-500 accent-gold-500" />
                  <div className="ml-3">
                    <span className={`block text-sm font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      Test / Instant Demo Payment (Recommended for Testing)
                    </span>
                    <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                      Instantly completes order without requiring credit card or UPI credentials.
                    </span>
                  </div>
                </label>

                <label className={`flex items-center p-4 border rounded-xl cursor-pointer transition-all ${
                  paymentMethod === 'razorpay'
                    ? 'border-gold-500 bg-gold-500/10'
                    : isDark ? 'border-dark-700 bg-dark-700/50' : 'border-gray-200 bg-gray-50'
                }`}>
                  <input type="radio" name="payment" value="razorpay" checked={paymentMethod === 'razorpay'} onChange={() => setPaymentMethod('razorpay')} className="w-4 h-4 text-gold-500 accent-gold-500" />
                  <div className="ml-3">
                    <span className={`block text-sm font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      Razorpay Online Payment (UPI, Cards, NetBanking, Wallets)
                    </span>
                    <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                      Secure payment gateway integration.
                    </span>
                  </div>
                </label>
              </div>
            </div>
          </div>

          <div>
            <CartSummary isCheckoutPage checkoutHandler={handleCheckout} loading={loading} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
