import { useEffect, useReducer, useCallback, useMemo, useRef, useState } from 'react';
import { RefreshCw, Database, ChevronUp, Search } from 'lucide-react';
import PostCard from './PostCard';
import LoadingSkeleton from './LoadingSkeleton';
import toast from 'react-hot-toast';
import { useTheme } from '../context/useTheme';
import api from '../api';
import { t } from '../i18n';

const PAGE_LOAD_TIME = Date.now();
const POST_CACHE_KEY = 'yt_feed_posts_cache';

// ─── Local post cache (localStorage) ─────────────────────────────────────────
function loadPostCache() {
  try {
    const raw = localStorage.getItem(POST_CACHE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function savePostCache(cacheObj) {
  try {
    localStorage.setItem(POST_CACHE_KEY, JSON.stringify(cacheObj));
  } catch {
    // localStorage full – ignore
  }
}

function getPostCache(handleLower, postCache) {
  return postCache[handleLower] || null;
}

// ─── Reducer ──────────────────────────────────────────────────────────────────
function feedReducer(state, action) {
  switch (action.type) {
    case 'FETCH_START': {
      const activeKeys = new Set(action.activeHandles.map(h => h.replace('@', '').toLowerCase()));
      const cleanedData = {};
      Object.entries(state.channelData).forEach(([channel, data]) => {
        const cleanC = channel.replace('@', '').toLowerCase();
        if (activeKeys.has(cleanC)) {
          cleanedData[channel] = data;
        }
      });
      return { ...state, channelData: cleanedData, loading: true };
    }
    case 'FETCH_CHANNEL_DONE':
      return {
        ...state,
        channelData: {
          ...state.channelData,
          [action.channel]: action.data,
        },
      };
    case 'FETCH_ALL_DONE':
      return { ...state, loading: false };
    default:
      return state;
  }
}

/** Format a Unix timestamp (ms) as "X min ago" or "X hr ago" */
function formatAge(fetchedAt, language) {
  if (!fetchedAt) return null;
  const diffMs = Date.now() - fetchedAt;
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return t(language, 'justNow');
  if (diffMin < 60) return t(language, 'minAgo', diffMin);
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return t(language, 'hrAgo', diffHr);
  return t(language, 'dAgo', Math.floor(diffHr / 24));
}

export default function HomePage({ channels, refreshTrigger, onRefreshAll, emptyMessage }) {
  const postCacheRef = useRef(loadPostCache());
  const loadIdRef = useRef(0);

  // Seed initial state from localStorage so posts appear instantly (SWR)
  const initialState = useMemo(() => {
    if (channels.length === 0) return { channelData: {}, loading: false };
    const seeded = {};
    let anySeeded = false;
    channels.forEach(ch => {
      const handle = (typeof ch === 'string' ? ch : ch.handle).replace('@', '').toLowerCase();
      const entry = getPostCache(handle, postCacheRef.current);
      if (entry) {
        seeded[entry.handle] = entry.data;
        anySeeded = true;
      }
    });
    // loading=true so the background fetch still runs; if nothing seeded, spinner shows
    return { channelData: seeded, loading: !anySeeded };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // run once on mount

  const [{ channelData, loading }, dispatch] = useReducer(feedReducer, initialState);
  const { language } = useTheme();

  function getHandle(ch) {
    return typeof ch === 'string' ? ch : ch.handle;
  }

  const fetchChannel = useCallback(async (ch, forceRefresh = false) => {
    const handle = getHandle(ch);
    try {
      const params = { channelHandle: handle };
      if (forceRefresh) params.refresh = 'true';
      const { data } = await api.get('/api/posts', { params });
      return { channel: handle, data, error: null };
    } catch (err) {
      const msg = err.response?.data?.error || err.message;
      return { channel: handle, data: null, error: msg };
    }
  }, []);

  const loadChannels = useCallback((forceRefresh = false) => {
    if (channels.length === 0) return;

    const activeHandles = channels.map(ch => getHandle(ch));
    dispatch({ type: 'FETCH_START', activeHandles });

    const currentLoadId = ++loadIdRef.current;
    let activeFetches = channels.length;
    const failedChannels = [];

    channels.forEach(async (ch) => {
      const { channel, data, error } = await fetchChannel(ch, forceRefresh);

      // If a new load cycle has started, discard this result to prevent race conditions
      if (currentLoadId !== loadIdRef.current) return;

      const handleKey = channel.replace('@', '').toLowerCase();
      let resolvedData = data;

      if (error) {
        // Fall back to stale localStorage data rather than showing an error
        const stale = postCacheRef.current[handleKey];
        if (stale) {
          resolvedData = { ...stale.data, fromCache: true, stale: true, fetchedAt: stale.fetchedAt };
        } else {
          resolvedData = { error };
          failedChannels.push(channel);
        }
      } else {
        resolvedData = data;
        // Persist to localStorage cache
        postCacheRef.current[handleKey] = { handle: channel, data, fetchedAt: Date.now() };
        savePostCache(postCacheRef.current);
      }

      dispatch({ type: 'FETCH_CHANNEL_DONE', channel, data: resolvedData });

      activeFetches--;
      if (activeFetches === 0) {
        if (failedChannels.length > 0) {
          toast.error(
            failedChannels.length === 1
              ? t(language, 'fetchFailed', failedChannels[0])
              : `Failed to fetch ${failedChannels.length} channels`,
            { id: 'fetch-error' }
          );
        }
        dispatch({ type: 'FETCH_ALL_DONE' });
      }
    });
  }, [channels, fetchChannel, language]);

  useEffect(() => {
    loadChannels(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [channels, refreshTrigger]);

  // Retry once after background scrapes complete (no cache found initially)
  useEffect(() => {
    if (loading) return;
    const hasEmptyUncached = Object.values(channelData).some(
      d => d && d.fromCache === false && d.posts && d.posts.length === 0
    );
    if (!hasEmptyUncached) return;
    const timer = setTimeout(() => loadChannels(false), 10000);
    return () => clearTimeout(timer);
  }, [loading, channelData, loadChannels]);

  // ── Scroll to top ──────────────────────────────────────────────────
  const [showScrollTop, setShowScrollTop] = useState(false);
  useEffect(() => {
    const onScroll = () => setShowScrollTop(window.scrollY > 400);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const [postSearch, setPostSearch] = useState('');

  // How many channels are served from cache
  const cacheInfo = useMemo(() => {
    const fromCache = Object.values(channelData).filter(d => d?.fromCache);
    if (fromCache.length === 0) return null;
    const oldest = Math.min(...fromCache.map(d => d.fetchedAt).filter(Boolean));
    return { count: fromCache.length, oldestFetchedAt: oldest };
  }, [channelData]);

  const allPosts = useMemo(() => {
    const result = [];
    Object.entries(channelData).forEach(([channel, data]) => {
      if (data && data.posts) {
        const chObj = channels.find(c => {
          const cleanH = (typeof c === 'string' ? c : c.handle).replace('@', '').toLowerCase();
          const cleanC = channel.replace('@', '').toLowerCase();
          return cleanH === cleanC;
        });
        if (!chObj) return;

        const displayName = chObj?.name || data.channelName || channel;

        data.posts.forEach(post => {
          result.push({
            ...post,
            _channelKey: channel,
            _channelName: displayName,
            _channelAvatar: data.channelAvatar || '',
          });
        });
      }
    });

    function parseRelativeDate(str) {
      if (!str) return 0;
      const lower = str.toLowerCase();
      const match = lower.match(/(\d+)\s*(second|minute|hour|day|week|month|year)s?\s*ago/);
      if (!match) return PAGE_LOAD_TIME;
      const num = parseInt(match[1], 10);
      const unit = match[2];
      const ms = {
        second: 1000,
        minute: 60000,
        hour: 3600000,
        day: 86400000,
        week: 604800000,
        month: 2592000000,
        year: 31536000000,
      }[unit] || 0;
      return PAGE_LOAD_TIME - num * ms;
    }

    result.sort((a, b) => parseRelativeDate(b.date) - parseRelativeDate(a.date));
    return result;
  }, [channelData, channels]);

  const filteredPosts = useMemo(() => {
    if (!postSearch.trim()) return allPosts;
    const q = postSearch.trim().toLowerCase();
    return allPosts.filter(p =>
      (p.text && p.text.toLowerCase().includes(q)) ||
      (p._channelName && p._channelName.toLowerCase().includes(q))
    );
  }, [allPosts, postSearch]);

  if (channels.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[40vh] text-yt-text-muted">
        <p className="text-lg md:text-xl" style={{ fontSize: 'var(--font-size-lg)' }}>{emptyMessage || t(language, 'noChannels')}</p>
      </div>
    );
  }

  // Show spinner only when we have no posts at all to display yet
  if (loading && allPosts.length === 0) return <LoadingSkeleton />;

  if (allPosts.length === 0) {
    return (
      <div className="text-center text-yt-text-muted py-16 md:py-24">
        {Object.values(channelData).some(d => d.error) ? (
          <>
            <p className="text-lg mb-2" style={{ fontSize: 'var(--font-size-lg)' }}>{t(language, 'loadError')}</p>
            <p className="text-sm" style={{ fontSize: 'var(--font-size-sm)' }}>{t(language, 'loadErrorHint')}</p>
          </>
        ) : (
          <p className="text-lg" style={{ fontSize: 'var(--font-size-lg)' }}>{t(language, 'noPosts')}</p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-5">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        {/* Cache / loading badge */}
        {loading ? (
          <div className="flex items-center gap-1.5 text-xs text-yt-text-muted bg-yt-bg-tertiary px-3 py-1.5 rounded-full animate-pulse">
            <RefreshCw size={12} className="text-yt-accent animate-spin" />
            <span>{t(language, 'updating')}</span>
          </div>
        ) : cacheInfo ? (
          <div className="flex items-center gap-1.5 text-xs text-yt-text-muted bg-yt-bg-tertiary px-3 py-1.5 rounded-full">
            <Database size={12} className="text-yt-accent" />
            <span>{t(language, 'cached', formatAge(cacheInfo.oldestFetchedAt, language))}</span>
          </div>
        ) : (
          <div />
        )}

        <button
          onClick={() => loadChannels(true)}
          disabled={loading}
          className="ml-auto bg-yt-bg-tertiary hover:bg-yt-border text-yt-accent px-4 py-2 rounded-lg text-sm font-medium transition inline-flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          {t(language, 'refreshAll')}
        </button>
      </div>

      {/* Post search */}
      <div className="relative">
        <Search size={16} className={`absolute ${language === 'ar' ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 text-yt-text-muted`} />
        <input
          value={postSearch}
          onChange={e => setPostSearch(e.target.value)}
          placeholder={t(language, 'searchPosts')}
          className={`w-full bg-yt-input text-yt-text rounded-lg py-2.5 text-sm outline-none focus:ring-2 focus:ring-yt-accent placeholder-yt-text-muted ${language === 'ar' ? 'pr-10 pl-3' : 'pl-10 pr-3'}`}
        />
      </div>

      {/* Post count */}
      <p className="text-xs text-yt-text-muted">{t(language, 'showingPosts', filteredPosts.length)}</p>

      {filteredPosts.map((post, i) => (
        <PostCard
          key={`${post._channelKey}-${i}`}
          post={post}
          channelName={post._channelName}
          channelAvatar={post._channelAvatar}
        />
      ))}

      {showScrollTop && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="fixed bottom-6 end-6 z-40 w-12 h-12 rounded-full bg-yt-accent text-white shadow-lg flex items-center justify-center hover:scale-110 active:scale-95 transition-all"
          aria-label={t(language, 'scrollToTop')}
        >
          <ChevronUp size={22} />
        </button>
      )}
    </div>
  );
}
