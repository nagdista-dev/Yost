import { useEffect, useState, useMemo } from 'react';
import toast from 'react-hot-toast';
import api from '../api';
import { useTheme } from '../context/useTheme';
import { t } from '../i18n';

const STORAGE_KEY = 'yt_videos_cache';

function isLikelyLive(title) {
  if (!title) return false;
  return /(?:🔴|⏺|LIVE|PREMIERE)\b/i.test(title);
}

function cacheKey(channels) {
  const handles = channels.map(c => (typeof c === 'string' ? c : c.handle).toLowerCase()).sort().join(',');
  return handles;
}

function loadCached(channels) {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const cached = JSON.parse(raw);
    if (cached.key === cacheKey(channels)) {
      return cached.data;
    }
  } catch {}
  return null;
}

function saveCache(channels, data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ key: cacheKey(channels), data }));
  } catch {}
}

export default function useVideos(channels, refreshTrigger = 0) {
  const { language } = useTheme();
  const [videos, setVideos] = useState({});
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState({ loaded: 0, total: 0 });
  const [categoryFilter, setCategoryFilter] = useState(null);
  const [sortBy, setSortBy] = useState('newest');
  const [liveFilter, setLiveFilter] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [ageFilter, setAgeFilter] = useState('all');

  const allCategories = [...new Set(channels.flatMap(ch => ch.categories || []).filter(Boolean))].sort();

  useEffect(() => {
    if (channels.length === 0) {
      setVideos({});
      setLoading(false);
      setProgress({ loaded: 0, total: 0 });
      return;
    }

    const cached = loadCached(channels);
    if (cached && refreshTrigger === 0) {
      setVideos(cached);
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function fetchAll() {
      setLoading(true);
      setProgress({ loaded: 0, total: channels.length });

      const handles = channels.map(ch => ch.handle || ch);
      const baseMap = {};
      channels.forEach(ch => {
        const handle = ch.handle || ch;
        baseMap[handle] = {
          _channelName: ch.name || handle.replace('@', ''),
          _channelHandle: handle,
          _channelCategories: ch.categories || ['Unspecified'],
        };
      });

      try {
        const { data } = await api.post('/api/latest-videos', {
          handles,
          refresh: refreshTrigger > 0,
        });

        const results = {};
        let failed = 0;

        for (const handle of handles) {
          if (cancelled) break;
          const video = data.videos?.[handle.replace('@', '')];
          const base = baseMap[handle] || {
            _channelName: handle.replace('@', ''),
            _channelHandle: handle,
            _channelCategories: ['Unspecified'],
          };

          if (video) {
            results[handle] = {
              ...video,
              ...base,
              thumbnail: video.thumbnail || `https://i.ytimg.com/vi/${video.videoId}/maxresdefault.jpg`,
            };
          } else {
            results[handle] = { ...base, _noVideo: true };
            failed++;
          }

          if (!cancelled) {
            setProgress(prev => ({ ...prev, loaded: prev.loaded + 1 }));
          }
        }

        if (failed > 0 && !cancelled) {
          toast.error(t(language, 'fetchVideosError'));
        }

        if (!cancelled) {
          setVideos(results);
          saveCache(channels, results);
        }
      } catch {
        if (!cancelled) {
          toast.error(t(language, 'fetchVideosError'));
          const fallback = {};
          channels.forEach(ch => {
            const handle = ch.handle || ch;
            fallback[handle] = {
              ...baseMap[handle],
              _noVideo: true,
            };
          });
          setVideos(fallback);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchAll();
    return () => { cancelled = true; };
  }, [channels, refreshTrigger]);

  const videoList = useMemo(() => {
    const filtered = Object.values(videos).filter(v => {
      if (categoryFilter && !(v._channelCategories || []).includes(categoryFilter)) return false;
      if (liveFilter && !v.isLive && !isLikelyLive(v.title)) return false;
      if (searchText) {
        const q = searchText.toLowerCase();
        const title = (v.title || '').toLowerCase();
        const channel = (v._channelName || v._channelHandle || '').toLowerCase();
        if (!title.includes(q) && !channel.includes(q)) return false;
      }
      if (ageFilter !== 'all' && v.published) {
        const age = Date.now() - new Date(v.published).getTime();
        const dayMs = 86400000;
        if (ageFilter === 'today' && age > dayMs) return false;
        if (ageFilter === 'week' && age > 7 * dayMs) return false;
        if (ageFilter === 'month' && age > 30 * dayMs) return false;
      }
      return true;
    });

    let sorted;
    switch (sortBy) {
      case 'views':
        sorted = [...filtered].sort((a, b) => (parseInt(b.views) || 0) - (parseInt(a.views) || 0));
        break;
      case 'likes':
        sorted = [...filtered].sort((a, b) => (parseInt(b.likes) || 0) - (parseInt(a.likes) || 0));
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
  }, [videos, categoryFilter, sortBy, liveFilter, searchText, ageFilter]);

  return {
    videos, loading, progress,
    videoList, allCategories,
    categoryFilter, setCategoryFilter,
    sortBy, setSortBy,
    liveFilter, setLiveFilter,
    searchText, setSearchText,
    ageFilter, setAgeFilter,
  };
}
