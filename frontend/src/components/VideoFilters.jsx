import { LayoutGrid, List, ChevronDown, Radio } from 'lucide-react';
import { useTheme } from '../context/useTheme';
import { t } from '../i18n';

const SORT_OPTIONS = ['newest', 'views', 'likes', 'dislikes', 'ratio'];

export default function VideoFilters({
  allCategories, categoryFilter, setCategoryFilter,
  sortBy, setSortBy, listMode, setListMode,
  liveFilter, setLiveFilter,
}) {
  const { language } = useTheme();

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

  return (
    <div className="flex items-center gap-1 md:gap-2">
      <select
        value={categoryFilter || ''}
        onChange={e => setCategoryFilter(e.target.value || null)}
        className="appearance-none px-2 py-1.5 pr-5 text-xs rounded-lg border border-yt-border/40 bg-yt-bg-tertiary/50 text-yt-text-secondary outline-none focus:ring-2 focus:ring-yt-accent cursor-pointer font-medium max-w-[130px] md:max-w-[180px] truncate"
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

      <div className="w-px h-4 bg-yt-border/20 shrink-0 hidden md:block" />

      <div className="flex items-center gap-0.5 bg-yt-bg-tertiary/50 rounded-lg p-0.5 border border-yt-border/40">
        <button
          onClick={() => setListMode(false)}
          className={`p-1 rounded-md transition ${
            !listMode ? 'bg-yt-accent text-white shadow-sm' : 'text-yt-text-secondary hover:text-yt-text'
          }`}
          title={t(language, 'gridView')}
        >
          <LayoutGrid size={12} />
        </button>
        <button
          onClick={() => setListMode(true)}
          className={`p-1 rounded-md transition ${
            listMode ? 'bg-yt-accent text-white shadow-sm' : 'text-yt-text-secondary hover:text-yt-text'
          }`}
          title={t(language, 'listView')}
        >
          <List size={12} />
        </button>
      </div>
    </div>
  );
}
