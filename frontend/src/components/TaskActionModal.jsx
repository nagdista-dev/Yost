import { useState } from 'react';
import { CheckCircle2, RotateCcw, Pencil, Trash2, X, Clock } from 'lucide-react';
import { useTaskTimer } from '../context/TaskTimerContext';
import { useTheme } from '../context/useTheme';
import { t } from '../i18n';
import TaskTimerModal from './TaskTimerModal';

export default function TaskActionModal({ task, onClose }) {
  const { removeTask, completeTask } = useTaskTimer();
  const { language } = useTheme();
  const [showEdit, setShowEdit] = useState(false);

  if (!task) return null;

  const isActive = task.status === 'active';
  const remaining = Math.max(0, task.endTime - Date.now());
  const hours = Math.floor(remaining / 3600000);
  const minutes = Math.floor((remaining % 3600000) / 60000);
  const seconds = Math.floor((remaining % 60000) / 1000);

  let timeDisplay;
  if (!isActive) {
    timeDisplay = t(language, 'completed');
  } else if (hours > 0) {
    timeDisplay = `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  } else {
    timeDisplay = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }

  function handleDelete() {
    removeTask(task.id);
    onClose();
  }

  function handleToggleComplete() {
    completeTask(task.id);
    onClose();
  }

  return (
    <>
      <div className="fixed top-0 left-0 w-screen h-screen z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
        <div
          className="bg-yt-bg-card rounded-xl p-6 border border-yt-border w-full max-w-sm mx-4 shadow-2xl"
          onClick={e => e.stopPropagation()}
        >
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                isActive ? 'bg-yt-accent/10 text-yt-accent' : 'bg-green-500/10 text-green-500'
              }`}>
                {isActive ? <Clock size={20} /> : <CheckCircle2 size={20} />}
              </div>
              <div>
                <h2 className="text-yt-text text-lg font-bold leading-tight">{task.name}</h2>
                <span className={`text-sm font-semibold ${
                  isActive ? 'text-yt-accent' : 'text-green-500'
                }`}>
                  {timeDisplay}
                </span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-yt-text-muted hover:text-yt-text hover:bg-yt-bg-tertiary transition"
            >
              <X size={18} />
            </button>
          </div>

          <div className="space-y-2">
            <button
              onClick={handleToggleComplete}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors hover:bg-yt-bg-tertiary text-start"
            >
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                isActive ? 'bg-green-500/10 text-green-500' : 'bg-yt-accent/10 text-yt-accent'
              }`}>
                {isActive ? <CheckCircle2 size={16} /> : <RotateCcw size={16} />}
              </div>
              <span className="text-yt-text">
                {isActive ? t(language, 'markComplete') : t(language, 'markActive')}
              </span>
            </button>

            <button
              onClick={() => setShowEdit(true)}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors hover:bg-yt-bg-tertiary text-start"
            >
              <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-blue-500/10 text-blue-500">
                <Pencil size={16} />
              </div>
              <span className="text-yt-text">{t(language, 'editTask')}</span>
            </button>

            <button
              onClick={handleDelete}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors hover:bg-red-500/10 text-start"
            >
              <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-red-500/10 text-red-500">
                <Trash2 size={16} />
              </div>
              <span className="text-red-500">{t(language, 'deleteTask')}</span>
            </button>
          </div>

          <div className="mt-4 pt-3 border-t border-yt-border">
            <button
              onClick={onClose}
              className="w-full py-2.5 rounded-xl text-sm font-medium text-yt-text-secondary hover:bg-yt-bg-tertiary transition"
            >
              {t(language, 'cancel')}
            </button>
          </div>
        </div>
      </div>

      <TaskTimerModal
        show={showEdit}
        onClose={() => setShowEdit(false)}
        editTask={task}
      />
    </>
  );
}
