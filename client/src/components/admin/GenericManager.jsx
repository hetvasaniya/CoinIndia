import { useState, useEffect } from 'react';
import adminService from '../../services/adminService';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import { useTheme } from '../../context/ThemeContext';
import toast from 'react-hot-toast';
import { FiEdit2, FiTrash2 } from 'react-icons/fi';

const GenericManager = ({ 
  title, 
  getFn, 
  createFn, 
  updateFn, 
  deleteFn,
  fields
}) => {
  const { isDark } = useTheme();

  const defaultFields = [
    { name: 'name', label: 'Name', required: true, placeholder: `e.g., ${title} Name` },
    { name: 'description', label: 'Description (Optional)', type: 'textarea', placeholder: `Enter historical context or notes for this ${title.toLowerCase()}...` }
  ];

  const formFields = fields || defaultFields;

  const getInitialFormData = () => {
    const data = {};
    formFields.forEach(f => { data[f.name] = ''; });
    return data;
  };

  const [items, setItems] = useState([]);
  const [countries, setCountries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState(getInitialFormData());
  const [editId, setEditId] = useState(null);

  useEffect(() => {
    fetchItems();
    const hasCountrySelect = formFields.some(f => f.type === 'countrySelect');
    if (hasCountrySelect) {
      adminService.getCountries().then(res => {
        const parseArray = (r) => (Array.isArray(r) ? r : (r?.data || []));
        setCountries(parseArray(res));
      }).catch(() => {});
    }
  }, []);

  const fetchItems = async () => {
    try {
      const res = await getFn();
      const parseArray = (r) => (Array.isArray(r) ? r : (r?.data || []));
      setItems(parseArray(res));
    } catch (error) {
      toast.error(`Failed to fetch ${title.toLowerCase()} list`);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editId) {
        const res = await updateFn(editId, formData);
        const updatedItem = res?.data || res || { ...formData, _id: editId };
        setItems((prev) => prev.map((i) => (i._id === editId ? { ...i, ...updatedItem } : i)));
        toast.success(`${title} updated successfully`);
      } else {
        const res = await createFn(formData);
        const newItem = res?.data || res;
        if (newItem && newItem._id) {
          setItems((prev) => [newItem, ...prev]);
        } else {
          fetchItems();
        }
        toast.success(`${title} created successfully`);
      }
      setFormData(getInitialFormData());
      setEditId(null);
    } catch (error) {
      toast.error(error.response?.data?.message || `Failed to save ${title.toLowerCase()}`);
    }
  };

  const handleEdit = (item) => {
    setEditId(item._id);
    const newFormData = {};
    formFields.forEach(f => {
      if (f.type === 'countrySelect') {
        newFormData[f.name] = item[f.name]?._id || item[f.name] || '';
      } else {
        newFormData[f.name] = item[f.name] !== undefined && item[f.name] !== null ? item[f.name] : '';
      }
    });
    setFormData(newFormData);
  };

  const handleDelete = async (id) => {
    if (window.confirm(`Are you sure you want to delete this ${title.toLowerCase()}?`)) {
      const prevItems = items;
      setItems((prev) => prev.filter((i) => i._id !== id));
      try {
        await deleteFn(id);
        toast.success(`${title} deleted successfully`);
      } catch (error) {
        setItems(prevItems);
        toast.error(`Failed to delete ${title.toLowerCase()}`);
      }
    }
  };

  if (loading) return <div className={`p-8 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Loading {title.toLowerCase()} data...</div>;

  const inputClasses = `w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-1 focus:ring-gold-500 focus:border-gold-500 sm:text-sm ${
    isDark ? 'bg-dark-700 border-dark-600 text-white placeholder-gray-500' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
  }`;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
      <div className="lg:col-span-2">
        <h1 className={`text-xl sm:text-2xl font-serif mb-4 sm:mb-6 ${isDark ? 'text-white' : 'text-gray-900'}`}>{title} Catalog</h1>
        <div className={`border rounded-xl shadow-sm overflow-hidden ${
          isDark ? 'bg-dark-800 border-dark-600' : 'bg-white border-gray-200'
        }`}>
          <div className="overflow-x-auto touch-scroll">
            <table className={`min-w-full divide-y ${isDark ? 'divide-dark-600' : 'divide-gray-200'}`}>
              <thead className={isDark ? 'bg-dark-700' : 'bg-gray-50'}>
                <tr>
                  <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Name</th>
                  {formFields.some(f => f.name === 'code') && <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Code</th>}
                  {formFields.some(f => f.name === 'mintMark') && <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Mint Mark</th>}
                  {formFields.some(f => f.name === 'location') && <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Location</th>}
                  {formFields.some(f => f.name === 'description') && <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Description</th>}
                  <th className={`px-6 py-3 text-right text-xs font-medium uppercase tracking-wider ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Actions</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${isDark ? 'divide-dark-600' : 'divide-gray-200'}`}>
                {items.length === 0 ? (
                  <tr><td colSpan="6" className={`px-6 py-8 text-center text-sm ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>No {title.toLowerCase()} items recorded yet.</td></tr>
                ) : (
                  items.map((item) => (
                    <tr key={item._id} className={`transition-colors ${isDark ? 'hover:bg-dark-700' : 'hover:bg-gray-50'}`}>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {item.flag && <span className="mr-2">{item.flag}</span>}{item.name}
                      </td>
                      {formFields.some(f => f.name === 'code') && <td className={`px-6 py-4 whitespace-nowrap text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{item.code || '-'}</td>}
                      {formFields.some(f => f.name === 'mintMark') && <td className={`px-6 py-4 whitespace-nowrap text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{item.mintMark || '-'}</td>}
                      {formFields.some(f => f.name === 'location') && <td className={`px-6 py-4 whitespace-nowrap text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{item.location || '-'}</td>}
                      {formFields.some(f => f.name === 'description') && <td className={`px-6 py-4 text-sm max-w-xs truncate ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{item.description || '-'}</td>}
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button onClick={() => handleEdit(item)} className="text-gold-500 hover:text-gold-400 mr-4 p-1" title="Edit"><FiEdit2 /></button>
                        <button onClick={() => handleDelete(item._id)} className="text-red-500 hover:text-red-400 p-1" title="Delete"><FiTrash2 /></button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div>
        <div className={`p-4 sm:p-6 border rounded-xl shadow-sm sticky top-6 ${
          isDark ? 'bg-dark-800 border-dark-600' : 'bg-white border-gray-200'
        }`}>
          <h2 className={`text-lg font-serif mb-4 border-b pb-2 ${
            isDark ? 'text-white border-dark-600' : 'text-gray-900 border-gray-200'
          }`}>
            {editId ? `Edit ${title}` : `Add New ${title}`}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            {formFields.map((field) => {
              if (field.type === 'textarea') {
                return (
                  <div key={field.name}>
                    <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      {field.label} {field.required && <span className="text-red-500">*</span>}
                    </label>
                    <textarea rows="3" className={inputClasses} placeholder={field.placeholder || ''} value={formData[field.name] || ''} onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })} required={field.required}></textarea>
                  </div>
                );
              }
              if (field.type === 'countrySelect') {
                return (
                  <div key={field.name}>
                    <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      {field.label} {field.required && <span className="text-red-500">*</span>}
                    </label>
                    <select className={inputClasses} value={formData[field.name] || ''} onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })} required={field.required}>
                      <option value="">{field.placeholder || '-- Select Country --'}</option>
                      {countries.map(c => (<option key={c._id} value={c._id}>{c.flag ? `${c.flag} ` : ''}{c.name} ({c.code})</option>))}
                    </select>
                  </div>
                );
              }
              return (<Input key={field.name} label={field.label} required={field.required} placeholder={field.placeholder || ''} value={formData[field.name] || ''} onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })} />);
            })}
            <div className={`flex space-x-2 pt-3 border-t ${isDark ? 'border-dark-600' : 'border-gray-200'}`}>
              <Button type="submit" className="w-full">{editId ? `Update ${title}` : `Save ${title}`}</Button>
              {editId && (<Button type="button" variant="outline" className="w-full" onClick={() => { setEditId(null); setFormData(getInitialFormData()); }}>Cancel</Button>)}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default GenericManager;
