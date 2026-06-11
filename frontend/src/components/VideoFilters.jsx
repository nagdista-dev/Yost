import { LayoutGrid, List, ChevronDown, X, Radio } from 'lucide-react';
import { useTheme } from '../context/useTheme';
import { t } from '../i18n';

const SORT_OPTIONS = ['newest', 'views', 'likes', 'dislikes', 'ratio'];

export default function VideoFilters({
  allCategories, categoryFilter, setCategoryFilter,
  sortBy, setSortBy, listMode, setListMode,
  liveFilter, setLiveFilter, onClearFilters,
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
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2 flex-wrap">
        <select
          value={categoryFilter || ''}
          onChange={e => setCategoryFilter(e.target.value || null)}
          className="appearance-none px-3 py-2 pr-8 text-xs rounded-lg border border-yt-border/40 bg-yt-bg-tertiary/50 text-yt-text-secondary outline-none focus:ring-2 focus:ring-yt-accent cursor-pointer font-medium max-w-[200px]"
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
            className="appearance-none px-3 py-2 pr-8 text-xs rounded-lg border border-yt-border/40 bg-yt-bg-tertiary/50 text-yt-text-secondary outline-none focus:ring-2 focus:ring-yt-accent cursor-pointer font-medium"
          >
            {SORT_OPTIONS.map(key => (
              <option key={key} value={key}>{sortLabel(key)}</option>
            ))}
          </select>
          <ChevronDown size={14} className="absolute end-2 top-1/2 -translate-y-1/2 pointer-events-none text-yt-text-muted" />
        </div>

        <button
          onClick={() => setLiveFilter(!liveFilter)}
          className={`p-1.5 rounded-lg transition flex items-center gap-1.5 text-xs font-medium ${
            liveFilter
              ? 'bg-red-500/15 text-red-500 border border-red-500/30'
              : 'text-yt-text-secondary hover:text-yt-text border border-transparent'
          }`}
          title="Live"
        >
          <Radio size={14} className={liveFilter ? 'animate-pulse' : ''} />
          <span className="hidden sm:inline">Live</span>
        </button>

        <div className="flex items-center gap-1 bg-yt-bg-tertiary/50 rounded-lg p-0.5 border border-yt-border/40">
          <button
            onClick={() => setListMode(false)}
            className={`p-1.5 rounded-md transition ${
              !listMode ? 'bg-yt-accent text-white shadow-sm' : 'text-yt-text-secondary hover:text-yt-text'
            }`}
            title={t(language, 'gridView')}
          >
            <LayoutGrid size={16} />
          </button>
          <button
            onClick={() => setListMode(true)}
            className={`p-1.5 rounded-md transition ${
              listMode ? 'bg-yt-accent text-white shadow-sm' : 'text-yt-text-secondary hover:text-yt-text'
            }`}
            title={t(language, 'listView')}
          >
            <List size={16} />
          </button>
        </div>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        {categoryFilter && (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-yt-accent/10 text-yt-accent text-xs font-medium">
            {categoryFilter === 'Unspecified' ? t(language, 'unspecified') : categoryFilter}
            <button
              onClick={() => setCategoryFilter(null)}
              className="hover:bg-yt-accent/20 rounded p-0.5 transition"
            >
              <X size={12} />
            </button>
          </span>
        )}
        {(categoryFilter || liveFilter) && onClearFilters && (
          <button
            onClick={onClearFilters}
            className="px-2.5 py-1 rounded-lg text-xs font-medium text-yt-text-muted hover:text-yt-text hover:bg-yt-bg-tertiary/50 border border-yt-border/30 transition"
          >
            {t(language, 'clearFilters')}
          </button>
        )}
      </div>
    </div>
  );
}
