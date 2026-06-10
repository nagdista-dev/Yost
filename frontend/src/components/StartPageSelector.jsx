import { useState, useRef, useEffect } from 'react';
import { Home, Video, Heart, Tv, Settings, ChevronDown } from 'lucide-react';
import { useTheme } from '../context/useTheme';
import { t } from '../i18n';

const START_PAGE_KEY = 'yt_feed_start_page';

const pageOptions = [
  { id: 'home', labelKey: 'tabHome', icon: Home },
  { id: 'videos', labelKey: 'tabVideos', icon: Video },
  { id: 'favorites', labelKey: 'tabFavorites', icon: Heart },
  { id: 'channels', labelKey: 'tabChannels', icon: Tv },
  { id: 'settings', labelKey: 'tabSettings', icon: Settings },
];

export function getStartPage() {
  try {
    return localStorage.getItem(START_PAGE_KEY) || 'home';
  } catch {
    return 'home';
  }
}

export function setStartPage(page) {
  try {
    localStorage.setItem(START_PAGE_KEY, page);
  } catch {}
}

export default function StartPageSelector() {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState(getStartPage);
  const ref = useRef(null);
  const { language } = useTheme();

  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const currentOption = pageOptions.find(o => o.id === selected) || pageOptions[0];
  const Icon = currentOption.icon;

  function handleSelect(id) {
    setSelected(id);
    setStartPage(id);
    setOpen(false);
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium bg-yt-bg-tertiary/50 text-yt-text-secondary hover:text-yt-text hover:bg-yt-bg-tertiary border border-yt-border/40 transition"
      >
        <Icon size={16} />
        <span>{t(language, currentOption.labelKey)}</span>
        <ChevronDown size={14} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute top-full mt-1 start-0 z-50 w-48 bg-yt-bg-card border border-yt-border rounded-xl shadow-xl overflow-hidden">
          <div className="px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-yt-text-muted border-b border-yt-border/40">
            {t(language, 'startPage')}
          </div>
          {pageOptions.map(opt => {
            const OptIcon = opt.icon;
            return (
              <button
                key={opt.id}
                onClick={() => handleSelect(opt.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm transition text-start ${
                  selected === opt.id
                    ? 'bg-yt-accent/10 text-yt-accent font-medium'
                    : 'text-yt-text-secondary hover:bg-yt-bg-tertiary hover:text-yt-text'
                }`}
              >
                <OptIcon size={16} />
                <span>{t(language, opt.labelKey)}</span>
                {selected === opt.id && (
                  <span className="ms-auto w-2 h-2 rounded-full bg-yt-accent" />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
