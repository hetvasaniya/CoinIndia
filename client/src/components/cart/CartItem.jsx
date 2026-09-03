import { Link } from 'react-router-dom';
import { FiTrash2 } from 'react-icons/fi';
import { useCart } from '../../context/CartContext';
import { useTheme } from '../../context/ThemeContext';
import { formatPrice, getImageUrl } from '../../utils/helpers';

const CartItem = ({ item }) => {
  const { updateQuantity, removeFromCart } = useCart();
  const { isDark } = useTheme();
  const { coin, quantity } = item;

  if (!coin) return null;

  return (
    <div className={`flex items-center py-6 border-b ${
      isDark ? 'border-dark-600' : 'border-gray-200'
    }`}>
      <Link to={`/coins/${coin.slug}`} className={`w-24 h-24 flex-shrink-0 border p-2 rounded-lg ${
        isDark ? 'bg-dark-700 border-dark-600' : 'bg-[#FAFAF7] border-gray-100'
      }`}>
        <img 
          src={getImageUrl(coin.images)} 
          alt={coin.name} 
          className={`w-full h-full object-contain ${isDark ? '' : 'mix-blend-multiply'}`} 
        />
      </Link>

      <div className="ml-6 flex-1 flex flex-col">
        <div className="flex justify-between">
          <div>
            <h3 className={`text-base font-serif ${isDark ? 'text-white' : 'text-gray-900'}`}>
              <Link to={`/coins/${coin.slug}`} className="hover:text-gold-500 transition-colors">{coin.name}</Link>
            </h3>
            <p className={`mt-1 text-sm ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>{coin.yearOfIssue || coin.year} &middot; {coin.condition}</p>
          </div>
          <p className={`text-base font-medium ${isDark ? 'text-gold-400' : 'text-gray-900'}`}>{formatPrice(coin.sellingPrice ?? coin.price ?? 0)}</p>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <div className={`flex items-center border rounded-lg ${
            isDark ? 'border-dark-600' : 'border-gray-300'
          }`}>
            <button
              onClick={() => updateQuantity(coin._id, Math.max(1, quantity - 1))}
              className={`px-3 py-1 transition-colors ${isDark ? 'text-gray-400 hover:bg-dark-700' : 'text-gray-600 hover:bg-gray-100'}`}
              disabled={quantity <= 1}
            >-</button>
            <span className={`px-3 py-1 text-sm text-center min-w-[2rem] ${isDark ? 'text-white' : 'text-gray-900'}`}>{quantity}</span>
            <button
              onClick={() => updateQuantity(coin._id, Math.min(coin.quantity, quantity + 1))}
              className={`px-3 py-1 transition-colors ${isDark ? 'text-gray-400 hover:bg-dark-700' : 'text-gray-600 hover:bg-gray-100'}`}
              disabled={quantity >= coin.quantity}
            >+</button>
          </div>

          <button
            onClick={() => removeFromCart(coin._id)}
            className="text-sm font-medium text-red-500 hover:text-red-400 flex items-center transition-colors"
          >
            <FiTrash2 className="mr-1" /> Remove
          </button>
        </div>
      </div>
    </div>
  );
};

export default CartItem;
