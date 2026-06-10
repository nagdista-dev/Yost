import { ThumbsUp, X } from 'lucide-react';
import { useTheme } from '../context/useTheme';
import { t } from '../i18n';

export default function CommentsModal({ channelName, post, comments, loading, onClose }) {
  const { language } = useTheme();

  return (
    <div
      className="fixed top-0 left-0 w-screen h-screen z-50 flex items-center justify-center bg-black/50"
      onClick={onClose}
    >
      <div
        className="bg-yt-bg-card rounded-2xl border border-yt-border shadow-xl mx-4 w-full max-w-lg max-h-[80vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-yt-border/60 shrink-0">
          <h3 className="text-yt-text font-bold text-sm">{t(language, 'comments')}</h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-yt-text-muted hover:text-yt-text hover:bg-yt-bg-tertiary transition"
          >
            <X size={18} />
          </button>
        </div>

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

        <div className="flex-1 overflow-y-auto px-5 py-3 space-y-4">
          {loading ? (
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
  );
}
