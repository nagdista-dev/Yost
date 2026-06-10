import { useRef, useEffect } from 'react';
import { Search } from 'lucide-react';
import { useTheme } from '../context/useTheme';
import { t } from '../i18n';

export default function PostSearch({ value, onChange }) {
  const searchRef = useRef(null);
  const { language } = useTheme();

  useEffect(() => {
    function onKeyDown(e) {
      if (e.key === 's' && !e.ctrlKey && !e.metaKey && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
        e.preventDefault();
        searchRef.current?.focus();
      }
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, []);

  return (
    <div className="relative">
      <Search size={16} className={`absolute ${language === 'ar' ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 text-yt-text-muted`} />
      <input
        ref={searchRef}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={`${t(language, 'searchPosts')} (s)`}
        className={`w-full bg-yt-input text-yt-text rounded-lg py-2.5 text-sm outline-none focus:ring-2 focus:ring-yt-accent placeholder-yt-text-muted ${language === 'ar' ? 'pr-10 pl-3' : 'pl-10 pr-3'}`}
      />
    </div>
  );
}
