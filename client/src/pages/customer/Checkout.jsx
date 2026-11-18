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
import { validateCheckoutAddress, isValidPhone, isValidPincode } from '../../utils/validation';

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
  const { user, updateUser } = useAuth();
  const { isDark } = useTheme();
  const navigate = useNavigate();

  const [shippingAddress, setShippingAddress] = useState({
    street: '', city: '', state: '', zipCode: '', country: 'India', phone: ''
  });
  const [errors, setErrors] = useState({});

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

  const handleAddressChange = (e) => {
    const { name, value } = e.target;
    setShippingAddress((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleAddressBlur = (field) => {
    if (field === 'street' && shippingAddress.street) {
      if (shippingAddress.street.trim().length < 5) {
        setErrors((prev) => ({ ...prev, street: 'Please enter a complete address (min 5 characters)' }));
      }
    }
    if (field === 'city' && shippingAddress.city) {
      if (shippingAddress.city.trim().length < 2) {
        setErrors((prev) => ({ ...prev, city: 'City name is required' }));
      }
    }
    if (field === 'state' && shippingAddress.state) {
      if (shippingAddress.state.trim().length < 2) {
        setErrors((prev) => ({ ...prev, state: 'State name is required' }));
      }
    }
    if (field === 'zipCode' && shippingAddress.zipCode) {
      if (!isValidPincode(shippingAddress.zipCode)) {
        setErrors((prev) => ({ ...prev, zipCode: 'Please enter a valid 6-digit PIN code' }));
      }
    }
    if (field === 'phone' && shippingAddress.phone) {
      if (!isValidPhone(shippingAddress.phone)) {
        setErrors((prev) => ({ ...prev, phone: 'Please enter a valid mobile number' }));
      }
    }
  };

  const handleCheckout = async () => {
    const { isValid, errors: validationErrors } = validateCheckoutAddress(shippingAddress);
    if (!isValid) {
      setErrors(validationErrors);
      toast.error('Please fix the shipping address errors');
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
          phone: shippingAddress.phone.trim(),
          addresses: [{
            street: shippingAddress.street.trim(),
            city: shippingAddress.city.trim(),
            state: shippingAddress.state.trim(),
            zipCode: shippingAddress.zipCode.trim(),
            country: shippingAddress.country.trim(),
            isDefault: true
          }]
        }).then(updated => {
          if (updated) updateUser(updated);
        }).catch(() => {});
      }

      if (paymentMethod === 'demo') {
        const orderData = {
          items: formattedItems,
          shippingAddress: {
            street: shippingAddress.street.trim(),
            city: shippingAddress.city.trim(),
            state: shippingAddress.state.trim(),
            zipCode: shippingAddress.zipCode.trim(),
            country: shippingAddress.country.trim(),
            phone: shippingAddress.phone.trim()
          },
          paymentMethod: 'Test / Demo Gateway'
        };

        const response = await orderService.createOrder(orderData);
        const orderId = response?.order?._id || response?._id;

        await paymentService.verifyPayment({
          orderId,
          paymentId: `demo_pay_${Date.now()}`,
          status: 'completed',
          paymentMethod: 'Test / Demo Gateway'
        });

        clearCart();
        toast.success('Order placed successfully!');
        navigate(`/orders/${orderId}`);
        return;
      }

      // Razorpay Payment Flow
      const isLoaded = await loadRazorpayScript();
      if (!isLoaded) {
        toast.error('Failed to load Razorpay SDK. Check your internet connection.');
        setLoading(false);
        return;
      }

      const orderData = {
        items: formattedItems,
        shippingAddress: {
          street: shippingAddress.street.trim(),
          city: shippingAddress.city.trim(),
          state: shippingAddress.state.trim(),
          zipCode: shippingAddress.zipCode.trim(),
          country: shippingAddress.country.trim(),
          phone: shippingAddress.phone.trim()
        },
        paymentMethod: 'Razorpay'
      };

      const response = await orderService.createOrder(orderData);
      const appOrder = response.order || response;

      const rzpOrderRes = await paymentService.createRazorpayOrder({
        orderId: appOrder._id,
        amount: appOrder.totalAmount
      });

      const options = {
        key: rzpOrderRes.keyId || import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: rzpOrderRes.amount,
        currency: rzpOrderRes.currency || 'INR',
        name: 'Coinomart',
        description: `Numismatic Order #${appOrder.orderNumber || appOrder._id.slice(-8)}`,
        order_id: rzpOrderRes.razorpayOrderId,
        handler: async (rzpRes) => {
          try {
            await paymentService.verifyPayment({
              orderId: appOrder._id,
              razorpayPaymentId: rzpRes.razorpay_payment_id,
              razorpayOrderId: rzpRes.razorpay_order_id,
              razorpaySignature: rzpRes.razorpay_signature,
              paymentMethod: 'Razorpay'
            });
            clearCart();
            toast.success('Payment verified! Order placed.');
            navigate(`/orders/${appOrder._id}`);
          } catch (err) {
            toast.error('Payment verification failed.');
            navigate(`/orders/${appOrder._id}`);
          }
        },
        prefill: {
          name: user?.name || '',
          email: user?.email || '',
          contact: shippingAddress.phone || user?.phone || ''
        },
        theme: {
          color: '#B8860B'
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function (rzpFailRes) {
        toast.error(`Payment failed: ${rzpFailRes.error.description}`);
      });
      rzp.open();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to initiate order placement');
    } finally {
      setLoading(false);
    }
  };

  const cardBg = isDark ? 'bg-dark-800 border-dark-600' : 'bg-white border-gray-200';

  return (
    <div className={`min-h-screen py-6 sm:py-12 transition-colors ${isDark ? 'bg-dark-900 text-gray-100' : 'bg-[#FAF8F5] text-gray-900'}`}>
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <h1 className={`text-2xl sm:text-3xl font-serif font-bold mb-6 sm:mb-8 ${isDark ? 'text-white' : 'text-gray-900'}`}>
          Checkout
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
          {/* Main Form (2 columns on lg) */}
          <div className="lg:col-span-2 space-y-6 sm:space-y-8">
            
            {/* 1. Shipping Address */}
            <div className={`border rounded-2xl p-4 sm:p-6 shadow-xs ${cardBg}`}>
              <h2 className={`text-base sm:text-lg font-serif font-bold mb-4 sm:mb-6 border-b pb-3 ${isDark ? 'text-white border-dark-700' : 'text-gray-900 border-gray-200'}`}>
                1. Delivery Shipping Address
              </h2>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="sm:col-span-2">
                  <Input 
                    label="Street Address" 
                    name="street"
                    required 
                    placeholder="House/Flat No., Building Name, Street" 
                    value={shippingAddress.street} 
                    onChange={handleAddressChange}
                    onBlur={() => handleAddressBlur('street')}
                    error={errors.street}
                  />
                </div>
                <Input 
                  label="City" 
                  name="city"
                  required 
                  placeholder="e.g., Mumbai, New Delhi" 
                  value={shippingAddress.city} 
                  onChange={handleAddressChange}
                  onBlur={() => handleAddressBlur('city')}
                  error={errors.city}
                />
                <Input 
                  label="State" 
                  name="state"
                  required 
                  placeholder="e.g., Maharashtra" 
                  value={shippingAddress.state} 
                  onChange={handleAddressChange}
                  onBlur={() => handleAddressBlur('state')}
                  error={errors.state}
                />
                <Input 
                  label="PIN / Zip Code" 
                  name="zipCode"
                  required 
                  placeholder="e.g., 400001" 
                  value={shippingAddress.zipCode} 
                  onChange={handleAddressChange}
                  onBlur={() => handleAddressBlur('zipCode')}
                  error={errors.zipCode}
                />
                <Input 
                  label="Phone Number" 
                  name="phone"
                  required 
                  placeholder="+91 98765 43210" 
                  value={shippingAddress.phone} 
                  onChange={handleAddressChange}
                  onBlur={() => handleAddressBlur('phone')}
                  error={errors.phone}
                />
              </div>

              <div className="mt-3 flex items-center">
                <input 
                  id="saveProfile" 
                  type="checkbox" 
                  checked={saveToProfile} 
                  onChange={(e) => setSaveToProfile(e.target.checked)} 
                  className="h-4 w-4 text-gold-500 focus:ring-gold-500 border-gray-300 rounded accent-gold-500 cursor-pointer" 
                />
                <label htmlFor="saveProfile" className={`ml-2 text-xs sm:text-sm cursor-pointer ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                  Save this address to my profile for future orders
                </label>
              </div>
            </div>

            {/* 2. Payment Method */}
            <div className={`border rounded-2xl p-4 sm:p-6 shadow-xs ${cardBg}`}>
              <h2 className={`text-base sm:text-lg font-serif font-bold mb-4 sm:mb-6 border-b pb-3 ${isDark ? 'text-white border-dark-700' : 'text-gray-900 border-gray-200'}`}>
                2. Select Payment Method
              </h2>

              <div className="space-y-3">
                <label className={`flex items-start p-3.5 sm:p-4 border rounded-xl cursor-pointer transition-all ${
                  paymentMethod === 'demo'
                    ? 'border-gold-500 bg-gold-500/10'
                    : isDark ? 'border-dark-700 bg-dark-750/50 hover:border-dark-600' : 'border-gray-200 bg-gray-50 hover:border-gray-300'
                }`}>
                  <input 
                    type="radio" 
                    name="payment" 
                    value="demo" 
                    checked={paymentMethod === 'demo'} 
                    onChange={() => setPaymentMethod('demo')} 
                    className="w-4 h-4 text-gold-500 accent-gold-500 mt-0.5" 
                  />
                  <div className="ml-3 min-w-0">
                    <span className={`block text-xs sm:text-sm font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      Test / Instant Demo Payment (Recommended for Testing)
                    </span>
                    <span className={`text-[11px] sm:text-xs block mt-0.5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                      Instantly completes order without requiring credit card or UPI credentials.
                    </span>
                  </div>
                </label>

                <label className={`flex items-start p-3.5 sm:p-4 border rounded-xl cursor-pointer transition-all ${
                  paymentMethod === 'razorpay'
                    ? 'border-gold-500 bg-gold-500/10'
                    : isDark ? 'border-dark-700 bg-dark-750/50 hover:border-dark-600' : 'border-gray-200 bg-gray-50 hover:border-gray-300'
                }`}>
                  <input 
                    type="radio" 
                    name="payment" 
                    value="razorpay" 
                    checked={paymentMethod === 'razorpay'} 
                    onChange={() => setPaymentMethod('razorpay')} 
                    className="w-4 h-4 text-gold-500 accent-gold-500 mt-0.5" 
                  />
                  <div className="ml-3 min-w-0">
                    <span className={`block text-xs sm:text-sm font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      Razorpay Online Gateway (UPI, Cards, NetBanking, Wallets)
                    </span>
                    <span className={`text-[11px] sm:text-xs block mt-0.5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                      Real-time secure Indian payment gateway checkout.
                    </span>
                  </div>
                </label>
              </div>
            </div>
          </div>

          {/* Right Column: Order Summary */}
          <div className="w-full">
            <div className="sticky top-24">
              <CartSummary 
                isCheckoutPage 
                checkoutHandler={handleCheckout} 
                loading={loading} 
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
