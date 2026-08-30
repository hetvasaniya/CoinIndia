import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import adminService from '../../services/adminService';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import toast from 'react-hot-toast';
import { ERA_OPTIONS, CONDITION_COLORS } from '../../utils/constants';

const CoinForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;

  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(isEdit);
  const [categories, setCategories] = useState([]);
  const [countries, setCountries] = useState([]);
  const [mints, setMints] = useState([]);
  
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    description: '',
    price: '',
    quantity: '1',
    category: '',
    country: '',
    mint: '',
    year: '',
    era: 'British India',
    condition: 'UNC',
    material: '',
    weight: '',
    diameter: '',
    denomination: '',
    obverseDesign: '',
    reverseDesign: '',
    isFeatured: false,
  });

  const [existingImages, setExistingImages] = useState([]);
  const [imageFiles, setImageFiles] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);

  useEffect(() => {
    fetchMetadata();
    if (isEdit) {
      fetchCoinData();
    }
  }, [id]);

  useEffect(() => {
    if (imageFiles.length > 0) {
      const urls = Array.from(imageFiles).map(file => URL.createObjectURL(file));
      setImagePreviews(urls);
      return () => urls.forEach(url => URL.revokeObjectURL(url));
    } else {
      setImagePreviews([]);
    }
  }, [imageFiles]);

  const fetchMetadata = async () => {
    try {
      const [catRes, counRes, mintRes] = await Promise.all([
        adminService.getCategories(),
        adminService.getCountries(),
        adminService.getMints()
      ]);
      const parseArray = (res) => (Array.isArray(res) ? res : (res?.data || []));
      setCategories(parseArray(catRes));
      setCountries(parseArray(counRes));
      setMints(parseArray(mintRes));
    } catch (error) {
      toast.error('Failed to load categories, countries, or mints');
    }
  };

  const fetchCoinData = async () => {
    setDataLoading(true);
    try {
      const data = await adminService.getCoin(id);
      if (data) {
        setFormData({
          name: data.name || '',
          sku: data.sku || '',
          description: data.historicalSignificance || data.description || '',
          price: data.sellingPrice !== undefined ? String(data.sellingPrice) : (data.price !== undefined ? String(data.price) : ''),
          quantity: data.quantity !== undefined ? String(data.quantity) : '1',
          category: data.category?._id || data.category || '',
          country: data.country?._id || data.country || '',
          mint: data.mint?._id || data.mint || '',
          year: data.yearOfIssue !== undefined ? String(data.yearOfIssue) : (data.year !== undefined ? String(data.year) : ''),
          era: data.era || 'British India',
          condition: data.condition || 'UNC',
          material: data.material || '',
          weight: data.weight !== undefined ? String(data.weight) : '',
          diameter: data.diameter !== undefined ? String(data.diameter) : '',
          denomination: data.denomination || '',
          obverseDesign: data.obverseDescription || '',
          reverseDesign: data.reverseDescription || '',
          isFeatured: !!data.isFeatured,
        });
        if (data.images && Array.isArray(data.images)) {
          setExistingImages(data.images);
        }
      }
    } catch (error) {
      toast.error('Failed to load existing coin data');
    } finally {
      setDataLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const submitData = new FormData();
    submitData.append('name', formData.name);
    submitData.append('sku', formData.sku);
    submitData.append('sellingPrice', formData.price);
    submitData.append('quantity', formData.quantity);
    submitData.append('category', formData.category);
    submitData.append('country', formData.country);
    if (formData.mint) submitData.append('mint', formData.mint);
    submitData.append('yearOfIssue', formData.year);
    submitData.append('era', formData.era);
    submitData.append('condition', formData.condition);
    submitData.append('material', formData.material);
    if (formData.weight) submitData.append('weight', formData.weight);
    if (formData.diameter) submitData.append('diameter', formData.diameter);
    submitData.append('denomination', formData.denomination);
    submitData.append('obverseDescription', formData.obverseDesign);
    submitData.append('reverseDescription', formData.reverseDesign);
    submitData.append('historicalSignificance', formData.description);
    submitData.append('isFeatured', formData.isFeatured);
    
    Array.from(imageFiles).forEach(file => {
      submitData.append('images', file);
    });

    try {
      if (isEdit) {
        await adminService.updateCoin(id, submitData);
        toast.success('Coin artifact updated successfully');
      } else {
        await adminService.createCoin(submitData);
        toast.success('Coin artifact registered successfully');
      }
      navigate('/admin/coins');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save coin artefact');
    } finally {
      setLoading(false);
    }
  };

  if (dataLoading) {
    return <div className="p-12 text-center text-gray-500 font-serif text-lg">Loading artifact specifications...</div>;
  }

  return (
    <div className="max-w-5xl mx-auto pb-12">
      <div className="mb-8">
        <button 
          onClick={() => navigate(-1)} 
          className="text-sm text-gray-500 hover:text-[#B8860B] mb-2 flex items-center gap-1 transition-colors"
        >
          &larr; Back to Catalog
        </button>
        <h1 className="text-3xl font-serif text-[#1a1a1a]">
          {isEdit ? 'Edit Coin Artifact' : 'Register New Coin Artifact'}
        </h1>
        <p className="text-gray-500 mt-1 text-sm">
          Fill in the specifications below. Helpful example placeholders are provided in every field.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Identification Section */}
        <div className="bg-white p-6 border border-gray-200 rounded-sm shadow-sm">
          <h2 className="text-xl font-serif text-[#1a1a1a] mb-6 border-b pb-2 flex items-center justify-between">
            <span>1. Identification & Classification</span>
            <span className="text-xs font-sans text-gray-400 font-normal">Required fields marked with *</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <Input 
                label="Artifact Name" 
                name="name" 
                required 
                placeholder="e.g., 1862 Queen Victoria One Rupee (Calcutta Mint, Silver)" 
                value={formData.name} 
                onChange={handleInputChange} 
              />
            </div>
            
            <Input 
              label="Year of Issue" 
              name="year" 
              required 
              placeholder="e.g., 1862 or 1556 or 320 BCE" 
              value={formData.year} 
              onChange={handleInputChange} 
            />
            
            <Input 
              label="SKU / Stock Identifier" 
              name="sku" 
              placeholder="e.g., COIN-IND-1862-001" 
              value={formData.sku} 
              onChange={handleInputChange} 
            />
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category <span className="text-red-500">*</span>
              </label>
              <select 
                name="category" 
                required 
                value={formData.category} 
                onChange={handleInputChange} 
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#B8860B] focus:border-[#B8860B] sm:text-sm bg-white"
              >
                <option value="">-- Select Category (e.g., British India, Mughal) --</option>
                {categories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Historical Era <span className="text-red-500">*</span>
              </label>
              <select 
                name="era" 
                required 
                value={formData.era} 
                onChange={handleInputChange} 
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#B8860B] focus:border-[#B8860B] sm:text-sm bg-white"
              >
                <option value="">-- Select Era (e.g., British India, Mughal) --</option>
                {ERA_OPTIONS.map(e => <option key={e} value={e}>{e}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Country of Origin <span className="text-red-500">*</span>
              </label>
              <select 
                name="country" 
                required 
                value={formData.country} 
                onChange={handleInputChange} 
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#B8860B] focus:border-[#B8860B] sm:text-sm bg-white"
              >
                <option value="">-- Select Country (e.g., India, United Kingdom) --</option>
                {countries.map(c => <option key={c._id} value={c._id}>{c.flag ? `${c.flag} ` : ''}{c.name}</option>)}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Numismatic Condition Grade <span className="text-red-500">*</span>
              </label>
              <select 
                name="condition" 
                required 
                value={formData.condition} 
                onChange={handleInputChange} 
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#B8860B] focus:border-[#B8860B] sm:text-sm bg-white"
              >
                <option value="">-- Select Grade (e.g., UNC, XF, VF) --</option>
                {Object.keys(CONDITION_COLORS).map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Historical Significance & Narrative
              </label>
              <textarea 
                name="description" 
                rows="4" 
                placeholder="Describe the historical context, issuing dynasty or ruler, commemorative milestones, strike quality, and numismatic pedigree..." 
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#B8860B] focus:border-[#B8860B] sm:text-sm" 
                value={formData.description} 
                onChange={handleInputChange}
              ></textarea>
            </div>
          </div>
        </div>

        {/* Imagery Section */}
        <div className="bg-white p-6 border border-gray-200 rounded-sm shadow-sm">
          <h2 className="text-xl font-serif text-[#1a1a1a] mb-6 border-b pb-2">2. Artifact Imagery (Obverse & Reverse)</h2>
          
          {existingImages.length > 0 && (
            <div className="mb-6">
              <p className="text-xs uppercase tracking-wider text-gray-500 font-semibold mb-3">Existing Images</p>
              <div className="flex flex-wrap gap-4">
                {existingImages.map((img, i) => (
                  <div key={i} className="w-24 h-24 border border-gray-200 p-1 bg-[#FAFAF7] rounded flex items-center justify-center">
                    <img 
                      src={typeof img === 'string' ? img : img.url} 
                      alt={`Artifact view ${i + 1}`} 
                      className="max-h-full max-w-full object-contain" 
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="border-2 border-dashed border-gray-300 rounded-md p-10 text-center bg-[#FAFAF7] hover:border-[#B8860B] transition-colors">
            <div className="space-y-2">
              <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <div className="flex text-sm text-gray-600 justify-center">
                <label className="relative cursor-pointer bg-white rounded-md font-medium text-[#B8860B] hover:text-[#8B6914] focus-within:outline-none px-2 py-0.5 border border-gray-200">
                  <span>Choose coin image files</span>
                  <input 
                    type="file" 
                    multiple 
                    className="sr-only" 
                    onChange={(e) => setImageFiles(e.target.files)} 
                    accept="image/*" 
                  />
                </label>
                <p className="pl-2 pt-0.5">or drag and drop coin photos</p>
              </div>
              <p className="text-xs text-gray-400">High-resolution PNG, JPG, WEBP up to 5MB each (Front & Back)</p>
            </div>
            
            {imagePreviews.length > 0 && (
              <div className="mt-6 border-t pt-4">
                <p className="text-sm font-medium text-emerald-700 mb-3">{imagePreviews.length} new photo(s) selected:</p>
                <div className="flex flex-wrap justify-center gap-3">
                  {imagePreviews.map((url, i) => (
                    <div key={i} className="w-20 h-20 border border-emerald-300 rounded p-1 bg-white shadow-sm">
                      <img src={url} alt={`Upload preview ${i+1}`} className="w-full h-full object-contain" />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Specifications Section */}
        <div className="bg-white p-6 border border-gray-200 rounded-sm shadow-sm">
          <h2 className="text-xl font-serif text-[#1a1a1a] mb-6 border-b pb-2">3. Technical Numismatic Specifications</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Input 
              label="Metal / Composition" 
              name="material" 
              placeholder="e.g., Silver (.917), Gold (.999), Copper" 
              value={formData.material} 
              onChange={handleInputChange} 
            />
            
            <Input 
              label="Weight (in grams)" 
              name="weight" 
              type="number" 
              step="0.01" 
              placeholder="e.g., 11.66" 
              value={formData.weight} 
              onChange={handleInputChange} 
            />
            
            <Input 
              label="Diameter (in mm)" 
              name="diameter" 
              type="number" 
              step="0.1" 
              placeholder="e.g., 30.8" 
              value={formData.diameter} 
              onChange={handleInputChange} 
            />
            
            <Input 
              label="Face Denomination" 
              name="denomination" 
              placeholder="e.g., 1 Rupee, 1 Mohur, 8 Annas" 
              value={formData.denomination} 
              onChange={handleInputChange} 
            />
            
            <div className="md:col-span-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Mint of Origin / Mint Mark Location
              </label>
              <select 
                name="mint" 
                value={formData.mint} 
                onChange={handleInputChange} 
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#B8860B] focus:border-[#B8860B] sm:text-sm bg-white"
              >
                <option value="">-- Select Mint (e.g., Calcutta, Bombay, Lahore, Madras) --</option>
                {mints.map(m => <option key={m._id} value={m._id}>{m.name} {m.mintMark ? `(${m.mintMark})` : ''}</option>)}
              </select>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Obverse (Front) Design</label>
              <textarea 
                name="obverseDesign" 
                rows="3" 
                placeholder="Describe the front engraving: portrait of monarch/emperor, head facing left/right, royal titles, peripheral rim beading..." 
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#B8860B] focus:border-[#B8860B] sm:text-sm" 
                value={formData.obverseDesign} 
                onChange={handleInputChange}
              ></textarea>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Reverse (Back) Design</label>
              <textarea 
                name="reverseDesign" 
                rows="3" 
                placeholder="Describe the back engraving: denomination wording, floral wreath pattern, issue year, mint mark symbol..." 
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#B8860B] focus:border-[#B8860B] sm:text-sm" 
                value={formData.reverseDesign} 
                onChange={handleInputChange}
              ></textarea>
            </div>
          </div>
        </div>

        {/* Pricing & Inventory */}
        <div className="bg-white p-6 border border-gray-200 rounded-sm shadow-sm">
          <h2 className="text-xl font-serif text-[#1a1a1a] mb-6 border-b pb-2">4. Valuation & Inventory Stock</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input 
              label="Selling Price (₹ INR)" 
              name="price" 
              type="number" 
              required 
              placeholder="e.g., 12500" 
              value={formData.price} 
              onChange={handleInputChange} 
            />
            
            <Input 
              label="Quantity Available in Stock" 
              name="quantity" 
              type="number" 
              required 
              placeholder="e.g., 1 or 5" 
              value={formData.quantity} 
              onChange={handleInputChange} 
            />
            
            <div className="md:col-span-2 flex items-center mt-2 p-3 bg-[#FAFAF7] rounded border border-gray-200">
              <input 
                type="checkbox" 
                id="isFeatured" 
                name="isFeatured" 
                checked={formData.isFeatured} 
                onChange={handleInputChange} 
                className="h-4 w-4 text-[#B8860B] focus:ring-[#B8860B] border-gray-300 rounded cursor-pointer" 
              />
              <label htmlFor="isFeatured" className="ml-3 block text-sm font-medium text-gray-900 cursor-pointer">
                Feature this artifact in the Homepage & Curated Highlights
              </label>
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-4 pt-4 border-t">
          <Button variant="outline" type="button" onClick={() => navigate('/admin/coins')}>
            Cancel
          </Button>
          <Button type="submit" isLoading={loading}>
            {isEdit ? 'Save Changes' : 'Register Artefact'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default CoinForm;
