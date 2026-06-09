import { useEffect, useState, useMemo } from 'react';
import { ExternalLink, Eye, Film, LayoutGrid, List, Trophy, Heart, BarChart3 } from 'lucide-react';
import { useTheme } from '../context/useTheme';
import api from '../api';
import { t } from '../i18n';

function formatViews(raw) {
  if (!raw || raw === '0') return '';
  const n = parseInt(raw, 10);
  if (n >= 1000000) return (n / 1000000).toFixed(1).replace('.0', '') + 'M';
  if (n >= 1000) return (n / 1000).toFixed(1).replace('.0', '') + 'K';
  return n.toLocaleString();
}

function timeAgo(iso, lang) {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  const diff = Date.now() - d.getTime();
  const sec = Math.floor(diff / 1000);
  if (sec < 60) return t(lang, 'timeJustNow');
  const min = Math.floor(sec / 60);
  if (min < 60) return t(lang, 'timeMinute', min);
  const hr = Math.floor(min / 60);
  if (hr < 24) return t(lang, 'timeHour', hr);
  const day = Math.floor(hr / 24);
  if (day < 7) return t(lang, 'timeDay', day);
  const week = Math.floor(day / 7);
  if (week < 5) return t(lang, 'timeWeek', week);
  const month = Math.floor(day / 30);
  if (month < 12) return t(lang, 'timeMonth', month);
  const year = Math.floor(day / 365);
  return t(lang, 'timeYear', year);
}

function engagementRate(likes, views) {
  const l = parseInt(likes, 10);
  const v = parseInt(views, 10);
  if (!v || !l) return null;
  return ((l / v) * 100).toFixed(1);
}

const GRID_COLUMNS = [1, 2, 3, 4];
const SORT_OPTIONS = ['newest', 'views', 'likes', 'ratio'];

function VideoSkeleton({ list }) {
  return (
    <div className={`bg-yt-bg-card rounded-2xl border border-yt-border overflow-hidden animate-pulse ${list ? 'flex gap-4 p-3' : ''}`}>
      <div className={`bg-yt-bg-tertiary ${list ? 'w-40 h-24 shrink-0 rounded-xl' : 'aspect-video'}`} />
      <div className={`space-y-2 ${list ? 'flex-1 py-1' : 'p-4'}`}>
        <div className="h-4 bg-yt-bg-tertiary rounded w-3/4" />
        <div className="h-3 bg-yt-bg-tertiary rounded w-1/2" />
        <div className="flex gap-4 mt-3">
          <div className="h-3 bg-yt-bg-tertiary rounded w-16" />
          <div className="h-3 bg-yt-bg-tertiary rounded w-16" />
        </div>
      </div>
    </div>
  );
}

function RankBadge({ rank, label, value }) {
  if (!rank || !value) return null;
  return (
    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-yt-bg-tertiary/60 text-yt-text-secondary">
      <Trophy size={10} className={rank <= 3 ? 'text-yt-accent' : 'text-yt-text-muted/50'} />
      {label} #{rank}
    </span>
  );
}

