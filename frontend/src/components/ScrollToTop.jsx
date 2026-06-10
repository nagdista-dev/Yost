import { useState, useEffect } from 'react';
import { ChevronUp } from 'lucide-react';
import { useTheme } from '../context/useTheme';
import { t } from '../i18n';

export default function ScrollToTop() {
  const [show, setShow] = useState(false);
  const { language } = useTheme();

  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > 400);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  if (!show) return null;

  return (
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      className="fixed bottom-20 md:bottom-6 end-6 z-40 w-12 h-12 rounded-full bg-yt-accent text-white shadow-lg flex items-center justify-center hover:scale-110 active:scale-95 transition-all"
      aria-label={t(language, 'scrollToTop')}
    >
      <ChevronUp size={22} />
    </button>
  );
}
