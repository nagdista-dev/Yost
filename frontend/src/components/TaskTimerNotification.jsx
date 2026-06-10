import { useState, useEffect, useRef } from 'react';
import { X, Clock } from 'lucide-react';
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
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 max-w-[90vw]">
      <div className="bg-yt-bg-card border border-yt-border rounded-xl px-4 py-3 shadow-2xl flex items-center gap-3 min-w-[260px]">
        <Clock size={18} className="text-yt-accent shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-3">
            <span className="text-yt-text text-sm font-medium truncate">{task.name}</span>
            <span className="text-yt-accent text-sm font-bold tabular-nums whitespace-nowrap">{timeString}</span>
          </div>
          <div className="mt-1.5 h-1 bg-yt-bg-tertiary rounded-full overflow-hidden">
            <div
              className="h-full bg-yt-accent rounded-full transition-all duration-1000 ease-linear"
              style={{ width: `${Math.min(100, progress * 100)}%` }}
            />
          </div>
        </div>
        <button
          onClick={() => removeTask(task.id)}
          className="p-1 rounded-lg text-yt-text-muted hover:text-yt-text hover:bg-yt-bg-tertiary transition shrink-0"
          aria-label="Cancel task"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
}
