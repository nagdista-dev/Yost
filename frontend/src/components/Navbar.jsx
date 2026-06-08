import { Download, Menu, Plus } from 'lucide-react';
import { useTheme } from '../context/useTheme';
import { useInstallPrompt } from '../context/useInstallPrompt';
import { t } from '../i18n';

export default function Navbar({ title, onAddChannel, onMenuToggle }) {
  const { language } = useTheme();
  const { isInstallable, handleInstall } = useInstallPrompt();

  return (
    <header className="fixed top-0 inset-x-0 h-16 bg-yt-sidebar/85 backdrop-blur-lg border-b border-yt-border z-40 flex items-center px-4 md:px-6">
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <button
          onClick={onMenuToggle}
          className="md:hidden p-2 -ms-2 rounded-xl text-yt-text-secondary hover:text-yt-text hover:bg-yt-bg-tertiary transition-colors"
          aria-label="Toggle menu"
        >
          <Menu size={22} />
        </button>

        <div className="flex items-center gap-2.5 flex-shrink-0">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#863bff] to-[#7e14ff] flex items-center justify-center shadow-sm">
            <svg width="18" height="18" viewBox="0 0 28 28" fill="none">
              <path d="M8 14L12 18L20 10" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <span className="text-yt-text text-lg font-extrabold tracking-tight">Yost</span>
        </div>

        {title && (
          <>
            <span className="hidden md:block text-yt-text-muted select-none">·</span>
            <span className="hidden md:block text-yt-text-secondary text-base font-medium truncate max-w-[180px] xl:max-w-[300px]">
              {title}
            </span>
          </>
        )}
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        {isInstallable && (
          <button
            onClick={handleInstall}
            className="md:hidden flex items-center gap-1.5 border border-yt-border text-yt-text-secondary hover:text-yt-text hover:bg-yt-bg-tertiary px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
          >
            <Download size={15} />
            <span>{t(language, 'installApp')}</span>
          </button>
        )}
        <button
          onClick={onAddChannel}
          className="hidden md:inline-flex items-center gap-1.5 bg-yt-accent hover:bg-yt-accent-hover text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors shadow-sm"
        >
          <Plus size={18} />
          <span>{t(language, 'addChannel')}</span>
        </button>
      </div>
    </header>
  );
}
