import { Tag } from 'lucide-react';

export default function CategoryButton({ cat, isSelected, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm font-medium transition ${
        isSelected
          ? 'bg-yt-accent/10 text-yt-accent'
          : 'text-yt-text-secondary hover:bg-yt-bg-tertiary hover:text-yt-text'
      }`}
    >
      <Tag size={14} className="opacity-60" />
      <span className="truncate">{cat}</span>
    </button>
  );
}
