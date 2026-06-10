import { useState, useCallback, useEffect } from 'react';
import toast from 'react-hot-toast';
import api from '../api';
import { useTheme } from '../context/useTheme';
import { t } from '../i18n';
import PostCardHeader from './PostCardHeader';
import PostCardBody from './PostCardBody';
import PostCardFooter from './PostCardFooter';
import ImageGrid from './ImageGrid';
import Lightbox from './Lightbox';
import CommentsModal from './CommentsModal';
import ChannelConfirmDialog from './ChannelConfirmDialog';

export default function PostCard({ post, channelName, channelAvatar, isSeen, onMarkSeen }) {
  const [lightboxIdx, setLightboxIdx] = useState(null);
  const [confirmChannel, setConfirmChannel] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState(null);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const { language } = useTheme();

  const handle = post._channelKey?.replace('@', '') || '';

  const markSeen = useCallback(() => {
    if (!isSeen && onMarkSeen) onMarkSeen();
  }, [isSeen, onMarkSeen]);

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

    let s = str.replace(
      /(\d+)\s*(minutes?|hours?|days?|weeks?|months?|years?)\s*ago/gi,
      (_, num, unit) => `منذ ${num} ${units[unit.toLowerCase()] || unit}`
    );

    s = s.replace(/\bago\b/gi, 'منذ');
    s = s.replace(/\bjust now\b/gi, 'الآن');

    return s;
  }

  function handleOpenComments() {
    markSeen();
    setShowComments(true);
    if (comments) return;
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

  return (
    <>
      <article
        className="bg-yt-bg-card rounded-2xl border border-yt-border shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden relative cursor-pointer"
        onClick={markSeen}
      >
        <PostCardHeader
          channelName={channelName}
          channelAvatar={channelAvatar}
          date={localizeDate(post.date)}
          isSeen={isSeen}
          onMarkSeen={markSeen}
          onChannelClick={() => { markSeen(); setConfirmChannel(true); }}
        />

        <PostCardBody text={post.text} />

        {post.images && post.images.length > 0 && (
          <div className="px-4 pb-3">
            <ImageGrid images={post.images} onOpen={i => setLightboxIdx(i)} />
          </div>
        )}

        <PostCardFooter
          post={post}
          channelName={channelName}
          handle={handle}
          onCommentsClick={handleOpenComments}
          onMarkSeen={markSeen}
        />
      </article>

      {lightboxIdx !== null && post.images?.length > 0 && (
        <Lightbox
          images={post.images}
          startIndex={lightboxIdx}
          onClose={() => setLightboxIdx(null)}
        />
      )}

      {showComments && (
        <CommentsModal
          channelName={channelName}
          post={post}
          comments={comments}
          loading={commentsLoading}
          onClose={() => setShowComments(false)}
        />
      )}

      {confirmChannel && (
        <ChannelConfirmDialog
          channelName={channelName}
          handle={handle}
          onClose={() => setConfirmChannel(false)}
        />
      )}
    </>
  );
}