function VideoCard({ video, list, language, ranks }) {
  const r = ranks || {};
  const ratio = engagementRate(video.likes, video.views);
  const ago = timeAgo(video.published, language);

  if (list) {
    return (
      <div className="bg-yt-bg-card rounded-2xl border border-yt-border shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden flex gap-3 p-3">
        <div className="w-40 h-24 shrink-0 rounded-xl overflow-hidden bg-yt-bg-tertiary relative">
          {video.thumbnail ? (
            <img src={video.thumbnail} alt={video.title} className="w-full h-full object-cover" loading="lazy" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-yt-text-muted/30"><Film size={24} /></div>
          )}
          {ago && (
            <span className="absolute bottom-1 right-1 bg-yt-bg/80 text-yt-text text-[10px] px-1.5 py-0.5 rounded font-medium">
              {ago}
            </span>
          )}
        </div>
        <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
          <div>
            <h3 className="text-yt-text font-semibold text-sm leading-snug line-clamp-1">{video.title || 'Untitled'}</h3>
            <p className="text-yt-text-muted text-xs mt-0.5">{video._channelName}</p>
          </div>
          <div className="flex flex-wrap items-center gap-1.5 mt-1">
            <RankBadge rank={r.viewsRank} label={t(language, 'rankViews')} value={video.views} />
            <RankBadge rank={r.likesRank} label={t(language, 'rankLikes')} value={video.likes} />
            {ratio && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-yt-bg-tertiary/60 text-yt-accent">
                <BarChart3 size={10} />
                {ratio}%
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 text-yt-text-muted text-xs flex-wrap mt-1">
            <span className="flex items-center gap-1"><Eye size={11} />{formatViews(video.views) || '0'}</span>
            {video.likes && <><span className="text-yt-text-muted/30">·</span><span className="flex items-center gap-1"><Heart size={11} />{formatViews(video.likes)}</span></>}
          </div>
          <a
            href={video.videoUrl || `https://www.youtube.com/@${video._channelHandle}`}
            target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-yt-accent/10 hover:bg-yt-accent/20 text-yt-accent text-xs font-semibold transition-all hover:scale-[1.02] active:scale-[0.98] self-start mt-1"
          >
            <ExternalLink size={12} />
            {t(language, 'watchOnYouTube')}
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-yt-bg-card rounded-2xl border border-yt-border shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden flex flex-col group">
      {/* Thumbnail */}
      <div className="aspect-video bg-yt-bg-tertiary overflow-hidden relative">
        {video.thumbnail ? (
          <img src={video.thumbnail} alt={video.title} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" loading="lazy" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-yt-text-muted/30"><Film size={48} /></div>
        )}
        {ago && (
          <span className="absolute bottom-1.5 right-1.5 bg-yt-bg/80 text-yt-text text-[10px] px-1.5 py-0.5 rounded font-medium backdrop-blur-sm">
            {ago}
          </span>
        )}
      </div>

      {/* Body */}
      <div className="p-3 md:p-4 flex flex-col gap-2 flex-1">
        {/* Title + channel */}
        <div className="flex-1">
          <h3 className="text-yt-text font-semibold text-sm leading-snug line-clamp-2">{video.title || 'Untitled'}</h3>
          <p className="text-yt-text-muted text-xs mt-0.5">{video._channelName}</p>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-3 gap-2 py-2 border-t border-b border-yt-border/40">
          <div className="flex flex-col items-center gap-0.5">
            <span className="text-xs font-semibold text-yt-text">{formatViews(video.views) || '0'}</span>
            <span className="text-[10px] text-yt-text-muted flex items-center gap-0.5"><Eye size={10} />{t(language, 'rankViews')}</span>
          </div>
          <div className="flex flex-col items-center gap-0.5 border-x border-yt-border/40">
            <span className="text-xs font-semibold text-yt-text">{formatViews(video.likes) || '0'}</span>
            <span className="text-[10px] text-yt-text-muted flex items-center gap-0.5"><Heart size={10} />{t(language, 'rankLikes')}</span>
          </div>
          <div className="flex flex-col items-center gap-0.5">
            <span className="text-xs font-semibold text-yt-text">{ratio ? `${ratio}%` : '—'}</span>
            <span className="text-[10px] text-yt-text-muted flex items-center gap-0.5"><BarChart3 size={10} />{t(language, 'engagement')}</span>
          </div>
        </div>

        {/* Rank badges */}
        <div className="flex flex-wrap items-center gap-1.5">
          <RankBadge rank={r.viewsRank} label={t(language, 'rankViews')} value={video.views} />
          <RankBadge rank={r.likesRank} label={t(language, 'rankLikes')} value={video.likes} />
        </div>

        {/* Action */}
        <a
          href={video.videoUrl || `https://www.youtube.com/@${video._channelHandle}`}
          target="_blank" rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-2 px-3 py-1.5 rounded-lg bg-yt-accent/10 hover:bg-yt-accent/20 text-yt-accent text-xs font-semibold transition-all hover:scale-[1.02] active:scale-[0.98] w-full"
        >
          <ExternalLink size={13} />
          {t(language, 'watchOnYouTube')}
        </a>
      </div>
    </div>
  );
}

export default function VideosPage({ channels }) {
  const { language } = useTheme();
  const [videos, setVideos] = useState({});
  const [loading, setLoading] = useState(true);
  const [listMode, setListMode] = useState(false);
  const [columns, setColumns] = useState(3);
  const [categoryFilter, setCategoryFilter] = useState(null);
  const [sortBy, setSortBy] = useState('newest');

  const allCategories = [...new Set(channels.map(ch => ch.category).filter(Boolean))];

  useEffect(() => {
    if (channels.length === 0) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function fetchAll() {
      setLoading(true);
      const results = {};

      const promises = channels.map(async (ch) => {
        const handle = typeof ch === 'string' ? ch : ch.handle;
        try {
          const { data } = await api.get('/api/latest-video', { params: { channelHandle: handle } });
          if (!cancelled && data.video) {
            results[handle] = {
              ...data.video,
              _channelName: ch.name || ch.handle.replace('@', ''),
              _channelHandle: handle,
              _channelCategory: ch.category,
            };
          }
        } catch {
          // silently skip failed channels
        }
      });

      await Promise.allSettled(promises);

      if (!cancelled) {
        setVideos(results);
        setLoading(false);
      }
    }

    fetchAll();

    return () => { cancelled = true; };
  }, [channels]);

  const videoList = useMemo(() => {
    const filtered = Object.values(videos).filter(v => !categoryFilter || v._channelCategory === categoryFilter);

    let sorted;
    switch (sortBy) {
      case 'views':
        sorted = [...filtered].sort((a, b) => (parseInt(b.views) || 0) - (parseInt(a.views) || 0));
        break;
      case 'likes':
        sorted = [...filtered].sort((a, b) => (parseInt(b.likes) || 0) - (parseInt(a.likes) || 0));
        break;
      case 'ratio': {
        const ratio = (v) => {
          const l = parseInt(v.likes, 10);
          const w = parseInt(v.views, 10);
          return w ? l / w : 0;
        };
        sorted = [...filtered].sort((a, b) => ratio(b) - ratio(a));
        break;
      }
      default:
        sorted = [...filtered].sort((a, b) => {
          const da = a.published ? new Date(a.published).getTime() : 0;
          const db = b.published ? new Date(b.published).getTime() : 0;
          return db - da;
        });
    }

    // Compute rankings within the filtered set
    const byViews = [...sorted].sort((a, b) => (parseInt(b.views) || 0) - (parseInt(a.views) || 0));
    const byLikes = [...sorted].sort((a, b) => (parseInt(b.likes) || 0) - (parseInt(a.likes) || 0));

    const viewsRankMap = {};
    const likesRankMap = {};
    byViews.forEach((v, i) => { viewsRankMap[v.videoId] = i + 1; });
    byLikes.forEach((v, i) => { likesRankMap[v.videoId] = i + 1; });

    return sorted.map(v => ({
      ...v,
      _viewsRank: viewsRankMap[v.videoId] || null,
      _likesRank: likesRankMap[v.videoId] || null,
    }));
  }, [videos, categoryFilter, sortBy]);

  if (channels.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[40vh] text-yt-text-muted">
        <p className="text-lg md:text-xl" style={{ fontSize: 'var(--font-size-lg)' }}>{t(language, 'noChannels')}</p>
      </div>
    );
  }

  const gridCols = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
  };

  const sortLabel = (key) => {
    switch (key) {
      case 'newest': return t(language, 'sortNewest');
      case 'views': return t(language, 'sortViews');
      case 'likes': return t(language, 'sortLikes');
      case 'ratio': return t(language, 'sortRatio');
      default: return key;
    }
  };

  return (
    <div className="space-y-4 md:space-y-5">
      {/* Filters bar */}
      <div className="flex items-center gap-3 flex-wrap">
        {allCategories.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            <button
              onClick={() => setCategoryFilter(null)}
              className={`px-3 py-1.5 text-xs rounded-lg border transition ${!categoryFilter ? 'bg-yt-accent text-white border-yt-accent' : 'bg-yt-bg-tertiary/50 text-yt-text-secondary border-yt-border/40 hover:border-yt-accent/50'}`}
            >
              {t(language, 'allCategories')}
            </button>
            {allCategories.map(cat => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`px-3 py-1.5 text-xs rounded-lg border transition ${categoryFilter === cat ? 'bg-yt-accent text-white border-yt-accent' : 'bg-yt-bg-tertiary/50 text-yt-text-secondary border-yt-border/40 hover:border-yt-accent/50'}`}
              >
                {cat === 'Unspecified' ? t(language, 'unspecified') : cat}
              </button>
            ))}
          </div>
        )}

        {/* Sort dropdown */}
        <select
          value={sortBy}
          onChange={e => setSortBy(e.target.value)}
          className="px-2.5 py-1.5 text-xs rounded-lg border border-yt-border/40 bg-yt-bg-tertiary/50 text-yt-text-secondary outline-none focus:ring-2 focus:ring-yt-accent appearance-none cursor-pointer"
          style={{ backgroundImage: 'none' }}
        >
          {SORT_OPTIONS.map(key => (
            <option key={key} value={key}>{sortLabel(key)}</option>
          ))}
        </select>

        <div className="ml-auto flex items-center gap-1 bg-yt-bg-tertiary/50 rounded-lg p-0.5 border border-yt-border/40">
          {!listMode && GRID_COLUMNS.map(n => (
            <button
              key={n}
              onClick={() => setColumns(n)}
              className={`px-2 py-1 rounded-md text-xs font-medium transition ${columns === n ? 'bg-yt-accent text-white' : 'text-yt-text-secondary hover:text-yt-text'}`}
              title={`${n} cols`}
            >
              {n}
            </button>
          ))}
          <span className="w-px h-4 bg-yt-border/40 mx-0.5" />
          <button
            onClick={() => setListMode(false)}
            className={`p-1.5 rounded-md transition ${!listMode ? 'bg-yt-accent text-white' : 'text-yt-text-secondary hover:text-yt-text'}`}
            title="Grid"
          >
            <LayoutGrid size={16} />
          </button>
          <button
            onClick={() => setListMode(true)}
            className={`p-1.5 rounded-md transition ${listMode ? 'bg-yt-accent text-white' : 'text-yt-text-secondary hover:text-yt-text'}`}
            title="List"
          >
            <List size={16} />
          </button>
        </div>
      </div>

      {loading ? (
        <div className={listMode ? 'space-y-3' : `grid ${gridCols[columns]} gap-4 md:gap-5`}>
          {Array.from({ length: Math.min(channels.length, 6) }).map((_, i) => (
            <VideoSkeleton key={i} list={listMode} />
          ))}
        </div>
      ) : videoList.length === 0 ? (
        <div className="text-center text-yt-text-muted py-16">
          <Film size={48} className="mx-auto mb-3 opacity-40" />
          <p className="text-lg" style={{ fontSize: 'var(--font-size-lg)' }}>{t(language, 'noVideos')}</p>
        </div>
      ) : (
        <>
          <p className="text-xs text-yt-text-muted">{t(language, 'showingVideos', videoList.length)}</p>
          <div className={listMode ? 'space-y-3' : `grid ${gridCols[columns]} gap-4 md:gap-5`}>
            {videoList.map((video) => (
              <VideoCard
                key={video.videoId}
                video={video}
                list={listMode}
                language={language}
                ranks={{ viewsRank: video._viewsRank, likesRank: video._likesRank }}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
