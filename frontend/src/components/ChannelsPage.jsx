import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useTheme } from '../context/useTheme';
import { t } from '../i18n';

const STORAGE_KEY = 'yt_feed_channels';

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

export default function ChannelsPage({ channels, setChannels }) {
  const { language } = useTheme();
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [input, setInput] = useState('');

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
    setShowModal(false);
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

  return (
    <div className="space-y-6">
      <div className="bg-yt-bg-card rounded-xl p-4 border border-yt-border">
        <div className="flex items-center justify-between mb-3">
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
            onClick={() => setShowModal(true)}
            className="ml-2 bg-yt-accent hover:bg-yt-accent-hover text-white p-2 rounded-lg transition flex-shrink-0"
            title={t(language, 'addChannel')}
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M10 4V16M4 10H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        {channels.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-yt-text-muted">
            <svg width="48" height="48" viewBox="0 0 48 48" fill="none" className="mb-3 opacity-40">
              <rect x="8" y="12" width="32" height="24" rx="4" stroke="currentColor" strokeWidth="2"/>
              <circle cx="24" cy="26" r="5" stroke="currentColor" strokeWidth="2"/>
              <path d="M28 24L22 30M22 24L28 30" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            <p className="text-lg" style={{ fontSize: 'var(--font-size-lg)' }}>{t(language, 'noChannels')}</p>
            <button
              onClick={() => setShowModal(true)}
              className="mt-3 bg-yt-accent hover:bg-yt-accent-hover text-white px-4 py-2 rounded-lg text-sm font-medium transition"
            >
              {t(language, 'addChannel')}
            </button>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
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

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowModal(false)}>
          <div
            className="bg-yt-bg-card rounded-xl p-6 border border-yt-border w-full max-w-md mx-4 shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <h2 className="text-yt-text text-lg font-bold mb-4">{t(language, 'addChannel')}</h2>
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={t(language, 'addPlaceholder')}
              className="w-full bg-yt-input text-yt-text rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-yt-accent placeholder-yt-text-muted mb-4"
              autoFocus
            />
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 rounded-lg text-sm font-medium text-yt-text-secondary hover:bg-yt-bg-tertiary transition"
              >
                {t(language, 'cancel')}
              </button>
              <button
                onClick={handleAdd}
                className="bg-yt-accent hover:bg-yt-accent-hover text-white px-4 py-2 rounded-lg text-sm font-medium transition"
              >
                {t(language, 'addChannel')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
