import { useEffect, useRef, useState } from 'react';
import { useTheme } from '../../context/ThemeContext';

export const HERO_SHOWCASE_IMAGES = [
  {
    id: 1,
    title: 'Historic Indian Coinage Collection',
    img: 'https://plus.unsplash.com/premium_photo-1680396761982-0bdd9675af35?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0',
  },
  {
    id: 2,
    title: 'Rare Numismatic Gold & Silver Artifacts',
    img: 'https://images.unsplash.com/photo-1554134449-8ad2b1dea29e?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0',
  },
  {
    id: 3,
    title: 'Ancient Mughal & Imperial Coin Treasury',
    img: 'https://images.unsplash.com/photo-1727169705454-42fb2a477d5d?q=80&w=1167&auto=format&fit=crop&ixlib=rb-4.1.0',
  },
  {
    id: 4,
    title: 'Princely States & Heritage Currency',
    img: 'https://images.unsplash.com/photo-1726916815921-9c37fea8a3b3?q=80&w=1167&auto=format&fit=crop&ixlib=rb-4.1.0',
  },
  {
    id: 5,
    title: 'Ancient Punch-Marked Silver Karshapanas',
    img: 'https://images.unsplash.com/photo-1672945690877-5307346cde57?q=80&w=1167&auto=format&fit=crop&ixlib=rb-4.1.0',
  },
];

