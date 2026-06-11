import { useState, useEffect, useMemo, useCallback } from 'react';
import { ArrowLeft, Play, CheckCircle2, Circle, ExternalLink, ListMusic, Clock, Eye } from 'lucide-react';
import { useTheme } from '../context/useTheme';
import { t } from '../i18n';
import api from '../api';

const PROGRESS_KEY = 'yt_feed_playlist_progress';

function loadProgress() {
  try {
    return JSON.parse(localStorage.getItem(PROGRESS_KEY) || '{}');
  } catch { return {}; }
}

function saveProgress(progress) {
  localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
}

function fmt(sec) {
  if (!sec) return '';
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

function timeAgo(dateStr) {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return t('en', 'justNow');
  if (mins < 60) return t('en', 'timeMinute', mins);
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return t('en', 'timeHour', hrs);
  const days = Math.floor(hrs / 24);
  if (days < 7) return t('en', 'timeDay', days);
  if (days < 30) return t('en', 'timeWeek', Math.floor(days / 7));
  return t('en', 'timeMonth', Math.floor(days / 30));
}

export default function PlaylistPage({ playlist, onBack }) {
  const { language } = useTheme();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(loadProgress);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    async function fetchData() {
      setLoading(true);
      setError(null);
      try {
        const { data: plData } = await api.get('/api/playlist-videos', { params: { playlistId: playlist.playlistId } });
        if (!cancelled) setData(plData);
      } catch {
        if (!cancelled) setError('Failed to load playlist');
      }
      if (!cancelled) setLoading(false);
    }
    fetchData();
    return () => { cancelled = true; };
  }, [playlist.playlistId]);

  const watchedSet = useMemo(() => {
    return new Set(progress[playlist.playlistId] || []);
  }, [progress, playlist.playlistId]);

  const stats = useMemo(() => {
    if (!data?.videos) return { total: 0, watched: 0, totalViews: 0, totalLength: 0 };
    const total = data.videos.length;
    const watched = data.videos.filter(v => watchedSet.has(v.videoId)).length;
    const totalLength = data.videos.reduce((sum, v) => sum + (parseInt(v.length) || 0), 0);
    return { total, watched, totalLength, progressPct: total ? Math.round((watched / total) * 100) : 0 };
  }, [data, watchedSet]);

  function toggleWatched(videoId) {
    setProgress(prev => {
      const list = prev[playlist.playlistId] || [];
      const updated = list.includes(videoId) ? list.filter(id => id !== videoId) : [...list, videoId];
      const next = { ...prev, [playlist.playlistId]: updated };
      saveProgress(next);
      return next;
    });
  }

  function markAllWatched() {
    if (!data?.videos) return;
    setProgress(prev => {
      const allIds = data.videos.map(v => v.videoId);
      const next = { ...prev, [playlist.playlistId]: allIds };
      saveProgress(next);
      return next;
    });
  }

  function markAllUnwatched() {
    setProgress(prev => {
      const next = { ...prev };
      delete next[playlist.playlistId];
      saveProgress(next);
      return next;
    });
  }

  const latestVideo = useMemo(() => {
    if (!data?.videos || data.videos.length === 0) return null;
    return data.videos.reduce((latest, v) => {
      const la = latest.published ? new Date(latest.published).getTime() : 0;
      const va = v.published ? new Date(v.published).getTime() : 0;
      return va > la ? v : latest;
    });
  }, [data]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-6 h-6 border-2 border-yt-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="text-center py-20 text-yt-text-muted">
        <p>{error || 'Failed to load playlist'}</p>
        <button onClick={onBack} className="mt-4 text-yt-accent hover:underline text-sm">{t(language, 'cancel')}</button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <button
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-yt-text-secondary hover:text-yt-text text-sm font-medium transition"
      >
        <ArrowLeft size={16} />
        {t(language, 'tabPlaylists')}
      </button>

      <div className="bg-yt-bg-card rounded-xl border border-yt-border p-5 md:p-6">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-xl bg-yt-accent/15 flex items-center justify-center text-yt-accent shrink-0">
            <ListMusic size={24} fill="currentColor" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-yt-text text-xl font-bold">{data.name || playlist.name || playlist.playlistId}</h1>
            {data.channelName && (
              <p className="text-yt-text-secondary text-sm mt-0.5">{data.channelName}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-5">
          <div className="bg-yt-bg-tertiary/30 rounded-lg p-3 text-center">
            <p className="text-yt-text-muted text-xs">{t(language, 'totalVideos')}</p>
            <p className="text-yt-text text-lg font-bold mt-0.5">{stats.total}</p>
          </div>
          <div className="bg-yt-bg-tertiary/30 rounded-lg p-3 text-center">
            <p className="text-yt-text-muted text-xs">{t(language, 'watched')}</p>
            <p className="text-yt-text text-lg font-bold mt-0.5">{stats.watched}</p>
          </div>
          <div className="bg-yt-bg-tertiary/30 rounded-lg p-3 text-center">
            <p className="text-yt-text-muted text-xs">{t(language, 'totalLength')}</p>
            <p className="text-yt-text text-lg font-bold mt-0.5">{fmt(stats.totalLength)}</p>
          </div>
          <div className="bg-yt-bg-tertiary/30 rounded-lg p-3 text-center">
            <p className="text-yt-text-muted text-xs">{t(language, 'progress')}</p>
            <p className="text-yt-text text-lg font-bold mt-0.5">{stats.progressPct}%</p>
          </div>
        </div>

        <div className="mt-4">
          <div className="w-full h-2 bg-yt-bg-tertiary rounded-full overflow-hidden">
            <div
              className="h-full bg-yt-accent rounded-full transition-all duration-500"
              style={{ width: `${stats.progressPct}%` }}
            />
          </div>
        </div>

        <div className="flex gap-2 mt-4">
          <button
            onClick={markAllWatched}
            className="text-xs px-3 py-1.5 rounded-lg bg-yt-accent/10 text-yt-accent hover:bg-yt-accent/20 font-medium transition"
          >
            {t(language, 'markAllWatched')}
          </button>
          <button
            onClick={markAllUnwatched}
            className="text-xs px-3 py-1.5 rounded-lg bg-yt-bg-tertiary/50 text-yt-text-secondary hover:text-yt-text font-medium transition"
          >
            {t(language, 'markAllUnwatched')}
          </button>
        </div>
      </div>

      <div className="space-y-2">
        {data.videos.map((video, idx) => {
          const watched = watchedSet.has(video.videoId);
          return (
            <div
              key={video.videoId}
              className={`bg-yt-bg-card rounded-xl border transition cursor-pointer hover:shadow-sm ${
                watched ? 'border-yt-accent/20 opacity-75' : 'border-yt-border'
              }`}
              onClick={() => toggleWatched(video.videoId)}
            >
              <div className="flex items-center gap-3 p-3 md:p-4">
                <div className="relative w-20 md:w-28 aspect-video rounded-lg overflow-hidden bg-yt-bg-tertiary shrink-0">
                  {video.thumbnail && (
                    <img src={video.thumbnail} alt="" className="w-full h-full object-cover" loading="lazy" />
                  )}
                  {video.length && (
                    <span className="absolute bottom-1 end-1 bg-black/80 text-white text-[10px] px-1 py-0.5 rounded font-medium">
                      {fmt(video.length)}
                    </span>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start gap-2">
                    <span className="text-yt-text-muted text-xs font-mono mt-0.5 shrink-0">#{video.position || idx + 1}</span>
                    <div className="min-w-0">
                      <h3 className={`text-sm leading-snug line-clamp-2 ${watched ? 'text-yt-text-muted line-through' : 'text-yt-text'}`}>
                        {video.title}
                      </h3>
                      <div className="flex items-center gap-3 mt-1 text-yt-text-muted text-xs">
                        {video.published && (
                          <span className="flex items-center gap-1">
                            <Clock size={10} />
                            {timeAgo(video.published)}
                          </span>
                        )}
                        {video.views && (
                          <span className="flex items-center gap-1">
                            <Eye size={10} />
                            {parseInt(video.views).toLocaleString()}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="shrink-0">
                  {watched ? (
                    <CheckCircle2 size={20} className="text-yt-accent" />
                  ) : (
                    <Circle size={20} className="text-yt-text-muted/40" />
                  )}
                </div>

                <a
                  href={`https://www.youtube.com/watch?v=${video.videoId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={e => e.stopPropagation()}
                  className="shrink-0 p-2 rounded-lg text-yt-text-muted hover:text-yt-accent hover:bg-yt-bg-tertiary transition"
                >
                  <ExternalLink size={14} />
                </a>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
