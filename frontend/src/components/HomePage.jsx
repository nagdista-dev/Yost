import { useEffect, useReducer, useCallback } from 'react';
import axios from 'axios';
import PostCard from './PostCard';
import LoadingSkeleton from './LoadingSkeleton';
import toast from 'react-hot-toast';
import { useTheme } from '../context/useTheme';
import { t } from '../i18n';

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

export default function HomePage({ channels, refreshTrigger, onRefreshAll }) {
  const [{ channelData, loading }, dispatch] = useReducer(feedReducer, {
    channelData: {},
    loading: channels.length > 0,
  });
  const { language } = useTheme();

  const fetchChannel = useCallback(async (channel) => {
    const url = channel.startsWith('http') ? channel : `https://www.youtube.com/@${channel.replace('@', '')}/posts`;

    try {
      const { data } = await axios.get('/api/posts', { params: { channelUrl: url } });
      return { channel, data, error: null };
    } catch (err) {
      const msg = err.response?.data?.error || err.message;
      return { channel, data: null, error: msg };
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

  const allPosts = [];
  Object.entries(channelData).forEach(([channel, data]) => {
    if (data && data.posts) {
      data.posts.forEach(post => {
        allPosts.push({
          ...post,
          _channelKey: channel,
          _channelName: data.channelName || channel,
          _channelAvatar: data.channelAvatar || '',
        });
      });
    }
  });

  allPosts.sort((a, b) => {
    const dateA = new Date(a.date);
    const dateB = new Date(b.date);
    if (isNaN(dateA) && isNaN(dateB)) return 0;
    if (isNaN(dateA)) return 1;
    if (isNaN(dateB)) return -1;
    return dateB - dateA;
  });

  if (channels.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-yt-text-muted">
        <p className="text-lg" style={{ fontSize: 'var(--font-size-lg)' }}>{t(language, 'noChannels')}</p>
      </div>
    );
  }

  if (loading) return <LoadingSkeleton />;

  if (allPosts.length === 0) {
    return (
      <div className="text-center text-yt-text-muted py-12">
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
    <div className="space-y-4">
      <div className="flex justify-end">
        <button
          onClick={onRefreshAll}
          className="bg-yt-bg-tertiary hover:bg-yt-border text-yt-accent px-3 py-2 rounded-lg text-sm font-medium transition"
        >
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
