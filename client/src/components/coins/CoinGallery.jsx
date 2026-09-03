import { useState } from 'react';
import { FiZoomIn, FiMaximize2 } from 'react-icons/fi';
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
    <div className="space-y-4 select-none">
      <div 
        className={`aspect-square relative border rounded-lg overflow-hidden p-6 cursor-zoom-in group ${
          isDark ? 'bg-dark-700 border-dark-600' : 'bg-[#FAFAF7] border-gray-200'
        }`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onMouseMove={handleMouseMove}
        onClick={() => setIsLightboxOpen(true)}
      >
        <div className={`absolute top-3 left-3 z-20 backdrop-blur-sm border px-2.5 py-1 rounded text-xs font-medium flex items-center gap-1.5 shadow-sm transition-opacity duration-300 group-hover:opacity-100 opacity-80 ${
          isDark ? 'bg-dark-800/90 border-dark-600 text-gray-300' : 'bg-white/90 border-gray-200 text-gray-700'
        }`}>
          <FiZoomIn className="text-gold-500" /> Hover to Zoom &bull; Click to Expand
        </div>

        <button 
          onClick={(e) => { e.stopPropagation(); setIsLightboxOpen(true); }}
          className={`absolute top-3 right-3 z-20 p-2 backdrop-blur-sm border rounded transition-colors shadow-sm ${
            isDark ? 'bg-dark-800/90 border-dark-600 text-gray-400 hover:text-gold-400' : 'bg-white/90 border-gray-200 text-gray-600 hover:text-gold-600'
          }`}
          title="Fullscreen Lightbox View"
        >
          <FiMaximize2 />
        </button>

        <div className="w-full h-full relative overflow-hidden flex items-center justify-center">
          <img
            src={currentImgSrc}
            alt={`Coin View ${activeImageIndex + 1}`}
            className="w-full h-full object-contain transition-transform duration-150 ease-out"
            style={{
              transform: isHovered ? 'scale(2.6)' : 'scale(1)',
              transformOrigin: `${zoomPos.x}% ${zoomPos.y}%`,
            }}
          />
        </div>

        {isHovered && (
          <div 
            className="pointer-events-none absolute border border-gold-500/50 bg-gold-500/10 rounded-full shadow-inner"
            style={{
              width: '100px',
              height: '100px',
              left: `calc(${zoomPos.x}% - 50px)`,
              top: `calc(${zoomPos.y}% - 50px)`,
            }}
          />
        )}
      </div>

      {imageList.length > 1 && (
        <div className="flex space-x-3 overflow-x-auto pb-2">
          {imageList.map((img, index) => {
            const imgSrc = typeof img === 'string' ? img : img?.url;
            return (
              <button
                key={index}
                onClick={() => setActiveImageIndex(index)}
                className={`flex-shrink-0 w-20 h-20 rounded-lg border-2 transition-all p-2 flex flex-col items-center justify-center ${
                  activeImageIndex === index 
                    ? 'border-gold-500 ring-1 ring-gold-500 bg-gold-500/5' 
                    : isDark 
                      ? 'border-dark-600 bg-dark-700 hover:border-gray-500'
                      : 'border-gray-200 bg-[#FAFAF7] hover:border-gray-300'
                }`}
              >
                <img src={imgSrc} alt={`Thumbnail ${index + 1}`} className="w-full h-12 object-contain mb-1" />
                <span className={`text-[10px] font-medium uppercase tracking-wider ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                  {index === 0 ? 'Obverse' : index === 1 ? 'Reverse' : `View ${index + 1}`}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {isLightboxOpen && (
        <div 
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setIsLightboxOpen(false)}
        >
          <button 
            onClick={() => setIsLightboxOpen(false)}
            className="absolute top-6 right-6 text-white text-3xl hover:text-gold-500 transition-colors"
          >
            &times;
          </button>
          <div className="max-w-4xl max-h-[90vh] p-4 flex flex-col items-center">
            <img 
              src={currentImgSrc} 
              alt="Fullscreen Coin View" 
              className="max-w-full max-h-[80vh] object-contain drop-shadow-2xl" 
            />
            <p className="text-gray-300 text-sm mt-4 font-serif">
              {activeImageIndex === 0 ? 'Obverse (Front View)' : activeImageIndex === 1 ? 'Reverse (Back View)' : `Detail View ${activeImageIndex + 1}`}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default CoinGallery;
