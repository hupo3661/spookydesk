import { useTasksContext } from '../TasksContext';
import { EmptyState } from './EmptyState';
import { TaskItem } from './TaskItem';
import styles from './TaskList.module.css';

export function TaskList() {
  const { filteredTasks, filter } = useTasksContext();

  if (filteredTasks.length === 0) {
    return <EmptyState filter={filter} />;
  }

  return (
    <ul className={styles.list}>
      {filteredTasks.map((task) => (
        <TaskItem key={task.id} task={task} />
      ))}
    </ul>
  );
}
