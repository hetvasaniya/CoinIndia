import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { FiSearch, FiFilter, FiX, FiSliders } from 'react-icons/fi';
import coinService from '../../services/coinService';
import CoinGrid from '../../components/coins/CoinGrid';
import CoinFilters from '../../components/coins/CoinFilters';
import { SORT_OPTIONS } from '../../utils/constants';
import { useTheme } from '../../context/ThemeContext';

const Explore = () => {
  const { isDark } = useTheme();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const initialCategory = searchParams.get('category');
  const urlSearch = searchParams.get('search');

  const [coins, setCoins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState([]);
  const [mints, setMints] = useState([]);
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  
  const [searchInput, setSearchInput] = useState(urlSearch || '');
  const [debouncedSearch, setDebouncedSearch] = useState(urlSearch || '');

  const [filters, setFilters] = useState({
    categories: initialCategory ? [initialCategory] : [],
    era: '',
    mints: [],
    minPrice: '',
    maxPrice: '',
  });
  
  const [sort, setSort] = useState('newest');

  // Lock body scroll when filter drawer is open
  useEffect(() => {
    if (isFilterDrawerOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isFilterDrawerOpen]);

  useEffect(() => {
    if (urlSearch !== null && urlSearch !== undefined) {
      setSearchInput(urlSearch);
      setDebouncedSearch(urlSearch);
    }
  }, [urlSearch]);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchInput);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchInput]);

  useEffect(() => {
    fetchMetadata();
  }, []);

  useEffect(() => {
    fetchCoins();
  }, [debouncedSearch, filters, sort]);

  const fetchMetadata = async () => {
    try {
      const [catsRes, mintsRes] = await Promise.all([
        coinService.getCategories(),
        coinService.getMints()
      ]);
      const parseArray = (r) => (Array.isArray(r) ? r : (r?.data || []));
      setCategories(parseArray(catsRes));
      setMints(parseArray(mintsRes));
    } catch (error) {
      console.error('Error fetching metadata', error);
    }
  };

  const fetchCoins = async () => {
    setLoading(true);
    try {
      const params = {
        search: debouncedSearch,
        query: debouncedSearch,
        categories: filters.categories.join(','),
        mints: filters.mints.join(','),
        era: filters.era,
        minPrice: filters.minPrice,
        maxPrice: filters.maxPrice,
        sort
      };
      
      const response = await coinService.getCoins(params);
      const coinList = response?.coins || (Array.isArray(response) ? response : (response?.data || []));
      setCoins(coinList);
    } catch (error) {
      console.error('Error fetching coins', error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate active filters count
  const activeFiltersCount = 
    filters.categories.length + 
    (filters.era ? 1 : 0) + 
    filters.mints.length + 
    (filters.minPrice ? 1 : 0) + 
    (filters.maxPrice ? 1 : 0);

  const clearFilter = (type, value) => {
    if (type === 'category') {
      setFilters(prev => ({ ...prev, categories: prev.categories.filter(id => id !== value) }));
    } else if (type === 'era') {
      setFilters(prev => ({ ...prev, era: '' }));
    } else if (type === 'mint') {
      setFilters(prev => ({ ...prev, mints: prev.mints.filter(id => id !== value) }));
    } else if (type === 'price') {
      setFilters(prev => ({ ...prev, minPrice: '', maxPrice: '' }));
    }
  };

  return (
    <div className={`min-h-screen py-6 sm:py-10 transition-colors ${isDark ? 'bg-dark-900 text-gray-100' : 'bg-[#FAF8F5] text-gray-900'}`}>
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        
        {/* Page Title & Search Bar */}
        <div className={`flex flex-col md:flex-row md:items-center justify-between mb-6 pb-5 border-b gap-4 ${
          isDark ? 'border-dark-700' : 'border-gray-200'
        }`}>
          <div>
            <h1 className={`text-2xl sm:text-3xl font-serif font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Explore Numismatic Catalog
            </h1>
            <p className={`text-xs sm:text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              Browse authenticated rare coins, ancient currency, and imperial mintages.
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
            {/* Search Input */}
            <div className="relative w-full sm:w-64 md:w-72">
              <input
                type="text"
                placeholder="Search coin, ruler, dynasty, mint..."
                className={`w-full pl-9 pr-4 py-2 border rounded-xl text-xs sm:text-sm transition-all focus:outline-none focus:ring-2 focus:ring-gold-500/30 focus:border-gold-500 ${
                  isDark ? 'bg-dark-800 border-dark-600 text-white placeholder-gray-500' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                }`}
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
              />
              <FiSearch className={`absolute left-3 top-1/2 -translate-y-1/2 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
              {searchInput && (
                <button
                  onClick={() => setSearchInput('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200"
                  aria-label="Clear search"
                >
                  <FiX className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            
            {/* Desktop Sort Dropdown */}
            <div className="hidden lg:block relative w-48">
              <select
                className={`w-full pl-3 pr-8 py-2 border rounded-xl text-xs sm:text-sm transition-all focus:outline-none focus:border-gold-500 cursor-pointer ${
                  isDark ? 'bg-dark-800 border-dark-600 text-white' : 'bg-white border-gray-300 text-gray-900'
                }`}
                value={sort}
                onChange={(e) => setSort(e.target.value)}
              >
                {SORT_OPTIONS.map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Mobile & Tablet Filter and Sort Toolbar */}
        <div className="lg:hidden mb-6 flex flex-col gap-3">
          <div className="flex items-center gap-2.5">
            {/* Mobile Filters Drawer Trigger */}
            <button
              type="button"
              onClick={() => setIsFilterDrawerOpen(true)}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border text-xs sm:text-sm font-semibold transition-all shadow-xs ${
                activeFiltersCount > 0
                  ? 'bg-gold-500/10 border-gold-500/50 text-gold-500'
                  : isDark
                    ? 'bg-dark-800 border-dark-600 text-gray-200 hover:border-gold-500'
                    : 'bg-white border-gray-200 text-gray-700 hover:border-gold-500'
              }`}
            >
              <FiFilter className="w-4 h-4 text-gold-500" />
              <span>Filters</span>
              {activeFiltersCount > 0 && (
                <span className="ml-1 px-1.5 py-0.2 rounded-full bg-gold-500 text-dark-950 font-bold text-[10px]">
                  {activeFiltersCount}
                </span>
              )}
            </button>

            {/* Mobile Sort Select */}
            <div className="flex-1 relative">
              <select
                className={`w-full py-2.5 pl-3 pr-8 rounded-xl border text-xs sm:text-sm font-medium transition-colors outline-none cursor-pointer ${
                  isDark ? 'bg-dark-800 border-dark-600 text-white' : 'bg-white border-gray-200 text-gray-800'
                }`}
                value={sort}
                onChange={(e) => setSort(e.target.value)}
              >
                {SORT_OPTIONS.map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Active Filter Chips Bar */}
        {(activeFiltersCount > 0 || debouncedSearch) && (
          <div className="flex flex-wrap items-center gap-2 mb-6 text-xs">
            <span className={`text-[11px] font-semibold uppercase tracking-wider ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              Active Filters:
            </span>
            
            {debouncedSearch && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-gold-500/10 text-gold-400 border border-gold-500/20 font-medium">
                Search: "{debouncedSearch}"
                <button onClick={() => setSearchInput('')} className="hover:text-white"><FiX className="w-3 h-3" /></button>
              </span>
            )}

            {filters.categories.map(catId => {
              const cat = categories.find(c => c._id === catId);
              return (
                <span key={catId} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-gold-500/10 text-gold-400 border border-gold-500/20 font-medium">
                  {cat?.name || 'Category'}
                  <button onClick={() => clearFilter('category', catId)} className="hover:text-white"><FiX className="w-3 h-3" /></button>
                </span>
              );
            })}

            {filters.era && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-gold-500/10 text-gold-400 border border-gold-500/20 font-medium">
                Era: {filters.era}
                <button onClick={() => clearFilter('era')} className="hover:text-white"><FiX className="w-3 h-3" /></button>
              </span>
            )}

            {filters.mints.map(mintId => {
              const mint = mints.find(m => m._id === mintId);
              return (
                <span key={mintId} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-gold-500/10 text-gold-400 border border-gold-500/20 font-medium">
                  {mint?.name || 'Mint'}
                  <button onClick={() => clearFilter('mint', mintId)} className="hover:text-white"><FiX className="w-3 h-3" /></button>
                </span>
              );
            })}

            {(filters.minPrice || filters.maxPrice) && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-gold-500/10 text-gold-400 border border-gold-500/20 font-medium">
                ₹{filters.minPrice || '0'} – ₹{filters.maxPrice || '∞'}
                <button onClick={() => clearFilter('price')} className="hover:text-white"><FiX className="w-3 h-3" /></button>
              </span>
            )}

            <button
              onClick={() => {
                setFilters({ categories: [], era: '', mints: [], minPrice: '', maxPrice: '' });
                setSearchInput('');
              }}
              className="text-xs text-gold-500 hover:underline ml-2"
            >
              Reset All
            </button>
          </div>
        )}

        {/* Content Layout */}
        <div className="flex flex-col lg:flex-row lg:gap-8">
          {/* Desktop Sidebar Filters (hidden on mobile/tablet) */}
          <div className="hidden lg:block w-64 flex-shrink-0">
            <div className={`p-5 rounded-2xl border sticky top-24 ${
              isDark ? 'bg-dark-800/80 border-dark-700 shadow-sm' : 'bg-white border-gray-200 shadow-xs'
            }`}>
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-gray-500/20">
                <span className="text-xs uppercase font-bold tracking-wider text-gold-500 flex items-center gap-1.5">
                  <FiSliders /> Filter Artifacts
                </span>
                {activeFiltersCount > 0 && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gold-500 text-dark-950">
                    {activeFiltersCount} Active
                  </span>
                )}
              </div>
              <CoinFilters 
                filters={filters} 
                setFilters={setFilters} 
                categories={categories} 
                mints={mints} 
              />
            </div>
          </div>

          {/* Main Coin Grid Content */}
          <div className="flex-1 min-w-0">
            <div className={`mb-4 flex items-center justify-between text-xs sm:text-sm ${
              isDark ? 'text-gray-400' : 'text-gray-500'
            }`}>
              <div>
                Showing <span className={`font-semibold ${isDark ? 'text-gold-400' : 'text-gray-900'}`}>{coins.length}</span> artifacts in catalog
              </div>
            </div>

            <CoinGrid coins={coins} loading={loading} />
          </div>
        </div>
      </div>

      {/* Mobile Filters Slide-Over Drawer */}
      {isFilterDrawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/70 backdrop-blur-xs transition-opacity"
            onClick={() => setIsFilterDrawerOpen(false)}
            aria-hidden="true"
          />

          {/* Drawer Panel */}
          <div className={`fixed inset-y-0 right-0 max-w-sm w-full shadow-2xl flex flex-col z-50 border-l transition-transform duration-300 animate-slide-up ${
            isDark ? 'bg-dark-900 border-dark-700 text-white' : 'bg-white border-gray-200 text-gray-900'
          }`}>
            {/* Header */}
            <div className={`p-4 border-b flex items-center justify-between flex-shrink-0 ${
              isDark ? 'border-dark-700 bg-dark-850' : 'border-gray-200 bg-[#FAFAF7]'
            }`}>
              <div className="flex items-center gap-2">
                <FiFilter className="text-gold-500" />
                <h3 className="font-serif font-bold text-base">Filter Coins</h3>
                {activeFiltersCount > 0 && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gold-500 text-dark-950">
                    {activeFiltersCount}
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={() => setIsFilterDrawerOpen(false)}
                className={`p-1.5 rounded-lg transition-colors ${
                  isDark ? 'text-gray-400 hover:text-white hover:bg-dark-700' : 'text-gray-400 hover:text-gray-700 hover:bg-gray-100'
                }`}
                aria-label="Close filters"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Filter Controls */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 touch-scroll">
              <CoinFilters 
                filters={filters} 
                setFilters={setFilters} 
                categories={categories} 
                mints={mints} 
                onClose={() => setIsFilterDrawerOpen(false)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Explore;
