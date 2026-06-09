import { useEffect, useState, useMemo } from 'react';
import { ExternalLink, Eye, Film, LayoutGrid, List, Trophy, Heart, BarChart3, MessageCircle, ThumbsDown, Clock, TrendingUp } from 'lucide-react';
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

function dislikePercentage(likes, dislikes) {
  const l = parseInt(likes, 10);
  const d = parseInt(dislikes, 10);
  if (!l && !d) return null;
  const total = l + d;
  if (!total) return null;
  return ((d / total) * 100).toFixed(1);
}

const GRID_COLUMNS = [1, 2, 3, 4];
const SORT_OPTIONS = ['newest', 'views', 'likes', 'comments', 'dislikes', 'ratio'];

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
      #{rank}
    </span>
  );
}

function VideoCard({ video, list, language, ranks }) {
  const r = ranks || {};
  const ratio = engagementRate(video.likes, video.views);
  const ago = timeAgo(video.published, language);
  const dislikePct = dislikePercentage(video.likes, video.dislikes);
  const commentsFormatted = formatViews(video.comments);
  const dislikesFormatted = formatViews(video.dislikes);

  if (list) {
    return (
      <div className="bg-yt-bg-card rounded-xl border border-yt-border shadow-sm hover:shadow-lg hover:border-yt-accent/20 transition-all duration-300 overflow-hidden flex gap-3 p-3 group">
        <div className="w-36 sm:w-44 h-20 sm:h-28 shrink-0 rounded-lg overflow-hidden bg-yt-bg-tertiary relative">
          {video.thumbnail ? (
            <img src={video.thumbnail} alt={video.title} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" loading="lazy" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-yt-text-muted/30"><Film size={24} /></div>
          )}
          {ago && (
            <span className="absolute bottom-1 right-1 bg-black/70 text-white text-[10px] px-1.5 py-0.5 rounded font-medium backdrop-blur-sm">
              <Clock size={8} className="inline mr-0.5" />
              {ago}
            </span>
          )}
        </div>
        <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5 gap-1">
          <div>
            <h3 className="text-yt-text font-semibold text-sm leading-snug line-clamp-1">{video.title || 'Untitled'}</h3>
            <p className="text-yt-text-muted text-xs mt-0.5">{video._channelName}</p>
          </div>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-yt-text-muted text-xs">
            <span className="flex items-center gap-1"><Eye size={11} /></span>
            {video.likes && <span className="flex items-center gap-1"><Heart size={11} /></span>}
            {commentsFormatted && <span className="flex items-center gap-1"><MessageCircle size={11} /></span>}
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            <RankBadge rank={r.viewsRank} label={t(language, 'rankViews')} value={video.views} />
            <RankBadge rank={r.likesRank} label={t(language, 'rankLikes')} value={video.likes} />
            {ratio && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-yt-bg-tertiary/60 text-emerald-500">
                <TrendingUp size={10} />
                {ratio}%
              </span>
            )}
            {dislikePct !== null && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-yt-bg-tertiary/60 text-red-400">
                <ThumbsDown size={10} />
                {dislikePct}%
              </span>
            )}
          </div>
          <a
            href={video.videoUrl || `https://www.youtube.com/@${video._channelHandle}`}
            target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-yt-accent/10 hover:bg-yt-accent/20 text-yt-accent text-xs font-semibold transition-all hover:scale-[1.02] active:scale-[0.98] self-start mt-0.5"
          >
            <ExternalLink size={12} />
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-yt-bg-card rounded-xl border border-yt-border shadow-sm hover:shadow-xl hover:border-yt-accent/20 transition-all duration-300 overflow-hidden flex flex-col group">
      {/* Thumbnail */}
      <div className="aspect-video bg-yt-bg-tertiary overflow-hidden relative">
        {video.thumbnail ? (
          <img src={video.thumbnail} alt={video.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" loading="lazy" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-yt-text-muted/30"><Film size={48} /></div>
        )}
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        {/* Top-left rank badge */}
        {r.viewsRank && r.viewsRank <= 3 && (
          <div className="absolute top-2 left-2 bg-yt-accent text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-lg flex items-center gap-1">
            <Trophy size={10} /> #{r.viewsRank}
          </div>
        )}

        {/* Time badge */}
        {ago && (
          <span className="absolute bottom-2 right-2 bg-black/70 text-white text-[10px] px-2 py-0.5 rounded font-medium backdrop-blur-sm flex items-center gap-1">
            <Clock size={10} />
            {ago}
          </span>
        )}
      </div>

      {/* Body */}
      <div className="p-3 md:p-4 flex flex-col gap-2.5 flex-1">
        {/* Title + channel */}
        <div className="flex-1 min-w-0">
          <h3 className="text-yt-text font-semibold text-sm leading-snug line-clamp-2 group-hover:text-yt-accent transition-colors duration-200">{video.title || 'Untitled'}</h3>
          <p className="text-yt-text-muted text-xs mt-1 flex items-center gap-1.5">
            <span className="w-4 h-4 rounded-full bg-yt-bg-tertiary flex items-center justify-center text-[8px] font-bold text-yt-text-muted">
              {(video._channelName || '?')[0].toUpperCase()}
            </span>
            {video._channelName}
          </p>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-4 gap-1.5 py-2 border-t border-b border-yt-border/30">
          <StatCell
            icon={<Eye size={12} />}
            value={formatViews(video.views) || '0'}
            label={t(language, 'rankViews')}
            highlight={r.viewsRank && r.viewsRank <= 3}
          />
          <StatCell
            icon={<Heart size={12} />}
            value={formatViews(video.likes) || '0'}
            label={t(language, 'rankLikes')}
            highlight={r.likesRank && r.likesRank <= 3}
            className="border-x border-yt-border/30"
          />
          <StatCell
            icon={<MessageCircle size={12} />}
            value={commentsFormatted || '—'}
            label={t(language, 'comments')}
          />
          <StatCell
            icon={<BarChart3 size={12} />}
            value={ratio ? `${ratio}%` : '—'}
            label={t(language, 'engagement')}
            className="text-emerald-500"
          />
        </div>

        {/* Dislike bar */}
        {dislikePct !== null && (
          <div className="space-y-1">
            <div className="flex items-center justify-between text-[10px] text-yt-text-muted">
              <span className="flex items-center gap-1">
                <ThumbsDown size={10} className="text-red-400" />
                {dislikesFormatted || '0'}
              </span>
              <span className="font-medium text-red-400">{dislikePct}%</span>
            </div>
            <div className="w-full h-1.5 bg-yt-bg-tertiary rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-green-500 to-red-500 transition-all duration-300"
                style={{ width: `${dislikePct}%` }}
              />
            </div>
          </div>
        )}

        {/* Rank badges */}
        <div className="flex flex-wrap items-center gap-1.5">
          <RankBadge rank={r.viewsRank} label={t(language, 'rankViews')} value={video.views} />
          <RankBadge rank={r.likesRank} label={t(language, 'rankLikes')} value={video.likes} />
        </div>

        {/* Action */}
        <a
          href={video.videoUrl || `https://www.youtube.com/@${video._channelHandle}`}
          target="_blank" rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-gradient-to-r from-yt-accent/10 to-yt-accent/5 hover:from-yt-accent/20 hover:to-yt-accent/10 text-yt-accent text-xs font-semibold transition-all hover:scale-[1.02] active:scale-[0.98] w-full border border-yt-accent/10 hover:border-yt-accent/20"
        >
          <ExternalLink size={13} />
        </a>
      </div>
    </div>
  );
}

function StatCell({ icon, value, label, highlight, className = '' }) {
  return (
    <div className={`flex flex-col items-center gap-0.5 ${className}`}>
      <span className={`text-xs font-bold ${highlight ? 'text-yt-accent' : 'text-yt-text'}`}>
        {value}
      </span>
      <span className="text-[10px] text-yt-text-muted flex items-center gap-0.5 whitespace-nowrap">
        {icon}
      </span>
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
      case 'comments':
        sorted = [...filtered].sort((a, b) => (parseInt(b.comments) || 0) - (parseInt(a.comments) || 0));
        break;
      case 'dislikes':
        sorted = [...filtered].sort((a, b) => (parseInt(b.dislikes) || 0) - (parseInt(a.dislikes) || 0));
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
      case 'comments': return t(language, 'sortComments');
      case 'dislikes': return t(language, 'sortDislikes');
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
