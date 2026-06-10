import { Plus } from 'lucide-react';

export default function FloatingAddButton({ onClick }) {
  return (
    <button
      onClick={onClick}
      className="md:hidden fixed bottom-6 end-6 z-40 w-14 h-14 rounded-full bg-yt-accent text-white shadow-lg flex items-center justify-center hover:scale-110 active:scale-95 transition-all"
      aria-label="Add channel"
    >
      <Plus size={26} />
    </button>
  );
}
