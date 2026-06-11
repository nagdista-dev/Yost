import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { Film, Search, X, RefreshCw } from 'lucide-react';
import { useTheme } from '../context/useTheme';
import { t } from '../i18n';
import VideoCard from '../components/VideoCard';
import VideoSkeleton from '../components/VideoSkeleton';
import VideoPlayerModal from '../components/VideoPlayerModal';
import VideoFilters from '../components/VideoFilters';
import useVideos from '../hooks/useVideos';

export default function VideosPage({ channels, onChannelClick, onUpdateChannel, onToggleFavorite, categories, refreshTrigger, onRefreshAll }) {
  const { language } = useTheme();
  const [listMode, setListMode] = useState(false);
  const [playingVideoId, setPlayingVideoId] = useState(null);
  const [search, setSearch] = useState('');

  const [editing, setEditing] = useState(null);
  const [editName, setEditName] = useState('');
  const [editCategories, setEditCategories] = useState([]);
  const [editCategoryInput, setEditCategoryInput] = useState('');
  const editCategoryRef = useRef(null);

  const {
    loading, videoList, allCategories, progress,
    categoryFilter, setCategoryFilter,
    sortBy, setSortBy,
    liveFilter, setLiveFilter,
  } = useVideos(channels, refreshTrigger);

  useEffect(() => {
    function onKeyDown(e) {
      if (e.key === 'Escape') setEditing(null);
    }
    if (editing) {
      document.addEventListener('keydown', onKeyDown);
      return () => document.removeEventListener('keydown', onKeyDown);
    }
  }, [editing]);

  const handlePlay = useCallback((videoId) => {
    setPlayingVideoId(videoId);
  }, []);

  const handleEditChannel = useCallback((channelHandle) => {
    const ch = channels.find(c => c.handle === channelHandle);
    if (!ch) return;
    setEditName(ch.name || '');
    setEditCategories([...(ch.categories || ['Unspecified'])]);
    setEditCategoryInput('');
    setEditing(ch);
  }, [channels]);

  const addEditCategory = (cat) => {
    const trimmed = cat.trim();
    if (!trimmed || editCategories.includes(trimmed)) return;
    if (trimmed === 'Unspecified') return;
    setEditCategories(prev => [...prev, trimmed]);
    setEditCategoryInput('');
    editCategoryRef.current?.focus();
  };

  const removeEditCategory = (cat) => {
    setEditCategories(prev => prev.filter(c => c !== cat));
  };

  const handleEditCategoryKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (editCategoryInput.trim()) addEditCategory(editCategoryInput);
    }
    if (e.key === 'Backspace' && !editCategoryInput && editCategories.length > 0) {
      removeEditCategory(editCategories[editCategories.length - 1]);
    }
  };

  const handleSaveEdit = () => {
    if (!editing) return;
    const cats = editCategories.length > 0 ? editCategories : ['Unspecified'];
    onUpdateChannel(editing, { ...editing, name: editName.trim(), categories: cats });
    setEditing(null);
  };

  const editAvailable = (categories || []).filter(c => c !== 'Unspecified' && !editCategories.includes(c));

  const filteredList = useMemo(() => {
    if (!search) return videoList;
    const q = search.toLowerCase();
    return videoList.filter(v =>
      (v.title || '').toLowerCase().includes(q) ||
      (v._channelName || '').toLowerCase().includes(q)
    );
  }, [videoList, search]);

  if (channels.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[40vh] text-yt-text-muted">
        <p className="text-lg md:text-xl" style={{ fontSize: 'var(--font-size-lg)' }}>{t(language, 'noChannels')}</p>
      </div>
    );
  }

  const activeFilterCount = [categoryFilter, liveFilter].filter(Boolean).length;

  return (
    <div className="space-y-4 md:space-y-5">
      <div className="sticky top-20 z-30 bg-yt-bg md:bg-yt-bg-card md:rounded-xl md:border md:border-yt-border/50 md:shadow-sm">
        <div className="px-3 md:px-5 py-2 md:pt-5 md:pb-4">
          <div className="hidden md:flex items-center gap-2 mb-4">
            <div className="w-1 h-5 rounded-full bg-yt-accent shrink-0" />
            <h2 className="text-yt-text font-bold text-sm">{t(language, 'tabVideos')}</h2>
          </div>

          <div className="flex items-center gap-2 md:gap-3">
            <div className="flex-1 min-w-0">
              <VideoFilters
                allCategories={allCategories}
                categoryFilter={categoryFilter}
                setCategoryFilter={setCategoryFilter}
                sortBy={sortBy}
                setSortBy={setSortBy}
                listMode={listMode}
                setListMode={setListMode}
                liveFilter={liveFilter}
                setLiveFilter={setLiveFilter}
                onClearFilters={() => {
                  setCategoryFilter(null);
                  setLiveFilter(false);
                }}
              />
            </div>
            <button
              onClick={onRefreshAll}
              disabled={loading}
              className="hidden md:inline-flex shrink-0 p-2 rounded-lg border border-yt-border/40 text-yt-text-secondary hover:text-yt-text hover:bg-yt-bg-tertiary/50 transition disabled:opacity-40"
              title={t(language, 'refreshVideos')}
            >
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>

          <div className="hidden md:block mt-4 relative">
            <Search size={14} className="absolute start-3 top-1/2 -translate-y-1/2 pointer-events-none text-yt-text-muted" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by video title or channel name..."
              className="w-full ps-9 pe-8 py-2.5 text-xs rounded-lg border border-yt-border/40 bg-yt-bg-tertiary/30 text-yt-text-secondary outline-none focus:ring-2 focus:ring-yt-accent focus:border-yt-accent/30 transition-all placeholder-yt-text-muted/60"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute end-2 top-1/2 -translate-y-1/2 text-yt-text-muted hover:text-yt-text p-0.5 rounded transition-colors"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>
      </div>

      {loading ? (
        <>
          <div className="flex items-center gap-2.5 px-1 py-2 text-xs text-yt-text-muted bg-yt-bg-tertiary/20 rounded-xl">
            <div className="w-4 h-4 border-2 border-yt-accent border-t-transparent rounded-full animate-spin" />
            <span>{t(language, 'loadingVideos', progress.loaded, progress.total)}</span>
          </div>
          <div className={listMode ? 'space-y-3' : 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5'}>
            {Array.from({ length: Math.min(channels.length, 6) }).map((_, i) => (
              <VideoSkeleton key={i} list={listMode} />
            ))}
          </div>
        </>
      ) : filteredList.length === 0 ? (
        <div className="text-center text-yt-text-muted py-20">
          <div className="w-16 h-16 rounded-2xl bg-yt-bg-tertiary/50 flex items-center justify-center mx-auto mb-4">
            <Film size={28} className="text-yt-text-muted/50" />
          </div>
          <p className="text-base" style={{ fontSize: 'var(--font-size-lg)' }}>
            {search ? 'No videos match your search.' : t(language, 'noVideos')}
          </p>
        </div>
      ) : (
        <>
          <div className="flex items-center gap-2 px-1 py-2.5">
            <div className="h-px flex-1 bg-yt-border/20" />
            <p className="text-xs text-yt-text-muted/70 font-medium whitespace-nowrap">
              {search
                ? `${filteredList.length} of ${videoList.length} videos`
                : t(language, 'showingVideos', filteredList.length)
              }
              {activeFilterCount > 0 && (
                <span className="ms-1.5 text-yt-accent/70">· {activeFilterCount} filter{activeFilterCount > 1 ? 's' : ''} active</span>
              )}
            </p>
            <div className="h-px flex-1 bg-yt-border/20" />
          </div>
          <div className={listMode ? 'space-y-3' : 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5'}>
            {filteredList.map(video => (
              <VideoCard
                key={video.videoId}
                video={video}
                list={listMode}
                ranks={{ viewsRank: video._viewsRank, likesRank: video._likesRank }}
                onPlay={handlePlay}
                onChannelClick={onChannelClick}
                onEditChannel={handleEditChannel}
              />
            ))}
          </div>
        </>
      )}

      {playingVideoId && (
        <VideoPlayerModal
          videoId={playingVideoId}
          onClose={() => setPlayingVideoId(null)}
        />
      )}

      {editing && (
        <div className="fixed top-0 left-0 w-screen h-screen z-50 flex items-center justify-center bg-black/50" onClick={() => setEditing(null)}>
          <div
            className="bg-yt-bg-card rounded-xl p-6 border border-yt-border w-full max-w-sm mx-4 shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-yt-text text-lg font-bold">{t(language, 'edit')} {editing.handle}</h2>
              <button
                onClick={() => setEditing(null)}
                className="p-1.5 rounded-lg text-yt-text-muted hover:text-yt-text hover:bg-yt-bg-tertiary transition"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-yt-text-secondary text-xs font-medium mb-1.5 block">
                  {t(language, 'channelName')}
                </label>
                <input
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSaveEdit()}
                  placeholder={t(language, 'channelName')}
                  className="w-full bg-yt-input text-yt-text rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-yt-accent placeholder-yt-text-muted"
                  autoFocus
                />
              </div>

              <div>
                <label className="text-yt-text-secondary text-xs font-medium mb-1.5 block">
                  {t(language, 'category')}
                </label>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {editCategories.map(cat => (
                    <span
                      key={cat}
                      className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-yt-accent/10 text-yt-accent text-xs font-medium"
                    >
                      {cat}
                      <button
                        type="button"
                        onClick={() => removeEditCategory(cat)}
                        className="hover:bg-yt-accent/20 rounded p-0.5 transition"
                      >
                        <X size={12} />
                      </button>
                    </span>
                  ))}
                </div>
                <input
                  ref={editCategoryRef}
                  value={editCategoryInput}
                  onChange={e => setEditCategoryInput(e.target.value)}
                  onKeyDown={handleEditCategoryKeyDown}
                  placeholder={t(language, 'addChannel') + '...'}
                  list="edit-category-suggestions"
                  className="w-full bg-yt-input text-yt-text rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-yt-accent placeholder-yt-text-muted"
                />
                <datalist id="edit-category-suggestions">
                  {editAvailable.map(c => (
                    <option key={c} value={c} />
                  ))}
                </datalist>
                {editAvailable.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {editAvailable.slice(0, 6).map(cat => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => addEditCategory(cat)}
                        className="px-2 py-0.5 text-[10px] rounded-md border border-yt-border/30 text-yt-text-muted hover:text-yt-text hover:border-yt-accent/50 transition"
                      >
                        +{cat}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-2 justify-end mt-6">
              <button
                onClick={() => setEditing(null)}
                className="px-4 py-2 rounded-lg text-sm font-medium text-yt-text-secondary hover:bg-yt-bg-tertiary transition"
              >
                {t(language, 'cancel')}
              </button>
              <button
                onClick={handleSaveEdit}
                className="bg-yt-accent hover:bg-yt-accent-hover text-white px-4 py-2 rounded-lg text-sm font-medium transition"
              >
                {t(language, 'save')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
