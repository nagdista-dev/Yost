import { useState, useCallback, useEffect, useRef } from 'react';
import toast, { Toaster } from 'react-hot-toast';
import { Heart, Loader2 } from 'lucide-react';
import { ThemeProvider } from './context/ThemeProvider';
import { useTheme } from './context/useTheme';
import api from './api';
import Navbar from './components/Navbar';
import ChannelSidebar from './components/ChannelSidebar';
import HomePage from './components/HomePage';
import ChannelsPage from './components/ChannelsPage';
import SettingsPage from './components/SettingsPage';
import ExportPage from './components/ExportPage';
import { t } from './i18n';

const STORAGE_KEY = 'yt_feed_channels';

function loadChannels() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (parsed.length > 0 && typeof parsed[0] === 'string') {
      const migrated = parsed.map(handle => ({
        handle,
        name: '',
        category: 'Unspecified',
        favorite: false,
      }));
      saveChannels(migrated);
      return migrated;
    }
    return parsed;
  } catch {
    return [];
  }
}

function saveChannels(channels) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(channels));
}

function getCategories(channels) {
  const cats = new Set();
  channels.forEach(c => { if (c.category) cats.add(c.category); });
  return [...cats].sort();
}

function AddChannelModal({ show, onClose, onAdd, categories }) {
  const [input, setInput] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [category, setCategory] = useState('');
  const [favorite, setFavorite] = useState(false);
  const [fetchingName, setFetchingName] = useState(false);
  const autoFilled = useRef(false);
  const { language } = useTheme();

  function normalizeHandle(raw) {
    let handle = raw.trim();
    if (!handle) return '';
    if (handle.includes('youtube.com') || handle.includes('youtu.be')) {
      const match = handle.match(/@([\w-]+)/);
      if (match) handle = `@${match[1]}`;
      else return '';
    }
    if (!handle.startsWith('@')) {
      handle = `@${handle}`;
    }
    return handle;
  }

  useEffect(() => {
    if (!show) return;
    const handle = normalizeHandle(input);
    if (!handle) return;

    const timer = setTimeout(async () => {
      setFetchingName(true);
      try {
        const channelUrl = `https://www.youtube.com/${handle.replace('@', '')}`;
        const { data } = await api.get('/api/channel-info', { params: { channelUrl } });
        if (data.name && !autoFilled.current) {
          setDisplayName(data.name);
          autoFilled.current = true;
        }
      } catch {
        console.debug('channel name lookup failed');
      } finally {
        setFetchingName(false);
      }
    }, 600);

    return () => clearTimeout(timer);
  }, [input, show]);

  function reset() {
    setInput('');
    setDisplayName('');
    setCategory('');
    setFavorite(false);
    autoFilled.current = false;
  }

  function handleAdd() {
    const handle = normalizeHandle(input);
    if (!handle) return;

    onAdd({
      handle,
      name: displayName.trim(),
      category: category.trim() || 'Unspecified',
      favorite,
    });

    reset();
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter') handleAdd();
  }

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div
        className="bg-yt-bg-card rounded-xl p-6 border border-yt-border w-full max-w-md mx-4 shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <h2 className="text-yt-text text-lg font-bold mb-5">{t(language, 'addChannel')}</h2>

        <div className="space-y-4">
          <div>
            <label className="text-yt-text-secondary text-xs font-medium mb-1.5 block">
              {t(language, 'addPlaceholder')}
            </label>
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={t(language, 'addPlaceholder')}
              className="w-full bg-yt-input text-yt-text rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-yt-accent placeholder-yt-text-muted"
              autoFocus
            />
          </div>

          <div>
            <label className="text-yt-text-secondary text-xs font-medium mb-1.5 block">
              {t(language, 'channelNamePlaceholder')}
            </label>
            <div className="relative">
              <input
                value={displayName}
                onChange={e => { autoFilled.current = false; setDisplayName(e.target.value); }}
                placeholder={t(language, 'channelNamePlaceholder')}
                className="w-full bg-yt-input text-yt-text rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-yt-accent placeholder-yt-text-muted pr-8"
              />
              {fetchingName && (
                <Loader2 size={16} className="absolute top-1/2 end-3 -translate-y-1/2 text-yt-text-muted animate-spin" />
              )}
            </div>
          </div>

          <div>
            <label className="text-yt-text-secondary text-xs font-medium mb-1.5 block">
              {t(language, 'category')}
            </label>
            <input
              value={category}
              onChange={e => setCategory(e.target.value)}
              placeholder={t(language, 'unspecified')}
              list="category-suggestions"
              className="w-full bg-yt-input text-yt-text rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-yt-accent placeholder-yt-text-muted"
            />
            <datalist id="category-suggestions">
              <option value={t(language, 'unspecified')} />
              {categories.filter(c => c !== 'Unspecified').map(c => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </div>

          <label className="flex items-center gap-3 cursor-pointer group">
            <button
              type="button"
              onClick={() => setFavorite(!favorite)}
              className={`p-1.5 rounded-lg transition ${
                favorite
                  ? 'text-red-500'
                  : 'text-yt-text-muted group-hover:text-yt-text-secondary'
              }`}
            >
              <Heart size={20} fill={favorite ? 'currentColor' : 'none'} />
            </button>
            <span className="text-yt-text text-sm font-medium">{t(language, 'addToFavorites')}</span>
          </label>
        </div>

        <div className="flex gap-2 justify-end mt-6">
          <button
            onClick={() => { reset(); onClose(); }}
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
  );
}

function AppContent() {
  const [channels, setChannels] = useState(loadChannels);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [activeTab, setActiveTab] = useState('home');
  const [showAddModal, setShowAddModal] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { language } = useTheme();

  const handleRefreshAll = useCallback(() => {
    setRefreshTrigger(t => t + 1);
  }, []);

  function handleAddChannel(channelObj) {
    const existing = channels.find(c => c.handle.toLowerCase() === channelObj.handle.toLowerCase());
    if (existing) {
      toast.error(t(language, 'channelExists'));
      return;
    }
    const updated = [...channels, channelObj];
    setChannels(updated);
    saveChannels(updated);
    setShowAddModal(false);
    toast.success(t(language, 'channelAdded', channelObj.handle));
  }

  function handleRemoveChannel(channel) {
    const updated = channels.filter(c => c !== channel);
    setChannels(updated);
    saveChannels(updated);
  }

  function handleToggleFavorite(channel) {
    const updated = channels.map(c =>
      c === channel ? { ...c, favorite: !c.favorite } : c
    );
    setChannels(updated);
    saveChannels(updated);
  }

  const categories = getCategories(channels);

  const pageTitle = () => {
    switch (activeTab) {
      case 'home': return t(language, 'appTitle');
      case 'favorites': return t(language, 'favoritesTitle');
      case 'channels': return t(language, 'channels');
      case 'settings': return t(language, 'settingsTitle');
      case 'export': return t(language, 'exportTitle');
      default: return '';
    }
  };

  const pageContent = () => {
    switch (activeTab) {
      case 'home':
        return (
          <HomePage
            channels={channels}
            refreshTrigger={refreshTrigger}
            onRefreshAll={handleRefreshAll}
          />
        );
      case 'favorites': {
        const favChannels = channels.filter(c => c.favorite);
        return (
          <HomePage
            channels={favChannels}
            refreshTrigger={refreshTrigger}
            onRefreshAll={handleRefreshAll}
            emptyMessage={t(language, 'noFavorites')}
          />
        );
      }
      case 'channels':
        return (
          <ChannelsPage
            channels={channels}
            onRemoveChannel={handleRemoveChannel}
            onToggleFavorite={handleToggleFavorite}
          />
        );
      case 'settings':
        return <SettingsPage />;
      case 'export':
        return <ExportPage channels={channels} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-yt-bg">
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: 'var(--bg-card)',
            color: 'var(--text-primary)',
            border: '1px solid var(--border)',
          },
        }}
      />
      <Navbar
        title={pageTitle()}
        onAddChannel={() => setShowAddModal(true)}
        onMenuToggle={() => setSidebarOpen(prev => !prev)}
      />
      <ChannelSidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        sidebarOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onAddChannel={() => { setShowAddModal(true); setSidebarOpen(false); }}
      />
      <main className="md:ms-64 pt-20 px-4 md:px-8 lg:px-12 pb-8 min-h-screen">
        <div className="max-w-4xl mx-auto pt-2 md:pt-4">
          {pageContent()}
        </div>
      </main>
      <AddChannelModal
        show={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAdd={handleAddChannel}
        categories={categories}
      />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}
