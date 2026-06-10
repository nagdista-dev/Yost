import { useTheme } from '../context/useTheme';
import { t } from '../i18n';

export default function ChannelConfirmDialog({ channelName, handle, onClose }) {
  const { language } = useTheme();

  return (
    <div
      className="fixed top-0 left-0 w-screen h-screen z-50 flex items-center justify-center bg-black/50"
      onClick={onClose}
    >
      <div
        className="bg-yt-bg-card rounded-2xl border border-yt-border shadow-xl p-6 mx-4 max-w-sm w-full"
        onClick={e => e.stopPropagation()}
      >
        <p className="text-yt-text text-sm leading-relaxed mb-5" style={{ fontSize: 'var(--font-size-base)' }}>
          {t(language, 'openChannelConfirm', channelName)}
        </p>
        <div className="flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm font-medium text-yt-text-muted hover:bg-yt-bg-tertiary transition-colors"
          >
            {t(language, 'cancel')}
          </button>
          <button
            onClick={() => {
              onClose();
              window.open(`https://www.youtube.com/@${handle}`, '_blank', 'noopener noreferrer');
            }}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-yt-accent text-white hover:opacity-90 transition-opacity"
          >
            {t(language, 'openChannel')}
          </button>
        </div>
      </div>
    </div>
  );
}
