import { useId, useRef, useState, type FormEvent } from 'react';
import { useCostume } from '../../../engine/useCostume';
import { useTasksContext } from '../TasksContext';
import type { TaskPriority } from '../types';
import styles from './AddTaskForm.module.css';

const PRIORITIES: TaskPriority[] = ['low', 'medium', 'high'];

export function AddTaskForm() {
  const { t, play } = useCostume();
  const { addTask } = useTasksContext();
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [dueDate, setDueDate] = useState('');
  const [category, setCategory] = useState('');
  const [error, setError] = useState(false);
  const titleRef = useRef<HTMLInputElement>(null);
  const uid = useId();
  const titleId = `${uid}-title`;
  const priorityId = `${uid}-priority`;
  const dueId = `${uid}-due`;
  const categoryId = `${uid}-category`;
  const errorId = `${uid}-error`;

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = title.trim();
    if (trimmed === '') {
      setError(true);
      titleRef.current?.focus();
      return;
    }
    addTask({
      title: trimmed,
      priority,
      dueDate: dueDate || null,
      category,
    });
    setTitle('');
    setPriority('medium');
    setDueDate('');
    setCategory('');
    setError(false);
    titleRef.current?.focus();
    play('task-add');
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit} noValidate>
      <div className={styles.row}>
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
        <button type="submit" className={styles.submit}>
          {t('tasks.addLabel')}
        </button>
      </div>
      {error && (
        <p id={errorId} role="alert" className={styles.error}>
          {t('tasks.errorEmptyTitle')}
        </p>
      )}
      <div className={styles.fields}>
        <div className={styles.field}>
          <select
            id={priorityId}
            aria-label={t('tasks.priority.' + priority)}
            className={styles.input}
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
      </div>
    </form>
  );
}
