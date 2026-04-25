import { useEffect, useRef } from 'react';

/**
 * Custom hook that uses IntersectionObserver to add a 'visible' class
 * to elements when they scroll into the viewport. Works with CSS classes:
 * .reveal, .reveal-left, .reveal-right, .reveal-scale, .stagger-children
 */
const useScrollReveal = () => {
  const containerRef = useRef(null);

  useEffect(() => {
    const root = containerRef.current || document;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
          }
        });
      },
      { threshold: 0.15, rootMargin: '0px 0px -40px 0px' }
    );

    const selectors = '.reveal, .reveal-left, .reveal-right, .reveal-scale, .stagger-children';
    const elements = root.querySelectorAll(selectors);
    elements.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  return containerRef;
};

export default useScrollReveal;
