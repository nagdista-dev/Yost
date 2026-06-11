import { useState, useCallback, useRef, useEffect } from 'react';
import { Film, X, RefreshCw, Trash2 } from 'lucide-react';
import { useTheme } from '../context/useTheme';
import { t } from '../i18n';
import VideoCard from '../components/VideoCard';
import VideoSkeleton from '../components/VideoSkeleton';
import VideoPlayerModal from '../components/VideoPlayerModal';
import VideoFilters from '../components/VideoFilters';
import useVideos from '../hooks/useVideos';

export default function VideosPage({ channels, onChannelClick, onUpdateChannel, onToggleFavorite, categories, refreshTrigger, onRefreshAll, clearFilterKey }) {
  const { language } = useTheme();
  const [listMode, setListMode] = useState(false);
  const [playingVideoId, setPlayingVideoId] = useState(null);

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
  } = useVideos(channels, refreshTrigger, clearFilterKey);

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
      <div className="sticky top-20 z-30 bg-yt-bg">
        <div className="px-2 md:px-3 py-1.5">
          <div className="flex items-center gap-1 md:gap-2">
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
              />
            </div>
            <button
              onClick={() => { setCategoryFilter(null); setLiveFilter(false); }}
              className="shrink-0 p-2 rounded-lg border border-yt-border/40 text-yt-text-secondary hover:text-yt-text hover:bg-yt-bg-tertiary/50 transition"
              title="Clear filters"
            >
              <Trash2 size={16} />
            </button>
            <button
              onClick={onRefreshAll}
              disabled={loading}
              className="shrink-0 p-2 rounded-lg border border-yt-border/40 text-yt-text-secondary hover:text-yt-text hover:bg-yt-bg-tertiary/50 transition disabled:opacity-40"
              title={t(language, 'refreshVideos')}
            >
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            </button>
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
      ) : videoList.length === 0 ? (
        <div className="text-center text-yt-text-muted py-20">
          <div className="w-16 h-16 rounded-2xl bg-yt-bg-tertiary/50 flex items-center justify-center mx-auto mb-4">
            <Film size={28} className="text-yt-text-muted/50" />
          </div>
          <p className="text-base" style={{ fontSize: 'var(--font-size-lg)' }}>
            {t(language, 'noVideos')}
          </p>
        </div>
      ) : (
        <>
          <div className="flex items-center gap-2 px-1 py-2.5">
            <div className="h-px flex-1 bg-yt-border/20" />
            <p className="text-xs text-yt-text-muted/70 font-medium whitespace-nowrap">
              {t(language, 'showingVideos', videoList.length)}
              {activeFilterCount > 0 && (
                <span className="ms-1.5 text-yt-accent/70">· {activeFilterCount} filter{activeFilterCount > 1 ? 's' : ''} active</span>
              )}
            </p>
            <div className="h-px flex-1 bg-yt-border/20" />
          </div>
          <div className={listMode ? 'space-y-3' : 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5'}>
            {videoList.map(video => (
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
