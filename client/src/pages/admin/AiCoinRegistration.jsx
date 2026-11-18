import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import adminService from '../../services/adminService';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import { useTheme } from '../../context/ThemeContext';
import toast from 'react-hot-toast';
import { ERA_OPTIONS, CONDITION_COLORS } from '../../utils/constants';
import { validateCoinForm } from '../../utils/validation';
import CoinAnalysisProgress from '../../components/admin/CoinAnalysisProgress';
import { 
  FiCpu, FiUploadCloud, FiTrash2, FiCheckCircle, 
  FiAlertTriangle, FiRefreshCw, FiSave, FiLayers, 
  FiHelpCircle, FiChevronRight, FiCheck, FiX, FiInfo,
  FiArrowRight, FiRotateCw
} from 'react-icons/fi';

const AiCoinRegistration = () => {
  const { draftId } = useParams();
  const navigate = useNavigate();
  const { isDark } = useTheme();

  // Navigation tab: 'single' | 'bulk' | 'drafts'
  const [activeTab, setActiveTab] = useState('single');

  // Metadata
  const [categories, setCategories] = useState([]);
  const [countries, setCountries] = useState([]);
  const [mints, setMints] = useState([]);
  const [loadingMetadata, setLoadingMetadata] = useState(true);

  // Single Coin State
  const [singleFiles, setSingleFiles] = useState([]);
  const [singleImageItems, setSingleImageItems] = useState([]);
  const [analyzingSingle, setAnalyzingSingle] = useState(false);
  const [singleProgressStage, setSingleProgressStage] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [progressState, setProgressState] = useState(null);
  const [activeAnalysisId, setActiveAnalysisId] = useState(null);
  const progressUnsubRef = useRef(null);

  // Bulk State
  const [bulkFiles, setBulkFiles] = useState([]);
  const [bulkImagePreviews, setBulkImagePreviews] = useState([]);
  const [analyzingBulk, setAnalyzingBulk] = useState(false);
  const [bulkProgressStage, setBulkProgressStage] = useState('');
  const [bulkDrafts, setBulkDrafts] = useState([]);
  const [bulkBatchId, setBulkBatchId] = useState(null);
  const [bulkProgressState, setBulkProgressState] = useState(null);
  const bulkProgressUnsubRef = useRef(null);

  // Active Draft being reviewed/edited
  const [currentDraft, setCurrentDraft] = useState(null);
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
    mintMark: '',
    obverseDesign: '',
    reverseDesign: '',
    isFeatured: false,
  });
  const [formErrors, setFormErrors] = useState({});

  // Drafts Tab State
  const [draftsList, setDraftsList] = useState([]);
  const [loadingDrafts, setLoadingDrafts] = useState(false);
  const [draftsFilter, setDraftsFilter] = useState('all');

  // Operational states
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [retryingAnalysis, setRetryingAnalysis] = useState(false);

  const singleFileInputRef = useRef(null);
  const bulkFileInputRef = useRef(null);

  // Fetch metadata and draft if specified in URL
  useEffect(() => {
    fetchMetadata();
    if (draftId) {
      loadSpecificDraft(draftId);
    }
  }, [draftId]);

  // Resume active analysis if browser was refreshed during an in-flight analysis
  useEffect(() => {
    const savedActive = localStorage.getItem('active_coin_analysis');
    if (savedActive) {
      try {
        const { analysisId } = JSON.parse(savedActive);
        if (analysisId) {
          setActiveAnalysisId(analysisId);
          setAnalyzingSingle(true);
          adminService.getAnalysisProgress(analysisId)
            .then((data) => {
              setProgressState(data);
              if (data.status === 'completed') {
                localStorage.removeItem('active_coin_analysis');
                setAnalyzingSingle(false);
                if (data.draft) {
                  populateDraftIntoForm(data.draft);
                } else if (data.draftId) {
                  adminService.getCoinDraft(data.draftId).then(populateDraftIntoForm).catch(console.error);
                }
              } else if (data.status === 'failed') {
                localStorage.removeItem('active_coin_analysis');
                setAnalyzingSingle(false);
              } else {
                // Analysis is still active on backend: subscribe to live progress updates
                if (progressUnsubRef.current) progressUnsubRef.current();
                progressUnsubRef.current = adminService.subscribeToAnalysisProgress(analysisId, {
                  onProgress: (evt) => setProgressState(evt),
                  onComplete: (evt) => {
                    localStorage.removeItem('active_coin_analysis');
                    setAnalyzingSingle(false);
                    if (evt.draft) populateDraftIntoForm(evt.draft);
                    else if (evt.draftId) adminService.getCoinDraft(evt.draftId).then(populateDraftIntoForm).catch(console.error);
                  },
                  onError: (evt) => {
                    localStorage.removeItem('active_coin_analysis');
                    setAnalyzingSingle(false);
                  },
                });
              }
            })
            .catch(() => {
              localStorage.removeItem('active_coin_analysis');
              setAnalyzingSingle(false);
            });
        }
      } catch (e) {
        localStorage.removeItem('active_coin_analysis');
      }
    }

    return () => {
      if (progressUnsubRef.current) progressUnsubRef.current();
      if (bulkProgressUnsubRef.current) bulkProgressUnsubRef.current();
    };
  }, []);

  // Load drafts when drafts tab is opened
  useEffect(() => {
    if (activeTab === 'drafts') {
      fetchDraftsList();
    }
  }, [activeTab, draftsFilter]);

  const fetchMetadata = async () => {
    try {
      const [catRes, counRes, mintRes] = await Promise.all([
        adminService.getCategories(),
        adminService.getCountries(),
        adminService.getMints(),
      ]);
      const parseArray = (res) => (Array.isArray(res) ? res : res?.data || []);
      setCategories(parseArray(catRes));
      setCountries(parseArray(counRes));
      setMints(parseArray(mintRes));
    } catch (err) {
      toast.error('Failed to load categories, countries, or mints.');
    } finally {
      setLoadingMetadata(false);
    }
  };

  const loadSpecificDraft = async (id) => {
    try {
      const draft = await adminService.getCoinDraft(id);
      populateDraftIntoForm(draft);
    } catch (err) {
      toast.error('Failed to load requested draft');
    }
  };

  const fetchDraftsList = async () => {
    setLoadingDrafts(true);
    try {
      const params = {};
      if (draftsFilter !== 'all') params.status = draftsFilter;
      const res = await adminService.getCoinDrafts(params);
      setDraftsList(res.drafts || []);
    } catch (err) {
      toast.error('Failed to fetch drafts list');
    } finally {
      setLoadingDrafts(false);
    }
  };

  const populateDraftIntoForm = (draft) => {
    setCurrentDraft(draft);
    const fd = draft.formData || {};
    setFormData({
      name: fd.name || '',
      sku: fd.sku || '',
      description: fd.description || '',
      price: fd.price !== undefined && fd.price !== null ? String(fd.price) : '',
      quantity: fd.quantity !== undefined && fd.quantity !== null ? String(fd.quantity) : '1',
      category: fd.category?._id || fd.category || '',
      country: fd.country?._id || fd.country || '',
      mint: fd.mint?._id || fd.mint || '',
      year: fd.year || '',
      era: fd.era || 'British India',
      condition: fd.condition || 'UNC',
      material: fd.material || '',
      weight: fd.weight !== undefined && fd.weight !== null ? String(fd.weight) : '',
      diameter: fd.diameter !== undefined && fd.diameter !== null ? String(fd.diameter) : '',
      denomination: fd.denomination || '',
      mintMark: fd.mintMark || '',
      obverseDesign: fd.obverseDesign || '',
      reverseDesign: fd.reverseDesign || '',
      isFeatured: !!fd.isFeatured,
    });

    if (draft.images && Array.isArray(draft.images)) {
      setSingleImageItems(
        draft.images.map((img) => ({
          url: img.url,
          role: img.role || 'uncertain',
          originalName: img.originalName || 'coin-photo.jpg',
          isExisting: true,
          localPath: img.localPath,
          publicId: img.publicId,
          isCloudinary: img.isCloudinary,
        }))
      );
    }
    setActiveTab('single');
  };

  // -------------------------------------------------------------
  // Single Coin Image Handling
  // -------------------------------------------------------------
  const handleSingleFilesSelected = (files) => {
    const fileList = Array.from(files);
    if (fileList.length === 0) return;

    const newItems = fileList.map((file, i) => {
      let role = 'uncertain';
      if (fileList.length === 2) {
        role = i === 0 ? 'obverse' : 'reverse';
      } else if (fileList.length === 1 && singleImageItems.length === 0) {
        role = 'obverse';
      }
      return {
        file,
        url: URL.createObjectURL(file),
        role,
        originalName: file.name,
        isExisting: false,
      };
    });

    setSingleFiles((prev) => [...prev, ...fileList]);
    setSingleImageItems((prev) => [...prev, ...newItems]);
  };

  const handleRemoveSingleImage = (indexToRemove) => {
    setSingleImageItems((prev) => prev.filter((_, idx) => idx !== indexToRemove));
    setSingleFiles((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handleSetImageRole = (index, newRole) => {
    setSingleImageItems((prev) =>
      prev.map((item, idx) => (idx === index ? { ...item, role: newRole } : item))
    );
  };

  const handleSwapObverseReverse = () => {
    setSingleImageItems((prev) =>
      prev.map((item) => {
        if (item.role === 'obverse') return { ...item, role: 'reverse' };
        if (item.role === 'reverse') return { ...item, role: 'obverse' };
        return item;
      })
    );
    toast.success('Front and back orientations swapped.');
  };

  // -------------------------------------------------------------
  // Single Coin Analysis
  // -------------------------------------------------------------
  const handleAnalyzeSingleCoin = async () => {
    if (analyzingSingle) return;
    if (singleImageItems.length === 0) {
      toast.error('Please upload at least one photograph of the coin (front and back recommended).');
      return;
    }

    // If all items are existing draft items and user wants to analyze
    if (singleImageItems.every((item) => !item.file) && currentDraft) {
      handleRetryAnalysis();
      return;
    }

    const analysisId = `analysis_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    setActiveAnalysisId(analysisId);
    setAnalyzingSingle(true);
    setUploadProgress(0);

    const initialProgress = {
      analysisId,
      stage: 'preparing_image',
      stageName: 'Preparing uploaded image.',
      progress: 5,
      status: 'processing',
      elapsedSeconds: 0,
      estimatedRemainingSeconds: 12,
      hasHistoricalData: false,
      message: 'Uploading and preparing coin photographs...',
    };
    setProgressState(initialProgress);

    try {
      localStorage.setItem('active_coin_analysis', JSON.stringify({ analysisId, startTime: Date.now() }));
    } catch (e) {}

    const submitData = new FormData();
    submitData.append('analysisId', analysisId);
    singleImageItems.forEach((item) => {
      if (item.file) {
        submitData.append('images', item.file);
      }
    });

    // Subscribe to SSE real-time progress events
    if (progressUnsubRef.current) {
      progressUnsubRef.current();
    }

    progressUnsubRef.current = adminService.subscribeToAnalysisProgress(analysisId, {
      onProgress: (evt) => {
        setProgressState(evt);
      },
      onComplete: (evt) => {
        try {
          localStorage.removeItem('active_coin_analysis');
        } catch (e) {}
      },
      onError: (evt) => {
        try {
          localStorage.removeItem('active_coin_analysis');
        } catch (e) {}
      },
    });

    try {
      const response = await adminService.analyzeSingleCoin(submitData, (progressEvent) => {
        if (progressEvent.total) {
          const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(percent);
        }
      });

      if (response.draft) {
        populateDraftIntoForm(response.draft);
        setProgressState((prev) => ({
          ...(prev || {}),
          status: 'completed',
          progress: 100,
          stage: 'completed',
          stageName: 'Analysis completed.',
          message: 'Analysis completed successfully! Review your draft below.',
          timing: response.timing || prev?.timing,
        }));

        try {
          localStorage.removeItem('active_coin_analysis');
        } catch (e) {}

        if (response.analysisWarning) {
          toast(response.analysisWarning, { icon: '⚠️', duration: 7000 });
        } else {
          toast.success('Coin successfully identified! Review and adjust the generated draft below.');
        }
      }
    } catch (err) {
      console.error(err);
      const errMsg = err.response?.data?.message || err.message || 'AI analysis is temporarily unavailable. Please try again in a few moments.';
      setProgressState((prev) => ({
        ...(prev || {}),
        status: 'failed',
        error: errMsg,
        message: errMsg,
      }));
      try {
        localStorage.removeItem('active_coin_analysis');
      } catch (e) {}
      toast.error(errMsg, { duration: 6000 });
    } finally {
      setAnalyzingSingle(false);
    }
  };

  // -------------------------------------------------------------
  // Bulk Coin Image Handling & Analysis
  // -------------------------------------------------------------
  const handleBulkFilesSelected = (files) => {
    const fileList = Array.from(files);
    if (fileList.length === 0) return;
    if (fileList.length + bulkFiles.length > 25) {
      toast.error('Maximum 25 photographs allowed per bulk batch.');
      return;
    }

    const newPreviews = fileList.map((file) => ({
      file,
      url: URL.createObjectURL(file),
      name: file.name,
    }));

    setBulkFiles((prev) => [...prev, ...fileList]);
    setBulkImagePreviews((prev) => [...prev, ...newPreviews]);
  };

  const handleRemoveBulkImage = (index) => {
    setBulkFiles((prev) => prev.filter((_, idx) => idx !== index));
    setBulkImagePreviews((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleAnalyzeBulkCoins = async () => {
    if (analyzingBulk) return;
    if (bulkFiles.length === 0) {
      toast.error('Please upload at least one coin photograph for bulk analysis.');
      return;
    }

    const analysisId = `bulk_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    setAnalyzingBulk(true);
    setBulkProgressState({
      analysisId,
      stage: 'preparing_image',
      stageName: 'Preparing uploaded image.',
      progress: 5,
      status: 'processing',
      elapsedSeconds: 0,
      estimatedRemainingSeconds: 20,
      hasHistoricalData: false,
      message: `Uploading batch of ${bulkFiles.length} coin photograph(s)...`,
    });

    const submitData = new FormData();
    submitData.append('analysisId', analysisId);
    bulkFiles.forEach((file) => {
      submitData.append('images', file);
    });

    if (bulkProgressUnsubRef.current) bulkProgressUnsubRef.current();
    bulkProgressUnsubRef.current = adminService.subscribeToAnalysisProgress(analysisId, {
      onProgress: (evt) => setBulkProgressState(evt),
    });

    try {
      const response = await adminService.analyzeBulkCoins(submitData);

      setBulkDrafts(response.drafts || []);
      setBulkBatchId(response.batchId);
      setBulkProgressState((prev) => ({
        ...(prev || {}),
        stage: 'completed',
        stageName: 'Analysis completed.',
        progress: 100,
        status: 'completed',
        message: `Successfully identified ${response.drafts?.length || 0} coin artifact(s)!`,
      }));

      if (response.analysisWarning) {
        toast(response.analysisWarning, { icon: '⚠️', duration: 7000 });
      } else {
        toast.success(`Identified ${response.drafts?.length || 0} coin artifacts in batch!`);
      }
    } catch (err) {
      const errMsg = err.response?.data?.message || err.message || 'Bulk coin analysis is temporarily unavailable. Please try again in a few moments.';
      setBulkProgressState((prev) => ({
        ...(prev || {}),
        stage: 'failed',
        status: 'failed',
        error: errMsg,
        message: errMsg,
      }));
      toast.error(errMsg, { duration: 6000 });
    } finally {
      setAnalyzingBulk(false);
    }
  };

  // -------------------------------------------------------------
  // Form Input Change & Save
  // -------------------------------------------------------------
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    });
    if (formErrors[name]) {
      setFormErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleSaveDraftChanges = async () => {
    if (!currentDraft) {
      toast.error('No active draft to save.');
      return;
    }

    setIsSavingDraft(true);
    try {
      const updatedImages = singleImageItems.map((item) => ({
        url: item.url,
        localPath: item.localPath,
        publicId: item.publicId,
        originalName: item.originalName,
        role: item.role,
        isCloudinary: !!item.isCloudinary,
      }));

      const res = await adminService.updateCoinDraft(currentDraft._id, {
        formData: {
          ...formData,
          price: formData.price !== '' ? Number(formData.price) : null,
          quantity: formData.quantity !== '' ? Number(formData.quantity) : 1,
          weight: formData.weight !== '' ? Number(formData.weight) : null,
          diameter: formData.diameter !== '' ? Number(formData.diameter) : null,
        },
        images: updatedImages,
      });

      populateDraftIntoForm(res);
      toast.success('Draft changes saved successfully.');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save draft changes.');
    } finally {
      setIsSavingDraft(false);
    }
  };

  const handleRetryAnalysis = async () => {
    if (!currentDraft || retryingAnalysis) return;
    setRetryingAnalysis(true);
    const analysisId = `retry_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    setProgressState({
      analysisId,
      stage: 'connecting_gemini',
      stageName: 'Connecting to Gemini AI.',
      progress: 30,
      status: 'processing',
      elapsedSeconds: 0,
      estimatedRemainingSeconds: 10,
      hasHistoricalData: false,
      message: 'Re-analyzing numismatic features with Gemini API...',
    });

    if (progressUnsubRef.current) progressUnsubRef.current();
    progressUnsubRef.current = adminService.subscribeToAnalysisProgress(analysisId, {
      onProgress: (evt) => setProgressState(evt),
    });

    try {
      const res = await adminService.retryCoinDraft(currentDraft._id, { analysisId });
      populateDraftIntoForm(res.draft);
      setProgressState({
        analysisId,
        stage: 'completed',
        stageName: 'Analysis completed.',
        progress: 100,
        status: 'completed',
        message: 'Numismatic analysis refreshed with Gemini API.',
      });
      toast.success('Numismatic analysis refreshed with Gemini API.');
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Retry analysis failed.';
      setProgressState({
        analysisId,
        stage: 'failed',
        status: 'failed',
        error: errMsg,
        message: errMsg,
      });
      toast.error(errMsg);
    } finally {
      setRetryingAnalysis(false);
    }
  };

  const handleDeleteDraft = async (idToDelete) => {
    const targetId = idToDelete || currentDraft?._id;
    if (!targetId) return;

    if (!window.confirm('Are you sure you want to discard this draft? This will remove temporary images and unapproved draft data.')) {
      return;
    }

    try {
      await adminService.deleteCoinDraft(targetId);
      toast.success('Draft discarded successfully.');
      if (currentDraft && currentDraft._id === targetId) {
        setCurrentDraft(null);
        setSingleImageItems([]);
        setSingleFiles([]);
        setFormData({
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
          mintMark: '',
          obverseDesign: '',
          reverseDesign: '',
          isFeatured: false,
        });
      }
      if (activeTab === 'drafts') {
        fetchDraftsList();
      } else if (activeTab === 'bulk') {
        setBulkDrafts((prev) => prev.filter((d) => d._id !== targetId));
      }
    } catch (err) {
      toast.error('Failed to delete draft.');
    }
  };

  // -------------------------------------------------------------
  // Approval & Publication Workflow
  // -------------------------------------------------------------
  const handleInitiateApproval = () => {
    const { isValid, errors } = validateCoinForm(formData);
    if (!isValid) {
      setFormErrors(errors);
      toast.error('Please resolve missing required fields before approval.');
      return;
    }
    if (singleImageItems.length === 0) {
      toast.error('At least one photograph is required.');
      return;
    }
    setShowConfirmModal(true);
  };

  const handleConfirmApproval = async () => {
    if (!currentDraft) return;
    setIsApproving(true);
    try {
      const updatedImages = singleImageItems.map((item) => ({
        url: item.url,
        localPath: item.localPath,
        publicId: item.publicId,
        originalName: item.originalName,
        role: item.role,
        isCloudinary: !!item.isCloudinary,
      }));

      const payload = {
        formData: {
          ...formData,
          price: Number(formData.price),
          quantity: Number(formData.quantity),
          weight: formData.weight !== '' ? Number(formData.weight) : null,
          diameter: formData.diameter !== '' ? Number(formData.diameter) : null,
        },
        images: updatedImages,
      };

      const res = await adminService.approveCoinDraft(currentDraft._id, payload);
      setShowConfirmModal(false);
      toast.success('Artefact approved and published to the marketplace catalog!');
      navigate('/admin/coins');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to approve and publish coin artifact.');
    } finally {
      setIsApproving(false);
    }
  };

  // Style constants
  const cardBg = isDark ? 'bg-dark-800 border-dark-700' : 'bg-white border-gray-200';
  const labelClass = `block text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`;
  const selectClass = `w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-1 focus:ring-gold-500 focus:border-gold-500 sm:text-sm ${
    isDark ? 'bg-dark-700 border-dark-600 text-white' : 'bg-white border-gray-300 text-gray-900'
  }`;
  const textareaClass = `w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-1 focus:ring-gold-500 focus:border-gold-500 sm:text-sm ${
    isDark ? 'bg-dark-700 border-dark-600 text-white placeholder-gray-500' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
  }`;

  return (
    <div className="max-w-6xl mx-auto pb-16">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 sm:mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 rounded-lg bg-gold-500/10 text-gold-500 border border-gold-500/30">
              <FiCpu className="w-4 h-4 sm:w-5 sm:h-5" />
            </span>
            <span className="text-[11px] sm:text-xs uppercase font-semibold tracking-wider text-gold-500">
              Intelligent Numismatics
            </span>
          </div>
          <h1 className={`text-2xl sm:text-3xl font-serif font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Register Coin with AI
          </h1>
          <p className={`mt-1 text-xs sm:text-sm max-w-2xl ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Upload coin photographs. Google Gemini vision identifies visible inscriptions, ruler portraits, mint marks, and designs to populate the official marketplace registration form for your approval.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <Link to="/admin/coins/new">
            <Button variant="outline" className="text-xs sm:text-sm py-2 px-3 sm:px-4">
              Manual Form
            </Button>
          </Link>
          <Link to="/admin/coins">
            <Button variant="outline" className="text-xs sm:text-sm py-2 px-3 sm:px-4">
              View Catalog
            </Button>
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <div className={`flex overflow-x-auto touch-scroll no-scrollbar border-b mb-6 sm:mb-8 ${isDark ? 'border-dark-700' : 'border-gray-200'}`}>
        <button
          onClick={() => setActiveTab('single')}
          className={`py-2.5 sm:py-3 px-3 sm:px-6 text-xs sm:text-sm font-medium border-b-2 transition-colors flex items-center gap-1.5 sm:gap-2 whitespace-nowrap flex-shrink-0 ${
            activeTab === 'single'
              ? 'border-gold-500 text-gold-500'
              : isDark
              ? 'border-transparent text-gray-400 hover:text-gray-200'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <FiCpu /> Single Coin Registration
        </button>
        <button
          onClick={() => setActiveTab('bulk')}
          className={`py-2.5 sm:py-3 px-3 sm:px-6 text-xs sm:text-sm font-medium border-b-2 transition-colors flex items-center gap-1.5 sm:gap-2 whitespace-nowrap flex-shrink-0 ${
            activeTab === 'bulk'
              ? 'border-gold-500 text-gold-500'
              : isDark
              ? 'border-transparent text-gray-400 hover:text-gray-200'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <FiLayers /> Bulk Registration
        </button>
        <button
          onClick={() => setActiveTab('drafts')}
          className={`py-2.5 sm:py-3 px-3 sm:px-6 text-xs sm:text-sm font-medium border-b-2 transition-colors flex items-center gap-1.5 sm:gap-2 whitespace-nowrap flex-shrink-0 ${
            activeTab === 'drafts'
              ? 'border-gold-500 text-gold-500'
              : isDark
              ? 'border-transparent text-gray-400 hover:text-gray-200'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <FiSave /> Saved Drafts
          {draftsList.length > 0 && (
            <span className="ml-1 text-xs px-2 py-0.5 rounded-full bg-gold-500/20 text-gold-500 font-bold">
              {draftsList.length}
            </span>
          )}
        </button>
      </div>

      {/* ========================================================= */}
      {/* TAB 1: SINGLE COIN REGISTRATION                           */}
      {/* ========================================================= */}
      {activeTab === 'single' && (
        <div className="space-y-8">
          {/* Uploader Section */}
          <div className={`p-6 border rounded-xl shadow-sm ${cardBg}`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 border-b pb-3">
              <div>
                <h2 className={`text-lg font-serif font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  Upload Coin Photographs
                </h2>
                <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  Upload high-resolution front (obverse) and back (reverse) photographs of the coin.
                </p>
              </div>
              {singleImageItems.length >= 2 && (
                <button
                  type="button"
                  onClick={handleSwapObverseReverse}
                  className="flex items-center gap-1.5 text-xs text-gold-500 hover:text-gold-400 border border-gold-500/30 px-3 py-1.5 rounded-lg bg-gold-500/10 transition-colors"
                >
                  <FiRotateCw /> Swap Front / Back
                </button>
              )}
            </div>

            {/* Drop Zone */}
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                handleSingleFilesSelected(e.dataTransfer.files);
              }}
              onClick={() => singleFileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
                isDark
                  ? 'border-dark-600 bg-dark-700/40 hover:border-gold-500 hover:bg-dark-700/70'
                  : 'border-gray-300 bg-[#FAFAF7] hover:border-gold-500 hover:bg-gold-500/5'
              }`}
            >
              <input
                ref={singleFileInputRef}
                type="file"
                multiple
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(e) => handleSingleFilesSelected(e.target.files)}
              />
              <div className="space-y-2">
                <FiUploadCloud className={`mx-auto h-10 w-10 ${isDark ? 'text-gold-400' : 'text-gold-600'}`} />
                <p className={`text-sm font-medium ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
                  Click or drag and drop front and back coin photos here
                </p>
                <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  Supports JPG, PNG, WEBP up to 10MB each
                </p>
              </div>
            </div>

            {/* Uploaded Photos Preview Grid */}
            {singleImageItems.length > 0 && (
              <div className="mt-6">
                <p className={`text-xs font-semibold uppercase tracking-wider mb-3 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  Uploaded Photographs ({singleImageItems.length})
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {singleImageItems.map((item, idx) => (
                    <div
                      key={idx}
                      className={`relative border rounded-xl p-2.5 flex flex-col shadow-sm ${
                        item.role === 'obverse'
                          ? 'border-emerald-500/50 bg-emerald-500/5 ring-1 ring-emerald-500/30'
                          : item.role === 'reverse'
                          ? 'border-blue-500/50 bg-blue-500/5 ring-1 ring-blue-500/30'
                          : isDark
                          ? 'border-dark-600 bg-dark-700'
                          : 'border-gray-200 bg-gray-50'
                      }`}
                    >
                      <div className="relative h-32 w-full rounded-lg overflow-hidden bg-black/20 flex items-center justify-center mb-2">
                        <img
                          src={item.url}
                          alt={`View ${idx + 1}`}
                          className="w-full h-full object-contain"
                        />
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveSingleImage(idx);
                          }}
                          className="absolute top-1.5 right-1.5 p-1 rounded-full bg-red-600/80 text-white hover:bg-red-600 shadow"
                          title="Remove photo"
                        >
                          <FiTrash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Role Assignment Buttons */}
                      <div className="mt-auto space-y-1">
                        <div className="flex items-center justify-between text-[11px] mb-1">
                          <span className="font-medium truncate max-w-[100px] text-gray-500">{item.originalName}</span>
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                              item.role === 'obverse'
                                ? 'bg-emerald-500/20 text-emerald-400'
                                : item.role === 'reverse'
                                ? 'bg-blue-500/20 text-blue-400'
                                : item.role === 'detail'
                                ? 'bg-purple-500/20 text-purple-400'
                                : 'bg-gray-500/20 text-gray-400'
                            }`}
                          >
                            {item.role === 'obverse' ? 'Front' : item.role === 'reverse' ? 'Back' : item.role}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-1 text-[10px]">
                          <button
                            type="button"
                            onClick={() => handleSetImageRole(idx, 'obverse')}
                            className={`py-1 rounded border transition-colors ${
                              item.role === 'obverse'
                                ? 'bg-emerald-600 text-white border-emerald-600'
                                : isDark
                                ? 'bg-dark-600 border-dark-500 text-gray-300 hover:bg-dark-500'
                                : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-100'
                            }`}
                          >
                            Front (Obv)
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSetImageRole(idx, 'reverse')}
                            className={`py-1 rounded border transition-colors ${
                              item.role === 'reverse'
                                ? 'bg-blue-600 text-white border-blue-600'
                                : isDark
                                ? 'bg-dark-600 border-dark-500 text-gray-300 hover:bg-dark-500'
                                : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-100'
                            }`}
                          >
                            Back (Rev)
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Analysis Action Bar */}
            <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-dark-700/40">
              <div className="text-xs text-gray-500">
                Tip: For greatest accuracy, upload both the front (portrait/monarch) and back (denomination/wreath) views.
              </div>
              <Button
                type="button"
                onClick={handleAnalyzeSingleCoin}
                disabled={singleImageItems.length === 0 || analyzingSingle}
                isLoading={analyzingSingle}
                className="w-full sm:w-auto shadow-gold"
              >
                <FiCpu className="mr-2" />
                {currentDraft ? 'Re-Analyze with Gemini' : 'Analyze with Gemini'}
              </Button>
            </div>

            {/* Real-Time Analysis Progress Display */}
            {(analyzingSingle || progressState) && (
              <div className="mt-6">
                <CoinAnalysisProgress
                  progressState={progressState}
                  onRetry={handleAnalyzeSingleCoin}
                  onDismiss={() => {
                    setProgressState(null);
                    setAnalyzingSingle(false);
                    try {
                      localStorage.removeItem('active_coin_analysis');
                    } catch (e) {}
                  }}
                />
              </div>
            )}
          </div>

          {/* AI Reasoning & Confidence Banner (if active draft) */}
          {currentDraft && (
            <div className={`p-6 border rounded-xl shadow-sm ${cardBg}`}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 border-b pb-3">
                <div className="flex items-center gap-2">
                  <span className="p-1 rounded bg-gold-500/20 text-gold-500">
                    <FiCheckCircle className="w-4 h-4" />
                  </span>
                  <h3 className={`font-serif font-bold text-base ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    AI Identification Diagnosis & Evidence
                  </h3>
                </div>

                <div className="flex items-center gap-2">
                  {currentDraft.confidence?.overall && (
                    <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 font-semibold border border-emerald-500/30">
                      Overall Confidence: {Math.round(currentDraft.confidence.overall * 100)}%
                    </span>
                  )}
                  <span
                    className={`text-xs px-2.5 py-1 rounded-full font-semibold border ${
                      currentDraft.status === 'ready_for_approval'
                        ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                        : currentDraft.status === 'needs_manual_review'
                        ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                        : 'bg-blue-500/20 text-blue-400 border-blue-500/30'
                    }`}
                  >
                    Status: {currentDraft.status.replace(/_/g, ' ')}
                  </span>
                </div>
              </div>

              {currentDraft.reasoningSummary && (
                <div className={`p-3.5 rounded-lg mb-4 text-xs leading-relaxed border ${
                  isDark ? 'bg-dark-700/40 border-dark-600 text-gray-300' : 'bg-gray-50 border-gray-200 text-gray-700'
                }`}>
                  <strong className="text-gold-500">Diagnostic Clues: </strong>
                  {currentDraft.reasoningSummary}
                </div>
              )}

              {currentDraft.uncertainFields && currentDraft.uncertainFields.length > 0 && (
                <div className="flex flex-wrap items-center gap-2 text-xs mb-3">
                  <span className="text-amber-500 flex items-center gap-1 font-medium">
                    <FiAlertTriangle /> Uncertain Fields (verify before saving):
                  </span>
                  {currentDraft.uncertainFields.map((f, i) => (
                    <span key={i} className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/30 font-mono text-[11px]">
                      {f}
                    </span>
                  ))}
                </div>
              )}

              {currentDraft.alternativePossibilities && currentDraft.alternativePossibilities.length > 0 && (
                <div className="text-xs text-gray-400">
                  <strong className="text-gray-300">Alternative Possibilities: </strong>
                  {currentDraft.alternativePossibilities.join(' • ')}
                </div>
              )}
            </div>
          )}

          {/* Form Sections (Editable) */}
          <div className="space-y-8">
            {/* Section 1: Identification & Classification */}
            <div className={`p-6 border rounded-xl shadow-sm ${cardBg}`}>
              <h2 className={`text-xl font-serif mb-6 border-b pb-3 flex items-center justify-between ${
                isDark ? 'text-white border-dark-700' : 'text-gray-900 border-gray-200'
              }`}>
                <span>1. Identification & Classification</span>
                <span className={`text-xs font-sans font-normal ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                  Required fields marked with *
                </span>
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
                    error={formErrors.name}
                  />
                </div>

                <Input
                  label="Year of Issue"
                  name="year"
                  required
                  placeholder="e.g., 1862 or 1556 or 320 BCE"
                  value={formData.year}
                  onChange={handleInputChange}
                  error={formErrors.year}
                />

                <Input
                  label="SKU / Stock Identifier"
                  name="sku"
                  placeholder="e.g., COIN-BI-1862-A83B"
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
                    className={`${selectClass} ${formErrors.category ? 'border-red-500' : ''}`}
                  >
                    <option value="">-- Select Category (e.g., British India, Indian) --</option>
                    {categories.map((c) => (
                      <option key={c._id} value={c._id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                  {formErrors.category && <p className="mt-1 text-sm text-red-500">{formErrors.category}</p>}
                </div>

                <div>
                  <label className={labelClass}>Historical Era <span className="text-red-500">*</span></label>
                  <select
                    name="era"
                    required
                    value={formData.era}
                    onChange={handleInputChange}
                    className={`${selectClass} ${formErrors.era ? 'border-red-500' : ''}`}
                  >
                    <option value="">-- Select Era --</option>
                    {ERA_OPTIONS.map((e) => (
                      <option key={e} value={e}>
                        {e}
                      </option>
                    ))}
                  </select>
                  {formErrors.era && <p className="mt-1 text-sm text-red-500">{formErrors.era}</p>}
                </div>

                <div>
                  <label className={labelClass}>Country of Origin <span className="text-red-500">*</span></label>
                  <select
                    name="country"
                    required
                    value={formData.country}
                    onChange={handleInputChange}
                    className={`${selectClass} ${formErrors.country ? 'border-red-500' : ''}`}
                  >
                    <option value="">-- Select Country --</option>
                    {countries.map((c) => (
                      <option key={c._id} value={c._id}>
                        {c.flag ? `${c.flag} ` : ''}{c.name}
                      </option>
                    ))}
                  </select>
                  {formErrors.country && <p className="mt-1 text-sm text-red-500">{formErrors.country}</p>}
                </div>

                <div>
                  <label className={labelClass}>Numismatic Condition Grade <span className="text-red-500">*</span></label>
                  <select
                    name="condition"
                    required
                    value={formData.condition}
                    onChange={handleInputChange}
                    className={`${selectClass} ${formErrors.condition ? 'border-red-500' : ''}`}
                  >
                    <option value="">-- Select Grade --</option>
                    {Object.keys(CONDITION_COLORS).map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                  {formErrors.condition && <p className="mt-1 text-sm text-red-500">{formErrors.condition}</p>}
                </div>

                <div className="md:col-span-2">
                  <label className={labelClass}>Historical Significance & Narrative</label>
                  <textarea
                    name="description"
                    rows="4"
                    placeholder="Describe historical context, ruler, significance..."
                    className={textareaClass}
                    value={formData.description}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
            </div>

            {/* Section 2: Technical Numismatic Specifications */}
            <div className={`p-6 border rounded-xl shadow-sm ${cardBg}`}>
              <h2 className={`text-xl font-serif mb-6 border-b pb-3 ${
                isDark ? 'text-white border-dark-700' : 'text-gray-900 border-gray-200'
              }`}>
                2. Technical Numismatic Specifications
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Input
                  label="Metal / Composition"
                  name="material"
                  placeholder="e.g., Silver (.917), Pure Copper"
                  value={formData.material}
                  onChange={handleInputChange}
                />
                <Input
                  label="Weight (g)"
                  name="weight"
                  type="number"
                  step="0.01"
                  placeholder="e.g., 11.66"
                  value={formData.weight}
                  onChange={handleInputChange}
                  error={formErrors.weight}
                />
                <Input
                  label="Diameter (mm)"
                  name="diameter"
                  type="number"
                  step="0.1"
                  placeholder="e.g., 30.8"
                  value={formData.diameter}
                  onChange={handleInputChange}
                  error={formErrors.diameter}
                />
                <Input
                  label="Face Denomination"
                  name="denomination"
                  placeholder="e.g., 1 Rupee, 1 Mohur"
                  value={formData.denomination}
                  onChange={handleInputChange}
                />

                <div className="md:col-span-2">
                  <label className={labelClass}>Mint of Origin</label>
                  <select name="mint" value={formData.mint} onChange={handleInputChange} className={selectClass}>
                    <option value="">-- Select Mint --</option>
                    {mints.map((m) => (
                      <option key={m._id} value={m._id}>
                        {m.name} {m.mintMark ? `(${m.mintMark})` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="md:col-span-2">
                  <Input
                    label="Mint Mark Location & Symbol"
                    name="mintMark"
                    placeholder="e.g., Diamond under date (◆)"
                    value={formData.mintMark}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                <div>
                  <label className={labelClass}>Obverse (Front) Design</label>
                  <textarea
                    name="obverseDesign"
                    rows="3"
                    placeholder="Describe front engraving..."
                    className={textareaClass}
                    value={formData.obverseDesign}
                    onChange={handleInputChange}
                  />
                </div>
                <div>
                  <label className={labelClass}>Reverse (Back) Design</label>
                  <textarea
                    name="reverseDesign"
                    rows="3"
                    placeholder="Describe back engraving..."
                    className={textareaClass}
                    value={formData.reverseDesign}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
            </div>

            {/* Section 3: Valuation & Inventory Stock */}
            <div className={`p-6 border rounded-xl shadow-sm ${cardBg}`}>
              <h2 className={`text-xl font-serif mb-6 border-b pb-3 ${
                isDark ? 'text-white border-dark-700' : 'text-gray-900 border-gray-200'
              }`}>
                3. Valuation & Inventory Stock
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input
                  label="Selling Price (₹ INR)"
                  name="price"
                  type="number"
                  required
                  placeholder="e.g., 12500"
                  value={formData.price}
                  onChange={handleInputChange}
                  error={formErrors.price}
                />
                <Input
                  label="Quantity Available in Stock"
                  name="quantity"
                  type="number"
                  required
                  placeholder="e.g., 1 or 5"
                  value={formData.quantity}
                  onChange={handleInputChange}
                  error={formErrors.quantity}
                />

                <div className={`md:col-span-2 flex items-center mt-2 p-3 rounded-lg border ${
                  isDark ? 'bg-dark-700/50 border-dark-600' : 'bg-[#FAFAF7] border-gray-200'
                }`}>
                  <input
                    type="checkbox"
                    id="isFeatured"
                    name="isFeatured"
                    checked={formData.isFeatured}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-gold-500 focus:ring-gold-500 border-gray-300 rounded accent-gold-500 cursor-pointer"
                  />
                  <label htmlFor="isFeatured" className={`ml-3 block text-sm font-medium cursor-pointer ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    Feature this artifact in Homepage & Curated Highlights
                  </label>
                </div>
              </div>
            </div>

            {/* Sticky Action Footer */}
            <div className={`p-4 border rounded-xl shadow-md flex flex-wrap items-center justify-between gap-4 ${cardBg}`}>
              <div className="flex items-center gap-2">
                {currentDraft && (
                  <Button
                    variant="outline"
                    type="button"
                    onClick={() => handleDeleteDraft(currentDraft._id)}
                    className="text-red-500 hover:text-red-400 hover:border-red-500/50"
                  >
                    <FiTrash2 className="mr-1.5" /> Discard Draft
                  </Button>
                )}
                {currentDraft && (
                  <Button
                    variant="outline"
                    type="button"
                    onClick={handleRetryAnalysis}
                    disabled={retryingAnalysis}
                    isLoading={retryingAnalysis}
                  >
                    <FiRefreshCw className="mr-1.5" /> Retry Analysis
                  </Button>
                )}
              </div>

              <div className="flex items-center gap-3">
                {currentDraft && (
                  <Button
                    variant="outline"
                    type="button"
                    onClick={handleSaveDraftChanges}
                    disabled={isSavingDraft}
                    isLoading={isSavingDraft}
                  >
                    <FiSave className="mr-1.5" /> Save Draft Edits
                  </Button>
                )}
                <Button
                  type="button"
                  onClick={handleInitiateApproval}
                  disabled={isApproving}
                  className="shadow-gold"
                >
                  <FiCheckCircle className="mr-2" /> Approve & Register to Marketplace
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 2: BULK COIN REGISTRATION                             */}
      {/* ========================================================= */}
      {activeTab === 'bulk' && (
        <div className="space-y-8">
          <div className={`p-6 border rounded-xl shadow-sm ${cardBg}`}>
            <h2 className={`text-lg font-serif font-bold mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Bulk Coin Photograph Upload
            </h2>
            <p className={`text-xs mb-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              Upload up to 25 photographs representing multiple coins. Gemini AI groups front and back views belonging to the same coin, detects duplicate shots, and creates separate editable drafts for each artifact.
            </p>

            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                handleBulkFilesSelected(e.dataTransfer.files);
              }}
              onClick={() => bulkFileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors ${
                isDark
                  ? 'border-dark-600 bg-dark-700/40 hover:border-gold-500'
                  : 'border-gray-300 bg-[#FAFAF7] hover:border-gold-500'
              }`}
            >
              <input
                ref={bulkFileInputRef}
                type="file"
                multiple
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(e) => handleBulkFilesSelected(e.target.files)}
              />
              <div className="space-y-2">
                <FiLayers className={`mx-auto h-12 w-12 ${isDark ? 'text-gold-400' : 'text-gold-600'}`} />
                <p className={`text-sm font-medium ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
                  Click or drag and drop multiple coin photos in batch
                </p>
                <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  Up to 25 JPG, PNG, or WEBP images per batch
                </p>
              </div>
            </div>

            {bulkImagePreviews.length > 0 && (
              <div className="mt-6">
                <div className="flex items-center justify-between mb-3">
                  <p className={`text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    Selected Photographs ({bulkImagePreviews.length})
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setBulkFiles([]);
                      setBulkImagePreviews([]);
                    }}
                    className="text-xs text-red-500 hover:text-red-400"
                  >
                    Clear All
                  </button>
                </div>

                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
                  {bulkImagePreviews.map((item, idx) => (
                    <div key={idx} className={`relative border rounded-lg p-1 aspect-square overflow-hidden group ${
                      isDark ? 'border-dark-600 bg-dark-700' : 'border-gray-200 bg-gray-50'
                    }`}>
                      <img src={item.url} alt={item.name} className="w-full h-full object-contain" />
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveBulkImage(idx);
                        }}
                        className="absolute top-1 right-1 p-1 rounded-full bg-red-600 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <FiTrash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-6 flex justify-end pt-4 border-t border-dark-700/40">
              <Button
                type="button"
                onClick={handleAnalyzeBulkCoins}
                disabled={bulkFiles.length === 0 || analyzingBulk}
                isLoading={analyzingBulk}
                className="shadow-gold"
              >
                <FiCpu className="mr-2" />
                Analyze Batch with Gemini ({bulkFiles.length} Photos)
              </Button>
            </div>

            {/* Real-Time Bulk Progress Display */}
            {(analyzingBulk || bulkProgressState) && (
              <div className="mt-6">
                <CoinAnalysisProgress
                  progressState={bulkProgressState}
                  customTitle="Bulk Coin Batch Analysis"
                  onRetry={handleAnalyzeBulkCoins}
                  onDismiss={() => {
                    setBulkProgressState(null);
                    setAnalyzingBulk(false);
                  }}
                />
              </div>
            )}
          </div>

          {/* Bulk Results List */}
          {bulkDrafts.length > 0 && (
            <div className={`p-6 border rounded-xl shadow-sm ${cardBg}`}>
              <div className="flex items-center justify-between mb-6 border-b pb-4">
                <div>
                  <h3 className={`text-xl font-serif font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    Generated Artifact Drafts ({bulkDrafts.length})
                  </h3>
                  <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    Review each identified coin below. Click &quot;Review &amp; Edit&quot; to open the full form, or approve directly.
                  </p>
                </div>
                {bulkBatchId && (
                  <span className="text-xs font-mono text-gray-500 px-2 py-1 rounded bg-dark-700/50 border border-dark-600">
                    Batch: {bulkBatchId}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {bulkDrafts.map((draft, idx) => (
                  <div
                    key={draft._id || idx}
                    className={`border rounded-xl p-4 flex flex-col justify-between shadow-sm transition-all hover:border-gold-500/50 ${
                      isDark ? 'bg-dark-700/40 border-dark-600' : 'bg-[#FAFAF7] border-gray-200'
                    }`}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-gold-500">#{idx + 1}</span>
                          <h4 className={`font-serif font-semibold text-sm line-clamp-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                            {draft.formData?.name || 'Unidentified Coin'}
                          </h4>
                        </div>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                            draft.status === 'ready_for_approval'
                              ? 'bg-emerald-500/20 text-emerald-400'
                              : draft.status === 'approved'
                              ? 'bg-blue-500/20 text-blue-400'
                              : 'bg-amber-500/20 text-amber-400'
                          }`}
                        >
                          {draft.status.replace(/_/g, ' ')}
                        </span>
                      </div>

                      {/* Image thumbnails */}
                      <div className="flex items-center gap-2 mb-3">
                        {draft.images && draft.images.map((img, i) => (
                          <div key={i} className="relative w-14 h-14 rounded-lg overflow-hidden border border-dark-600 bg-black/20 flex-shrink-0">
                            <img src={img.url} alt={`View ${i + 1}`} className="w-full h-full object-contain" />
                            <span className="absolute bottom-0 inset-x-0 bg-black/70 text-[8px] text-center text-white font-mono uppercase">
                              {img.role}
                            </span>
                          </div>
                        ))}
                      </div>

                      {/* Specs snippet */}
                      <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-xs text-gray-400 mb-4">
                        <div>
                          <span className="text-gray-500">Year: </span>
                          <span className={isDark ? 'text-gray-200' : 'text-gray-800'}>{draft.formData?.year || 'Unknown'}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Era: </span>
                          <span className={isDark ? 'text-gray-200' : 'text-gray-800'}>{draft.formData?.era || 'Unknown'}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Metal: </span>
                          <span className={isDark ? 'text-gray-200' : 'text-gray-800'}>{draft.formData?.material || 'Unknown'}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Price: </span>
                          <span className="text-gold-500 font-semibold">{draft.formData?.price ? `₹${draft.formData.price}` : 'Unset'}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-2 pt-3 border-t border-dark-600">
                      <button
                        type="button"
                        onClick={() => handleDeleteDraft(draft._id)}
                        className="text-xs text-red-500 hover:text-red-400 p-1.5"
                        title="Delete draft"
                      >
                        <FiTrash2 />
                      </button>
                      <Button
                        type="button"
                        onClick={() => populateDraftIntoForm(draft)}
                        className="text-xs py-1.5 px-3"
                      >
                        Review &amp; Edit Form <FiArrowRight className="ml-1" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 3: DRAFTS MANAGEMENT                                  */}
      {/* ========================================================= */}
      {activeTab === 'drafts' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Filter Status:</span>
              <select
                value={draftsFilter}
                onChange={(e) => setDraftsFilter(e.target.value)}
                className={selectClass}
              >
                <option value="all">All Drafts</option>
                <option value="ready_for_approval">Ready for Approval</option>
                <option value="needs_manual_review">Needs Manual Review</option>
                <option value="pending_review">Pending Review</option>
                <option value="approved">Approved</option>
                <option value="analysis_failed">Analysis Failed</option>
              </select>
            </div>

            <Button variant="outline" onClick={fetchDraftsList} isLoading={loadingDrafts} className="text-xs">
              <FiRefreshCw className="mr-1.5" /> Refresh List
            </Button>
          </div>

          {loadingDrafts ? (
            <div className="py-12 text-center text-sm text-gray-500">Loading drafts...</div>
          ) : draftsList.length === 0 ? (
            <div className={`p-12 text-center border rounded-xl ${cardBg}`}>
              <FiInfo className="mx-auto h-8 w-8 text-gray-400 mb-2" />
              <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                No saved drafts found matching &quot;{draftsFilter}&quot;.
              </p>
              <button
                type="button"
                onClick={() => setActiveTab('single')}
                className="mt-3 text-xs text-gold-500 hover:text-gold-400 underline"
              >
                Register a new coin with AI
              </button>
            </div>
          ) : (
            <div className={`border rounded-xl overflow-hidden shadow-sm ${cardBg}`}>
              <div className="overflow-x-auto">
                <table className={`min-w-full divide-y ${isDark ? 'divide-dark-700' : 'divide-gray-200'}`}>
                  <thead className={isDark ? 'bg-dark-700/50' : 'bg-gray-50'}>
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Artifact
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        SKU &amp; Mode
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Price &amp; Year
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y ${isDark ? 'divide-dark-700' : 'divide-gray-200'}`}>
                    {draftsList.map((draft) => (
                      <tr key={draft._id} className={isDark ? 'hover:bg-dark-700/30' : 'hover:bg-gray-50'}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="h-10 w-10 flex-shrink-0 rounded-lg overflow-hidden border border-dark-600 bg-black/20">
                              <img
                                src={draft.images?.[0]?.url || '/placeholder.png'}
                                alt=""
                                className="h-full w-full object-contain"
                              />
                            </div>
                            <div className="ml-4">
                              <div className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                {draft.formData?.name || 'Unnamed Coin'}
                              </div>
                              <div className="text-xs text-gray-500">
                                {draft.formData?.category?.name || draft.formData?.era || 'Uncategorized'}
                              </div>
                            </div>
                          </div>
                        </td>

                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-xs font-mono text-gold-500">{draft.formData?.sku || 'No SKU'}</div>
                          <div className="text-[11px] text-gray-500 uppercase">{draft.mode} Mode</div>
                        </td>

                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full uppercase ${
                              draft.status === 'ready_for_approval'
                                ? 'bg-emerald-500/20 text-emerald-400'
                                : draft.status === 'approved'
                                ? 'bg-blue-500/20 text-blue-400'
                                : draft.status === 'analysis_failed'
                                ? 'bg-red-500/20 text-red-400'
                                : 'bg-amber-500/20 text-amber-400'
                            }`}
                          >
                            {draft.status.replace(/_/g, ' ')}
                          </span>
                        </td>

                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <div className={isDark ? 'text-white' : 'text-gray-900'}>
                            {draft.formData?.price ? `₹${draft.formData.price}` : 'Unset'}
                          </div>
                          <div className="text-xs text-gray-500">{draft.formData?.year || 'Year unset'}</div>
                        </td>

                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              type="button"
                              onClick={() => populateDraftIntoForm(draft)}
                              className="text-xs py-1 px-2.5"
                            >
                              Edit / Review
                            </Button>
                            <button
                              type="button"
                              onClick={() => handleDeleteDraft(draft._id)}
                              className="text-red-500 hover:text-red-400 p-1"
                              title="Delete draft"
                            >
                              <FiTrash2 />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Confirmation Modal Before Approving to Live Marketplace */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className={`max-w-md w-full border rounded-2xl p-6 shadow-2xl ${cardBg}`}>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-xl bg-gold-500/20 text-gold-500">
                <FiCheckCircle className="w-6 h-6" />
              </div>
              <h3 className={`text-lg font-serif font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Confirm Artifact Registration
              </h3>
            </div>

            <p className={`text-sm mb-4 leading-relaxed ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
              Are you sure you want to approve and publish this artifact to the marketplace? Verified images will be uploaded to Cloudinary, and customers will be able to browse and purchase this piece.
            </p>

            <div className={`p-4 rounded-xl border text-xs space-y-2 mb-6 ${
              isDark ? 'bg-dark-700/50 border-dark-600 text-gray-300' : 'bg-gray-50 border-gray-200 text-gray-700'
            }`}>
              <div className="flex justify-between">
                <span className="text-gray-500">Artifact:</span>
                <span className="font-semibold text-right max-w-[200px] truncate">{formData.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Selling Price:</span>
                <span className="font-semibold text-gold-500">₹{formData.price}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Stock Quantity:</span>
                <span className="font-semibold">{formData.quantity} unit(s)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Photographs:</span>
                <span className="font-semibold">{singleImageItems.length} verified photo(s)</span>
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                type="button"
                onClick={() => setShowConfirmModal(false)}
                disabled={isApproving}
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleConfirmApproval}
                disabled={isApproving}
                isLoading={isApproving}
                className="shadow-gold"
              >
                Confirm &amp; Publish
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AiCoinRegistration;
