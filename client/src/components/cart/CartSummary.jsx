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
    <div className={`rounded-2xl p-4 sm:p-6 border shadow-xs transition-colors ${
      isDark ? 'bg-dark-800 border-dark-600' : 'bg-white border-gray-200'
    }`}>
      <h2 className={`text-base sm:text-lg font-serif font-bold mb-4 sm:mb-6 ${isDark ? 'text-white' : 'text-gray-900'}`}>
        Order Summary
      </h2>
      
      <div className={`space-y-3 sm:space-y-4 text-xs sm:text-sm border-b pb-4 ${
        isDark ? 'text-gray-400 border-dark-700' : 'text-gray-600 border-gray-200'
      }`}>
        <div className="flex justify-between">
          <p>Subtotal ({cartItems.length} {cartItems.length === 1 ? 'item' : 'items'})</p>
          <p className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{formatPrice(subtotal)}</p>
        </div>
        <div className="flex justify-between">
          <p>Estimated GST (18%)</p>
          <p className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{formatPrice(tax)}</p>
        </div>
        <div className="flex justify-between items-center">
          <div>
            <p>Insured Shipping</p>
            {!isFreeShipping && (
              <span className="text-[10px] text-gray-500 block">
                Free above {formatPrice(shippingRules.freeShippingThreshold)}
              </span>
            )}
          </div>
          <p className={`font-semibold ${isFreeShipping ? 'text-emerald-500' : isDark ? 'text-white' : 'text-gray-900'}`}>
            {isFreeShipping ? 'FREE' : formatPrice(shipping)}
          </p>
        </div>
      </div>

      <div className={`flex justify-between py-4 border-b ${
        isDark ? 'border-dark-700' : 'border-gray-200'
      }`}>
        <p className={`text-sm sm:text-base font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Total Payable</p>
        <p className={`text-base sm:text-lg font-bold ${isDark ? 'text-gold-400' : 'text-gray-900'}`}>{formatPrice(total)}</p>
      </div>

      <div className="mt-5 sm:mt-6">
        {isCheckoutPage ? (
          <Button 
            className="w-full py-3 px-4 text-xs sm:text-sm font-semibold tracking-wider uppercase shadow-gold" 
            onClick={checkoutHandler} 
            isLoading={loading} 
            disabled={loading || cartItems.length === 0}
          >
            Complete Order
          </Button>
        ) : (
          <Link to="/checkout" className="block w-full">
            <Button className="w-full py-3 px-4 text-xs sm:text-sm font-semibold tracking-wider uppercase shadow-gold">
              Proceed to Checkout &rarr;
            </Button>
          </Link>
        )}
      </div>
      
      <p className="mt-4 text-[11px] text-center text-gray-500">
        🔒 256-Bit SSL Encrypted &bull; Razorpay &bull; Numismatic Transit
      </p>
    </div>
  );
};

export default CartSummary;
