import { Link } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { useTheme } from '../../context/ThemeContext';
import CartItem from '../../components/cart/CartItem';
import CartSummary from '../../components/cart/CartSummary';
import EmptyState from '../../components/common/EmptyState';
import { FiShoppingCart } from 'react-icons/fi';
import Button from '../../components/common/Button';

const Cart = () => {
  const { cartItems, loading } = useCart();
  const { isDark } = useTheme();

  if (loading) return <div className={`text-center py-20 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Loading cart...</div>;

  if (cartItems.length === 0) {
    return (
      <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 ${isDark ? 'bg-dark-900' : 'bg-[#FAF8F5]'}`}>
        <EmptyState 
          title="Your Cart is Empty" 
          message="Looks like you haven't added any artifacts to your cart yet."
          icon={<FiShoppingCart className={`h-12 w-12 ${isDark ? 'text-gray-600' : 'text-gray-300'}`} />}
          action={
            <Link to="/explore">
              <Button>Explore Catalog</Button>
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <div className={`min-h-screen py-12 transition-colors ${isDark ? 'bg-dark-900 text-gray-100' : 'bg-[#FAF8F5] text-gray-900'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className={`text-3xl font-serif mb-8 ${isDark ? 'text-white' : 'text-gray-900'}`}>Shopping Cart</h1>
        
        <div className="flex flex-col lg:flex-row gap-12">
          <div className="flex-1">
            <div className={`border-t ${isDark ? 'border-dark-700' : 'border-gray-200'}`}>
              {cartItems.map(item => (
                <CartItem key={item._id} item={item} />
              ))}
            </div>
          </div>
          
          <div className="w-full lg:w-96 flex-shrink-0">
            <CartSummary />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;
