import { useEffect, useState } from 'react';

export function ScrollToTopButton() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    function handleScroll() {
      setVisible(window.scrollY > 280);
    }

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  function scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  if (!visible) return null;

  return (
    <button
      aria-label="Back to top"
      className="scroll-to-top"
      onClick={scrollToTop}
      type="button"
    >
      <svg aria-hidden="true" fill="none" height="18" viewBox="0 0 18 18" width="18" xmlns="http://www.w3.org/2000/svg">
        <path d="M9 14V4M4 9l5-5 5 5" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" />
      </svg>
    </button>
  );
}
