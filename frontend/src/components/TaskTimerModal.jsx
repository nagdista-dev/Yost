import { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';
import { useTaskTimer } from '../context/TaskTimerContext';
import { useTheme } from '../context/useTheme';
import { t } from '../i18n';

const PRESETS = [
  { label: '5m', value: 5 },
  { label: '15m', value: 15 },
  { label: '30m', value: 30 },
  { label: '1h', value: 60 },
  { label: '2h', value: 120 },
];

export default function TaskTimerModal({ show, onClose, editTask }) {
  const [name, setName] = useState('');
  const [duration, setDuration] = useState(30);
  const [customMinutes, setCustomMinutes] = useState('');
  const { addTask, updateTask } = useTaskTimer();
  const { language } = useTheme();
  const isEditing = !!editTask;

  useEffect(() => {
    if (editTask) {
      setName(editTask.name);
      const durMinutes = Math.round(editTask.duration / 60000);
      if (PRESETS.some(p => p.value === durMinutes)) {
        setDuration(durMinutes);
        setCustomMinutes('');
      } else {
        setDuration(30);
        setCustomMinutes(String(durMinutes));
      }
    } else {
      setName('');
      setDuration(30);
      setCustomMinutes('');
    }
  }, [editTask, show]);

  function handleSubmit() {
    const finalDuration = customMinutes ? parseInt(customMinutes, 10) : duration;
    if (!finalDuration || finalDuration <= 0) return;
    if (isEditing) {
      updateTask(editTask.id, {
        name: name.trim() || editTask.name,
        endTime: Date.now() + finalDuration * 60 * 1000,
        duration: finalDuration * 60 * 1000,
      });
    } else {
      addTask(name.trim() || t(language, 'taskTimer'), finalDuration);
    }
    onClose();
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter') handleSubmit();
  }

  if (!show) return null;

  return (
    <div className="fixed top-0 left-0 w-screen h-screen z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div
        className="bg-yt-bg-card rounded-xl p-6 border border-yt-border w-full max-w-sm mx-4 shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 mb-5">
          <Clock size={20} className="text-yt-accent" />
          <h2 className="text-yt-text text-lg font-bold">
            {isEditing ? t(language, 'editTask') : t(language, 'taskTimer')}
          </h2>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-yt-text-secondary text-xs font-medium mb-1.5 block">
              {t(language, 'taskName')}
            </label>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={t(language, 'taskNamePlaceholder')}
              className="w-full bg-yt-input text-yt-text rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-yt-accent placeholder-yt-text-muted"
              autoFocus
            />
          </div>

          <div>
            <label className="text-yt-text-secondary text-xs font-medium mb-1.5 block">
              {t(language, 'taskDuration')}
            </label>
            <div className="flex flex-wrap gap-2 mb-2">
              {PRESETS.map(p => (
                <button
                  key={p.value}
                  onClick={() => { setDuration(p.value); setCustomMinutes(''); }}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    !customMinutes && duration === p.value
                      ? 'bg-yt-accent text-white'
                      : 'bg-yt-bg-tertiary text-yt-text-secondary hover:text-yt-text'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="1"
                max="1440"
                value={customMinutes}
                onChange={e => setCustomMinutes(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={t(language, 'customMin')}
                className="w-24 bg-yt-input text-yt-text rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-yt-accent placeholder-yt-text-muted [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
              <span className="text-yt-text-secondary text-xs">{t(language, 'minutes')}</span>
            </div>
          </div>
        </div>

        <div className="flex gap-2 justify-end mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm font-medium text-yt-text-secondary hover:bg-yt-bg-tertiary transition"
          >
            {t(language, 'cancel')}
          </button>
          <button
            onClick={handleSubmit}
            className="bg-yt-accent hover:bg-yt-accent-hover text-white px-4 py-2 rounded-lg text-sm font-medium transition"
          >
            {isEditing ? t(language, 'save') : t(language, 'startTask')}
          </button>
        </div>
      </div>
    </div>
  );
}
