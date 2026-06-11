import { useState, useCallback } from 'react';
import { Bookmark, Film } from 'lucide-react';
import { useTheme } from '../context/useTheme';
import { t } from '../i18n';
import VideoCard from '../components/VideoCard';
import VideoPlayerModal from '../components/VideoPlayerModal';

export default function SavedVideosPage({ saved, onChannelClick }) {
  const { language } = useTheme();
  const [listMode, setListMode] = useState(false);
  const [playingVideoId, setPlayingVideoId] = useState(null);

  const handlePlay = useCallback((videoId) => {
    setPlayingVideoId(videoId);
  }, []);

  if (saved.length === 0) {
    return (
      <div className="text-center text-yt-text-muted py-20">
        <div className="w-16 h-16 rounded-2xl bg-yt-bg-tertiary/50 flex items-center justify-center mx-auto mb-4">
          <Bookmark size={28} className="text-yt-text-muted/50" />
        </div>
        <p className="text-base" style={{ fontSize: 'var(--font-size-lg)' }}>
          {t(language, 'noSavedVideos')}
        </p>
        <p className="text-sm mt-2 text-yt-text-muted/70">
          {t(language, 'noSavedVideosHint')}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between px-1">
        <p className="text-xs text-yt-text-muted/70 font-medium">
          {t(language, 'showingVideos', saved.length)}
        </p>
        <div className="flex items-center gap-0.5 bg-yt-bg-tertiary/50 rounded-lg p-0.5 border border-yt-border/40">
          <button
            onClick={() => setListMode(false)}
            className={`p-1 rounded-md transition ${!listMode ? 'bg-yt-accent text-white shadow-sm' : 'text-yt-text-secondary hover:text-yt-text'}`}
          >
            <Film size={12} />
          </button>
          <button
            onClick={() => setListMode(true)}
            className={`p-1 rounded-md transition ${listMode ? 'bg-yt-accent text-white shadow-sm' : 'text-yt-text-secondary hover:text-yt-text'}`}
          >
            <Film size={12} />
          </button>
        </div>
      </div>

      <div className={listMode ? 'space-y-3' : 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5'}>
        {saved.map(video => (
          <VideoCard
            key={video.videoId}
            video={video}
            list={listMode}
            onPlay={handlePlay}
            onChannelClick={onChannelClick}
          />
        ))}
      </div>

      {playingVideoId && (
        <VideoPlayerModal
          videoId={playingVideoId}
          onClose={() => setPlayingVideoId(null)}
        />
      )}
    </div>
  );
}
