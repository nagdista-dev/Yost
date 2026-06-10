export default function renderTextWithLinks(text) {
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
