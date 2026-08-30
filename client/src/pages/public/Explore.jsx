import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { FiSearch } from 'react-icons/fi';
import coinService from '../../services/coinService';
import CoinGrid from '../../components/coins/CoinGrid';
import CoinFilters from '../../components/coins/CoinFilters';
import { SORT_OPTIONS } from '../../utils/constants';

const Explore = () => {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const initialCategory = searchParams.get('category');

  const [coins, setCoins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState([]);
  const [mints, setMints] = useState([]);
  
  const [filters, setFilters] = useState({
    search: '',
    categories: initialCategory ? [initialCategory] : [],
    era: '',
    mints: [],
    minPrice: '',
    maxPrice: '',
  });
  
  const [sort, setSort] = useState('newest');

  useEffect(() => {
    fetchMetadata();
  }, []);

  useEffect(() => {
    fetchCoins();
  }, [filters, sort]);

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
        search: filters.search,
        query: filters.search,
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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 pb-4 border-b border-gray-200">
        <h1 className="text-3xl font-serif text-[#1a1a1a] mb-4 md:mb-0">Explore Catalog</h1>
        
        <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4 w-full md:w-auto">
          {/* Search */}
          <div className="relative w-full sm:w-64">
            <input
              type="text"
              placeholder="Search by coin name, ruler, era..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-sm focus:outline-none focus:border-[#B8860B] focus:ring-1 focus:ring-[#B8860B] text-sm"
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            />
            <FiSearch className="absolute left-3 top-2.5 text-gray-400" />
          </div>
          
          {/* Sort */}
          <select
            className="w-full sm:w-48 pl-3 pr-8 py-2 border border-gray-300 rounded-sm focus:outline-none focus:border-[#B8860B] text-sm bg-white"
            value={sort}
            onChange={(e) => setSort(e.target.value)}
          >
            {SORT_OPTIONS.map(option => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row">
        {/* Sidebar Filters */}
        <CoinFilters 
          filters={filters} 
          setFilters={setFilters} 
          categories={categories} 
          mints={mints} 
        />

        {/* Main Content */}
        <div className="flex-1 mt-8 lg:mt-0">
          <div className="mb-4 text-sm text-gray-500">
            Showing <span className="font-medium text-[#1a1a1a]">{coins.length}</span> results
          </div>
          <CoinGrid coins={coins} loading={loading} />
        </div>
      </div>
    </div>
  );
};

export default Explore;
