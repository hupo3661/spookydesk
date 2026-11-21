import { useContext, useId } from 'react';
import { useCostume } from '../../../engine/useCostume';
import { TasksContext } from '../../tasks/TasksContext';
import type { TimerState } from '../types';
import styles from './TaskBinder.module.css';

interface TaskBinderProps {
  boundTaskId: string | null;
  bindTask: (id: string | null) => void;
  state: TimerState;
}

export function TaskBinder({ boundTaskId, bindTask, state }: TaskBinderProps) {
  const { t } = useCostume();
  const tasksCtx = useContext(TasksContext);
  const selectId = useId();

  if (state !== 'idle' || tasksCtx === null) return null;

  const activeTasks = tasksCtx.tasks.filter((task) => task.status === 'active');
  const label = t('focus.taskBinderLabel');

  return (
    <div className={styles.root}>
      <label className={styles.label} htmlFor={selectId}>
        {label}
      </label>
      <select
        id={selectId}
        className={styles.select}
        aria-label={label}
        value={boundTaskId ?? ''}
        onChange={(e) => bindTask(e.target.value === '' ? null : e.target.value)}
      >
        <option value="">{t('focus.taskBinderNone')}</option>
        {activeTasks.map((task) => (
          <option key={task.id} value={task.id}>
            {task.title}
          </option>
        ))}
      </select>
    </div>
  );
}
