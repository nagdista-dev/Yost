import { useState } from 'react';
import { useTheme } from '../context/useTheme';
import { t } from '../i18n';

function isArabic(text) {
  return /[\u0600-\u06FF]/.test(text);
}

export default function PostCard({ post, channelName, channelAvatar }) {
  const [expanded, setExpanded] = useState(false);
  const [lightbox, setLightbox] = useState(null);
  const { language } = useTheme();
  const isLongText = post.text.length > 150;
  const arabic = isArabic(post.text);

  return (
    <>
      <div className="bg-yt-bg-card rounded-xl p-4 shadow-lg border border-yt-border">
        <div className="flex items-center gap-3 mb-3">
          {channelAvatar ? (
            <img
              src={channelAvatar}
              alt={channelName}
              className="w-10 h-10 rounded-full object-cover"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-yt-accent/20 flex items-center justify-center text-yt-accent font-bold text-sm">
              {channelName.charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <p className="text-yt-text font-semibold text-sm">{channelName}</p>
            <p className="text-yt-text-muted text-xs">{post.date}</p>
          </div>
        </div>

        <div className="mb-3">
          <p
            className={`text-yt-text text-sm leading-relaxed whitespace-pre-wrap ${arabic ? 'font-arabic font-tajawal' : ''} ${!expanded && isLongText ? 'line-clamp-3' : ''}`}
            style={{ fontSize: 'var(--font-size-base)' }}
          >
            {post.text}
          </p>
          {isLongText && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="text-yt-accent text-xs mt-1 hover:opacity-80 transition"
            >
              {expanded ? t(language, 'showLess') : t(language, 'showMore')}
            </button>
          )}
        </div>

        {post.images.length > 0 && (
          <div className={`grid gap-2 mb-3 ${post.images.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
            {post.images.map((img, i) => (
              <img
                key={i}
                src={img}
                alt={`Post image ${i + 1}`}
                className="rounded-lg w-full object-cover cursor-pointer hover:opacity-90 transition"
                style={{ maxHeight: '300px' }}
                onClick={() => setLightbox(img)}
              />
            ))}
          </div>
        )}

        <div className="flex items-center gap-4 pt-2 border-t border-yt-border">
          <span className="text-yt-text-secondary text-sm flex items-center gap-1">
            <span>👍</span> {post.likes}
          </span>
          {post.postUrl && (
            <a
              href={post.postUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-yt-accent text-sm hover:opacity-80 transition flex items-center gap-1"
            >
              <span>🔗</span> {t(language, 'openOnYouTube')}
            </a>
          )}
        </div>
      </div>

      {lightbox && (
        <div
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          onClick={() => setLightbox(null)}
        >
          <img
            src={lightbox}
            alt="Lightbox"
            className="max-w-full max-h-[90vh] rounded-lg object-contain"
          />
        </div>
      )}
    </>
  );
}
