import { FilterTabs } from './components/FilterTabs';
import { AddTaskForm } from './components/AddTaskForm';
import { TaskList } from './components/TaskList';
import styles from './TasksPage.module.css';

export default function TasksPage() {
  return (
    <main className={styles.page}>
      <FilterTabs />
      <AddTaskForm />
      <TaskList />
    </main>
  );
}
