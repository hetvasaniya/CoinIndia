import { useState, useEffect } from 'react';
import adminService from '../../services/adminService';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
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
  const defaultFields = [
    { name: 'name', label: 'Name', required: true, placeholder: `e.g., ${title} Name` },
    { name: 'description', label: 'Description (Optional)', type: 'textarea', placeholder: `Enter historical context or notes for this ${title.toLowerCase()}...` }
  ];

  const formFields = fields || defaultFields;

  const getInitialFormData = () => {
    const data = {};
    formFields.forEach(f => {
      data[f.name] = '';
    });
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
        await updateFn(editId, formData);
        toast.success(`${title} updated successfully`);
      } else {
        await createFn(formData);
        toast.success(`${title} created successfully`);
      }
      setFormData(getInitialFormData());
      setEditId(null);
      fetchItems();
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
      try {
        await deleteFn(id);
        toast.success(`${title} deleted successfully`);
        fetchItems();
      } catch (error) {
        toast.error(`Failed to delete ${title.toLowerCase()}`);
      }
    }
  };

  if (loading) return <div className="p-8 text-gray-500">Loading {title.toLowerCase()} data...</div>;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2">
        <h1 className="text-2xl font-serif text-[#1a1a1a] mb-6">{title} Catalog</h1>
        <div className="bg-white border border-gray-200 rounded-sm shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-[#FAFAF7]">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  {formFields.some(f => f.name === 'code') && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Code</th>
                  )}
                  {formFields.some(f => f.name === 'mintMark') && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mint Mark</th>
                  )}
                  {formFields.some(f => f.name === 'location') && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                  )}
                  {formFields.some(f => f.name === 'description') && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                  )}
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {items.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-8 text-center text-sm text-gray-500">
                      No {title.toLowerCase()} items recorded yet. Use the form to add one.
                    </td>
                  </tr>
                ) : (
                  items.map((item) => (
                    <tr key={item._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {item.flag && <span className="mr-2">{item.flag}</span>}
                        {item.name}
                      </td>
                      {formFields.some(f => f.name === 'code') && (
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.code || '-'}</td>
                      )}
                      {formFields.some(f => f.name === 'mintMark') && (
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.mintMark || '-'}</td>
                      )}
                      {formFields.some(f => f.name === 'location') && (
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.location || '-'}</td>
                      )}
                      {formFields.some(f => f.name === 'description') && (
                        <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">{item.description || '-'}</td>
                      )}
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button 
                          onClick={() => handleEdit(item)} 
                          className="text-[#B8860B] hover:text-[#8B6914] mr-4 p-1"
                          title="Edit"
                        >
                          <FiEdit2 />
                        </button>
                        <button 
                          onClick={() => handleDelete(item._id)} 
                          className="text-red-600 hover:text-red-900 p-1"
                          title="Delete"
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

      <div>
        <div className="bg-white p-6 border border-gray-200 rounded-sm shadow-sm sticky top-6">
          <h2 className="text-lg font-serif text-[#1a1a1a] mb-4 border-b pb-2">
            {editId ? `Edit ${title}` : `Add New ${title}`}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            {formFields.map((field) => {
              if (field.type === 'textarea') {
                return (
                  <div key={field.name}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {field.label} {field.required && <span className="text-red-500">*</span>}
                    </label>
                    <textarea 
                      rows="3" 
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#B8860B] focus:border-[#B8860B] sm:text-sm" 
                      placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}...`}
                      value={formData[field.name] || ''} 
                      onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })}
                      required={field.required}
                    />
                  </div>
                );
              }

              if (field.type === 'countrySelect') {
                return (
                  <div key={field.name}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {field.label} {field.required && <span className="text-red-500">*</span>}
                    </label>
                    <select
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#B8860B] focus:border-[#B8860B] sm:text-sm bg-white"
                      value={formData[field.name] || ''}
                      onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })}
                      required={field.required}
                    >
                      <option value="">{field.placeholder || '-- Select Country --'}</option>
                      {countries.map(c => (
                        <option key={c._id} value={c._id}>
                          {c.flag ? `${c.flag} ` : ''}{c.name} ({c.code})
                        </option>
                      ))}
                    </select>
                  </div>
                );
              }

              return (
                <Input 
                  key={field.name}
                  label={field.label} 
                  required={field.required} 
                  placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}...`}
                  value={formData[field.name] || ''} 
                  onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })} 
                />
              );
            })}

            <div className="flex space-x-2 pt-3 border-t">
              <Button type="submit" className="w-full">
                {editId ? `Update ${title}` : `Save ${title}`}
              </Button>
              {editId && (
                <Button 
                  type="button" 
                  variant="outline" 
                  className="w-full" 
                  onClick={() => { setEditId(null); setFormData(getInitialFormData()); }}
                >
                  Cancel
                </Button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default GenericManager;
