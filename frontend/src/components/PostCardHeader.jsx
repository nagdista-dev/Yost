import { useState } from 'react';

export default function PostCardHeader({ channelName, channelAvatar, date, isSeen, onMarkSeen, onChannelClick }) {
  const [imgError, setImgError] = useState(false);

  return (
    <div className="flex items-start gap-3 px-4 pt-4 pb-3">
      {!isSeen && (
        <div className="absolute top-4 start-4 w-2.5 h-2.5 rounded-full bg-blue-500 ring-2 ring-yt-bg-card z-10" />
      )}
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
      <div className="min-w-0 flex-1">
        <span
          role="button"
          tabIndex={0}
          onClick={onChannelClick}
          onKeyDown={e => e.key === 'Enter' && onChannelClick()}
          className="cursor-pointer block text-yt-text font-semibold text-sm leading-tight truncate hover:text-yt-accent transition-colors"
        >
          {channelName}
        </span>
        <p className="text-yt-text-muted text-xs mt-0.5">{date}</p>
      </div>
    </div>
  );
}
