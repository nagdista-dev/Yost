import { useState, useEffect } from 'react';
import { ArrowLeft, Play, Clock, Film } from 'lucide-react';
import api from '../api';
import timeAgo from '../utils/timeAgo';
import VideoPlayerModal from '../components/VideoPlayerModal';
import { useTheme } from '../context/useTheme';

export default function ChannelPage({ channelHandle, onBack }) {
  const { language } = useTheme();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [playing, setPlaying] = useState(null);

  useEffect(() => {
    let cancelled = false;
    async function fetchData() {
      setLoading(true);
      try {
        const res = await api.get('/api/channel-videos', { params: { channelHandle } });
        if (!cancelled) setData(res.data);
      } catch {
        if (!cancelled) setData(null);
      }
      if (!cancelled) setLoading(false);
    }
    fetchData();
    return () => { cancelled = true; };
  }, [channelHandle]);

  const avatarLetter = (data?.channelName || channelHandle).replace('@', '').charAt(0).toUpperCase();

  return (
    <div className="space-y-5">
      <button
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-yt-text-muted hover:text-yt-text transition text-sm"
      >
        <ArrowLeft size={16} />
        Back
      </button>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-6 h-6 border-2 border-yt-accent border-t-transparent rounded-full animate-spin" />
        </div>
      ) : !data ? (
        <div className="text-center text-yt-text-muted py-20 text-sm">Could not load channel.</div>
      ) : (
        <>
          <div className="bg-yt-bg-card rounded-xl border border-yt-border/50 p-5 md:p-6 flex items-center gap-4">
            {data.avatar ? (
              <img
                src={data.avatar}
                alt={data.channelName}
                className="w-16 h-16 md:w-20 md:h-20 rounded-full object-cover border-2 border-yt-border/30"
              />
            ) : (
              <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-yt-accent/20 flex items-center justify-center text-yt-accent text-xl md:text-2xl font-bold shrink-0">
                {avatarLetter}
              </div>
            )}
            <div className="min-w-0">
              <h1 className="text-yt-text text-xl md:text-2xl font-bold truncate">
                {data.channelName}
              </h1>
              <p className="text-yt-text-muted text-sm mt-0.5">{data.channelHandle}</p>
            </div>
          </div>

          {data.videos && data.videos.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
              {data.videos.map(video => (
                <div
                  key={video.videoId}
                  className="group bg-yt-bg-card rounded-xl border border-yt-border/50 shadow-sm hover:shadow-xl hover:border-yt-accent/20 hover:-translate-y-0.5 transition-all duration-300 overflow-hidden flex flex-col cursor-pointer"
                  onClick={() => setPlaying(video.videoId)}
                >
                  <div className="aspect-video bg-yt-bg-tertiary relative overflow-hidden">
                    {video.thumbnail ? (
                      <img
                        src={video.thumbnail}
                        alt={video.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-yt-text-muted/30">
                        <Film size={32} />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none" />
                    <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                      <div className="w-12 h-12 rounded-full bg-yt-accent/90 flex items-center justify-center shadow-lg transform scale-75 group-hover:scale-100 transition-transform duration-300">
                        <Play size={20} className="text-white ml-0.5" />
                      </div>
                    </div>
                    <div className="absolute bottom-2 left-2 flex items-center gap-1.5">
                      <span className="bg-black/70 text-white/90 text-[10px] px-1.5 py-0.5 rounded font-medium backdrop-blur-sm flex items-center gap-1">
                        <Clock size={10} />
                        {timeAgo(video.published, language)}
                      </span>
                    </div>
                  </div>
                  <div className="p-3 flex-1 min-w-0">
                    <h3 className="text-yt-text font-semibold text-sm leading-snug line-clamp-2 group-hover:text-yt-accent transition-colors">
                      {video.title}
                    </h3>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-yt-text-muted py-20 text-sm">No videos found.</div>
          )}
        </>
      )}

      {playing && (
        <VideoPlayerModal
          videoId={playing}
          onClose={() => setPlaying(null)}
        />
      )}
    </div>
  );
}