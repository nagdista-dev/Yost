import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';

const TaskTimerContext = createContext(null);

export function TaskTimerProvider({ children }) {
  const [tasks, setTasks] = useState([]);
  const [completedTask, setCompletedTask] = useState(null);
  const manualRemoveRef = useRef(null);

  const addTask = useCallback((name, durationMinutes) => {
    const id = Date.now().toString();
    const endTime = Date.now() + durationMinutes * 60 * 1000;
    setTasks(prev => [...prev, { id, name, endTime, duration: durationMinutes * 60 * 1000 }]);
    return id;
  }, []);

  const removeTask = useCallback((id) => {
    manualRemoveRef.current = id;
    setTasks(prev => prev.filter(t => t.id !== id));
  }, []);

  const clearCompletedTask = useCallback(() => {
    setCompletedTask(null);
  }, []);

  useEffect(() => {
    if (tasks.length === 0) return;
    const interval = setInterval(() => {
      const now = Date.now();
      setTasks(prev => {
        const expired = prev.filter(t => t.endTime <= now);
        if (expired.length > 0) {
          const completed = expired.find(t => t.id !== manualRemoveRef.current);
          if (completed) {
            setCompletedTask({ id: completed.id, name: completed.name });
          }
        }
        manualRemoveRef.current = null;
        return prev.filter(t => t.endTime > now);
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [tasks.length]);

  return (
    <TaskTimerContext.Provider value={{ tasks, addTask, removeTask, completedTask, clearCompletedTask }}>
      {children}
    </TaskTimerContext.Provider>
  );
}

export function useTaskTimer() {
  const ctx = useContext(TaskTimerContext);
  if (!ctx) throw new Error('useTaskTimer must be used within TaskTimerProvider');
  return ctx;
}
