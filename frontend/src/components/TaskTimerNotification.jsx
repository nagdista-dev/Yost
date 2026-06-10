import { useState, useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { useTaskTimer } from '../context/TaskTimerContext';

export default function TaskTimerNotification() {
  const { tasks, removeTask, completedTask, clearCompletedTask } = useTaskTimer();
  const [now, setNow] = useState(Date.now());
  const audioRef = useRef(null);

  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio('/bell-notification.mp3');
    }
  }, []);

  useEffect(() => {
    if (!completedTask) return;
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => {});
    }
    clearCompletedTask();
  }, [completedTask, clearCompletedTask]);

  useEffect(() => {
    if (tasks.length === 0) return;
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [tasks.length]);

  if (tasks.length === 0) return null;

  const task = tasks[0];
  const remaining = Math.max(0, task.endTime - now);
  const totalDuration = task.duration;
  const progress = totalDuration > 0 ? 1 - (remaining / totalDuration) : 0;

  const hours = Math.floor(remaining / 3600000);
  const minutes = Math.floor((remaining % 3600000) / 60000);
  const seconds = Math.floor((remaining % 60000) / 1000);

  let timeString;
  if (hours > 0) {
    timeString = `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  } else {
    timeString = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }

  return (
    <div className="fixed bottom-0 inset-x-0 z-50 p-3 md:bottom-4 md:left-1/2 md:-translate-x-1/2 md:max-w-md md:p-0">
      <div className="bg-yt-bg-card/95 backdrop-blur-xl border border-yt-border rounded-2xl md:rounded-xl px-4 py-3.5 shadow-2xl flex items-center gap-3 md:gap-3 animate-slide-up md:animate-fade-in">
        <div className="w-9 h-9 md:w-8 md:h-8 rounded-xl bg-yt-accent shrink-0 flex items-center justify-center shadow-sm overflow-hidden">
          <svg viewBox="0 0 48 48" className="w-6 h-6 md:w-5 md:h-5">
            <rect width="48" height="48" rx="12" fill="white" />
            <text x="24" y="33" text-anchor="middle" fill="#ff0000" fontFamily="Inter, sans-serif" fontSize="26" fontWeight="900">Y</text>
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <span className="text-yt-text text-sm md:text-xs font-semibold truncate">{task.name}</span>
            <span className="text-yt-accent text-base md:text-sm font-bold tabular-nums whitespace-nowrap tracking-wider">{timeString}</span>
          </div>
          <div className="mt-2 h-1 bg-yt-bg-tertiary rounded-full overflow-hidden">
            <div
              className="h-full bg-yt-accent rounded-full transition-all duration-1000 ease-linear"
              style={{ width: `${Math.min(100, progress * 100)}%` }}
            />
          </div>
        </div>
        <button
          onClick={() => removeTask(task.id)}
          className="p-2 md:p-1.5 rounded-xl md:rounded-lg text-yt-text-muted hover:text-yt-text hover:bg-yt-bg-tertiary active:bg-yt-bg-tertiary transition shrink-0"
          aria-label="Cancel task"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
