import { useState, useEffect } from 'react';
import { Clock, CheckCircle2, ListTodo } from 'lucide-react';
import { useTaskTimer } from '../context/TaskTimerContext';
import { useTheme } from '../context/useTheme';
import { t } from '../i18n';
import TaskActionModal from './TaskActionModal';

export default function TaskTimeline({ onOpenTimer }) {
  const { allTasks } = useTaskTimer();
  const { language } = useTheme();
  const [now, setNow] = useState(Date.now());
  const [selectedTask, setSelectedTask] = useState(null);

  useEffect(() => {
    if (allTasks.length === 0) return;
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [allTasks.length]);

  const hasTasks = allTasks.length > 0;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-yt-text text-xl font-bold">{t(language, 'timeline')}</h2>
        <button
          onClick={onOpenTimer}
          className="flex items-center gap-1.5 bg-yt-accent hover:bg-yt-accent-hover text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors shadow-sm"
        >
          <Clock size={16} />
          <span>{t(language, 'newTask')}</span>
        </button>
      </div>

      {!hasTasks && (
        <div className="flex flex-col items-center justify-center py-20 text-yt-text-muted">
          <ListTodo size={48} className="opacity-30 mb-4" />
          <p className="text-sm">{t(language, 'noTasks')}</p>
        </div>
      )}

      <div className="space-y-2">
        {allTasks.map(task => {
          const isActive = task.status === 'active';
          const remaining = Math.max(0, task.endTime - now);
          const progress = task.duration > 0 ? 1 - (remaining / task.duration) : 0;

          const hours = Math.floor(remaining / 3600000);
          const mins = Math.floor((remaining % 3600000) / 60000);
          const secs = Math.floor((remaining % 60000) / 1000);

          let timeDisplay;
          if (!isActive) {
            timeDisplay = t(language, 'completed');
          } else if (hours > 0) {
            timeDisplay = `${hours}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
          } else {
            timeDisplay = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
          }

          return (
            <button
              key={task.id}
              onClick={() => setSelectedTask(task)}
              className="w-full text-start bg-yt-bg-card border border-yt-border rounded-xl px-4 py-3.5 hover:border-yt-accent/30 hover:shadow-md transition-all duration-200 group"
            >
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-xl shrink-0 flex items-center justify-center ${
                  isActive ? 'bg-yt-accent/10 text-yt-accent' : 'bg-green-500/10 text-green-500'
                }`}>
                  {isActive ? <Clock size={18} /> : <CheckCircle2 size={18} />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-3">
                    <span className={`text-sm font-semibold truncate ${
                      isActive ? 'text-yt-text' : 'text-yt-text-muted line-through'
                    }`}>
                      {task.name}
                    </span>
                    <span className={`text-sm font-bold tabular-nums whitespace-nowrap ${
                      isActive ? 'text-yt-accent' : 'text-green-500'
                    }`}>
                      {timeDisplay}
                    </span>
                  </div>
                  {isActive && (
                    <div className="mt-2 h-1 bg-yt-bg-tertiary rounded-full overflow-hidden">
                      <div
                        className="h-full bg-yt-accent rounded-full transition-all duration-1000 ease-linear"
                        style={{ width: `${Math.min(100, progress * 100)}%` }}
                      />
                    </div>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <TaskActionModal
        task={selectedTask}
        onClose={() => setSelectedTask(null)}
      />
    </div>
  );
}
