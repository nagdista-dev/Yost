import { useState, useEffect, useMemo, useRef } from 'react';
import { ArrowLeft, Search, X, Edit2, Heart } from 'lucide-react';
import api from '../api';
import VideoCard from '../components/VideoCard';
import VideoSkeleton from '../components/VideoSkeleton';
import VideoPlayerModal from '../components/VideoPlayerModal';
import VideoFilters from '../components/VideoFilters';
import { useTheme } from '../context/useTheme';
import { t } from '../i18n';

function isLikelyLive(title) {
  if (!title) return false;
  return /(?:🔴|⏺|LIVE|PREMIERE)\b/i.test(title);
}

export default function ChannelPage({ channel, onUpdateChannel, onToggleFavorite, categories, onBack, clearFilterKey }) {
  const { language } = useTheme();
  const channelHandle = channel?.handle;
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [playing, setPlaying] = useState(null);
  const [listMode, setListMode] = useState(false);
  const [sortBy, setSortBy] = useState('newest');
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState(null);
  const [liveFilter, setLiveFilter] = useState(false);
  const [editing, setEditing] = useState(null);
  const [editName, setEditName] = useState('');
  const [editCategories, setEditCategories] = useState([]);
  const [editCategoryInput, setEditCategoryInput] = useState('');
  const editCategoryRef = useRef(null);

  useEffect(() => {
    setCategoryFilter(null);
    setLiveFilter(false);
  }, [clearFilterKey]);

  useEffect(() => {
    function onKeyDown(e) {
      if (e.key === 'Escape') setEditing(null);
    }
    if (editing) {
      document.addEventListener('keydown', onKeyDown);
      return () => document.removeEventListener('keydown', onKeyDown);
    }
  }, [editing]);

  useEffect(() => {
    let cancelled = false;
    async function fetchData() {
      setLoading(true);
      try {
        const res = await api.get('/api/channel-videos', { params: { channelHandle } });
        if (!cancelled) setData(res.data);
      } catch {
        if (!cancelled) setData(null);
      }
      if (!cancelled) setLoading(false);
    }
    fetchData();
    return () => { cancelled = true; };
  }, [channelHandle]);

  const avatarLetter = (data?.channelName || channelHandle || '').replace('@', '').charAt(0).toUpperCase();

  const processedVideos = useMemo(() => {
    if (!data?.videos) return [];
    let list = data.videos.map(v => ({
      ...v,
      _channelHandle: data.channelHandle,
      _channelCategories: channel?.categories || ['Unspecified'],
    }));

    if (categoryFilter) {
      list = list.filter(v => (v._channelCategories || []).includes(categoryFilter));
    }

    if (liveFilter) {
      list = list.filter(v => v.isLive || isLikelyLive(v.title));
    }

    if (search) {
      const q = search.toLowerCase();
      list = list.filter(v => v.title.toLowerCase().includes(q));
    }

    switch (sortBy) {
      case 'views':
        list.sort((a, b) => (parseInt(b.views) || 0) - (parseInt(a.views) || 0));
        break;
      case 'likes':
        list.sort((a, b) => (parseInt(b.likes) || 0) - (parseInt(a.likes) || 0));
        break;
      case 'dislikes':
        list.sort((a, b) => (parseInt(b.dislikes) || 0) - (parseInt(a.dislikes) || 0));
        break;
      case 'ratio': {
        const ratio = (v) => {
          const l = parseInt(v.likes, 10);
          const w = parseInt(v.views, 10);
          return w ? l / w : 0;
        };
        list.sort((a, b) => ratio(b) - ratio(a));
        break;
      }
      default:
        list.sort((a, b) => new Date(b.published) - new Date(a.published));
    }

    const byViews = [...list].sort((a, b) => (parseInt(b.views) || 0) - (parseInt(a.views) || 0));
    const byLikes = [...list].sort((a, b) => (parseInt(b.likes) || 0) - (parseInt(a.likes) || 0));
    const viewsRankMap = {};
    const likesRankMap = {};
    byViews.forEach((v, i) => { viewsRankMap[v.videoId] = i + 1; });
    byLikes.forEach((v, i) => { likesRankMap[v.videoId] = i + 1; });

    return list.map(v => ({
      ...v,
      _viewsRank: viewsRankMap[v.videoId] || null,
      _likesRank: likesRankMap[v.videoId] || null,
    }));
  }, [data, search, sortBy, categoryFilter, liveFilter, channel]);

  function startEdit() {
    if (!channel) return;
    setEditName(channel.name || '');
    setEditCategories([...(channel.categories || ['Unspecified'])]);
    setEditCategoryInput('');
    setEditing(channel);
  }

  function addEditCategory(cat) {
    const trimmed = cat.trim();
    if (!trimmed || editCategories.includes(trimmed)) return;
    if (trimmed === 'Unspecified') return;
    setEditCategories(prev => [...prev, trimmed]);
    setEditCategoryInput('');
    editCategoryRef.current?.focus();
  }

  function removeEditCategory(cat) {
    setEditCategories(prev => prev.filter(c => c !== cat));
  }

  function handleEditCategoryKeyDown(e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (editCategoryInput.trim()) addEditCategory(editCategoryInput);
    }
    if (e.key === 'Backspace' && !editCategoryInput && editCategories.length > 0) {
      removeEditCategory(editCategories[editCategories.length - 1]);
    }
  }

  function handleSaveEdit() {
    if (!editing) return;
    const cats = editCategories.length > 0 ? editCategories : ['Unspecified'];
    onUpdateChannel(editing, { ...editing, name: editName.trim(), categories: cats });
    setEditing(null);
  }

  const editAvailable = (categories || []).filter(c => c !== 'Unspecified' && !editCategories.includes(c));

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-yt-text-muted hover:text-yt-text transition text-sm"
        >
          <ArrowLeft size={16} />
          Back
        </button>
        {channel && (
          <div className="flex items-center gap-1">
            <button
              onClick={() => onToggleFavorite(channel)}
              className={`p-2 rounded-lg transition ${
                channel.favorite ? 'text-red-500' : 'text-yt-text-muted hover:text-yt-text'
              }`}
              title={t(language, 'favorite')}
            >
              <Heart size={16} fill={channel.favorite ? 'currentColor' : 'none'} />
            </button>
            <button
              onClick={startEdit}
              className="p-2 rounded-lg text-yt-text-muted hover:text-yt-text transition"
              title={t(language, 'edit')}
            >
              <Edit2 size={16} />
            </button>
          </div>
        )}
      </div>

      {loading ? (
        <>
          <div className="bg-yt-bg-card rounded-xl border border-yt-border/50 p-5 md:p-6 flex items-center gap-4 animate-pulse">
            <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-yt-bg-tertiary shrink-0" />
            <div className="space-y-2 flex-1">
              <div className="h-5 bg-yt-bg-tertiary rounded w-1/3" />
              <div className="h-3 bg-yt-bg-tertiary rounded w-1/5" />
            </div>
          </div>
          <div className={listMode ? 'space-y-3' : 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5'}>
            {Array.from({ length: 6 }).map((_, i) => (
              <VideoSkeleton key={i} list={listMode} />
            ))}
          </div>
        </>
      ) : !data ? (
        <div className="text-center text-yt-text-muted py-20 text-sm">Could not load channel.</div>
      ) : (
        <>
          <div className="bg-yt-bg-card rounded-xl border border-yt-border/50 p-5 md:p-6 flex items-center gap-4">
            <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-yt-accent/20 flex items-center justify-center text-yt-accent text-xl md:text-2xl font-bold shrink-0">
              {avatarLetter}
            </div>
            <div className="min-w-0">
              <h1 className="text-yt-text text-xl md:text-2xl font-bold truncate">
                {data.channelName}
              </h1>
              <p className="text-yt-text-muted text-sm mt-0.5">{data.channelHandle}</p>
            </div>
          </div>

          <VideoFilters
            allCategories={channel?.categories || []}
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

          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2 flex-wrap">
              <div className="relative flex-1 min-w-[160px] max-w-xs">
                <Search size={14} className="absolute start-3 top-1/2 -translate-y-1/2 pointer-events-none text-yt-text-muted" />
                <input
                  type="text"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search videos..."
                  className="w-full ps-9 pe-8 py-2 text-xs rounded-lg border border-yt-border/40 bg-yt-bg-tertiary/50 text-yt-text-secondary outline-none focus:ring-2 focus:ring-yt-accent"
                />
                {search && (
                  <button
                    onClick={() => setSearch('')}
                    className="absolute end-2 top-1/2 -translate-y-1/2 text-yt-text-muted hover:text-yt-text"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            </div>
          </div>

          {processedVideos.length > 0 ? (
            <>
              <div className="flex items-center justify-between px-0.5">
                <p className="text-xs text-yt-text-muted">
                  {search
                    ? `${processedVideos.length} of ${data.videos.length} videos`
                    : `${processedVideos.length} videos`
                  }
                </p>
              </div>
              <div className={listMode ? 'space-y-3' : 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5'}>
                {processedVideos.map(video => (
                  <VideoCard
                    key={video.videoId}
                    video={video}
                    list={listMode}
                    ranks={{ viewsRank: video._viewsRank, likesRank: video._likesRank }}
                    onPlay={(id) => setPlaying(id)}
                    onChannelClick={onBack}
                  />
                ))}
              </div>
            </>
          ) : (
            <div className="text-center text-yt-text-muted py-20 text-sm">
              {search ? 'No videos match your search.' : 'No videos found.'}
            </div>
          )}
        </>
      )}

      {playing && (
        <VideoPlayerModal
          videoId={playing}
          onClose={() => setPlaying(null)}
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
