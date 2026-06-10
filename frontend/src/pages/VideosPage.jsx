import { useState, useCallback } from 'react';
import { Film } from 'lucide-react';
import { useTheme } from '../context/useTheme';
import { t } from '../i18n';
import VideoCard from '../components/VideoCard';
import VideoSkeleton from '../components/VideoSkeleton';
import VideoPlayerModal from '../components/VideoPlayerModal';
import VideoFilters from '../components/VideoFilters';
import useVideos from '../hooks/useVideos';

export default function VideosPage({ channels }) {
  const { language } = useTheme();
  const [listMode, setListMode] = useState(false);
  const [playingVideoId, setPlayingVideoId] = useState(null);

  const {
    loading, videoList, allCategories, progress,
    categoryFilter, setCategoryFilter,
    sortBy, setSortBy,
  } = useVideos(channels);

  const handlePlay = useCallback((videoId) => {
    setPlayingVideoId(videoId);
  }, []);

  if (channels.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[40vh] text-yt-text-muted">
        <p className="text-lg md:text-xl" style={{ fontSize: 'var(--font-size-lg)' }}>{t(language, 'noChannels')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-5">
      <VideoFilters
        allCategories={allCategories}
        categoryFilter={categoryFilter}
        setCategoryFilter={setCategoryFilter}
        sortBy={sortBy}
        setSortBy={setSortBy}
        listMode={listMode}
        setListMode={setListMode}
      />

      {loading ? (
        <>
          <div className="flex items-center gap-2.5 px-1 py-2 text-xs text-yt-text-muted bg-yt-bg-tertiary/20 rounded-xl">
            <div className="w-4 h-4 border-2 border-yt-accent border-t-transparent rounded-full animate-spin" />
            <span>{t(language, 'loadingVideos', progress.loaded, progress.total)}</span>
          </div>
          <div className={listMode ? 'space-y-3' : 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5'}>
            {Array.from({ length: Math.min(channels.length, 6) }).map((_, i) => (
              <VideoSkeleton key={i} list={listMode} />
            ))}
          </div>
        </>
      ) : videoList.length === 0 ? (
        <div className="text-center text-yt-text-muted py-20">
          <div className="w-16 h-16 rounded-2xl bg-yt-bg-tertiary/50 flex items-center justify-center mx-auto mb-4">
            <Film size={28} className="text-yt-text-muted/50" />
          </div>
          <p className="text-base" style={{ fontSize: 'var(--font-size-lg)' }}>{t(language, 'noVideos')}</p>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between px-0.5">
            <p className="text-xs text-yt-text-muted">{t(language, 'showingVideos', videoList.length)}</p>
          </div>
          <div className={listMode ? 'space-y-3' : 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5'}>
            {videoList.map(video => (
              <VideoCard
                key={video.videoId}
                video={video}
                list={listMode}
                ranks={{ viewsRank: video._viewsRank, likesRank: video._likesRank }}
                onPlay={handlePlay}
              />
            ))}
          </div>
        </>
      )}

      {playingVideoId && (
        <VideoPlayerModal
          videoId={playingVideoId}
          onClose={() => setPlayingVideoId(null)}
        />
      )}
    </div>
  );
}
