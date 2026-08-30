import { useState } from 'react';
import { FiZoomIn, FiMaximize2 } from 'react-icons/fi';
import { STATIC_IMAGES } from '../../data/staticImages';

const CoinGallery = ({ images }) => {
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [zoomPos, setZoomPos] = useState({ x: 50, y: 50 });
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

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
      {/* Main Interactive Zoom Box */}
      <div 
        className="bg-[#FAFAF7] aspect-square relative border border-gray-200 rounded-sm overflow-hidden p-6 cursor-zoom-in group"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onMouseMove={handleMouseMove}
        onClick={() => setIsLightboxOpen(true)}
      >
        {/* Zoom Hint Badge */}
        <div className="absolute top-3 left-3 z-20 bg-white/90 backdrop-blur-sm border border-gray-200 px-2.5 py-1 rounded text-xs font-medium text-gray-700 flex items-center gap-1.5 shadow-sm transition-opacity duration-300 group-hover:opacity-100 opacity-80">
          <FiZoomIn className="text-[#B8860B]" /> Hover to Zoom &bull; Click to Expand
        </div>

        {/* Maximize Button */}
        <button 
          onClick={(e) => { e.stopPropagation(); setIsLightboxOpen(true); }}
          className="absolute top-3 right-3 z-20 p-2 bg-white/90 backdrop-blur-sm border border-gray-200 rounded text-gray-600 hover:text-[#B8860B] transition-colors shadow-sm"
          title="Fullscreen Lightbox View"
        >
          <FiMaximize2 />
        </button>

        {/* Main Coin Image with Magnification */}
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

        {/* Lens Overlay Crosshair Indicator */}
        {isHovered && (
          <div 
            className="pointer-events-none absolute border border-[#B8860B]/50 bg-[#B8860B]/10 rounded-full shadow-inner"
            style={{
              width: '100px',
              height: '100px',
              left: `calc(${zoomPos.x}% - 50px)`,
              top: `calc(${zoomPos.y}% - 50px)`,
            }}
          />
        )}
      </div>

      {/* Thumbnails Bar */}
      {imageList.length > 1 && (
        <div className="flex space-x-3 overflow-x-auto pb-2">
          {imageList.map((img, index) => {
            const imgSrc = typeof img === 'string' ? img : img?.url;
            return (
              <button
                key={index}
                onClick={() => setActiveImageIndex(index)}
                className={`flex-shrink-0 w-20 h-20 bg-[#FAFAF7] rounded border-2 transition-all p-2 flex flex-col items-center justify-center ${
                  activeImageIndex === index 
                    ? 'border-[#B8860B] ring-1 ring-[#B8860B] bg-amber-50/40' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <img
                  src={imgSrc}
                  alt={`Thumbnail ${index + 1}`}
                  className="w-full h-12 object-contain mb-1"
                />
                <span className="text-[10px] text-gray-500 font-medium uppercase tracking-wider">
                  {index === 0 ? 'Obverse' : index === 1 ? 'Reverse' : `View ${index + 1}`}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* Fullscreen Lightbox Modal */}
      {isLightboxOpen && (
        <div 
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setIsLightboxOpen(false)}
        >
          <button 
            onClick={() => setIsLightboxOpen(false)}
            className="absolute top-6 right-6 text-white text-3xl hover:text-[#B8860B] transition-colors"
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
