import { Link } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import CartItem from '../../components/cart/CartItem';
import CartSummary from '../../components/cart/CartSummary';
import EmptyState from '../../components/common/EmptyState';
import { FiShoppingCart } from 'react-icons/fi';
import Button from '../../components/common/Button';

const Cart = () => {
  const { cartItems, loading } = useCart();

  if (loading) return <div className="text-center py-20">Loading cart...</div>;

  if (cartItems.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <EmptyState 
          title="Your Cart is Empty" 
          message="Looks like you haven't added any artifacts to your cart yet."
          icon={<FiShoppingCart className="h-12 w-12 text-gray-300" />}
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-serif text-[#1a1a1a] mb-8">Shopping Cart</h1>
      
      <div className="flex flex-col lg:flex-row gap-12">
        <div className="flex-1">
          <div className="border-t border-gray-200">
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
  );
};

export default Cart;
