import { ERA_OPTIONS } from '../../utils/constants';

const CoinFilters = ({ 
  filters, 
  setFilters, 
  categories, 
  mints 
}) => {
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

  return (
    <div className="w-full lg:w-64 flex-shrink-0 space-y-8 pr-6">
      {/* Categories */}
      <div>
        <h3 className="font-serif text-lg text-[#1a1a1a] mb-4 pb-2 border-b border-gray-200">Category</h3>
        <div className="space-y-3">
          {categories.map((category) => (
            <label key={category._id} className="flex items-center cursor-pointer group">
              <input
                type="checkbox"
                className="w-4 h-4 text-[#B8860B] border-gray-300 rounded focus:ring-[#B8860B]"
                checked={filters.categories.includes(category._id)}
                onChange={() => handleCategoryChange(category._id)}
              />
              <span className="ml-3 text-sm text-gray-600 group-hover:text-[#1a1a1a] transition-colors">
                {category.name}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Era */}
      <div>
        <h3 className="font-serif text-lg text-[#1a1a1a] mb-4 pb-2 border-b border-gray-200">Era</h3>
        <div className="space-y-3">
          {ERA_OPTIONS.map((era) => (
            <label key={era} className="flex items-center cursor-pointer group">
              <input
                type="radio"
                name="era"
                className="w-4 h-4 text-[#B8860B] border-gray-300 focus:ring-[#B8860B]"
                checked={filters.era === era || (era === 'All Eras' && !filters.era)}
                onChange={() => handleEraChange(era)}
              />
              <span className="ml-3 text-sm text-gray-600 group-hover:text-[#1a1a1a] transition-colors">
                {era}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Mints */}
      <div>
        <h3 className="font-serif text-lg text-[#1a1a1a] mb-4 pb-2 border-b border-gray-200">Mint</h3>
        <div className="flex flex-wrap gap-2">
          {mints.map((mint) => {
            const isSelected = filters.mints.includes(mint._id);
            return (
              <button
                key={mint._id}
                onClick={() => handleMintChange(mint._id)}
                className={`px-3 py-1.5 text-xs rounded-full border transition-colors ${
                  isSelected 
                    ? 'bg-[#B8860B] border-[#B8860B] text-white' 
                    : 'bg-white border-gray-300 text-gray-600 hover:border-[#B8860B] hover:text-[#B8860B]'
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
        <h3 className="font-serif text-lg text-[#1a1a1a] mb-4 pb-2 border-b border-gray-200">Price Range</h3>
        <div className="flex items-center space-x-2">
          <input
            type="number"
            placeholder="Min"
            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-[#B8860B] focus:border-[#B8860B]"
            value={filters.minPrice || ''}
            onChange={(e) => setFilters({ ...filters, minPrice: e.target.value })}
          />
          <span className="text-gray-400">-</span>
          <input
            type="number"
            placeholder="Max"
            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-[#B8860B] focus:border-[#B8860B]"
            value={filters.maxPrice || ''}
            onChange={(e) => setFilters({ ...filters, maxPrice: e.target.value })}
          />
        </div>
      </div>

      <button
        onClick={() => setFilters({ categories: [], era: '', mints: [], minPrice: '', maxPrice: '', search: '' })}
        className="w-full py-2 text-sm text-gray-500 underline hover:text-[#B8860B] transition-colors"
      >
        Clear All Filters
      </button>
    </div>
  );
};

export default CoinFilters;
