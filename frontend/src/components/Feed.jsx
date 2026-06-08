import { useEffect, useReducer, useCallback, useState } from 'react';
import axios from 'axios';
import PostCard from './PostCard';
import LoadingSkeleton from './LoadingSkeleton';
import toast from 'react-hot-toast';
import { useTheme } from '../context/useTheme';
import { t } from '../i18n';

const STORAGE_KEY = 'yt_feed_channels';

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

function loadChannels() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveChannels(channels) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(channels));
}

export default function Feed({ channels, setChannels, refreshTrigger, onRefreshAll }) {
  const [{ channelData, loading }, dispatch] = useReducer(feedReducer, {
    channelData: {},
    loading: channels.length > 0,
  });
  const { language } = useTheme();
  const [input, setInput] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (channels.length > 0) return;
    const stored = loadChannels();
    if (stored.length > 0) setChannels(stored);
  }, [channels.length, setChannels]);

  const filteredChannels = channels.filter(ch =>
    ch.toLowerCase().includes(search.toLowerCase())
  );

  function handleAdd() {
    let handle = input.trim();
    if (!handle) return;

    if (handle.includes('youtube.com') || handle.includes('youtu.be')) {
      const match = handle.match(/@([\w-]+)/);
      if (match) handle = `@${match[1]}`;
      else {
        toast.error(t(language, 'invalidUrl'));
        return;
      }
    }

    if (!handle.startsWith('@')) {
      handle = `@${handle}`;
    }

    const existing = channels.find(c => c.toLowerCase() === handle.toLowerCase());
    if (existing) {
      toast.error(t(language, 'channelExists'));
      return;
    }

    const updated = [...channels, handle];
    setChannels(updated);
    saveChannels(updated);
    setInput('');
    toast.success(t(language, 'channelAdded', handle));
  }

  function handleRemove(channel) {
    const updated = channels.filter(c => c !== channel);
    setChannels(updated);
    saveChannels(updated);
    toast.success(t(language, 'channelRemoved', channel));
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter') handleAdd();
  }

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

  return (
    <div className="space-y-6">
      <div className="bg-yt-bg-card rounded-xl p-4 border border-yt-border">
        <div className="flex gap-2 mb-3">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t(language, 'addPlaceholder')}
            className="flex-1 bg-yt-input text-yt-text rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-yt-accent placeholder-yt-text-muted"
          />
          <button
            onClick={handleAdd}
            className="bg-yt-accent hover:bg-yt-accent-hover text-white px-4 py-2 rounded-lg text-sm font-medium transition whitespace-nowrap"
          >
            {t(language, 'addChannel')}
          </button>
        </div>

        {channels.length > 0 && (
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <span className={`absolute ${language === 'ar' ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 text-yt-text-muted text-sm`}>🔍</span>
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder={t(language, 'searchChannels')}
                className={`w-full bg-yt-input text-yt-text rounded-lg py-2 text-sm outline-none focus:ring-2 focus:ring-yt-accent placeholder-yt-text-muted ${language === 'ar' ? 'pr-8 pl-3' : 'pl-8 pr-3'}`}
              />
            </div>
            <button
              onClick={onRefreshAll}
              className="bg-yt-bg-tertiary hover:bg-yt-border text-yt-accent px-3 py-2 rounded-lg text-sm font-medium transition whitespace-nowrap"
            >
              {t(language, 'refreshAll')}
            </button>
          </div>
        )}

        {channels.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {filteredChannels.map(ch => (
              <div key={ch} className="flex items-center gap-1.5 bg-yt-bg-tertiary rounded-full pl-2 pr-1 py-1">
                <div className="w-5 h-5 rounded-full bg-yt-accent/20 flex items-center justify-center text-yt-accent text-[10px] flex-shrink-0 font-bold">
                  {ch.replace('@', '').charAt(0).toUpperCase()}
                </div>
                <span className="text-yt-text text-xs truncate max-w-[100px]">{ch}</span>
                <button
                  onClick={() => handleRemove(ch)}
                  className="text-yt-text-muted hover:text-yt-accent text-xs p-0.5 transition"
                  title={t(language, 'remove')}
                >
                  ✕
                </button>
              </div>
            ))}
            {search && filteredChannels.length === 0 && (
              <p className="text-yt-text-muted text-xs py-1">{t(language, 'noSearchResults')}</p>
            )}
          </div>
        )}
      </div>

      {channels.length === 0 ? (
        <div className="flex items-center justify-center h-64 text-yt-text-muted">
          <p className="text-lg" style={{ fontSize: 'var(--font-size-lg)' }}>{t(language, 'noChannels')}</p>
        </div>
      ) : loading ? (
        <LoadingSkeleton />
      ) : allPosts.length === 0 ? (
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
      ) : (
        <div className="space-y-4">
          {allPosts.map((post, i) => (
            <PostCard
              key={`${post._channelKey}-${i}`}
              post={post}
              channelName={post._channelName}
              channelAvatar={post._channelAvatar}
            />
          ))}
        </div>
      )}
    </div>
  );
}
