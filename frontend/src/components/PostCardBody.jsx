import { useState } from 'react';
import { useTheme } from '../context/useTheme';
import { t } from '../i18n';
import renderTextWithLinks from '../utils/renderTextWithLinks.jsx';

const TEXT_LIMIT = 220;

export default function PostCardBody({ text }) {
  const [expanded, setExpanded] = useState(false);
  const { language } = useTheme();

  if (!text) return null;

  const isLong = text.length > TEXT_LIMIT;
  const displayText = isLong && !expanded ? text.slice(0, TEXT_LIMIT) + '…' : text;

  return (
    <div className="px-4 pb-1">
      <p className="text-yt-text text-sm leading-relaxed whitespace-pre-wrap break-words" style={{ fontSize: 'var(--font-size-base)' }}>
        {renderTextWithLinks(displayText)}
      </p>
      {isLong && (
        <button
          onClick={e => { e.stopPropagation(); setExpanded(!expanded); }}
          className="text-yt-accent text-xs mt-2 font-medium hover:opacity-75 transition-opacity"
        >
          {expanded ? t(language, 'showLess') : t(language, 'showMore')}
        </button>
      )}
    </div>
  );
}
