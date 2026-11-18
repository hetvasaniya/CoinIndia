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
    <div className={`py-4 sm:py-6 border-b transition-colors flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-6 ${
      isDark ? 'border-dark-700' : 'border-gray-200'
    }`}>
      {/* Thumbnail + Title Row on Mobile */}
      <div className="flex items-center gap-3 w-full sm:w-auto">
        <Link 
          to={`/coins/${coin.slug}`} 
          className={`w-20 h-20 sm:w-24 sm:h-24 flex-shrink-0 border p-2 rounded-xl overflow-hidden ${
            isDark ? 'bg-dark-800 border-dark-600' : 'bg-[#FAFAF7] border-gray-200'
          }`}
        >
          <img 
            src={getImageUrl(coin.images)} 
            alt={coin.name} 
            className="w-full h-full object-contain" 
          />
        </Link>

        {/* Mobile title & price (visible on xs, hidden on desktop) */}
        <div className="flex-1 sm:hidden">
          <h3 className={`text-sm font-serif font-semibold leading-snug line-clamp-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            <Link to={`/coins/${coin.slug}`} className="hover:text-gold-500 transition-colors">
              {coin.name}
            </Link>
          </h3>
          <p className={`mt-0.5 text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            {coin.yearOfIssue || coin.year || 'Historical'} &middot; {coin.condition || 'UNC'}
          </p>
          <p className={`text-sm font-bold mt-1 ${isDark ? 'text-gold-400' : 'text-gray-900'}`}>
            {formatPrice(coin.sellingPrice ?? coin.price ?? 0)}
          </p>
        </div>
      </div>

      {/* Desktop Info & Quantity / Price Controls */}
      <div className="flex-1 w-full flex flex-col justify-between">
        <div className="hidden sm:flex justify-between items-start gap-4">
          <div>
            <h3 className={`text-base font-serif font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              <Link to={`/coins/${coin.slug}`} className="hover:text-gold-500 transition-colors">
                {coin.name}
              </Link>
            </h3>
            <p className={`mt-1 text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              {coin.yearOfIssue || coin.year || 'Historical'} &middot; {coin.condition || 'UNC'} Grade
            </p>
          </div>
          <p className={`text-base font-bold ${isDark ? 'text-gold-400' : 'text-gray-900'}`}>
            {formatPrice(coin.sellingPrice ?? coin.price ?? 0)}
          </p>
        </div>

        {/* Action Controls: Quantity +/- and Remove Button */}
        <div className="mt-2 sm:mt-4 flex items-center justify-between sm:justify-start gap-4 w-full">
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 sm:hidden">Qty:</span>
            <div className={`flex items-center border rounded-lg overflow-hidden ${
              isDark ? 'border-dark-600 bg-dark-800' : 'border-gray-300 bg-white'
            }`}>
              <button
                onClick={() => updateQuantity(coin._id, Math.max(1, quantity - 1))}
                className={`w-8 h-8 flex items-center justify-center font-bold text-base transition-colors ${
                  isDark ? 'text-gray-300 hover:bg-dark-700' : 'text-gray-600 hover:bg-gray-100'
                } ${quantity <= 1 ? 'opacity-40 cursor-not-allowed' : ''}`}
                disabled={quantity <= 1}
                aria-label="Decrease quantity"
              >
                &minus;
              </button>
              
              <span className={`w-8 text-center text-xs sm:text-sm font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {quantity}
              </span>
              
              <button
                onClick={() => updateQuantity(coin._id, Math.min(coin.quantity || 10, quantity + 1))}
                className={`w-8 h-8 flex items-center justify-center font-bold text-base transition-colors ${
                  isDark ? 'text-gray-300 hover:bg-dark-700' : 'text-gray-600 hover:bg-gray-100'
                } ${quantity >= (coin.quantity || 10) ? 'opacity-40 cursor-not-allowed' : ''}`}
                disabled={quantity >= (coin.quantity || 10)}
                aria-label="Increase quantity"
              >
                +
              </button>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs sm:hidden text-gray-400">
              Total: <strong className={isDark ? 'text-gold-400' : 'text-gray-900'}>{formatPrice((coin.sellingPrice ?? coin.price ?? 0) * quantity)}</strong>
            </span>

            <button
              onClick={() => removeFromCart(coin._id)}
              className={`p-2 rounded-lg transition-colors border flex items-center justify-center ${
                isDark 
                  ? 'border-dark-600 text-red-400 hover:bg-red-500/10 hover:border-red-500/40' 
                  : 'border-gray-200 text-red-500 hover:bg-red-50 hover:border-red-200'
              }`}
              title="Remove artifact from cart"
              aria-label="Remove item"
            >
              <FiTrash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartItem;
