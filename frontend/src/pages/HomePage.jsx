import { useEffect, useCallback, useMemo, useState, useRef } from 'react';
import { RefreshCw, Tv } from 'lucide-react';
import PostCard from '../components/PostCard';
import LoadingSkeleton from '../components/LoadingSkeleton';
import CacheInfo from '../components/CacheInfo';
import PostSearch from '../components/PostSearch';
import ScrollToTop from '../components/ScrollToTop';
import toast from 'react-hot-toast';
import { useTheme } from '../context/useTheme';
import api from '../api';
import { t } from '../i18n';
import usePostCache from '../hooks/usePostCache';
import useFeedReducer from '../hooks/useFeedReducer';
import useSeenTracking from '../hooks/useSeenTracking';

const PAGE_LOAD_TIME = Date.now();

export default function HomePage({ channels, refreshTrigger, onRefreshAll, emptyMessage }) {
  const { postCacheRef, getPostCache, updateCache } = usePostCache();
  const loadIdRef = useRef(0);
  const [{ channelData, loading }, dispatch] = useFeedReducer(channels, postCacheRef, getPostCache);
  const { language } = useTheme();
  const { seenUrls, markSeen } = useSeenTracking();
  const [postSearch, setPostSearch] = useState('');

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
      if (currentLoadId !== loadIdRef.current) return;

      const handleKey = channel.replace('@', '').toLowerCase();
      let resolvedData = data;

      if (error) {
        const stale = postCacheRef.current[handleKey];
        if (stale) {
          resolvedData = { ...stale.data, fromCache: true, stale: true, fetchedAt: stale.fetchedAt };
        } else {
          resolvedData = { error };
          failedChannels.push(channel);
        }
      } else {
        resolvedData = data;
        updateCache(handleKey, channel, data);
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
  }, [channels, fetchChannel, language, dispatch, updateCache, postCacheRef]);

  useEffect(() => {
    loadChannels(false);
  }, [channels, refreshTrigger, loadChannels]);

  useEffect(() => {
    if (loading) return;
    const hasEmptyUncached = Object.values(channelData).some(
      d => d && d.fromCache === false && d.posts && d.posts.length === 0
    );
    if (!hasEmptyUncached) return;
    const timer = setTimeout(() => loadChannels(false), 10000);
    return () => clearTimeout(timer);
  }, [loading, channelData, loadChannels]);

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
      <div className="flex flex-col items-center justify-center min-h-[40vh] text-center px-4">
        <div className="w-16 h-16 rounded-2xl bg-yt-bg-tertiary flex items-center justify-center mb-4">
          <Tv size={28} className="text-yt-text-muted" />
        </div>
        <p className="text-lg md:text-xl text-yt-text-muted mb-2" style={{ fontSize: 'var(--font-size-lg)' }}>
          {emptyMessage || t(language, 'noChannels')}
        </p>
        <p className="text-sm text-yt-text-muted/70 max-w-sm" style={{ fontSize: 'var(--font-size-sm)' }}>
          {t(language, 'noChannelsHint')}
        </p>
      </div>
    );
  }

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
        <CacheInfo loading={loading} cacheInfo={cacheInfo} />
        <button
          onClick={() => loadChannels(true)}
          disabled={loading}
          className="ml-auto bg-yt-bg-tertiary hover:bg-yt-border text-yt-accent px-4 py-2 rounded-lg text-sm font-medium transition inline-flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          {t(language, 'refreshAll')}
        </button>
      </div>

      <PostSearch value={postSearch} onChange={setPostSearch} />

      <p className="text-xs text-yt-text-muted">{t(language, 'showingPosts', filteredPosts.length)}</p>

      {filteredPosts.map((post, i) => (
        <PostCard
          key={`${post._channelKey}-${i}`}
          post={post}
          channelName={post._channelName}
          channelAvatar={post._channelAvatar}
          isSeen={post.postUrl ? seenUrls.has(post.postUrl) : false}
          onMarkSeen={() => post.postUrl && markSeen(post.postUrl)}
        />
      ))}

      <ScrollToTop />
    </div>
  );
}
