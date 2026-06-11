import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Radio, Search, X } from 'lucide-react';
import { useTheme } from '../context/useTheme';
import { t } from '../i18n';

const SORT_OPTIONS = ['newest', 'views', 'likes', 'dislikes', 'ratio'];
const AGE_OPTIONS = ['all', 'today', 'week', 'month'];

export default function VideoFilters({
  allCategories, categoryFilter, setCategoryFilter,
  sortBy, setSortBy, listMode, setListMode,
  liveFilter, setLiveFilter,
  searchText, setSearchText,
  ageFilter, setAgeFilter,
}) {
  const { language } = useTheme();
  const searchRef = useRef(null);
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === '/' && !searchOpen && document.activeElement?.tagName !== 'INPUT') {
        e.preventDefault();
        setSearchOpen(true);
      }
      if (e.key === 'Escape' && searchOpen) {
        setSearchOpen(false);
        setSearchText('');
        searchRef.current?.blur();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [searchOpen]);

  useEffect(() => {
    if (searchOpen && searchRef.current) {
      searchRef.current.focus();
    }
  }, [searchOpen]);

  const sortLabel = (key) => {
    switch (key) {
      case 'newest': return t(language, 'sortNewest');
      case 'views': return t(language, 'sortViews');
      case 'likes': return t(language, 'sortLikes');
      case 'dislikes': return t(language, 'sortDislikes');
      case 'ratio': return t(language, 'sortRatio');
      default: return key;
    }
  };

  const ageLabel = (key) => {
    switch (key) {
      case 'all': return t(language, 'allTime');
      case 'today': return t(language, 'today');
      case 'week': return t(language, 'thisWeek');
      case 'month': return t(language, 'thisMonth');
      default: return key;
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-1 md:gap-2">
      {searchOpen ? (
        <div className="relative flex-1 min-w-[120px] max-w-[200px]">
          <input
            ref={searchRef}
            value={searchText}
            onChange={e => setSearchText(e.target.value)}
            placeholder={t(language, 'searchVideos')}
            className="w-full bg-yt-input text-yt-text rounded-lg px-2 py-1.5 pe-8 text-xs outline-none focus:ring-2 focus:ring-yt-accent placeholder-yt-text-muted"
          />
          {searchText && (
            <button
              onClick={() => setSearchText('')}
              className="absolute end-1 top-1/2 -translate-y-1/2 p-0.5 text-yt-text-muted hover:text-yt-text"
            >
              <X size={12} />
            </button>
          )}
        </div>
      ) : (
        <button
          onClick={() => setSearchOpen(true)}
          className="flex items-center gap-1 p-1.5 text-xs rounded-lg text-yt-text-secondary hover:text-yt-text hover:bg-yt-bg-tertiary/50 transition"
          title={t(language, 'searchVideos')}
        >
          <Search size={12} />
        </button>
      )}

      <select
        value={categoryFilter || ''}
        onChange={e => setCategoryFilter(e.target.value || null)}
        className="appearance-none px-2 py-1.5 pr-5 text-xs rounded-lg border border-yt-border/40 bg-yt-bg-tertiary/50 text-yt-text-secondary outline-none focus:ring-2 focus:ring-yt-accent cursor-pointer font-medium max-w-[100px] md:max-w-[140px] truncate"
      >
        <option value="">{t(language, 'allCategories')}</option>
        {allCategories.map(cat => (
          <option key={cat} value={cat}>
            {cat === 'Unspecified' ? t(language, 'unspecified') : cat}
          </option>
        ))}
      </select>

      <div className="relative">
        <select
          value={sortBy}
          onChange={e => setSortBy(e.target.value)}
          className="appearance-none px-2 py-1.5 pr-5 text-xs rounded-lg border border-yt-border/40 bg-yt-bg-tertiary/50 text-yt-text-secondary outline-none focus:ring-2 focus:ring-yt-accent cursor-pointer font-medium"
        >
          {SORT_OPTIONS.map(key => (
            <option key={key} value={key}>{sortLabel(key)}</option>
          ))}
        </select>
        <ChevronDown size={12} className="absolute end-1.5 top-1/2 -translate-y-1/2 pointer-events-none text-yt-text-muted" />
      </div>

      <div className="relative">
        <select
          value={ageFilter}
          onChange={e => setAgeFilter(e.target.value)}
          className="appearance-none px-2 py-1.5 pr-5 text-xs rounded-lg border border-yt-border/40 bg-yt-bg-tertiary/50 text-yt-text-secondary outline-none focus:ring-2 focus:ring-yt-accent cursor-pointer font-medium"
        >
          {AGE_OPTIONS.map(key => (
            <option key={key} value={key}>{ageLabel(key)}</option>
          ))}
        </select>
        <ChevronDown size={12} className="absolute end-1.5 top-1/2 -translate-y-1/2 pointer-events-none text-yt-text-muted" />
      </div>

      <div className="w-px h-4 bg-yt-border/20 shrink-0 hidden md:block" />

      <button
        onClick={() => setLiveFilter(!liveFilter)}
        className={`inline-flex p-1.5 rounded-lg transition items-center gap-1 text-xs font-medium ${
          liveFilter
            ? 'bg-red-500/15 text-red-500 border border-red-500/30'
            : 'text-yt-text-secondary hover:text-yt-text border border-transparent'
        }`}
        title="Live"
      >
        <Radio size={11} className={liveFilter ? 'animate-pulse' : ''} />
        <span className="hidden md:inline">Live</span>
      </button>
    </div>
  );
}
