import { useState, useEffect } from 'react';
import adminService from '../../services/adminService';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import { useTheme } from '../../context/ThemeContext';
import toast from 'react-hot-toast';
import { FiEdit2, FiTrash2, FiPlus, FiSearch, FiGlobe, FiCheck } from 'react-icons/fi';

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
  const { isDark } = useTheme();
  const [formData, setFormData] = useState({ name: '', code: '', flag: '' });

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
    return <div className={`p-8 font-serif ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Loading country catalog...</div>;
  }

  const cardBg = isDark ? 'bg-dark-800 border-dark-700' : 'bg-white border-gray-200';

  return (
    <div className="space-y-6">
      <div className={`flex justify-between items-center border-b pb-4 ${isDark ? 'border-dark-700' : 'border-gray-200'}`}>
        <div>
          <h1 className={`text-2xl font-serif ${isDark ? 'text-white' : 'text-gray-900'}`}>Country Catalog</h1>
          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Manage countries for coin minting and origins</p>
        </div>
        <div className="text-xs bg-gold-500/10 border border-gold-500/20 px-3 py-1.5 rounded-full font-medium text-gold-500">
          Total Recorded: {countries.length}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* LEFT SIDE */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className={`text-lg font-serif flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            <FiGlobe className="text-gold-500" /> Added Countries Catalog
          </h2>

          <div className={`border rounded-xl shadow-sm overflow-hidden ${cardBg}`}>
            <div className="overflow-x-auto">
              <table className={`min-w-full divide-y ${isDark ? 'divide-dark-700' : 'divide-gray-200'}`}>
                <thead className={isDark ? 'bg-dark-700/50' : 'bg-gray-50'}>
                  <tr>
                    <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Country Name</th>
                    <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Short Code</th>
                    <th className={`px-6 py-3 text-right text-xs font-medium uppercase tracking-wider ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Actions</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${isDark ? 'divide-dark-700' : 'divide-gray-200'}`}>
                  {countries.length === 0 ? (
                    <tr>
                      <td colSpan="3" className={`px-6 py-12 text-center text-sm ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                        No country items recorded yet.
                      </td>
                    </tr>
                  ) : (
                    countries.map((country) => (
                      <tr key={country._id} className={`transition-colors ${isDark ? 'hover:bg-dark-700/50' : 'hover:bg-gray-50'}`}>
                        <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium flex items-center ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          {country.flag ? <span className="mr-3 text-lg">{country.flag}</span> : <span className="mr-3 text-gray-500">🌐</span>}
                          {country.name}
                        </td>
                        <td className={`px-6 py-4 whitespace-nowrap text-sm font-mono ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                          {country.code || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button onClick={() => handleEdit(country)} className="text-gold-500 hover:text-gold-400 mr-4 p-1">
                            <FiEdit2 />
                          </button>
                          <button onClick={() => handleDelete(country._id)} className="text-red-500 hover:text-red-400 p-1">
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

        {/* RIGHT SIDE */}
        <div className="space-y-6">
          {/* Quick Selection List */}
          <div className={`p-5 border rounded-xl shadow-sm ${cardBg}`}>
            <h2 className={`text-md font-serif mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>Select & Add Country</h2>
            <p className={`text-xs mb-3 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Click any country from the list below to quickly add it</p>

            <div className="relative mb-3">
              <FiSearch className={`absolute left-3 top-2.5 text-sm ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
              <input
                type="text"
                placeholder="Search country name or code..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-full pl-9 pr-3 py-1.5 text-sm border rounded-lg focus:outline-none focus:ring-1 focus:ring-gold-500 ${
                  isDark ? 'bg-dark-700 border-dark-600 text-white placeholder-gray-500' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                }`}
              />
            </div>

            <div className={`max-h-60 overflow-y-auto space-y-1.5 border-t border-b py-2 pr-1 ${isDark ? 'border-dark-700' : 'border-gray-100'}`}>
              {filteredPresets.length === 0 ? (
                <div className="text-xs text-gray-500 py-3 text-center">No matching country found</div>
              ) : (
                filteredPresets.map((preset) => {
                  const added = isPresetAdded(preset.code);
                  return (
                    <div
                      key={preset.code}
                      className={`flex items-center justify-between p-2 rounded text-sm transition-colors ${
                        added
                          ? isDark ? 'bg-gold-500/10 border border-gold-500/20 text-gray-300' : 'bg-amber-50 border border-amber-200 text-gray-600'
                          : isDark ? 'hover:bg-dark-700 border border-transparent' : 'hover:bg-gray-50 border border-transparent'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span>{preset.flag}</span>
                        <span className={`font-medium ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>{preset.name}</span>
                        <span className="text-xs text-gray-500 font-mono">({preset.code})</span>
                      </div>
                      {added ? (
                        <span className="text-xs text-gold-500 flex items-center gap-1 font-medium px-2 py-0.5 rounded bg-gold-500/10">
                          <FiCheck className="text-xs" /> Added
                        </span>
                      ) : (
                        <button
                          onClick={() => handleQuickAdd(preset)}
                          className="text-xs bg-gold-500 hover:bg-gold-600 text-white px-2 py-1 rounded flex items-center gap-1 transition-colors"
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

          {/* Form */}
          <div className={`p-5 border rounded-xl shadow-sm sticky top-6 ${cardBg}`}>
            <h2 className={`text-md font-serif mb-4 border-b pb-2 ${isDark ? 'text-white border-dark-700' : 'text-gray-900 border-gray-200'}`}>
              {editId ? 'Edit Country' : 'Add Custom Country'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input label="Country Name" required placeholder="e.g., Portugal, Ancient Rome" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
              <Input label="Country Code (ISO)" required placeholder="e.g., PT, ROM, IN" value={formData.code} onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })} />
              <Input label="Flag Emoji or Symbol (Optional)" placeholder="e.g., 🇵🇹, 🏛️, 🇮🇳" value={formData.flag} onChange={(e) => setFormData({ ...formData, flag: e.target.value })} />

              <div className={`flex space-x-2 pt-2 border-t ${isDark ? 'border-dark-700' : 'border-gray-200'}`}>
                <Button type="submit" className="w-full">{editId ? 'Update Country' : 'Save Country'}</Button>
                {editId && (
                  <Button type="button" variant="outline" className="w-full" onClick={() => { setEditId(null); setFormData({ name: '', code: '', flag: '' }); }}>
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
