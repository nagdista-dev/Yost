import { useState, useCallback, useEffect } from 'react';
import { ThumbsUp, ExternalLink, X, ChevronLeft, ChevronRight, ImageOff, Share2, MessageCircle, Copy } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api';
import { useTheme } from '../context/useTheme';
import { t } from '../i18n';

// ── helpers ────────────────────────────────────────────────────────────────────

function formatCount(raw) {
  if (!raw || raw === '0') return '0';
  return raw;
}

function renderTextWithLinks(text) {
  if (!text) return null;
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const parts = text.split(urlRegex);
  return parts.map((part, i) =>
    part.match(urlRegex) ? (
      <a
        key={i}
        href={part}
        target="_blank"
        rel="noopener noreferrer"
        className="text-yt-accent underline underline-offset-2 font-medium break-all hover:opacity-80 transition-opacity"
        onClick={e => e.stopPropagation()}
      >
        {part}
      </a>
    ) : (
      part
    )
  );
}

// ── Lightbox ──────────────────────────────────────────────────────────────────

function Lightbox({ images, startIndex, onClose }) {
  const [idx, setIdx] = useState(startIndex);

  const prev = useCallback(e => {
    e.stopPropagation();
    setIdx(i => (i - 1 + images.length) % images.length);
  }, [images.length]);

  const next = useCallback(e => {
    e.stopPropagation();
    setIdx(i => (i + 1) % images.length);
  }, [images.length]);

  return (
    <div
      className="fixed top-0 left-0 w-screen h-screen z-50 flex items-center justify-center bg-black/90"
      onClick={onClose}
    >
      {/* Close */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition"
        aria-label="Close"
      >
        <X size={20} />
      </button>

      {/* Counter */}
      {images.length > 1 && (
        <span className="absolute top-4 left-4 z-10 text-white/70 text-sm font-medium">
          {idx + 1} / {images.length}
        </span>
      )}

      {/* Image */}
      <img
        src={images[idx]}
        alt={`Image ${idx + 1}`}
        className="max-h-[90vh] max-w-[90vw] rounded-xl object-contain select-none"
        onClick={e => e.stopPropagation()}
      />

      {/* Prev / Next */}
      {images.length > 1 && (
        <>
          <button
            onClick={prev}
            className="absolute left-3 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition"
          >
            <ChevronLeft size={24} />
          </button>
          <button
            onClick={next}
            className="absolute right-3 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition"
          >
            <ChevronRight size={24} />
          </button>
        </>
      )}

      {/* Dot strip */}
      {images.length > 1 && (
        <div className="absolute bottom-5 flex gap-1.5">
          {images.map((_, i) => (
            <button
              key={i}
              onClick={e => { e.stopPropagation(); setIdx(i); }}
              className={`h-1.5 rounded-full transition-all ${i === idx ? 'w-5 bg-white' : 'w-1.5 bg-white/40'}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Lazy Image ────────────────────────────────────────────────────────────────

function LazyImage({ src, alt, imgClassName, wrapperClassName, onClick }) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  return (
    <div
      className={`relative overflow-hidden ${wrapperClassName || ''}`}
      onClick={onClick}
    >
      {!loaded && !error && (
        <div className="absolute inset-0 bg-yt-bg-tertiary animate-pulse" />
      )}
      {!error ? (
        <img
          src={src}
          alt={alt}
          loading="lazy"
          decoding="async"
          className={`${imgClassName || ''} transition-opacity duration-300 ${loaded ? 'opacity-100' : 'opacity-0'}`}
          onLoad={() => setLoaded(true)}
          onError={() => setError(true)}
        />
      ) : (
        <div className="absolute inset-0 bg-yt-bg-tertiary flex items-center justify-center">
          <ImageOff size={24} className="text-yt-text-muted/50" />
        </div>
      )}
    </div>
  );
}

// ── Image Grid ────────────────────────────────────────────────────────────────

function ImageGrid({ images, onOpen }) {
  const count = images.length;
  const visible = images.slice(0, 4);
  const extra = count - 4;

  if (count === 1) {
    return (
      <div
        className="rounded-xl overflow-hidden cursor-pointer border border-yt-border bg-yt-bg-tertiary mt-3"
        onClick={() => onOpen(0)}
      >
        <LazyImage
          src={images[0]}
          alt="Post image"
          imgClassName="w-full max-h-[420px] object-cover hover:opacity-95 transition-opacity duration-200"
        />
      </div>
    );
  }

  if (count === 2) {
    return (
      <div className="grid grid-cols-2 gap-1.5 rounded-xl overflow-hidden mt-3">
        {images.map((img, i) => (
          <LazyImage
            key={i}
            src={img}
            alt={`Image ${i + 1}`}
            wrapperClassName="aspect-square cursor-pointer border border-yt-border rounded-xl"
            imgClassName="w-full h-full object-cover hover:scale-[1.02] transition-transform duration-200"
            onClick={() => onOpen(i)}
          />
        ))}
      </div>
    );
  }

  if (count === 3) {
    return (
      <div className="grid grid-cols-2 gap-1.5 rounded-xl overflow-hidden mt-3">
        <LazyImage
          src={images[0]}
          alt="Image 1"
          wrapperClassName="row-span-2 aspect-[3/4] md:aspect-square cursor-pointer border border-yt-border rounded-xl"
          imgClassName="w-full h-full object-cover hover:scale-[1.02] transition-transform duration-200"
          onClick={() => onOpen(0)}
        />
        <div className="flex flex-col gap-1.5">
          {images.slice(1).map((img, i) => (
            <LazyImage
              key={i}
              src={img}
              alt={`Image ${i + 2}`}
              wrapperClassName="flex-1 aspect-square cursor-pointer border border-yt-border rounded-xl"
              imgClassName="w-full h-full object-cover hover:scale-[1.02] transition-transform duration-200"
              onClick={() => onOpen(i + 1)}
            />
          ))}
        </div>
      </div>
    );
  }

  // 4+
  return (
    <div className="grid grid-cols-2 gap-1.5 mt-3">
      {visible.map((img, i) => (
        <div
          key={i}
          className="relative aspect-square overflow-hidden cursor-pointer border border-yt-border rounded-xl"
          onClick={() => onOpen(i)}
        >
          <LazyImage
            src={img}
            alt={`Image ${i + 1}`}
            imgClassName="w-full h-full object-cover hover:scale-[1.02] transition-transform duration-200"
          />
          {i === 3 && extra > 0 && (
            <div className="absolute inset-0 bg-black/55 flex items-center justify-center text-white font-bold text-2xl pointer-events-none">
              +{extra}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ── PostCard ──────────────────────────────────────────────────────────────────

export default function PostCard({ post, channelName, channelAvatar, isSeen, onMarkSeen }) {
  const [expanded, setExpanded] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [lightboxIdx, setLightboxIdx] = useState(null);
  const [confirmChannel, setConfirmChannel] = useState(null);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState(null);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const { language } = useTheme();

  const handle = post._channelKey?.replace('@', '') || '';

  // Mark as seen on first interaction
  const markSeen = useCallback(() => {
    if (!isSeen && onMarkSeen) onMarkSeen();
  }, [isSeen, onMarkSeen]);

  // Close modals on Escape
  useEffect(() => {
    function onKeyDown(e) {
      if (e.key === 'Escape') {
        setLightboxIdx(null);
        setConfirmChannel(false);
        setShowComments(false);
      }
    }
    if (lightboxIdx !== null || confirmChannel || showComments) {
      document.addEventListener('keydown', onKeyDown);
      return () => document.removeEventListener('keydown', onKeyDown);
    }
  }, [lightboxIdx, confirmChannel, showComments]);

  // Helper to localize relative time strings for Arabic
  function localizeDate(str) {
    if (!str) return '';
    if (language !== 'ar') return str;

    const units = {
      'minute': 'دقيقة', 'minutes': 'دقيقة',
      'hour': 'ساعة', 'hours': 'ساعة',
      'day': 'يوم', 'days': 'يوم',
      'week': 'أسبوع', 'weeks': 'أسابيع',
      'month': 'شهر', 'months': 'أشهر',
      'year': 'سنة', 'years': 'سنوات',
    };

    // Match full pattern: "2 days ago" → "منذ 2 يوم"
    let s = str.replace(
      /(\d+)\s*(minutes?|hours?|days?|weeks?|months?|years?)\s*ago/gi,
      (_, num, unit) => `منذ ${num} ${units[unit.toLowerCase()] || unit}`
    );

    // Handle remaining standalone "ago" that wasn't part of pattern above
    s = s.replace(/\bago\b/gi, 'منذ');
    s = s.replace(/\bjust now\b/gi, 'الآن');

    return s;
  }

  function handleOpenComments() {
    markSeen();
    setShowComments(true);
    if (comments) return; // already loaded
    setCommentsLoading(true);
    api.get('/api/comments', { params: { postUrl: post.postUrl } })
      .then(({ data }) => {
        setComments(data.comments);
        setCommentsLoading(false);
      })
      .catch((err) => {
        const msg = err.response?.data?.error || 'Failed to load comments';
        toast.error(msg);
        setCommentsLoading(false);
      });
  }

  const TEXT_LIMIT = 220;
  const isLong = (post.text || '').length > TEXT_LIMIT;
  const displayText = isLong && !expanded ? post.text.slice(0, TEXT_LIMIT) + '…' : post.text;

  return (
    <>
      <article
        className="bg-yt-bg-card rounded-2xl border border-yt-border shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden relative cursor-pointer"
        onClick={markSeen}
      >
        {/* Seen indicator */}
        {!isSeen && (
          <div className="absolute top-4 start-4 w-2.5 h-2.5 rounded-full bg-blue-500 ring-2 ring-yt-bg-card z-10" />
        )}

        {/* ── Header ── */}
        <div className="flex items-start gap-3 px-4 pt-4 pb-3">
          {/* Avatar */}
          {channelAvatar && !imgError ? (
            <img
              src={channelAvatar}
              alt={channelName}
              className="w-10 h-10 rounded-full object-cover shrink-0 border border-yt-border"
              loading="lazy"
              decoding="async"
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-yt-accent/30 to-yt-accent/10 border border-yt-accent/20 flex items-center justify-center text-yt-accent font-bold uppercase shrink-0 text-base">
              {channelName ? channelName.charAt(0) : '?'}
            </div>
          )}

          {/* Name + date */}
          <div className="min-w-0 flex-1">
            <span
              role="button"
              tabIndex={0}
              onClick={() => { markSeen(); setConfirmChannel(true); }}
              onKeyDown={e => e.key === 'Enter' && setConfirmChannel(true)}
              className="cursor-pointer block text-yt-text font-semibold text-sm leading-tight truncate hover:text-yt-accent transition-colors"
            >
              {channelName}
            </span>
            <p className="text-yt-text-muted text-xs mt-0.5">{localizeDate(post.date)}</p>
          </div>
        </div>

        {/* ── Text body ── */}
        {post.text ? (
          <div className="px-4 pb-1">
            <p className="text-yt-text text-sm leading-relaxed whitespace-pre-wrap break-words" style={{ fontSize: 'var(--font-size-base)' }}>
              {renderTextWithLinks(displayText)}
            </p>
            {isLong && (
              <button
                onClick={() => { markSeen(); setExpanded(!expanded); }}
                className="text-yt-accent text-xs mt-2 font-medium hover:opacity-75 transition-opacity"
              >
                {expanded ? t(language, 'showLess') : t(language, 'showMore')}
              </button>
            )}
          </div>
        ) : null}

        {/* ── Images ── */}
        {post.images && post.images.length > 0 && (
          <div className="px-4 pb-3">
            <ImageGrid images={post.images} onOpen={i => setLightboxIdx(i)} />
          </div>
        )}

        {/* ── Footer ── */}
        <div className="flex items-center gap-5 px-4 py-3 border-t border-yt-border/60">
          {/* Likes */}
          <span className="flex items-center gap-1.5 text-yt-text-muted text-xs font-medium">
            <ThumbsUp size={13} className="text-yt-text-secondary" />
            {formatCount(post.likes)}
          </span>

          {/* Comments */}
          {post.postUrl && (
            <button
              onClick={handleOpenComments}
              className="inline-flex items-center gap-1.5 text-yt-text-muted text-xs font-medium hover:text-yt-accent transition-colors"
              aria-label="Comments"
            >
              <MessageCircle size={13} className="text-yt-text-secondary" />
              {formatCount(post.comments)}
            </button>
          )}

          {/* Spacer */}
          <div className="flex-1" />

          {/* Copy text */}
          {post.text && (
            <button
              onClick={() => {
                markSeen();
                navigator.clipboard.writeText(post.text).then(() => toast.success(t(language, 'textCopied'))).catch(() => {});
              }}
              className="inline-flex items-center justify-center w-9 h-9 rounded-xl text-yt-text-muted hover:text-yt-accent hover:bg-yt-accent/10 transition-all"
              aria-label={t(language, 'copyText')}
            >
              <Copy size={14} />
            </button>
          )}

          {/* Share */}
          <button
            onClick={() => {
              markSeen();
              const url = post.postUrl || `https://www.youtube.com/@${handle}`;
              if (navigator.share) {
                navigator.share({ title: channelName, url }).catch(() => {});
              } else {
                navigator.clipboard.writeText(url).then(() => toast.success(t(language, 'linkCopied'))).catch(() => {});
              }
            }}
            className="inline-flex items-center justify-center w-9 h-9 rounded-xl text-yt-text-muted hover:text-yt-accent hover:bg-yt-accent/10 transition-all"
            aria-label={t(language, 'sharePost')}
          >
            <Share2 size={15} />
          </button>

          {/* Open on YouTube */}
          {post.postUrl && (
            <a
              href={post.postUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-yt-accent/10 hover:bg-yt-accent/20 text-yt-accent text-xs font-semibold transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <ExternalLink size={15} />
              {t(language, 'openOnYouTube')}
            </a>
          )}
        </div>
      </article>

      {/* ── Lightbox ── */}
      {lightboxIdx !== null && post.images?.length > 0 && (
        <Lightbox
          images={post.images}
          startIndex={lightboxIdx}
          onClose={() => setLightboxIdx(null)}
        />
      )}

      {/* ── Comments modal ── */}
      {showComments && (
        <div
          className="fixed top-0 left-0 w-screen h-screen z-50 flex items-center justify-center bg-black/50"
          onClick={() => setShowComments(false)}
        >
          <div
            className="bg-yt-bg-card rounded-2xl border border-yt-border shadow-xl mx-4 w-full max-w-lg max-h-[80vh] flex flex-col"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-yt-border/60 shrink-0">
              <h3 className="text-yt-text font-bold text-sm">{t(language, 'comments')}</h3>
              <button
                onClick={() => setShowComments(false)}
                className="p-1.5 rounded-lg text-yt-text-muted hover:text-yt-text hover:bg-yt-bg-tertiary transition"
              >
                <X size={18} />
              </button>
            </div>

            {/* Post preview */}
            <div className="px-5 py-3 border-b border-yt-border/40 shrink-0">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-yt-accent/30 to-yt-accent/10 flex items-center justify-center text-yt-accent font-bold uppercase text-[10px]">
                  {channelName ? channelName.charAt(0) : '?'}
                </div>
                <span className="text-yt-text font-semibold text-xs truncate">{channelName}</span>
              </div>
              <p className="text-yt-text-secondary text-xs leading-relaxed line-clamp-2">
                {post.text || ''}
              </p>
            </div>

            {/* Comments list */}
            <div className="flex-1 overflow-y-auto px-5 py-3 space-y-4">
              {commentsLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="w-6 h-6 border-2 border-yt-accent border-t-transparent rounded-full animate-spin" />
                </div>
              ) : !comments || comments.length === 0 ? (
                <p className="text-yt-text-muted text-sm text-center py-8">
                  {t(language, 'noComments')}
                </p>
              ) : (
                comments.map((c, i) => (
                  <div key={i} className="flex gap-3">
                    {c.avatar ? (
                      <img
                        src={c.avatar}
                        alt={c.author}
                        className="w-8 h-8 rounded-full object-cover shrink-0 border border-yt-border"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-yt-accent/20 flex items-center justify-center text-yt-accent font-bold text-xs shrink-0">
                        {c.author ? c.author.charAt(0).toUpperCase() : '?'}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-yt-text text-xs font-semibold truncate">{c.author}</span>
                        <span className="text-yt-text-muted text-[10px] shrink-0">{c.time}</span>
                      </div>
                      <p className="text-yt-text text-xs mt-0.5 leading-relaxed whitespace-pre-wrap break-words">
                        {c.text}
                      </p>
                      <div className="flex items-center gap-3 mt-1.5">
                        <span className="flex items-center gap-1 text-yt-text-muted text-[10px]">
                          <ThumbsUp size={10} />
                          {c.likes !== '0' ? c.likes : ''}
                        </span>
                        {c.replies && (
                          <span className="text-yt-text-muted text-[10px]">{c.replies}</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Channel confirm ── */}
      {confirmChannel && (
        <div
          className="fixed top-0 left-0 w-screen h-screen z-50 flex items-center justify-center bg-black/50"
          onClick={() => setConfirmChannel(false)}
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
                onClick={() => setConfirmChannel(false)}
                className="px-4 py-2 rounded-lg text-sm font-medium text-yt-text-muted hover:bg-yt-bg-tertiary transition-colors"
              >
                {t(language, 'cancel')}
              </button>
              <button
                onClick={() => {
                  setConfirmChannel(false);
                  window.open(`https://www.youtube.com/@${handle}`, '_blank', 'noopener noreferrer');
                }}
                className="px-4 py-2 rounded-lg text-sm font-medium bg-yt-accent text-white hover:opacity-90 transition-opacity"
              >
                {t(language, 'openChannel')}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
