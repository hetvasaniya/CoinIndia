import { useState } from 'react';
import { FiZoomIn, FiMaximize2, FiX } from 'react-icons/fi';
import { STATIC_IMAGES } from '../../data/staticImages';
import { useTheme } from '../../context/ThemeContext';

const CoinGallery = ({ images }) => {
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [zoomPos, setZoomPos] = useState({ x: 50, y: 50 });
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const { isDark } = useTheme();

  const imageList = Array.isArray(images) && images.length > 0
    ? images
    : [STATIC_IMAGES.placeholders.coinFront, STATIC_IMAGES.placeholders.coinBack];

  const currentImgSrc = typeof imageList[activeImageIndex] === 'string'
    ? imageList[activeImageIndex]
    : imageList[activeImageIndex]?.url || STATIC_IMAGES.placeholders.coinFront;

  const handleMouseMove = (e) => {
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    const x = Math.max(0, Math.min(100, ((e.clientX - left) / width) * 100));
    const y = Math.max(0, Math.min(100, ((e.clientY - top) / height) * 100));
    setZoomPos({ x, y });
  };

  return (
    <div className="space-y-3 sm:space-y-4 select-none w-full max-w-full">
      {/* Main Image Frame */}
      <div 
        className={`aspect-square relative border rounded-xl overflow-hidden p-3 sm:p-6 cursor-zoom-in group ${
          isDark ? 'bg-dark-800 border-dark-600' : 'bg-[#FAFAF7] border-gray-200'
        }`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onMouseMove={handleMouseMove}
        onClick={() => setIsLightboxOpen(true)}
      >
        {/* Zoom Hint Badge */}
        <div className={`absolute top-2.5 left-2.5 z-20 backdrop-blur-xs border px-2 py-1 rounded-lg text-[10px] sm:text-xs font-medium flex items-center gap-1.5 shadow-xs transition-opacity duration-300 group-hover:opacity-100 opacity-80 ${
          isDark ? 'bg-dark-900/90 border-dark-600 text-gray-300' : 'bg-white/90 border-gray-200 text-gray-700'
        }`}>
          <FiZoomIn className="text-gold-500" />
          <span className="hidden sm:inline">Hover to Zoom &bull; </span>Tap to Expand
        </div>

        {/* Expand Button */}
        <button 
          onClick={(e) => { e.stopPropagation(); setIsLightboxOpen(true); }}
          className={`absolute top-2.5 right-2.5 z-20 p-1.5 sm:p-2 backdrop-blur-xs border rounded-lg transition-colors shadow-xs ${
            isDark ? 'bg-dark-900/90 border-dark-600 text-gray-400 hover:text-gold-400' : 'bg-white/90 border-gray-200 text-gray-600 hover:text-gold-600'
          }`}
          title="Fullscreen View"
          aria-label="Expand image"
        >
          <FiMaximize2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        </button>

        {/* Active Image */}
        <div className="w-full h-full relative overflow-hidden flex items-center justify-center">
          <img
            src={currentImgSrc}
            alt={`Coin View ${activeImageIndex + 1}`}
            className="w-full h-full object-contain transition-transform duration-150 ease-out"
            style={{
              transform: isHovered ? 'scale(2.4)' : 'scale(1)',
              transformOrigin: `${zoomPos.x}% ${zoomPos.y}%`,
            }}
          />
        </div>

        {/* Circular Magnifier Target Ring (desktop hover only) */}
        {isHovered && (
          <div 
            className="pointer-events-none hidden sm:block absolute border border-gold-500/60 bg-gold-500/10 rounded-full shadow-inner"
            style={{
              width: '100px',
              height: '100px',
              left: `calc(${zoomPos.x}% - 50px)`,
              top: `calc(${zoomPos.y}% - 50px)`,
            }}
          />
        )}
      </div>

      {/* Thumbnails Strip */}
      {imageList.length > 1 && (
        <div className="flex space-x-2 sm:space-x-3 overflow-x-auto pb-2 touch-scroll no-scrollbar">
          {imageList.map((img, index) => {
            const imgSrc = typeof img === 'string' ? img : img?.url;
            return (
              <button
                key={index}
                onClick={() => setActiveImageIndex(index)}
                className={`flex-shrink-0 w-16 h-16 sm:w-20 sm:h-20 rounded-xl border-2 transition-all p-1.5 flex flex-col items-center justify-center ${
                  activeImageIndex === index 
                    ? 'border-gold-500 ring-1 ring-gold-500 bg-gold-500/5' 
                    : isDark 
                      ? 'border-dark-600 bg-dark-750 hover:border-gray-500'
                      : 'border-gray-200 bg-[#FAFAF7] hover:border-gray-300'
                }`}
              >
                <img src={imgSrc} alt={`Thumbnail ${index + 1}`} className="w-full h-10 object-contain mb-0.5" />
                <span className={`text-[9px] sm:text-[10px] font-medium uppercase tracking-wider truncate max-w-full ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  {index === 0 ? 'Front' : index === 1 ? 'Back' : `View ${index + 1}`}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* Fullscreen Lightbox Modal */}
      {isLightboxOpen && (
        <div 
          className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex items-center justify-center p-3 sm:p-6"
          onClick={() => setIsLightboxOpen(false)}
        >
          <button 
            onClick={() => setIsLightboxOpen(false)}
            className="absolute top-4 right-4 sm:top-6 sm:right-6 p-2 rounded-full bg-white/10 text-white hover:text-gold-400 hover:bg-white/20 transition-colors z-50"
            aria-label="Close fullscreen view"
          >
            <FiX className="w-6 h-6" />
          </button>
          <div 
            className="max-w-4xl max-h-[90vh] p-2 flex flex-col items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <img 
              src={currentImgSrc} 
              alt="Fullscreen Coin View" 
              className="max-w-full max-h-[75vh] object-contain drop-shadow-2xl rounded-lg" 
            />
            <p className="text-gray-300 text-xs sm:text-sm mt-4 font-serif text-center">
              {activeImageIndex === 0 ? 'Obverse (Front View)' : activeImageIndex === 1 ? 'Reverse (Back View)' : `Detail Specimen View ${activeImageIndex + 1}`}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default CoinGallery;
