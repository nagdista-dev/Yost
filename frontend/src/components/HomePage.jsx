import { useEffect, useReducer, useCallback, useMemo } from 'react';
import { RefreshCw } from 'lucide-react';
import PostCard from './PostCard';
import LoadingSkeleton from './LoadingSkeleton';
import toast from 'react-hot-toast';
import { useTheme } from '../context/useTheme';
import api from '../api';
import { t } from '../i18n';

const PAGE_LOAD_TIME = Date.now();

function feedReducer(state, action) {
  switch (action.type) {
    case 'FETCH_START':
      return { ...state, loading: true };
    case 'FETCH_DONE':
      return { channelData: action.data, loading: false };
    default:
      return state;
  }
}

export default function HomePage({ channels, refreshTrigger, onRefreshAll, emptyMessage }) {
  const [{ channelData, loading }, dispatch] = useReducer(feedReducer, {
    channelData: {},
    loading: channels.length > 0,
  });
  const { language } = useTheme();

  function getHandle(ch) {
    return typeof ch === 'string' ? ch : ch.handle;
  }

  const fetchChannel = useCallback(async (ch) => {
    const handle = getHandle(ch);

    try {
      const { data } = await api.get('/api/posts', { params: { channelHandle: handle } });
      return { channel: handle, data, error: null };
    } catch (err) {
      const msg = err.response?.data?.error || err.message;
      return { channel: handle, data: null, error: msg };
    }
  }, []);

  useEffect(() => {
    if (channels.length === 0) return;

    let cancelled = false;
    dispatch({ type: 'FETCH_START' });

    Promise.all(channels.map(fetchChannel)).then(results => {
      if (cancelled) return;
      const newData = {};
      results.forEach(({ channel, data, error }) => {
        if (error) {
          newData[channel] = { error };
          toast.error(t(language, 'fetchFailed', channel));
        } else {
          newData[channel] = data;
        }
      });
      dispatch({ type: 'FETCH_DONE', data: newData });
    });

    return () => { cancelled = true; };
  }, [channels, refreshTrigger, fetchChannel, language]);

  const allPosts = useMemo(() => {
    const result = [];
    Object.entries(channelData).forEach(([channel, data]) => {
      if (data && data.posts) {
        data.posts.forEach(post => {
          result.push({
            ...post,
            _channelKey: channel,
            _channelName: channel,
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

    result.sort((a, b) => {
      const dateA = parseRelativeDate(a.date);
      const dateB = parseRelativeDate(b.date);
      return dateB - dateA;
    });

    return result;
  }, [channelData]);

  if (channels.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[40vh] text-yt-text-muted">
        <p className="text-lg md:text-xl" style={{ fontSize: 'var(--font-size-lg)' }}>{emptyMessage || t(language, 'noChannels')}</p>
      </div>
    );
  }

  if (loading) return <LoadingSkeleton />;

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
      <div className="flex justify-end">
        <button
          onClick={onRefreshAll}
          className="bg-yt-bg-tertiary hover:bg-yt-border text-yt-accent px-4 py-2 rounded-lg text-sm font-medium transition inline-flex items-center gap-2"
        >
          <RefreshCw size={16} />
          {t(language, 'refreshAll')}
        </button>
      </div>
      {allPosts.map((post, i) => (
        <PostCard
          key={`${post._channelKey}-${i}`}
          post={post}
          channelName={post._channelName}
          channelAvatar={post._channelAvatar}
        />
      ))}
    </div>
  );
}
