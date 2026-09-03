import { ERA_OPTIONS } from '../../utils/constants';
import { useTheme } from '../../context/ThemeContext';

const CoinFilters = ({ 
  filters, 
  setFilters, 
  categories, 
  mints 
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

  const sectionHeading = `font-serif text-lg mb-4 pb-2 border-b ${isDark ? 'text-white border-dark-600' : 'text-gray-900 border-gray-200'}`;
  const labelText = `ml-3 text-sm transition-colors ${isDark ? 'text-gray-400 group-hover:text-white' : 'text-gray-600 group-hover:text-gray-900'}`;

  return (
    <div className="w-full lg:w-64 flex-shrink-0 space-y-8 pr-6">
      {/* Categories */}
      <div>
        <h3 className={sectionHeading}>Category</h3>
        <div className="space-y-3">
          {categories.map((category) => (
            <label key={category._id} className="flex items-center cursor-pointer group">
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
        <div className="space-y-3">
          {ERA_OPTIONS.map((era) => (
            <label key={era} className="flex items-center cursor-pointer group">
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
        <h3 className={sectionHeading}>Mint</h3>
        <div className="flex flex-wrap gap-2">
          {mints.map((mint) => {
            const isSelected = filters.mints.includes(mint._id);
            return (
              <button
                key={mint._id}
                onClick={() => handleMintChange(mint._id)}
                className={`px-3 py-1.5 text-xs rounded-full border transition-all ${
                  isSelected 
                    ? 'bg-gold-500 border-gold-500 text-white' 
                    : isDark 
                      ? 'bg-dark-700 border-dark-600 text-gray-400 hover:border-gold-500 hover:text-gold-400'
                      : 'bg-white border-gray-300 text-gray-600 hover:border-gold-500 hover:text-gold-600'
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
        <h3 className={sectionHeading}>Price Range</h3>
        <div className="flex items-center space-x-2">
          <input
            type="number"
            placeholder="Min"
            className={`w-full px-2 py-1.5 text-sm border rounded-lg transition-colors focus:ring-gold-500 focus:border-gold-500 ${
              isDark ? 'bg-dark-700 border-dark-600 text-white placeholder-gray-500' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
            }`}
            value={filters.minPrice || ''}
            onChange={(e) => setFilters({ ...filters, minPrice: e.target.value })}
          />
          <span className={isDark ? 'text-gray-500' : 'text-gray-400'}>-</span>
          <input
            type="number"
            placeholder="Max"
            className={`w-full px-2 py-1.5 text-sm border rounded-lg transition-colors focus:ring-gold-500 focus:border-gold-500 ${
              isDark ? 'bg-dark-700 border-dark-600 text-white placeholder-gray-500' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
            }`}
            value={filters.maxPrice || ''}
            onChange={(e) => setFilters({ ...filters, maxPrice: e.target.value })}
          />
        </div>
      </div>

      <button
        onClick={() => setFilters({ categories: [], era: '', mints: [], minPrice: '', maxPrice: '', search: '' })}
        className="w-full py-2 text-sm text-gold-500 underline hover:text-gold-400 transition-colors"
      >
        Clear All Filters
      </button>
    </div>
  );
};

export default CoinFilters;
