import { Link } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { useTheme } from '../../context/ThemeContext';
import CartItem from '../../components/cart/CartItem';
import CartSummary from '../../components/cart/CartSummary';
import EmptyState from '../../components/common/EmptyState';
import { FiShoppingCart, FiArrowLeft } from 'react-icons/fi';
import Button from '../../components/common/Button';

const Cart = () => {
  const { cartItems, loading } = useCart();
  const { isDark } = useTheme();

  if (loading) return (
    <div className={`min-h-[50vh] flex items-center justify-center text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
      Loading shopping cart...
    </div>
  );

  if (cartItems.length === 0) {
    return (
      <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 ${isDark ? 'bg-dark-900' : 'bg-[#FAF8F5]'}`}>
        <EmptyState 
          title="Your Cart is Empty" 
          message="Looks like you haven't added any numismatic artifacts to your cart yet."
          icon={<FiShoppingCart className={`h-12 w-12 ${isDark ? 'text-gray-600' : 'text-gray-300'}`} />}
          action={
            <Link to="/explore">
              <Button className="shadow-gold uppercase tracking-wider text-xs sm:text-sm">
                Explore Catalog
              </Button>
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <div className={`min-h-screen py-6 sm:py-12 transition-colors ${isDark ? 'bg-dark-900 text-gray-100' : 'bg-[#FAF8F5] text-gray-900'}`}>
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 sm:mb-8 gap-2">
          <h1 className={`text-2xl sm:text-3xl font-serif font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Shopping Cart ({cartItems.length} {cartItems.length === 1 ? 'item' : 'items'})
          </h1>
          <Link to="/explore" className="text-xs sm:text-sm text-gold-500 hover:text-gold-400 flex items-center gap-1 font-medium">
            <FiArrowLeft className="w-3.5 h-3.5" /> Continue Shopping
          </Link>
        </div>
        
        <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
          {/* Cart Items List */}
          <div className="flex-1 min-w-0">
            <div className={`border-t ${isDark ? 'border-dark-700' : 'border-gray-200'}`}>
              {cartItems.map(item => (
                <CartItem key={item._id} item={item} />
              ))}
            </div>
          </div>
          
          {/* Cart Summary */}
          <div className="w-full lg:w-96 flex-shrink-0">
            <div className="sticky top-24">
              <CartSummary />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;
