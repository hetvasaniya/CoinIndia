import { Link } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { formatPrice } from '../../utils/helpers';
import Button from '../common/Button';

const CartSummary = ({ isCheckoutPage = false, checkoutHandler = null, loading = false }) => {
  const { cartItems } = useCart();

  const subtotal = cartItems.reduce(
    (acc, item) => acc + ((item.coin?.sellingPrice ?? item.coin?.price ?? 0) * (item.quantity || 1)),
    0
  );
  const tax = Math.round(subtotal * 0.18); // 18% GST
  const shipping = 0; // Free shipping
  const total = subtotal + tax + shipping;

  return (
    <div className="bg-gray-50 rounded-sm p-6">
      <h2 className="text-lg font-serif text-[#1a1a1a] mb-6">Order Summary</h2>
      
      <div className="space-y-4 text-sm text-gray-600 border-b border-gray-200 pb-4">
        <div className="flex justify-between">
          <p>Subtotal ({cartItems.length} items)</p>
          <p className="font-medium text-gray-900">{formatPrice(subtotal)}</p>
        </div>
        <div className="flex justify-between">
          <p>Estimated GST (18%)</p>
          <p className="font-medium text-gray-900">{formatPrice(tax)}</p>
        </div>
        <div className="flex justify-between">
          <p>Shipping</p>
          <p className="font-medium text-green-600">Free</p>
        </div>
      </div>

      <div className="flex justify-between py-4 border-b border-gray-200">
        <p className="text-base font-medium text-gray-900">Total</p>
        <p className="text-lg font-bold text-[#1a1a1a]">{formatPrice(total)}</p>
      </div>

      <div className="mt-6">
        {isCheckoutPage ? (
          <Button 
            className="w-full py-3 text-sm tracking-wider uppercase" 
            onClick={checkoutHandler}
            isLoading={loading}
            disabled={loading || cartItems.length === 0}
          >
            Complete Order
          </Button>
        ) : (
          <Link to="/checkout" className="block w-full">
            <Button className="w-full py-3 text-sm tracking-wider uppercase">
              Proceed to Checkout
            </Button>
          </Link>
        )}
      </div>
      
      <div className="mt-4 flex justify-center space-x-2 grayscale opacity-50">
        {/* Placeholder for payment icons */}
        <div className="h-6 w-10 bg-gray-300 rounded"></div>
        <div className="h-6 w-10 bg-gray-300 rounded"></div>
        <div className="h-6 w-10 bg-gray-300 rounded"></div>
      </div>
    </div>
  );
};

export default CartSummary;
