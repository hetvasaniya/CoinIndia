import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import adminService from '../../services/adminService';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import { useTheme } from '../../context/ThemeContext';
import toast from 'react-hot-toast';
import { ERA_OPTIONS, CONDITION_COLORS } from '../../utils/constants';
import { validateCoinForm } from '../../utils/validation';
import { FiCpu, FiCheckCircle, FiRefreshCw, FiAlertTriangle, FiLayers } from 'react-icons/fi';

const CoinForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isDark } = useTheme();
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
  const [errors, setErrors] = useState({});

  const [existingImages, setExistingImages] = useState([]);
  const [imageFiles, setImageFiles] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);

  // AI Coin Analysis State
  const [analyzingAi, setAnalyzingAi] = useState(false);
  const [aiStage, setAiStage] = useState('');
  const [aiExtractedInfo, setAiExtractedInfo] = useState(null);

  const handleAnalyzeWithAi = async () => {
    if (analyzingAi) return;
    if (imageFiles.length === 0) {
      toast.error('Please choose at least one coin image file below before running AI analysis.');
      return;
    }

    setAnalyzingAi(true);
    setAiStage('Uploading coin photographs...');

    const submitData = new FormData();
    Array.from(imageFiles).forEach((file) => {
      submitData.append('images', file);
    });

    try {
      setAiStage('Analyzing inscriptions, portrait, ruler, mint & condition with Gemini...');
      const response = await adminService.analyzeSingleCoin(submitData, (progressEvent) => {
        if (progressEvent.total && progressEvent.loaded === progressEvent.total) {
          setAiStage('Extracting numismatic specifications and catalog match...');
        }
      });

      const extracted = response.draft?.formData || response.data || response.coin || {};

      // Match category ID if needed
      let matchedCatId = '';
      if (extracted.category) {
        matchedCatId = typeof extracted.category === 'object' ? extracted.category._id : extracted.category;
      }
      if (!matchedCatId && (extracted.categorySuggestedName || extracted.era)) {
        const catTarget = (extracted.categorySuggestedName || extracted.era).toLowerCase();
        const found = categories.find((c) => {
          const cName = c.name.toLowerCase();
          return cName === catTarget || cName.includes(catTarget) || catTarget.includes(cName);
        });
        if (found) matchedCatId = found._id;
      }

      // Match country ID if needed
      let matchedCounId = '';
      if (extracted.country) {
        matchedCounId = typeof extracted.country === 'object' ? extracted.country._id : extracted.country;
      }
      if (!matchedCounId && extracted.countrySuggestedName) {
        const counTarget = extracted.countrySuggestedName.toLowerCase();
        const found = countries.find((c) => {
          const cName = c.name.toLowerCase();
          return cName === counTarget || cName.includes(counTarget) || counTarget.includes(cName);
        });
        if (found) matchedCounId = found._id;
      }

      // Match mint ID if needed
      let matchedMintId = '';
      if (extracted.mint) {
        matchedMintId = typeof extracted.mint === 'object' ? extracted.mint._id : extracted.mint;
      }
      if (!matchedMintId && (extracted.mintSuggestedName || extracted.mintOfOrigin)) {
        const mintTarget = (extracted.mintSuggestedName || extracted.mintOfOrigin).toLowerCase();
        const found = mints.find((m) => {
          const mName = m.name.toLowerCase();
          const mLocation = m.location ? m.location.toLowerCase() : '';
          return mName.includes(mintTarget) || mLocation.includes(mintTarget) || mintTarget.includes(mName);
        });
        if (found) matchedMintId = found._id;
      }

      setFormData((prev) => ({
        ...prev,
        name: extracted.name || extracted.artifactName || prev.name,
        year: extracted.year ? String(extracted.year) : (extracted.yearOfIssue ? String(extracted.yearOfIssue) : prev.year),
        sku: extracted.sku || prev.sku,
        description: extracted.description || extracted.historicalNarrative || prev.description,
        price: extracted.price !== null && extracted.price !== undefined ? String(extracted.price) : (extracted.suggestedPriceINR ? String(extracted.suggestedPriceINR) : prev.price),
        category: matchedCatId || prev.category,
        country: matchedCounId || prev.country,
        mint: matchedMintId || prev.mint,
        era: extracted.era || extracted.historicalEra || prev.era,
        condition: extracted.condition || extracted.conditionGrade || prev.condition,
        material: extracted.material || extracted.metalComposition || prev.material,
        weight: extracted.weight ? String(extracted.weight) : prev.weight,
        diameter: extracted.diameter ? String(extracted.diameter) : prev.diameter,
        denomination: extracted.denomination || extracted.faceDenomination || prev.denomination,
        obverseDesign: extracted.obverseDesign || prev.obverseDesign,
        reverseDesign: extracted.reverseDesign || prev.reverseDesign,
      }));

      setErrors({});

      setAiExtractedInfo({
        detectedName: extracted.name || extracted.artifactName,
        confidence: response.draft?.confidence || {},
        reasoning: response.draft?.reasoningSummary || '',
        draftId: response.draft?._id,
        analysisWarning: response.analysisWarning,
      });

      if (response.analysisWarning) {
        toast(response.analysisWarning, { icon: '⚠️', duration: 7000 });
      } else {
        toast.success('Coin details extracted successfully with AI! Review and edit the prefilled values below.');
      }
    } catch (err) {
      console.error('AI Coin Analysis error in CoinForm:', err);
      const errMsg = err.response?.data?.message || err.message || 'AI analysis is temporarily unavailable. Please try again in a few moments.';
      toast.error(errMsg, { duration: 6000 });
    } finally {
      setAnalyzingAi(false);
      setAiStage('');
    }
  };

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
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleInputBlur = (field) => {
    if (field === 'name' && formData.name && formData.name.trim().length < 3) {
      setErrors((prev) => ({ ...prev, name: 'Artifact name must be at least 3 characters' }));
    }
    if (field === 'price' && formData.price !== '') {
      if (Number(formData.price) <= 0) {
        setErrors((prev) => ({ ...prev, price: 'Selling price must be greater than ₹0' }));
      }
    }
    if (field === 'quantity' && formData.quantity !== '') {
      if (Number(formData.quantity) < 0 || !Number.isInteger(Number(formData.quantity))) {
        setErrors((prev) => ({ ...prev, quantity: 'Quantity must be a positive whole integer' }));
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const { isValid, errors: validationErrors } = validateCoinForm(formData);
    if (!isValid) {
      setErrors(validationErrors);
      toast.error('Please fix the errors in the coin form');
      return;
    }

    setLoading(true);

    const submitData = new FormData();
    submitData.append('name', formData.name.trim());
    submitData.append('sku', formData.sku ? formData.sku.trim() : '');
    submitData.append('sellingPrice', formData.price);
    submitData.append('quantity', formData.quantity);
    submitData.append('category', formData.category);
    submitData.append('country', formData.country);
    if (formData.mint) submitData.append('mint', formData.mint);
    submitData.append('yearOfIssue', formData.year.trim());
    submitData.append('era', formData.era);
    submitData.append('condition', formData.condition);
    submitData.append('material', formData.material ? formData.material.trim() : '');
    if (formData.weight) submitData.append('weight', formData.weight);
    if (formData.diameter) submitData.append('diameter', formData.diameter);
    submitData.append('denomination', formData.denomination ? formData.denomination.trim() : '');
    submitData.append('obverseDescription', formData.obverseDesign ? formData.obverseDesign.trim() : '');
    submitData.append('reverseDescription', formData.reverseDesign ? formData.reverseDesign.trim() : '');
    submitData.append('historicalSignificance', formData.description ? formData.description.trim() : '');
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
    return <div className={`p-12 text-center font-serif text-lg ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Loading artifact specifications...</div>;
  }

  const cardBg = isDark ? 'bg-dark-800 border-dark-700' : 'bg-white border-gray-200';
  const labelClass = `block text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`;
  const selectClass = `w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-1 focus:ring-gold-500 focus:border-gold-500 sm:text-sm ${
    isDark ? 'bg-dark-700 border-dark-600 text-white' : 'bg-white border-gray-300 text-gray-900'
  }`;
  const textareaClass = `w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-1 focus:ring-gold-500 focus:border-gold-500 sm:text-sm ${
    isDark ? 'bg-dark-700 border-dark-600 text-white placeholder-gray-500' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
  }`;

  return (
    <div className="max-w-5xl mx-auto pb-12">
      <div className="mb-6 sm:mb-8">
        <button 
          onClick={() => navigate(-1)} 
          className="text-sm text-gold-500 hover:text-gold-400 mb-2 flex items-center gap-1 transition-colors"
        >
          &larr; Back to Catalog
        </button>
        <h1 className={`text-2xl sm:text-3xl font-serif ${isDark ? 'text-white' : 'text-gray-900'}`}>
          {isEdit ? 'Edit Coin Artifact' : 'Register New Coin Artifact'}
        </h1>
        <p className={`mt-1 text-xs sm:text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
          Fill in the specifications below. Helpful example placeholders are provided in every field.
        </p>
      </div>

      {/* AI Quick Banner */}
      <div className={`mb-6 p-4 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
        isDark ? 'bg-gold-500/10 border-gold-500/30' : 'bg-gold-50 border-gold-200'
      }`}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gold-500 text-dark-900 flex items-center justify-center font-bold flex-shrink-0">
            <FiCpu className="w-5 h-5" />
          </div>
          <div>
            <h3 className={`text-sm font-semibold ${isDark ? 'text-gold-400' : 'text-gold-900'}`}>
              AI-Powered Coin Auto-Fill
            </h3>
            <p className={`text-xs ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
              Upload coin photographs below and let Gemini extract year, denomination, mint, metal, and market value.
            </p>
          </div>
        </div>
        <Link to="/admin/coins/ai">
          <Button variant="outline" size="sm" type="button" className="whitespace-nowrap text-xs border-gold-500 text-gold-500 hover:bg-gold-500/20">
            <FiLayers className="mr-1.5" /> Open Full AI Workspace
          </Button>
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8" noValidate>
        {/* Identification */}
        <div className={`p-4 sm:p-6 border rounded-xl shadow-sm ${cardBg}`}>
          <h2 className={`text-lg sm:text-xl font-serif mb-4 sm:mb-6 border-b pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-1 ${
            isDark ? 'text-white border-dark-700' : 'text-gray-900 border-gray-200'
          }`}>
            <span>1. Identification & Classification</span>
            <span className={`text-xs font-sans font-normal ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Required fields marked with *</span>
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
                onBlur={() => handleInputBlur('name')}
                error={errors.name}
              />
            </div>
            <Input 
              label="Year of Issue" 
              name="year" 
              required 
              placeholder="e.g., 1862 or 1556 or 320 BCE" 
              value={formData.year} 
              onChange={handleInputChange} 
              error={errors.year}
            />
            <Input 
              label="SKU / Stock Identifier" 
              name="sku" 
              placeholder="e.g., COIN-IND-1862-001" 
              value={formData.sku} 
              onChange={handleInputChange} 
            />
            
            <div>
              <label className={labelClass}>Category <span className="text-red-500">*</span></label>
              <select 
                name="category" 
                required 
                value={formData.category} 
                onChange={handleInputChange} 
                className={`${selectClass} ${errors.category ? 'border-red-500' : ''}`}
              >
                <option value="">-- Select Category (e.g., British India, Mughal) --</option>
                {categories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
              </select>
              {errors.category && <p className="mt-1 text-sm text-red-500">{errors.category}</p>}
            </div>
            
            <div>
              <label className={labelClass}>Historical Era <span className="text-red-500">*</span></label>
              <select 
                name="era" 
                required 
                value={formData.era} 
                onChange={handleInputChange} 
                className={`${selectClass} ${errors.era ? 'border-red-500' : ''}`}
              >
                <option value="">-- Select Era (e.g., British India, Mughal) --</option>
                {ERA_OPTIONS.map(e => <option key={e} value={e}>{e}</option>)}
              </select>
              {errors.era && <p className="mt-1 text-sm text-red-500">{errors.era}</p>}
            </div>

            <div>
              <label className={labelClass}>Country of Origin <span className="text-red-500">*</span></label>
              <select 
                name="country" 
                required 
                value={formData.country} 
                onChange={handleInputChange} 
                className={`${selectClass} ${errors.country ? 'border-red-500' : ''}`}
              >
                <option value="">-- Select Country (e.g., India, United Kingdom) --</option>
                {countries.map(c => <option key={c._id} value={c._id}>{c.flag ? `${c.flag} ` : ''}{c.name}</option>)}
              </select>
              {errors.country && <p className="mt-1 text-sm text-red-500">{errors.country}</p>}
            </div>
            
            <div>
              <label className={labelClass}>Numismatic Condition Grade <span className="text-red-500">*</span></label>
              <select 
                name="condition" 
                required 
                value={formData.condition} 
                onChange={handleInputChange} 
                className={`${selectClass} ${errors.condition ? 'border-red-500' : ''}`}
              >
                <option value="">-- Select Grade (e.g., UNC, XF, VF) --</option>
                {Object.keys(CONDITION_COLORS).map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              {errors.condition && <p className="mt-1 text-sm text-red-500">{errors.condition}</p>}
            </div>

            <div className="md:col-span-2">
              <label className={labelClass}>Historical Significance & Narrative</label>
              <textarea name="description" rows="4" placeholder="Describe the historical context, issuing dynasty or ruler, commemorative milestones, strike quality..." className={textareaClass} value={formData.description} onChange={handleInputChange}></textarea>
            </div>
          </div>
        </div>

        {/* Images */}
        <div className={`p-4 sm:p-6 border rounded-xl shadow-sm ${cardBg}`}>
          <h2 className={`text-lg sm:text-xl font-serif mb-4 sm:mb-6 border-b pb-3 ${isDark ? 'text-white border-dark-700' : 'text-gray-900 border-gray-200'}`}>
            2. Artifact Imagery (Obverse & Reverse)
          </h2>

          {/* AI Extracted Information Summary */}
          {aiExtractedInfo && (
            <div className={`mb-6 p-4 rounded-xl border ${
              isDark ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-300' : 'bg-emerald-50 border-emerald-200 text-emerald-800'
            }`}>
              <div className="flex items-start gap-3">
                <FiCheckCircle className="w-5 h-5 text-emerald-500 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-medium">
                    AI Analysis Applied for: <span className="font-semibold">{aiExtractedInfo.detectedName}</span>
                  </p>
                  <p className="text-xs mt-1 text-opacity-80">
                    Form fields have been automatically populated. Review the technical specifications, condition, and pricing below before registering.
                  </p>
                  {aiExtractedInfo.draftId && (
                    <div className="mt-2">
                      <Link to={`/admin/coins/ai/${aiExtractedInfo.draftId}`} className="text-xs text-gold-500 hover:underline inline-flex items-center gap-1 font-medium">
                        Open in Full AI Review Workspace &rarr;
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* AI Analyze Trigger Bar */}
          {imageFiles.length > 0 && (
            <div className={`mb-6 p-4 rounded-xl border flex flex-col sm:flex-row items-center justify-between gap-4 ${
              isDark ? 'bg-dark-700/60 border-dark-600' : 'bg-gold-50/70 border-gold-200'
            }`}>
              <div>
                <p className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {imageFiles.length} photo{imageFiles.length > 1 ? 's' : ''} ready for AI analysis
                </p>
                <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  Gemini will detect denomination, year, mint, country, composition, and market value.
                </p>
              </div>
              <Button
                type="button"
                onClick={handleAnalyzeWithAi}
                isLoading={analyzingAi}
                disabled={analyzingAi}
                className="bg-gold-500 hover:bg-gold-600 text-dark-900 font-semibold shadow-gold whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FiCpu className="mr-2" />
                {analyzingAi ? (aiStage || 'Analyzing with Gemini...') : 'Analyze with Gemini AI'}
              </Button>
            </div>
          )}
          
          {existingImages.length > 0 && (
            <div className="mb-6">
              <p className="text-xs uppercase tracking-wider text-gold-500 font-semibold mb-3">Existing Images</p>
              <div className="flex flex-wrap gap-4">
                {existingImages.map((img, i) => (
                  <div key={i} className={`w-24 h-24 border p-1 rounded-lg flex items-center justify-center ${isDark ? 'bg-dark-700 border-dark-600' : 'bg-gray-50 border-gray-200'}`}>
                    <img src={typeof img === 'string' ? img : img.url} alt={`Artifact view ${i + 1}`} className="max-h-full max-w-full object-contain" />
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className={`border-2 border-dashed rounded-lg p-10 text-center transition-colors ${
            isDark ? 'border-dark-600 bg-dark-700/50 hover:border-gold-500' : 'border-gray-300 bg-[#FAFAF7] hover:border-gold-500'
          }`}>
            <div className="space-y-2">
              <svg className={`mx-auto h-12 w-12 ${isDark ? 'text-gray-600' : 'text-gray-400'}`} stroke="currentColor" fill="none" viewBox="0 0 48 48">
                <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <div className={`flex text-sm justify-center ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                <label className={`relative cursor-pointer rounded-md font-medium text-gold-500 hover:text-gold-400 focus-within:outline-none px-2 py-0.5 border ${
                  isDark ? 'bg-dark-700 border-dark-600' : 'bg-white border-gray-200'
                }`}>
                  <span>Choose coin image files</span>
                  <input type="file" multiple className="sr-only" onChange={(e) => setImageFiles(e.target.files)} accept="image/*" />
                </label>
                <p className="pl-2 pt-0.5">or drag and drop coin photos</p>
              </div>
              <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>High-resolution PNG, JPG, WEBP up to 5MB each (Front & Back)</p>
            </div>
            
            {imagePreviews.length > 0 && (
              <div className={`mt-6 border-t pt-4 ${isDark ? 'border-dark-600' : 'border-gray-200'}`}>
                <p className="text-sm font-medium text-emerald-500 mb-3">{imagePreviews.length} new photo(s) selected:</p>
                <div className="flex flex-wrap justify-center gap-3">
                  {imagePreviews.map((url, i) => (
                    <div key={i} className={`w-20 h-20 border rounded-lg p-1 shadow-sm ${isDark ? 'bg-dark-700 border-dark-600' : 'bg-white border-gray-200'}`}>
                      <img src={url} alt={`Upload preview ${i+1}`} className="w-full h-full object-contain" />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Specs */}
        <div className={`p-4 sm:p-6 border rounded-xl shadow-sm ${cardBg}`}>
          <h2 className={`text-lg sm:text-xl font-serif mb-4 sm:mb-6 border-b pb-3 ${isDark ? 'text-white border-dark-700' : 'text-gray-900 border-gray-200'}`}>
            3. Technical Numismatic Specifications
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            <Input label="Metal / Composition" name="material" placeholder="e.g., Silver (.917), Gold (.999)" value={formData.material} onChange={handleInputChange} />
            <Input label="Weight (g)" name="weight" type="number" step="0.01" placeholder="e.g., 11.66" value={formData.weight} onChange={handleInputChange} error={errors.weight} />
            <Input label="Diameter (mm)" name="diameter" type="number" step="0.1" placeholder="e.g., 30.8" value={formData.diameter} onChange={handleInputChange} error={errors.diameter} />
            <Input label="Face Denomination" name="denomination" placeholder="e.g., 1 Rupee, 1 Mohur" value={formData.denomination} onChange={handleInputChange} />
            
            <div className="md:col-span-2 lg:col-span-4">
              <label className={labelClass}>Mint of Origin / Mint Mark Location</label>
              <select name="mint" value={formData.mint} onChange={handleInputChange} className={selectClass}>
                <option value="">-- Select Mint (e.g., Calcutta, Bombay, Lahore, Madras) --</option>
                {mints.map(m => <option key={m._id} value={m._id}>{m.name} {m.mintMark ? `(${m.mintMark})` : ''}</option>)}
              </select>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mt-4 sm:mt-6">
            <div>
              <label className={labelClass}>Obverse (Front) Design</label>
              <textarea name="obverseDesign" rows="3" placeholder="Describe front engraving..." className={textareaClass} value={formData.obverseDesign} onChange={handleInputChange}></textarea>
            </div>
            <div>
              <label className={labelClass}>Reverse (Back) Design</label>
              <textarea name="reverseDesign" rows="3" placeholder="Describe back engraving..." className={textareaClass} value={formData.reverseDesign} onChange={handleInputChange}></textarea>
            </div>
          </div>
        </div>

        {/* Valuation & Stock */}
        <div className={`p-4 sm:p-6 border rounded-xl shadow-sm ${cardBg}`}>
          <h2 className={`text-lg sm:text-xl font-serif mb-4 sm:mb-6 border-b pb-3 ${isDark ? 'text-white border-dark-700' : 'text-gray-900 border-gray-200'}`}>
            4. Valuation & Inventory Stock
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            <Input 
              label="Selling Price (₹ INR)" 
              name="price" 
              type="number" 
              required 
              placeholder="e.g., 12500" 
              value={formData.price} 
              onChange={handleInputChange} 
              onBlur={() => handleInputBlur('price')}
              error={errors.price}
            />
            <Input 
              label="Quantity Available in Stock" 
              name="quantity" 
              type="number" 
              required 
              placeholder="e.g., 1 or 5" 
              value={formData.quantity} 
              onChange={handleInputChange} 
              onBlur={() => handleInputBlur('quantity')}
              error={errors.quantity}
            />
            
            <div className={`md:col-span-2 flex items-center mt-2 p-3 rounded-lg border ${
              isDark ? 'bg-dark-700/50 border-dark-600' : 'bg-[#FAFAF7] border-gray-200'
            }`}>
              <input type="checkbox" id="isFeatured" name="isFeatured" checked={formData.isFeatured} onChange={handleInputChange} className="h-4 w-4 text-gold-500 focus:ring-gold-500 border-gray-300 rounded accent-gold-500 cursor-pointer" />
              <label htmlFor="isFeatured" className={`ml-3 block text-sm font-medium cursor-pointer ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Feature this artifact in Homepage & Curated Highlights
              </label>
            </div>
          </div>
        </div>

        <div className={`flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-3 sm:space-x-4 pt-4 border-t ${isDark ? 'border-dark-700' : 'border-gray-200'}`}>
          <Button variant="outline" type="button" onClick={() => navigate('/admin/coins')} className="w-full sm:w-auto">
            Cancel
          </Button>
          <Button type="submit" isLoading={loading} className="w-full sm:w-auto shadow-gold">
            {isEdit ? 'Save Changes' : 'Register Artefact'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default CoinForm;
