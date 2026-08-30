import { useState, useEffect } from 'react';
import adminService from '../../services/adminService';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import toast from 'react-hot-toast';
import { FiEdit2, FiTrash2, FiPlus, FiSearch, FiGlobe, FiCheck } from 'react-icons/fi';

// Predefined list of popular historic and modern numismatic countries (No images needed)
const PRESET_COUNTRIES = [
  { name: 'India', code: 'IN', flag: '🇮🇳' },
  { name: 'British India', code: 'IN-BR', flag: '🇬🇧' },
  { name: 'Mughal Empire', code: 'MUGH', flag: '👑' },
  { name: 'East India Company', code: 'EIC', flag: '⚓' },
  { name: 'United Kingdom', code: 'GB', flag: '🇬🇧' },
  { name: 'United States', code: 'US', flag: '🇺🇸' },
  { name: 'Portugal', code: 'PT', flag: '🇵🇹' },
  { name: 'France', code: 'FR', flag: '🇫🇷' },
  { name: 'Germany', code: 'DE', flag: '🇩🇪' },
  { name: 'Netherlands', code: 'NL', flag: '🇳🇱' },
  { name: 'Spain', code: 'ES', flag: '🇪🇸' },
  { name: 'Italy', code: 'IT', flag: '🇮🇹' },
  { name: 'Austria', code: 'AT', flag: '🇦🇹' },
  { name: 'Switzerland', code: 'CH', flag: '🇨🇭' },
  { name: 'Canada', code: 'CA', flag: '🇨🇦' },
  { name: 'Australia', code: 'AU', flag: '🇦🇺' },
  { name: 'Japan', code: 'JP', flag: '🇯🇵' },
  { name: 'China', code: 'CN', flag: '🇨🇳' },
  { name: 'Russia', code: 'RU', flag: '🇷🇺' },
  { name: 'Ottoman Empire', code: 'OTT', flag: '🌙' },
  { name: 'Ancient Greece', code: 'GRC', flag: '🏛️' },
  { name: 'Roman Empire', code: 'ROM', flag: '🏛️' }
];

