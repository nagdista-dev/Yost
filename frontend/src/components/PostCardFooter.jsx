import { ThumbsUp, MessageCircle, ExternalLink, Share2, Copy } from 'lucide-react';
import toast from 'react-hot-toast';
import { useTheme } from '../context/useTheme';
import { t } from '../i18n';
import formatCount from '../utils/formatCount';

export default function PostCardFooter({ post, channelName, handle, onCommentsClick, onMarkSeen }) {
  const { language } = useTheme();

  function handleCopy() {
    onMarkSeen();
    navigator.clipboard.writeText(post.text).then(() => toast.success(t(language, 'textCopied'))).catch(() => {});
  }

  function handleShare() {
    onMarkSeen();
    const url = post.postUrl || `https://www.youtube.com/@${handle}`;
    if (navigator.share) {
      navigator.share({ title: channelName, url }).catch(() => {});
    } else {
      navigator.clipboard.writeText(url).then(() => toast.success(t(language, 'linkCopied'))).catch(() => {});
    }
  }

  return (
    <div className="flex items-center gap-5 px-4 py-3 border-t border-yt-border/60">
      <span className="flex items-center gap-1.5 text-yt-text-muted text-xs font-medium">
        <ThumbsUp size={13} className="text-yt-text-secondary" />
        {formatCount(post.likes)}
      </span>

      {post.postUrl && (
        <button
          onClick={onCommentsClick}
          className="inline-flex items-center gap-1.5 text-yt-text-muted text-xs font-medium hover:text-yt-accent transition-colors"
          aria-label="Comments"
        >
          <MessageCircle size={13} className="text-yt-text-secondary" />
          {formatCount(post.comments)}
        </button>
      )}

      <div className="flex-1" />

      {post.text && (
        <button
          onClick={handleCopy}
          className="inline-flex items-center justify-center w-9 h-9 rounded-xl text-yt-text-muted hover:text-yt-accent hover:bg-yt-accent/10 transition-all"
          aria-label={t(language, 'copyText')}
        >
          <Copy size={14} />
        </button>
      )}

      <button
        onClick={handleShare}
        className="inline-flex items-center justify-center w-9 h-9 rounded-xl text-yt-text-muted hover:text-yt-accent hover:bg-yt-accent/10 transition-all"
        aria-label={t(language, 'sharePost')}
      >
        <Share2 size={15} />
      </button>

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
  );
}
