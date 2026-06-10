import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';

const TaskTimerContext = createContext(null);

export function TaskTimerProvider({ children }) {
  const [tasks, setTasks] = useState([]);
  const [completedTask, setCompletedTask] = useState(null);
  const manualRemoveRef = useRef(null);
  const notificationTimeouts = useRef({});

  const addTask = useCallback((name, durationMinutes) => {
    const id = Date.now().toString();
    const endTime = Date.now() + durationMinutes * 60 * 1000;
    setTasks(prev => [...prev, {
      id, name, endTime,
      duration: durationMinutes * 60 * 1000,
      status: 'active',
      createdAt: Date.now(),
    }]);
    return id;
  }, []);

  const removeTask = useCallback((id) => {
    manualRemoveRef.current = id;
    setTasks(prev => prev.filter(t => t.id !== id));
  }, []);

  const completeTask = useCallback((id) => {
    setTasks(prev => prev.map(t =>
      t.id === id ? { ...t, status: t.status === 'active' ? 'completed' : 'active' } : t
    ));
  }, []);

  const updateTask = useCallback((id, updates) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
  }, []);

  const clearCompletedTask = useCallback(() => {
    setCompletedTask(null);
  }, []);

  useEffect(() => {
    if (tasks.length === 0) return;
    const interval = setInterval(() => {
      const now = Date.now();
      setTasks(prev => {
        const expired = prev.filter(t => t.status === 'active' && t.endTime <= now);
        if (expired.length > 0) {
          const completed = expired.find(t => t.id !== manualRemoveRef.current);
          if (completed) {
            setCompletedTask({ id: completed.id, name: completed.name });
          }
        }
        manualRemoveRef.current = null;
        return prev.map(t =>
          t.status === 'active' && t.endTime <= now
            ? { ...t, status: 'completed' }
            : t
        );
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [tasks.length]);

  const activeTasks = tasks.filter(t => t.status === 'active');
  const allTasks = [...tasks].sort((a, b) => b.createdAt - a.createdAt);

  return (
    <TaskTimerContext.Provider value={{
      tasks: activeTasks,
      allTasks,
      addTask,
      removeTask,
      completeTask,
      updateTask,
      completedTask,
      clearCompletedTask,
    }}>
      {children}
    </TaskTimerContext.Provider>
  );
}

export function useTaskTimer() {
  const ctx = useContext(TaskTimerContext);
  if (!ctx) throw new Error('useTaskTimer must be used within TaskTimerProvider');
  return ctx;
}
