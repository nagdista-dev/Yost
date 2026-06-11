import { useEffect, useCallback, useRef, useState } from 'react';
import { X, ExternalLink } from 'lucide-react';
import { useTheme } from '../context/useTheme';

function fmt(sec) {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

export default function VideoPlayerModal({ videoId, onClose }) {
  const { language } = useTheme();
  const containerRef = useRef(null);
  const playerRef = useRef(null);
  const [time, setTime] = useState(0);

  const handleKeyDown = useCallback(e => {
    if (e.key === 'Escape') onClose();
  }, [onClose]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  useEffect(() => {
    let cancelled = false;
    let player = null;
    let interval = null;

    function init() {
      if (cancelled || !containerRef.current) return;
      player = new window.YT.Player(containerRef.current, {
        videoId,
        playerVars: {
          autoplay: 1,
          controls: 1,
          modestbranding: 1,
          rel: 0,
          iv_load_policy: 3,
        },
        events: {
          onReady: () => {
            playerRef.current = player;
            interval = setInterval(() => {
              if (player && player.getCurrentTime) {
                setTime(player.getCurrentTime());
              }
            }, 250);
          },
        },
      });
    }

    if (window.YT && window.YT.Player) {
      init();
    } else {
      const prev = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        if (prev) prev();
        init();
      };
      if (!document.querySelector('script[src*="youtube.com/iframe_api"]')) {
        const s = document.createElement('script');
        s.src = 'https://www.youtube.com/iframe_api';
        document.head.appendChild(s);
      }
    }

    return () => {
      cancelled = true;
      if (interval) clearInterval(interval);
      if (player && player.destroy) player.destroy();
    };
  }, [videoId]);

  function openAtTime() {
    const t = Math.floor(time);
    window.open(
      `https://www.youtube.com/watch?v=${videoId}&t=${t}s`,
      '_blank'
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-4xl mx-4 bg-yt-bg-card rounded-2xl overflow-hidden shadow-2xl border border-yt-border"
        onClick={e => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-3 end-3 z-10 p-2 rounded-full bg-black/50 hover:bg-black/70 text-white transition-colors"
        >
          <X size={20} />
        </button>
        <div className="aspect-video">
          <div ref={containerRef} className="w-full h-full" />
        </div>

        <div className="px-4 py-3 border-t border-yt-border/30">
          <button
            onClick={openAtTime}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-yt-accent hover:bg-yt-accent-hover text-white text-sm font-medium transition"
          >
            <ExternalLink size={14} />
            {language === 'ar'
              ? `فتح على يوتيوب عند ${fmt(time)}`
              : `Open on YouTube at ${fmt(time)}`}
          </button>
        </div>
      </div>
    </div>
  );
}
