import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
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
  const navigate = useNavigate();

  const [shippingAddress, setShippingAddress] = useState({
    street: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'India',
    phone: ''
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

      // 1. If Demo / Mock Payment is selected (No Razorpay keys needed)
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

      // 2. If Razorpay Online Payment is selected
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
        name: 'Coin India',
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
          contact: shippingAddress.phone
        },
        theme: {
          color: '#B8860B'
        }
      };

      const rzp1 = new window.Razorpay(options);
      rzp1.on('payment.failed', function (response) {
        toast.error(response.error?.description || 'Payment failed');
      });
      rzp1.open();

    } catch (error) {
      toast.error(error.response?.data?.message || 'Checkout failed');
    } finally {
      setLoading(false);
    }
  };

  const hasSavedAddress = Boolean(user?.addresses?.[0]?.street);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-serif text-[#1a1a1a] mb-8">Checkout</h1>
      
      <div className="flex flex-col lg:flex-row gap-12">
        <div className="flex-1 space-y-8">
          <div className="bg-white p-6 border border-gray-200 rounded-sm">
            <div className="flex justify-between items-center mb-6 border-b pb-2">
              <h2 className="text-xl font-serif text-[#1a1a1a]">Shipping Address</h2>
              {hasSavedAddress && (
                <span className="text-xs bg-amber-50 text-[#B8860B] border border-amber-200 px-2.5 py-1 rounded">
                  Pre-filled from Profile
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Street Address"
                required
                className="md:col-span-2"
                placeholder="e.g., Flat 402, Heritage Heights, MG Road"
                value={shippingAddress.street}
                onChange={(e) => setShippingAddress({ ...shippingAddress, street: e.target.value })}
              />
              <Input
                label="City"
                required
                placeholder="e.g., Mumbai or New Delhi"
                value={shippingAddress.city}
                onChange={(e) => setShippingAddress({ ...shippingAddress, city: e.target.value })}
              />
              <Input
                label="State"
                required
                placeholder="e.g., Maharashtra"
                value={shippingAddress.state}
                onChange={(e) => setShippingAddress({ ...shippingAddress, state: e.target.value })}
              />
              <Input
                label="PIN Code"
                required
                placeholder="e.g., 400001"
                value={shippingAddress.zipCode}
                onChange={(e) => setShippingAddress({ ...shippingAddress, zipCode: e.target.value })}
              />
              <Input
                label="Phone Number"
                required
                placeholder="e.g., +91 98765 43210"
                value={shippingAddress.phone}
                onChange={(e) => setShippingAddress({ ...shippingAddress, phone: e.target.value })}
              />
            </div>

            <div className="mt-4 pt-4 border-t border-gray-100 flex items-center">
              <input
                id="saveToProfile"
                type="checkbox"
                checked={saveToProfile}
                onChange={(e) => setSaveToProfile(e.target.checked)}
                className="h-4 w-4 text-[#B8860B] focus:ring-[#B8860B] border-gray-300 rounded cursor-pointer"
              />
              <label htmlFor="saveToProfile" className="ml-2 block text-sm text-gray-700 cursor-pointer">
                Save this address in profile for future orders
              </label>
            </div>
          </div>

          {/* Payment Method Selector */}
          <div className="bg-white p-6 border border-gray-200 rounded-sm">
            <h2 className="text-xl font-serif text-[#1a1a1a] mb-4 border-b pb-2">Payment Method</h2>
            <div className="space-y-3">
              <label 
                className={`flex items-start p-4 border rounded-sm cursor-pointer transition-colors ${
                  paymentMethod === 'demo' ? 'border-[#B8860B] bg-amber-50/40' : 'border-gray-200 hover:bg-gray-50'
                }`}
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  value="demo"
                  checked={paymentMethod === 'demo'}
                  onChange={() => setPaymentMethod('demo')}
                  className="mt-1 h-4 w-4 text-[#B8860B] focus:ring-[#B8860B] border-gray-300"
                />
                <div className="ml-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-gray-900">Demo / Test Payment (Instant)</span>
                    <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded font-medium">
                      No Razorpay Keys Needed
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Simulate an instant successful payment to test full order processing and dashboards.
                  </p>
                </div>
              </label>

              <label 
                className={`flex items-start p-4 border rounded-sm cursor-pointer transition-colors ${
                  paymentMethod === 'razorpay' ? 'border-[#B8860B] bg-amber-50/40' : 'border-gray-200 hover:bg-gray-50'
                }`}
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  value="razorpay"
                  checked={paymentMethod === 'razorpay'}
                  onChange={() => setPaymentMethod('razorpay')}
                  className="mt-1 h-4 w-4 text-[#B8860B] focus:ring-[#B8860B] border-gray-300"
                />
                <div className="ml-3">
                  <span className="text-sm font-semibold text-gray-900">Online Payment (Razorpay Gateway)</span>
                  <p className="text-xs text-gray-500 mt-1">
                    Pay via UPI, Cards, Netbanking, or Wallets using your Razorpay account keys.
                  </p>
                </div>
              </label>
            </div>
          </div>
        </div>
        
        <div className="w-full lg:w-96 flex-shrink-0">
          <CartSummary isCheckoutPage={true} checkoutHandler={handleCheckout} loading={loading} />
        </div>
      </div>
    </div>
  );
};

export default Checkout;
