import { useRef, useState } from 'react';
import { useCostume } from '../../../engine/useCostume';
import { useTasksContext } from '../TasksContext';
import type { Task } from '../types';
import { EditTaskModal } from './EditTaskModal';
import { LinkedSessionBadge } from './LinkedSessionBadge';
import { PriorityBadge } from './PriorityBadge';
import styles from './TaskItem.module.css';

interface TaskItemProps {
  task: Task;
}

export function TaskItem({ task }: TaskItemProps) {
  const { t, play } = useCostume();
  const { completeTask, deleteTask } = useTasksContext();
  const [completing, setCompleting] = useState(false);
  const [editing, setEditing] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const completedRef = useRef(false);

  function finishComplete() {
    if (completedRef.current) return;
    completedRef.current = true;
    completeTask(task.id);
    setCompleting(false);
  }

  function handleComplete() {
    if (task.status !== 'active' || completing || completedRef.current) return;
    setCompleting(true);
    play('task-complete');
    // Fallback in case animationend never fires. Not cleared on unmount so
    // the completion is never lost.
    setTimeout(finishComplete, 900);
  }

  function handleAnimationEnd() {
    if (completing) finishComplete();
  }

  function handleDelete() {
    if (!confirmingDelete) {
      setConfirmingDelete(true);
      return;
    }
    deleteTask(task.id);
  }

  const rootClass =
    task.status === 'done' ? `${styles.item} ${styles.done}` : styles.item;

  return (
    <li
      className={rootClass}
      data-completing={completing ? 'true' : undefined}
      onAnimationEnd={handleAnimationEnd}
    >
      <div className={styles.body}>
        <span className={styles.title}>{task.title}</span>
        <div className={styles.meta}>
          <PriorityBadge priority={task.priority} />
          {task.dueDate !== null && (
            <span className={styles.chip}>
              {t('tasks.dueDateLabel') + ' ' + task.dueDate}
            </span>
          )}
          {task.category !== '' && (
            <span className={styles.chip}>
              {t('tasks.categoryLabel') + ' ' + task.category}
            </span>
          )}
          <LinkedSessionBadge linkedSessionId={task.linkedSessionId} />
        </div>
      </div>
      <div className={styles.actions}>
        {task.status === 'active' && (
          <button
            type="button"
            className={styles.button}
            onClick={handleComplete}
            disabled={completing}
          >
            {t('tasks.completeLabel')}
          </button>
        )}
        <button
          type="button"
          className={styles.button}
          onClick={() => setEditing(true)}
        >
          {t('tasks.editLabel')}
        </button>
        <button
          type="button"
          className={confirmingDelete ? `${styles.button} ${styles.danger}` : styles.button}
          onClick={handleDelete}
        >
          {confirmingDelete ? t('tasks.deleteConfirm') : t('tasks.deleteLabel')}
        </button>
      </div>
      {editing && (
        <EditTaskModal task={task} onClose={() => setEditing(false)} />
      )}
    </li>
  );
}