const CountryManager = () => {
  const [countries, setCountries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [editId, setEditId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    flag: ''
  });

  useEffect(() => {
    fetchCountries();
  }, []);

  const fetchCountries = async () => {
    try {
      const res = await adminService.getCountries();
      const parseArray = (r) => (Array.isArray(r) ? r : (r?.data || []));
      setCountries(parseArray(res));
    } catch (error) {
      toast.error('Failed to fetch country list');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.code.trim()) {
      toast.error('Country Name and Code are required');
      return;
    }

    try {
      if (editId) {
        await adminService.updateCountry(editId, formData);
        toast.success('Country updated successfully');
      } else {
        await adminService.createCountry(formData);
        toast.success('Country added successfully');
      }
      setFormData({ name: '', code: '', flag: '' });
      setEditId(null);
      fetchCountries();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save country');
    }
  };

  const handleQuickAdd = async (preset) => {
    const exists = countries.some(
      (c) => c.code.toLowerCase() === preset.code.toLowerCase() || c.name.toLowerCase() === preset.name.toLowerCase()
    );

    if (exists) {
      toast.error(`${preset.name} is already added to your catalog`);
      return;
    }

    try {
      await adminService.createCountry(preset);
      toast.success(`${preset.name} added to catalog`);
      fetchCountries();
    } catch (error) {
      toast.error(error.response?.data?.message || `Failed to add ${preset.name}`);
    }
  };

  const handleEdit = (country) => {
    setEditId(country._id);
    setFormData({
      name: country.name || '',
      code: country.code || '',
      flag: country.flag || ''
    });
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this country?')) {
      try {
        await adminService.deleteCountry(id);
        toast.success('Country deleted successfully');
        fetchCountries();
      } catch (error) {
        toast.error('Failed to delete country');
      }
    }
  };

  const filteredPresets = PRESET_COUNTRIES.filter(
    (preset) =>
      preset.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      preset.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const isPresetAdded = (code) => {
    return countries.some((c) => c.code.toLowerCase() === code.toLowerCase());
  };

  if (loading) {
    return <div className="p-8 text-gray-500 font-serif">Loading country catalog...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center border-b pb-4">
        <div>
          <h1 className="text-2xl font-serif text-[#1a1a1a]">Country Catalog</h1>
          <p className="text-sm text-gray-500">Manage countries for coin minting and origins</p>
        </div>
        <div className="text-xs bg-[#FAFAF7] border border-gray-200 px-3 py-1.5 rounded-full font-medium text-[#B8860B]">
          Total Recorded: {countries.length}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* LEFT SIDE: Added Countries Catalog Table */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-lg font-serif text-[#1a1a1a] flex items-center gap-2">
            <FiGlobe className="text-[#B8860B]" /> Added Countries Catalog
          </h2>

          <div className="bg-white border border-gray-200 rounded-sm shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-[#FAFAF7]">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Country Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ISO / Short Code
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {countries.length === 0 ? (
                    <tr>
                      <td colSpan="3" className="px-6 py-12 text-center text-sm text-gray-500">
                        <FiGlobe className="mx-auto h-8 w-8 text-gray-300 mb-2" />
                        No country items recorded yet. Use the country list or input form on the right side to add countries.
                      </td>
                    </tr>
                  ) : (
                    countries.map((country) => (
                      <tr key={country._id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 flex items-center">
                          {country.flag ? (
                            <span className="mr-3 text-lg">{country.flag}</span>
                          ) : (
                            <span className="mr-3 text-gray-400">🌐</span>
                          )}
                          {country.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 font-mono">
                          {country.code || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => handleEdit(country)}
                            className="text-[#B8860B] hover:text-[#8B6914] mr-4 p-1 rounded hover:bg-amber-50"
                            title="Edit Country"
                          >
                            <FiEdit2 />
                          </button>
                          <button
                            onClick={() => handleDelete(country._id)}
                            className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50"
                            title="Delete Country"
                          >
                            <FiTrash2 />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* RIGHT SIDE: Country Selection List & Custom Add Form */}
        <div className="space-y-6">
          {/* Quick Selection List */}
          <div className="bg-white p-5 border border-gray-200 rounded-sm shadow-sm">
            <h2 className="text-md font-serif text-[#1a1a1a] mb-1">Select & Add Country</h2>
            <p className="text-xs text-gray-500 mb-3">Click any country from the list below to quickly add it</p>

            <div className="relative mb-3">
              <FiSearch className="absolute left-3 top-2.5 text-gray-400 text-sm" />
              <input
                type="text"
                placeholder="Search country name or code..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#B8860B] focus:border-[#B8860B]"
              />
            </div>

            <div className="max-h-60 overflow-y-auto space-y-1.5 border-t border-b border-gray-100 py-2 pr-1">
              {filteredPresets.length === 0 ? (
                <div className="text-xs text-gray-400 py-3 text-center">No matching country found</div>
              ) : (
                filteredPresets.map((preset) => {
                  const added = isPresetAdded(preset.code);
                  return (
                    <div
                      key={preset.code}
                      className={`flex items-center justify-between p-2 rounded text-sm transition-colors ${
                        added
                          ? 'bg-amber-50/60 border border-amber-200/50 text-gray-600'
                          : 'hover:bg-gray-50 border border-transparent'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span>{preset.flag}</span>
                        <span className="font-medium text-gray-800">{preset.name}</span>
                        <span className="text-xs text-gray-400 font-mono">({preset.code})</span>
                      </div>
                      {added ? (
                        <span className="text-xs text-amber-700 flex items-center gap-1 font-medium px-2 py-0.5 rounded bg-amber-100">
                          <FiCheck className="text-xs" /> Added
                        </span>
                      ) : (
                        <button
                          onClick={() => handleQuickAdd(preset)}
                          className="text-xs bg-[#B8860B] hover:bg-[#8B6914] text-white px-2 py-1 rounded flex items-center gap-1 transition-colors"
                        >
                          <FiPlus className="text-xs" /> Add
                        </button>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Custom Country Form */}
          <div className="bg-white p-5 border border-gray-200 rounded-sm shadow-sm sticky top-6">
            <h2 className="text-md font-serif text-[#1a1a1a] mb-4 border-b pb-2">
              {editId ? 'Edit Country' : 'Add Custom Country'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Country Name"
                required
                placeholder="e.g., Portugal, Ancient Rome"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />

              <Input
                label="Country Code (ISO)"
                required
                placeholder="e.g., PT, ROM, IN"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
              />

              <Input
                label="Flag Emoji or Symbol (Optional)"
                placeholder="e.g., 🇵🇹, 🏛️, 🇮🇳"
                value={formData.flag}
                onChange={(e) => setFormData({ ...formData, flag: e.target.value })}
              />

              <div className="flex space-x-2 pt-2 border-t">
                <Button type="submit" className="w-full">
                  {editId ? 'Update Country' : 'Save Country'}
                </Button>
                {editId && (
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={() => {
                      setEditId(null);
                      setFormData({ name: '', code: '', flag: '' });
                    }}
                  >
                    Cancel
                  </Button>
                )}
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CountryManager;
