import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * ScrollToTop automatically scrolls the page and all main scroll containers 
 * to top whenever the route pathname changes.
 */
const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    // Scroll window, documentElement, and body
    window.scrollTo(0, 0);
    if (document.documentElement) {
      document.documentElement.scrollTop = 0;
    }
    if (document.body) {
      document.body.scrollTop = 0;
    }

    // Scroll any scrollable admin containers or custom div containers
    const scrollableContainers = document.querySelectorAll(
      '.overflow-y-auto, .overflow-auto, [class*="overflow-y-auto"]'
    );
    scrollableContainers.forEach((el) => {
      el.scrollTop = 0;
    });
  }, [pathname]);

  return null;
};

export default ScrollToTop;
