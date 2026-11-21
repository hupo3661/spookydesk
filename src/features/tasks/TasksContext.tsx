import { createContext, useContext, useState, type ReactNode } from 'react';
import { getSetting, setSetting } from '../../engine/storage';
import {
  incrementMonstersDefeated,
  loadTasksStore,
  saveTasksStore,
  type TasksStore,
} from './storage';
import type { NewTaskDraft, Task, TaskFilter } from './types';
import { updateStreak } from '../today-stats/streakStorage';
import { toLocalDate } from '../today-stats/dateUtils';

interface TasksContextValue {
  tasks: Task[];
  monstersDefeated: number;
  addTask: (draft: NewTaskDraft) => void;
  updateTask: (id: string, patch: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  completeTask: (id: string) => void;
  filter: TaskFilter;
  setFilter: (f: TaskFilter) => void;
  filteredTasks: Task[];
}

export const TasksContext = createContext<TasksContextValue | null>(null);

function readInitialFilter(): TaskFilter {
  const value = getSetting('tasksFilter');
  return value === 'today' || value === 'all' || value === 'completed'
    ? value
    : 'all';
}

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

/** Local calendar date as YYYY-MM-DD. */
function localToday(): string {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function deriveFilteredTasks(tasks: Task[], filter: TaskFilter): Task[] {
  switch (filter) {
    case 'today': {
      const today = localToday();
      return tasks.filter(
        (t) =>
          t.dueDate === today || (t.dueDate === null && t.status !== 'done'),
      );
    }
    case 'completed':
      return tasks
        .filter((t) => t.status === 'done')
        .sort((a, b) => {
          if (a.completedAt === b.completedAt) return 0;
          if (a.completedAt === null) return 1;
          if (b.completedAt === null) return -1;
          return a.completedAt < b.completedAt ? 1 : -1;
        });
    case 'all':
    default:
      return tasks.filter((t) => t.status !== 'done');
  }
}

export function TasksProvider({ children }: { children: ReactNode }) {
  const [store, setStore] = useState<TasksStore>(() => loadTasksStore());
  const [filter, setFilterState] = useState<TaskFilter>(readInitialFilter);

  function commit(next: TasksStore): void {
    saveTasksStore(next);
    setStore(next);
  }

  function addTask(draft: NewTaskDraft): void {
    const now = new Date().toISOString();
    const task: Task = {
      id: crypto.randomUUID(),
      title: draft.title,
      priority: draft.priority,
      dueDate: draft.dueDate,
      category: draft.category,
      status: 'active',
      completedAt: null,
      linkedSessionId: null,
      createdAt: now,
      updatedAt: now,
    };
    commit({ ...store, tasks: [...store.tasks, task] });
  }

  function updateTask(id: string, patch: Partial<Task>): void {
    const now = new Date().toISOString();
    commit({
      ...store,
      tasks: store.tasks.map((t) =>
        t.id === id ? { ...t, ...patch, id: t.id, updatedAt: now } : t,
      ),
    });
  }

  function deleteTask(id: string): void {
    commit({ ...store, tasks: store.tasks.filter((t) => t.id !== id) });
  }

  function completeTask(id: string): void {
    const task = store.tasks.find((t) => t.id === id);
    if (!task || task.status === 'done') return;
    // Persists +1 against the stored copy; the state below mirrors it.
    incrementMonstersDefeated();
    updateStreak(toLocalDate());
    const now = new Date().toISOString();
    commit({
      ...store,
      monstersDefeated: store.monstersDefeated + 1,
      tasks: store.tasks.map((t) =>
        t.id === id
          ? { ...t, status: 'done', completedAt: now, updatedAt: now }
          : t,
      ),
    });
  }

  function setFilter(f: TaskFilter): void {
    setFilterState(f);
    setSetting('tasksFilter', f);
  }

  const value: TasksContextValue = {
    tasks: store.tasks,
    monstersDefeated: store.monstersDefeated,
    addTask,
    updateTask,
    deleteTask,
    completeTask,
    filter,
    setFilter,
    filteredTasks: deriveFilteredTasks(store.tasks, filter),
  };

  return <TasksContext.Provider value={value}>{children}</TasksContext.Provider>;
}

export function useTasksContext(): TasksContextValue {
  const ctx = useContext(TasksContext);
  if (ctx === null) {
    throw new Error('useTasksContext must be used within a TasksProvider');
  }
  return ctx;
}
