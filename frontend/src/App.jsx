import { useState, useEffect, useCallback } from 'react';
import { Toaster } from 'react-hot-toast';
import { ThemeProvider } from './context/ThemeProvider';
import { useTheme } from './context/useTheme';
import Navbar from './components/Navbar';
import ChannelSidebar from './components/ChannelSidebar';
import AddChannelModal from './components/AddChannelModal';
import KeyboardShortcutsModal from './components/KeyboardShortcutsModal';
import HomePage from './pages/HomePage';
import ChannelsPage from './pages/ChannelsPage';
import VideosPage from './pages/VideosPage';
import ChannelPage from './pages/ChannelPage';
import SettingsPage from './pages/SettingsPage';
import ExportPage from './pages/ExportPage';
import useChannels from './hooks/useChannels';
import { getStartPage } from './components/StartPageSelector';
import FloatingAddButton from './components/FloatingAddButton';
import { t } from './i18n';

function AppContent() {
  const {
    channels, categories,
    handleAddChannel, handleRemoveChannel,
    handleUpdateChannel, handleToggleFavorite, handleImportChannels,
  } = useChannels();
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [activeTab, setActiveTab] = useState(getStartPage);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [channelProfile, setChannelProfile] = useState(null);
  const { language } = useTheme();

  const handleSetActiveTab = useCallback((tab) => {
    setActiveTab(tab);
    setChannelProfile(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  useEffect(() => {
    function handleKeyDown(e) {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable) return;
      if (e.key === '?') {
        e.preventDefault();
        setShowShortcuts(prev => !prev);
      } else if (e.key === 'h') {
        e.preventDefault();
        handleSetActiveTab('home');
      } else if (e.key === 'v') {
        e.preventDefault();
        handleSetActiveTab('videos');
      } else if (e.key === 'c') {
        e.preventDefault();
        handleSetActiveTab('channels');
      } else if (e.key === 'Escape') {
        setShowShortcuts(false);
        setChannelProfile(null);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleSetActiveTab]);

  function handleRefreshAll() {
    setRefreshTrigger(t => t + 1);
  }

  function handleSelectCategory(cat) {
    setSelectedCategory(prev => prev === cat ? null : cat);
    if (activeTab !== 'home') handleSetActiveTab('home');
  }

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
    if (channelProfile) {
      const channel = channels.find(ch => ch.handle === channelProfile);
      return (
        <ChannelPage
          channel={channel}
          onUpdateChannel={handleUpdateChannel}
          onToggleFavorite={handleToggleFavorite}
          categories={categories}
          onBack={() => setChannelProfile(null)}
        />
      );
    }
    switch (activeTab) {
      case 'home': {
        const filtered = selectedCategory
          ? channels.filter(c => (c.categories || []).includes(selectedCategory))
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
        return <VideosPage channels={channels} onChannelClick={(handle) => setChannelProfile(handle)} />;
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
        onGoHome={() => { handleSetActiveTab(getStartPage()); setSelectedCategory(null); }}
      />
      <ChannelSidebar
        activeTab={activeTab}
        setActiveTab={handleSetActiveTab}
        sidebarOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onAddChannel={() => { setShowAddModal(true); setSidebarOpen(false); }}
        categories={categories}
        selectedCategory={selectedCategory}
        onSelectCategory={handleSelectCategory}
        channelCount={channels.length}
      />
      <main className="md:ms-64 pt-20 px-4 md:px-8 lg:px-12 pb-8 min-h-screen">
        <div className="max-w-4xl mx-auto pt-2 md:pt-4">
          {pageContent()}
        </div>
      </main>
      <FloatingAddButton onClick={() => setShowAddModal(true)} />

      <AddChannelModal
        show={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAdd={handleAddChannel}
        categories={categories}
      />

      <KeyboardShortcutsModal
        show={showShortcuts}
        onClose={() => setShowShortcuts(false)}
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
