export default function QuickButton({ icon: Icon, label, onClick, active }) {
  return (
    <button
      onClick={onClick}
      title={label}
      className={`flex items-center justify-center w-10 h-10 rounded-lg transition-colors ${
        active
          ? 'bg-yt-accent/15 text-yt-accent'
          : 'text-yt-text-muted hover:bg-yt-bg-tertiary hover:text-yt-text'
      }`}
    >
      <Icon size={18} />
    </button>
  );
}
