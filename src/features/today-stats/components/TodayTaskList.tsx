import type { Task } from '../../tasks/types';
import { EmptyState } from '../../tasks/components/EmptyState';
import { TaskItem } from '../../tasks/components/TaskItem';
import styles from './TodayTaskList.module.css';

interface TodayTaskListProps {
  tasks: Task[];
}

export function TodayTaskList({ tasks }: TodayTaskListProps) {
  if (tasks.length === 0) return <EmptyState filter="today" />;

  return (
    <ul className={styles.list}>
      {tasks.map((task) => (
        <TaskItem key={task.id} task={task} />
      ))}
    </ul>
  );
}
