import { useState, useCallback } from 'react';
import { Toaster } from 'react-hot-toast';
import { ThemeProvider } from './context/ThemeProvider';
import { useTheme } from './context/useTheme';
import ChannelSidebar from './components/ChannelSidebar';
import HomePage from './components/HomePage';
import ChannelsPage from './components/ChannelsPage';
import SettingsPage from './components/SettingsPage';
import ExportPage from './components/ExportPage';
import { t } from './i18n';

function AppContent() {
  const [channels, setChannels] = useState([]);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [activeTab, setActiveTab] = useState('home');
  const { language } = useTheme();

  const handleRefreshAll = useCallback(() => {
    setRefreshTrigger(t => t + 1);
  }, []);

  const pageTitle = () => {
    switch (activeTab) {
      case 'home': return t(language, 'appTitle');
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
      case 'channels':
        return (
          <ChannelsPage
            channels={channels}
            setChannels={setChannels}
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
      <ChannelSidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      <main className="md:ml-64 p-4 md:p-8 max-w-2xl mx-auto pb-24 md:pb-8 min-h-screen">
        <h1 className="text-yt-text text-2xl font-bold mb-6" style={{ fontSize: 'var(--font-size-xl)' }}>
          {pageTitle()}
        </h1>
        {pageContent()}
      </main>
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
