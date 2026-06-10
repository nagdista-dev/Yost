import { LayoutGrid, List, ChevronDown } from 'lucide-react';
import { useTheme } from '../context/useTheme';
import { t } from '../i18n';

const SORT_OPTIONS = ['newest', 'views', 'likes', 'dislikes', 'ratio'];

export default function VideoFilters({
  allCategories, categoryFilter, setCategoryFilter,
  sortBy, setSortBy, listMode, setListMode,
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
      {/* Category pills - scrollable horizontally */}
      {allCategories.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none -mx-1 px-1">
          <button
            onClick={() => setCategoryFilter(null)}
            className={`shrink-0 px-3.5 py-1.5 text-xs rounded-xl border transition font-medium ${
              !categoryFilter
                ? 'bg-yt-accent text-white border-yt-accent shadow-sm'
                : 'bg-yt-bg-tertiary/40 text-yt-text-secondary border-yt-border/30 hover:border-yt-accent/50 hover:text-yt-text'
            }`}
          >
            {t(language, 'allCategories')}
          </button>
          {allCategories.map(cat => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`shrink-0 px-3.5 py-1.5 text-xs rounded-xl border transition font-medium whitespace-nowrap ${
                categoryFilter === cat
                  ? 'bg-yt-accent text-white border-yt-accent shadow-sm'
                  : 'bg-yt-bg-tertiary/40 text-yt-text-secondary border-yt-border/30 hover:border-yt-accent/50 hover:text-yt-text'
              }`}
            >
              {cat === 'Unspecified' ? t(language, 'unspecified') : cat}
            </button>
          ))}
        </div>
      )}

      {/* Sort + View controls row */}
      <div className="flex items-center gap-2 flex-wrap">
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

        <div className="ms-auto flex items-center gap-1 bg-yt-bg-tertiary/50 rounded-lg p-0.5 border border-yt-border/40">
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
    </div>
  );
}
