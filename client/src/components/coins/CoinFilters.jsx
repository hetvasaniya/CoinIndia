import { ERA_OPTIONS } from '../../utils/constants';
import { useTheme } from '../../context/ThemeContext';

const CoinFilters = ({ 
  filters, 
  setFilters, 
  categories, 
  mints,
  className = '',
  onClose = null
}) => {
  const { isDark } = useTheme();

  const handleCategoryChange = (categoryId) => {
    const updatedCategories = filters.categories.includes(categoryId)
      ? filters.categories.filter(id => id !== categoryId)
      : [...filters.categories, categoryId];
    setFilters({ ...filters, categories: updatedCategories });
  };

  const handleEraChange = (era) => {
    setFilters({ ...filters, era: era === 'All Eras' ? '' : era });
  };

  const handleMintChange = (mintId) => {
    const updatedMints = filters.mints.includes(mintId)
      ? filters.mints.filter(id => id !== mintId)
      : [...filters.mints, mintId];
    setFilters({ ...filters, mints: updatedMints });
  };

  const sectionHeading = `font-serif text-base sm:text-lg mb-3 pb-2 border-b ${isDark ? 'text-white border-dark-700' : 'text-gray-900 border-gray-200'}`;
  const labelText = `ml-3 text-xs sm:text-sm transition-colors ${isDark ? 'text-gray-300 group-hover:text-white' : 'text-gray-700 group-hover:text-gray-900'}`;

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Categories */}
      <div>
        <h3 className={sectionHeading}>Category</h3>
        <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
          {categories.map((category) => (
            <label key={category._id} className="flex items-center cursor-pointer group py-0.5">
              <input
                type="checkbox"
                className="w-4 h-4 text-gold-500 border-gray-300 rounded focus:ring-gold-500 accent-gold-500"
                checked={filters.categories.includes(category._id)}
                onChange={() => handleCategoryChange(category._id)}
              />
              <span className={labelText}>{category.name}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Era */}
      <div>
        <h3 className={sectionHeading}>Era</h3>
        <div className="space-y-2.5 max-h-52 overflow-y-auto pr-1">
          {ERA_OPTIONS.map((era) => (
            <label key={era} className="flex items-center cursor-pointer group py-0.5">
              <input
                type="radio"
                name="era"
                className="w-4 h-4 text-gold-500 border-gray-300 focus:ring-gold-500 accent-gold-500"
                checked={filters.era === era || (era === 'All Eras' && !filters.era)}
                onChange={() => handleEraChange(era)}
              />
              <span className={labelText}>{era}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Mints */}
      <div>
        <h3 className={sectionHeading}>Mint of Origin</h3>
        <div className="flex flex-wrap gap-1.5 max-h-44 overflow-y-auto pr-1">
          {mints.map((mint) => {
            const isSelected = filters.mints.includes(mint._id);
            return (
              <button
                type="button"
                key={mint._id}
                onClick={() => handleMintChange(mint._id)}
                className={`px-2.5 py-1 text-xs rounded-full border transition-all ${
                  isSelected 
                    ? 'bg-gold-500 border-gold-500 text-white font-medium shadow-xs' 
                    : isDark 
                      ? 'bg-dark-700 border-dark-600 text-gray-300 hover:border-gold-500 hover:text-gold-400'
                      : 'bg-white border-gray-300 text-gray-700 hover:border-gold-500 hover:text-gold-600'
                }`}
              >
                {mint.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* Price Range */}
      <div>
        <h3 className={sectionHeading}>Price Range (₹)</h3>
        <div className="flex items-center space-x-2">
          <input
            type="number"
            placeholder="Min ₹"
            className={`w-full px-2.5 py-1.5 text-xs sm:text-sm border rounded-lg transition-colors focus:ring-gold-500 focus:border-gold-500 ${
              isDark ? 'bg-dark-700 border-dark-600 text-white placeholder-gray-500' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
            }`}
            value={filters.minPrice || ''}
            onChange={(e) => setFilters({ ...filters, minPrice: e.target.value })}
          />
          <span className={isDark ? 'text-gray-500' : 'text-gray-400'}>-</span>
          <input
            type="number"
            placeholder="Max ₹"
            className={`w-full px-2.5 py-1.5 text-xs sm:text-sm border rounded-lg transition-colors focus:ring-gold-500 focus:border-gold-500 ${
              isDark ? 'bg-dark-700 border-dark-600 text-white placeholder-gray-500' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
            }`}
            value={filters.maxPrice || ''}
            onChange={(e) => setFilters({ ...filters, maxPrice: e.target.value })}
          />
        </div>
      </div>

      {/* Action Buttons */}
      <div className="pt-2 space-y-2">
        <button
          type="button"
          onClick={() => setFilters({ categories: [], era: '', mints: [], minPrice: '', maxPrice: '', search: '' })}
          className="w-full py-2 text-xs sm:text-sm text-gold-500 hover:text-gold-400 underline font-medium transition-colors"
        >
          Clear All Filters
        </button>

        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 bg-gradient-to-r from-gold-600 to-gold-500 text-white font-semibold text-xs sm:text-sm uppercase tracking-wider rounded-xl shadow-gold"
          >
            Apply Filters
          </button>
        )}
      </div>
    </div>
  );
};

export default CoinFilters;
