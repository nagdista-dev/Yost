import { useState, useCallback } from 'react';
import toast, { Toaster } from 'react-hot-toast';
import { ThemeProvider } from './context/ThemeProvider';
import { useTheme } from './context/useTheme';
import Navbar from './components/Navbar';
import ChannelSidebar from './components/ChannelSidebar';
import AddChannelModal from './components/AddChannelModal';
import HomePage from './pages/HomePage';
import ChannelsPage from './pages/ChannelsPage';
import VideosPage from './pages/VideosPage';
import SettingsPage from './pages/SettingsPage';
import ExportPage from './pages/ExportPage';
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

function AppContent() {
  const [channels, setChannels] = useState(loadChannels);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [activeTab, setActiveTab] = useState('home');
  const [showAddModal, setShowAddModal] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
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

  function handleUpdateChannel(oldChannel, updatedChannel) {
    const updated = channels.map(c => c === oldChannel ? updatedChannel : c);
    setChannels(updated);
    saveChannels(updated);
    toast.success(t(language, 'channelUpdated', updatedChannel.name || updatedChannel.handle));
  }

  function handleToggleFavorite(channel) {
    const updated = channels.map(c =>
      c === channel ? { ...c, favorite: !c.favorite } : c
    );
    setChannels(updated);
    saveChannels(updated);
  }

  function handleImportChannels(imported) {
    const existing = new Map(channels.map(c => [c.handle.toLowerCase(), c]));
    let added = 0;
    imported.forEach(ch => {
      const key = ch.handle.toLowerCase();
      if (!existing.has(key)) {
        existing.set(key, {
          handle: ch.handle,
          name: ch.name || '',
          category: ch.category || 'Unspecified',
          favorite: ch.favorite || false,
        });
        added++;
      }
    });
    if (added === 0) return;
    const updated = Array.from(existing.values());
    setChannels(updated);
    saveChannels(updated);
  }

  function handleSelectCategory(cat) {
    setSelectedCategory(prev => prev === cat ? null : cat);
    if (activeTab !== 'home') setActiveTab('home');
  }

  const categories = getCategories(channels);

  const pageTitle = () => {
    switch (activeTab) {
      case 'home': return t(language, 'appTitle');
      case 'videos': return t(language, 'tabVideos');
      case 'favorites': return t(language, 'favoritesTitle');
      case 'channels': return t(language, 'channels');
      case 'settings': return t(language, 'settingsTitle');
      case 'export': return t(language, 'exportTitle');
      default: return '';
    }
  };

  const pageContent = () => {
    switch (activeTab) {
      case 'home': {
        const filtered = selectedCategory
          ? channels.filter(c => c.category === selectedCategory)
          : channels;
        const emptyMsg = selectedCategory
          ? `${t(language, 'noChannels')} (${t(language, 'category')}: ${selectedCategory})`
          : undefined;
        return (
          <HomePage
            channels={filtered}
            refreshTrigger={refreshTrigger}
            onRefreshAll={handleRefreshAll}
            emptyMessage={emptyMsg}
          />
        );
      }
      case 'videos':
        return <VideosPage channels={channels} />;
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
            onUpdateChannel={handleUpdateChannel}
            onToggleFavorite={handleToggleFavorite}
            categories={categories}
          />
        );
      case 'settings':
        return <SettingsPage />;
      case 'export':
        return <ExportPage channels={channels} onImport={handleImportChannels} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-yt-bg">
      <Toaster
        position="bottom-right"
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
        onGoHome={() => { setActiveTab('home'); setSelectedCategory(null); }}
      />
      <ChannelSidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        sidebarOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onAddChannel={() => { setShowAddModal(true); setSidebarOpen(false); }}
        categories={categories}
        selectedCategory={selectedCategory}
        onSelectCategory={handleSelectCategory}
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
