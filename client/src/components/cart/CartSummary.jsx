import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { useTheme } from '../../context/ThemeContext';
import { formatPrice } from '../../utils/helpers';
import settingsService from '../../services/settingsService';
import Button from '../common/Button';

const CartSummary = ({ isCheckoutPage = false, checkoutHandler = null, loading = false }) => {
  const { cartItems } = useCart();
  const { isDark } = useTheme();
  const [shippingRules, setShippingRules] = useState({ shippingCharge: 50, freeShippingThreshold: 999 });

  useEffect(() => {
    settingsService.getPublicSettings()
      .then(data => {
        if (data) {
          setShippingRules({
            shippingCharge: Number(data.shippingCharge) || 50,
            freeShippingThreshold: Number(data.freeShippingThreshold) || 999
          });
        }
      })
      .catch(() => {});
  }, []);

  const subtotal = cartItems.reduce(
    (acc, item) => acc + ((item.coin?.sellingPrice ?? item.coin?.price ?? 0) * (item.quantity || 1)),
    0
  );
  const tax = Math.round(subtotal * 0.18);
  const isFreeShipping = subtotal >= shippingRules.freeShippingThreshold;
  const shipping = isFreeShipping ? 0 : shippingRules.shippingCharge;
  const total = subtotal + tax + shipping;

  return (
    <div className={`rounded-lg p-6 border ${
      isDark ? 'bg-dark-800 border-dark-600' : 'bg-gray-50 border-gray-200'
    }`}>
      <h2 className={`text-lg font-serif mb-6 ${isDark ? 'text-white' : 'text-gray-900'}`}>Order Summary</h2>
      
      <div className={`space-y-4 text-sm border-b pb-4 ${
        isDark ? 'text-gray-400 border-dark-600' : 'text-gray-600 border-gray-200'
      }`}>
        <div className="flex justify-between">
          <p>Subtotal ({cartItems.length} items)</p>
          <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{formatPrice(subtotal)}</p>
        </div>
        <div className="flex justify-between">
          <p>Estimated GST (18%)</p>
          <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{formatPrice(tax)}</p>
        </div>
        <div className="flex justify-between">
          <p>Shipping</p>
          <p className={`font-medium ${isFreeShipping ? 'text-emerald-500' : isDark ? 'text-white' : 'text-gray-900'}`}>
            {isFreeShipping ? 'Free' : formatPrice(shipping)}
          </p>
        </div>
      </div>

      <div className={`flex justify-between py-4 border-b ${
        isDark ? 'border-dark-600' : 'border-gray-200'
      }`}>
        <p className={`text-base font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>Total</p>
        <p className={`text-lg font-bold ${isDark ? 'text-gold-400' : 'text-gray-900'}`}>{formatPrice(total)}</p>
      </div>

      <div className="mt-6">
        {isCheckoutPage ? (
          <Button className="w-full py-3 text-sm tracking-wider uppercase" onClick={checkoutHandler} isLoading={loading} disabled={loading || cartItems.length === 0}>
            Complete Order
          </Button>
        ) : (
          <Link to="/checkout" className="block w-full">
            <Button className="w-full py-3 text-sm tracking-wider uppercase">Proceed to Checkout</Button>
          </Link>
        )}
      </div>
      
      <div className="mt-4 flex justify-center space-x-2 opacity-40">
        <div className={`h-6 w-10 rounded ${isDark ? 'bg-dark-600' : 'bg-gray-300'}`}></div>
        <div className={`h-6 w-10 rounded ${isDark ? 'bg-dark-600' : 'bg-gray-300'}`}></div>
        <div className={`h-6 w-10 rounded ${isDark ? 'bg-dark-600' : 'bg-gray-300'}`}></div>
      </div>
    </div>
  );
};

export default CartSummary;
