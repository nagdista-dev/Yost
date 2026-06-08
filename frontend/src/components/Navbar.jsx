import { Download, Menu, Plus } from 'lucide-react';
import { useTheme } from '../context/useTheme';
import { useInstallPrompt } from '../context/useInstallPrompt';
import { t } from '../i18n';

export default function Navbar({ title, onAddChannel, onMenuToggle }) {
  const { language } = useTheme();
  const { isInstallable, handleInstall } = useInstallPrompt();

  return (
    <header className="fixed top-0 inset-x-0 h-16 bg-yt-sidebar/95 backdrop-blur-sm border-b border-yt-border z-40 flex items-center px-4 md:px-6 lg:px-8">
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <button
          onClick={onMenuToggle}
          className="md:hidden p-1.5 -ms-1.5 rounded-lg text-yt-text-secondary hover:text-yt-text hover:bg-yt-bg-tertiary transition"
          aria-label="Toggle menu"
        >
          <Menu size={24} />
        </button>
        <svg width="32" height="32" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg" className="flex-shrink-0">
          <rect width="28" height="28" rx="6" fill="url(#navbar-logo-gradient)" />
          <path d="M8 14L12 18L20 10" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          <defs>
            <linearGradient id="navbar-logo-gradient" x1="0" y1="0" x2="28" y2="28" gradientUnits="userSpaceOnUse">
              <stop stopColor="#863bff" />
              <stop offset="1" stopColor="#7e14ff" />
            </linearGradient>
          </defs>
        </svg>
        <h1 className="text-yt-text text-xl font-bold tracking-tight flex-shrink-0">Yost</h1>
        {title && (
          <>
            <span className="hidden md:block text-yt-text-muted text-lg mx-1">/</span>
            <span className="hidden md:block text-yt-text-secondary text-base font-medium truncate">{title}</span>
          </>
        )}
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        {isInstallable && (
          <button
            onClick={handleInstall}
            className="md:hidden flex items-center gap-1.5 border border-yt-border text-yt-text-secondary hover:text-yt-text hover:bg-yt-bg-tertiary px-2.5 py-1.5 rounded-lg text-xs font-medium transition"
          >
            <Download size={16} />
            <span>{t(language, 'installApp')}</span>
          </button>
        )}
        <button
          onClick={onAddChannel}
          className="hidden md:flex items-center gap-1.5 bg-yt-accent hover:bg-yt-accent-hover text-white px-3 py-1.5 md:px-4 md:py-2 rounded-lg text-sm font-medium transition flex-shrink-0"
        >
          <Plus size={18} />
          <span className="hidden sm:inline">{t(language, 'addChannel')}</span>
        </button>
      </div>
    </header>
  );
}
