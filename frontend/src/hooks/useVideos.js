import { useEffect, useState, useMemo } from 'react';
import toast from 'react-hot-toast';
import api from '../api';
import { useTheme } from '../context/useTheme';
import { t } from '../i18n';

const STORAGE_KEY = 'yt_videos_cache';
const CHANNEL_ID_CACHE_KEY = 'yt_channel_id_cache';

const CORS_PROXIES = [
  (url) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
  (url) => `https://corsproxy.io/?${encodeURIComponent(url)}`,
];

function loadChannelIdCache() {
  try { return JSON.parse(localStorage.getItem(CHANNEL_ID_CACHE_KEY) || '{}'); } catch { return {}; }
}

function saveChannelIdCache(cache) {
  try { localStorage.setItem(CHANNEL_ID_CACHE_KEY, JSON.stringify(cache)); } catch {}
}

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

function findChannelIdInHtml(html) {
  const patterns = [
    /channel_id=(UC[\w-]+)/,
    /"channelId"\s*:\s*"(UC[\w-]+)"/,
    /\/channel\/(UC[\w-]+)/,
    /"externalId"\s*:\s*"(UC[\w-]+)"/,
    /"browseId"\s*:\s*"(UC[\w-]+)"/,
  ];
  for (const p of patterns) {
    const m = html.match(p);
    if (m) return m[1];
  }
  const canon = html.match(/<link\s+rel="canonical"\s+href="[^"]*\/channel\/(UC[\w-]+)"/i);
  if (canon) return canon[1];
  return null;
}

function parseRssEntry(entryXml) {
  const videoIdM = entryXml.match(/<[^:>]*:?videoId[^>]*>([^<]+)<\/[^>]*:?videoId[^>]*>/);
  if (!videoIdM) return null;
  const videoId = videoIdM[1].trim();
  const titleM = entryXml.match(/<title[^>]*>([^<]+)<\/title>/);
  const pubM = entryXml.match(/<published[^>]*>([^<]+)<\/published>/);
  const viewsM = entryXml.match(/media:statistics\s+views="(\d+)"/i);
  const durM = entryXml.match(/media:content[^>]*\bduration="(\d+)"/i);
  const title = titleM ? titleM[1].trim() : '';
  return {
    videoId,
    title,
    published: pubM ? pubM[1].trim() : '',
    views: viewsM ? viewsM[1] : '',
    length: durM ? durM[1] : '',
    thumbnail: `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`,
    videoUrl: `https://www.youtube.com/watch?v=${videoId}`,
    isLive: isLikelyLive(title),
  };
}

async function fetchAsText(url, signal) {
  const rsp = await fetch(url, { signal, credentials: 'omit' });
  if (!rsp.ok) return null;
  return rsp.text();
}

async function tryProxies(url, signal, timeoutMs = 10000) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  const mergedSignal = signal ? combineSignals(signal, controller.signal) : controller.signal;

  const attempts = [];

  attempts.push(
    fetchAsText(`/yt${new URL(url).pathname}${new URL(url).search}`, mergedSignal)
  );

  for (const proxy of CORS_PROXIES) {
    attempts.push(fetchAsText(proxy(url), mergedSignal));
  }

  try {
    const results = await Promise.allSettled(attempts);
    for (const result of results) {
      if (result.status === 'fulfilled' && result.value) {
        clearTimeout(timeout);
        return result.value;
      }
    }
  } finally {
    clearTimeout(timeout);
  }
  return null;
}

function combineSignals(...signals) {
  const controller = new AbortController();
  for (const s of signals) {
    if (s?.aborted) { controller.abort(); break; }
    s?.addEventListener('abort', () => controller.abort(), { once: true });
  }
  return controller.signal;
}

async function fetchChannelId(handle, signal) {
  const clean = handle.replace('@', '');
  const html = await tryProxies(`https://www.youtube.com/@${clean}`, signal, 15000);
  if (!html) return null;
  return findChannelIdInHtml(html);
}

async function fetchRssVideo(channelId, signal) {
  const xml = await tryProxies(
    `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`,
    signal, 10000
  );
  if (!xml) return null;
  const entryM = xml.match(/<entry[^>]*>([\s\S]*?)<\/entry>/);
  if (!entryM) return null;
  return parseRssEntry(entryM[1]);
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
    const abortController = new AbortController();

    async function fetchAll() {
      setLoading(true);
      setProgress({ loaded: 0, total: channels.length });
      const results = {};
      let failed = 0;
      const channelIdCache = loadChannelIdCache();
      let cacheDirty = false;

      const BATCH_SIZE = 3;

      for (let i = 0; i < channels.length; i += BATCH_SIZE) {
        if (cancelled) break;
        const batch = channels.slice(i, i + BATCH_SIZE);

        await Promise.allSettled(batch.map(async (ch) => {
          const handle = typeof ch === 'string' ? ch : ch.handle;
          const base = {
            _channelName: ch.name || ch.handle.replace('@', ''),
            _channelHandle: handle,
            _channelCategories: ch.categories || ['Unspecified'],
          };

          try {
            const cleanHandle = handle.replace('@', '');
            let channelId = channelIdCache[cleanHandle];

            if (!channelId) {
              channelId = ch.channelId || null;
              if (!channelId) {
                channelId = await fetchChannelId(handle, abortController.signal);
                if (channelId) {
                  channelIdCache[cleanHandle] = channelId;
                  cacheDirty = true;
                }
              }
            }

            let video = null;
            if (channelId) {
              video = await fetchRssVideo(channelId, abortController.signal);
            }

            if (cancelled) return;
            results[handle] = video
              ? { ...video, ...base }
              : { ...base, _noVideo: true };
          } catch {
            if (!cancelled) results[handle] = { ...base, _noVideo: true };
            failed++;
          }
          if (!cancelled) {
            setProgress(prev => ({ ...prev, loaded: prev.loaded + 1 }));
          }
        }));

        if (!cancelled && i + BATCH_SIZE < channels.length) {
          await new Promise(r => setTimeout(r, 500));
        }
      }

      if (cacheDirty) saveChannelIdCache(channelIdCache);

      if (failed > 0 && !cancelled) {
        toast.error(t(language, 'fetchVideosError'));
      }

      if (!cancelled) {
        setVideos(results);
        saveCache(channels, results);
        setLoading(false);
      }
    }

    fetchAll();
    return () => { cancelled = true; abortController.abort(); };
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
  }, [videos, categoryFilter, sortBy, liveFilter]);

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
