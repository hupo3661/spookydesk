import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react';
import { useCostume } from '../../../engine/useCostume';
import { useTasksContext } from '../TasksContext';
import type { Task, TaskPriority } from '../types';
import styles from './EditTaskModal.module.css';

const PRIORITIES: TaskPriority[] = ['low', 'medium', 'high'];
const FOCUSABLE =
  'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [href], [tabindex]:not([tabindex="-1"])';

interface EditTaskModalProps {
  task: Task;
  onClose: () => void;
}

export function EditTaskModal({ task, onClose }: EditTaskModalProps) {
  const { t } = useCostume();
  const { updateTask } = useTasksContext();
  const [title, setTitle] = useState(task.title);
  const [priority, setPriority] = useState<TaskPriority>(task.priority);
  const [dueDate, setDueDate] = useState(task.dueDate ?? '');
  const [category, setCategory] = useState(task.category);
  const [error, setError] = useState(false);
  const titleRef = useRef<HTMLInputElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const uid = useId();
  const titleId = `${uid}-title`;
  const priorityId = `${uid}-priority`;
  const dueId = `${uid}-due`;
  const categoryId = `${uid}-category`;
  const errorId = `${uid}-error`;

  useEffect(() => {
    titleRef.current?.focus();
  }, []);

  function handleSave() {
    const trimmed = title.trim();
    if (trimmed === '') {
      setError(true);
      titleRef.current?.focus();
      return;
    }
    updateTask(task.id, {
      title: trimmed,
      priority,
      dueDate: dueDate || null,
      category,
    });
    onClose();
  }

  function handleKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    if (e.key === 'Escape') {
      e.stopPropagation();
      onClose();
      return;
    }
    if (e.key !== 'Tab') return;
    const nodes = dialogRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE);
    if (!nodes || nodes.length === 0) return;
    const first = nodes[0];
    const last = nodes[nodes.length - 1];
    const active = document.activeElement;
    if (e.shiftKey && (active === first || !dialogRef.current?.contains(active))) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && (active === last || !dialogRef.current?.contains(active))) {
      e.preventDefault();
      first.focus();
    }
  }

  return (
    <div className={styles.overlay}>
      <div
        ref={dialogRef}
        className={styles.dialog}
        role="dialog"
        aria-modal="true"
        aria-label={t('tasks.editLabel')}
        onKeyDown={handleKeyDown}
      >
        <form
          className={styles.form}
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            handleSave();
          }}
        >
          <div className={styles.field}>
            <input
              ref={titleRef}
              id={titleId}
              className={styles.input}
              type="text"
              value={title}
              placeholder={t('tasks.addPlaceholder')}
              aria-label={t('tasks.addPlaceholder')}
              aria-invalid={error}
              aria-describedby={error ? errorId : undefined}
              onChange={(e) => {
                setTitle(e.target.value);
                if (error) setError(false);
              }}
            />
            {error && (
              <p id={errorId} role="alert" className={styles.error}>
                {t('tasks.errorEmptyTitle')}
              </p>
            )}
          </div>
          <div className={styles.field}>
            <select
              id={priorityId}
              className={styles.input}
              aria-label={t('tasks.priority.' + priority)}
              value={priority}
              onChange={(e) => setPriority(e.target.value as TaskPriority)}
            >
              {PRIORITIES.map((p) => (
                <option key={p} value={p}>
                  {t('tasks.priority.' + p)}
                </option>
              ))}
            </select>
          </div>
          <div className={styles.field}>
            <label htmlFor={dueId} className={styles.label}>
              {t('tasks.dueDateLabel')}
            </label>
            <input
              id={dueId}
              className={styles.input}
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </div>
          <div className={styles.field}>
            <label htmlFor={categoryId} className={styles.label}>
              {t('tasks.categoryLabel')}
            </label>
            <input
              id={categoryId}
              className={styles.input}
              type="text"
              maxLength={32}
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            />
          </div>
          <div className={styles.actions}>
            <button type="button" className={styles.cancel} onClick={onClose}>
              {t('tasks.cancelLabel')}
            </button>
            <button type="submit" className={styles.save}>
              {t('tasks.saveLabel')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