const HeroVerticalCardSlider = ({ customImages }) => {
  const { isDark } = useTheme();

  const images =
    customImages && customImages.length > 0
      ? customImages
      : HERO_SHOWCASE_IMAGES;

  const [activeIndex, setActiveIndex] = useState(0);
  const [prevIndex, setPrevIndex] = useState(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [direction, setDirection] = useState('down'); // 'down' or 'up'

  const sectionRef = useRef(null);
  const activeIndexRef = useRef(0);
  const isTransitioningRef = useRef(false);
  const transitionTimerRef = useRef(null);
  const wheelAccumulatorRef = useRef(0);
  const touchStartYRef = useRef(null);

  // Synchronize ref state
  useEffect(() => {
    activeIndexRef.current = activeIndex;
  }, [activeIndex]);

  // Transition handler
  const changeImage = (dir) => {
    if (isTransitioningRef.current) return false;

    const currentIndex = activeIndexRef.current;
    const nextIndex = currentIndex + dir;

    // Standard scroll unlocked at image boundaries
    if (nextIndex < 0 || nextIndex >= images.length) {
      return false;
    }

    const scrollDir = dir > 0 ? 'down' : 'up';
    setDirection(scrollDir);
    setPrevIndex(currentIndex);
    activeIndexRef.current = nextIndex;
    setActiveIndex(nextIndex);

    isTransitioningRef.current = true;
    setIsTransitioning(true);

    clearTimeout(transitionTimerRef.current);
    transitionTimerRef.current = setTimeout(() => {
      isTransitioningRef.current = false;
      setIsTransitioning(false);
    }, 600);

    return true;
  };

  // Wheel event listener scoped ONLY to the slider section
  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const handleWheel = (event) => {
      // Prevent scroll while animation is actively playing
      if (isTransitioningRef.current) {
        event.preventDefault();
        return;
      }

      wheelAccumulatorRef.current += event.deltaY;
      const threshold = 40;

      if (Math.abs(wheelAccumulatorRef.current) < threshold) {
        // Prevent normal page scroll only while navigating within image limits
        if (
          (event.deltaY > 0 && activeIndexRef.current < images.length - 1) ||
          (event.deltaY < 0 && activeIndexRef.current > 0)
        ) {
          event.preventDefault();
        }
        return;
      }

      const dir = wheelAccumulatorRef.current > 0 ? 1 : -1;
      wheelAccumulatorRef.current = 0;

      const currentIndex = activeIndexRef.current;

      // Navigate down inside boundaries
      if (dir > 0 && currentIndex < images.length - 1) {
        event.preventDefault();
        changeImage(1);
        return;
      }

      // Navigate up inside boundaries
      if (dir < 0 && currentIndex > 0) {
        event.preventDefault();
        changeImage(-1);
        return;
      }

      // Boundary reached: event.preventDefault() is skipped, returning control to page scroll
    };

    // Attached directly to section node instead of window
    section.addEventListener('wheel', handleWheel, { passive: false });

    return () => {
      section.removeEventListener('wheel', handleWheel);
      clearTimeout(transitionTimerRef.current);
    };
  }, [images.length]);

  // Touch handlers for mobile devices
  const handleTouchStart = (event) => {
    const firstTouch = event.touches[0];
    if (firstTouch) {
      touchStartYRef.current = firstTouch.clientY;
    }
  };

  const handleTouchEnd = (event) => {
    if (touchStartYRef.current === null || isTransitioningRef.current) {
      touchStartYRef.current = null;
      return;
    }

    const lastTouch = event.changedTouches[0];
    if (!lastTouch) {
      touchStartYRef.current = null;
      return;
    }

    const deltaY = touchStartYRef.current - lastTouch.clientY;
    touchStartYRef.current = null;

    if (Math.abs(deltaY) < 45) return;

    if (deltaY > 0 && activeIndexRef.current < images.length - 1) {
      changeImage(1);
    } else if (deltaY < 0 && activeIndexRef.current > 0) {
      changeImage(-1);
    }
  };

  const currentImage = images[activeIndex];

  return (
    <section
      ref={sectionRef}
      className={`relative w-full overflow-hidden select-none ${
        isDark ? 'bg-dark-900' : 'bg-[#FAF8F5]'
      }`}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <div className="relative w-full max-w-[570px] mx-auto">
        {/* Glow */}
        <div
          className="absolute -inset-10 rounded-full blur-3xl pointer-events-none"
          style={{
            background:
              'radial-gradient(ellipse at center, rgba(184,134,11,0.18) 0%, transparent 70%)',
          }}
        />

        {/* Frame */}
        <div
          className="relative z-10 w-full overflow-hidden rounded-2xl"
          style={{
            aspectRatio: '16 / 10',
            perspective: '1200px',
          }}
        >
          {/* Outgoing Image */}
          {isTransitioning && prevIndex !== null && (
            <div
              key={`prev-${prevIndex}`}
              className="absolute inset-0 z-10 overflow-hidden rounded-2xl"
              style={{
                animation: `${
                  direction === 'down'
                    ? 'heroPreviousImageDown'
                    : 'heroPreviousImageUp'
                } 0.6s cubic-bezier(0.22, 1, 0.36, 1) forwards`,
              }}
            >
              <img
                src={images[prevIndex]?.img}
                alt={images[prevIndex]?.title || ''}
                className="w-full h-full object-cover"
                draggable="false"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
            </div>
          )}

          {/* Incoming/Active Image */}
          <div
            key={`current-${activeIndex}`}
            className="absolute inset-0 z-20 overflow-hidden rounded-2xl border-2 border-gold-500/80"
            style={{
              boxShadow: '0 20px 50px -10px rgba(212,175,55,0.40)',
              animation: isTransitioning
                ? `${
                    direction === 'down'
                      ? 'heroCurrentImageDown'
                      : 'heroCurrentImageUp'
                  } 0.6s cubic-bezier(0.22, 1, 0.36, 1) forwards`
                : 'none',
            }}
          >
            <img
              src={currentImage?.img}
              alt={currentImage?.title || `Showcase ${activeIndex + 1}`}
              className="w-full h-full object-cover pointer-events-none"
              draggable="false"
              loading={activeIndex === 0 ? 'eager' : 'lazy'}
            />

            <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent pointer-events-none" />

            {currentImage?.title && (
              <div className="absolute bottom-5 left-5 right-12 pointer-events-none">
                <p className="text-white text-xs sm:text-sm md:text-base font-serif font-semibold tracking-wide drop-shadow-lg">
                  {currentImage.title}
                </p>
              </div>
            )}

            <div className="absolute top-4 right-4 rounded-full bg-black/40 backdrop-blur-md px-3 py-1.5 text-[10px] sm:text-xs font-medium tracking-[0.2em] text-white">
              {String(activeIndex + 1).padStart(2, '0')} /{' '}
              {String(images.length).padStart(2, '0')}
            </div>
          </div>

          {/* Dots Indicator */}
          <div className="absolute right-3 top-1/2 -translate-y-1/2 z-30 flex flex-col items-center gap-2 pointer-events-none">
            {images.map((item, index) => {
              const isActive = index === activeIndex;
              return (
                <div
                  key={item.id ?? index}
                  className="rounded-full transition-all duration-300"
                  style={{
                    width: isActive ? 7 : 4,
                    height: isActive ? 7 : 4,
                    backgroundColor: isActive
                      ? 'rgba(212,175,55,1)'
                      : isDark
                      ? 'rgba(255,255,255,0.35)'
                      : 'rgba(0,0,0,0.25)',
                    transform: isActive ? 'scale(1.3)' : 'scale(1)',
                  }}
                />
              );
            })}
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {images.map((item, index) => {
              const isActive = index === activeIndex;
              return (
                <div
                  key={item.id ?? index}
                  className="h-[2px] transition-all duration-500"
                  style={{
                    width: isActive ? '40px' : '20px',
                    backgroundColor: isActive
                      ? '#C28B09'
                      : isDark
                      ? 'rgba(255,255,255,0.18)'
                      : 'rgba(0,0,0,0.15)',
                  }}
                />
              );
            })}
          </div>

          <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.18em] text-gray-500">
            {activeIndex === images.length - 1
              ? 'Continue scrolling'
              : 'Scroll to explore'}
          </div>
        </div>
      </div>

      {/* Styles */}
      <style>{`
        /* Scroll Down Transitions */
        @keyframes heroCurrentImageDown {
          from { opacity: 0; transform: translateY(55px) scale(0.97); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes heroPreviousImageDown {
          from { opacity: 1; transform: translateY(0) scale(1); }
          to { opacity: 0; transform: translateY(-55px) scale(0.97); }
        }

        /* Scroll Up Transitions */
        @keyframes heroCurrentImageUp {
          from { opacity: 0; transform: translateY(-55px) scale(0.97); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes heroPreviousImageUp {
          from { opacity: 1; transform: translateY(0) scale(1); }
          to { opacity: 0; transform: translateY(55px) scale(0.97); }
        }
      `}</style>
    </section>
  );
};

export default HeroVerticalCardSlider;