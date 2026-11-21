import { useCostume } from '../../../engine/useCostume';
import { useTasksContext } from '../TasksContext';
import type { TaskFilter } from '../types';
import styles from './FilterTabs.module.css';

const FILTERS: TaskFilter[] = ['today', 'all', 'completed'];

export function FilterTabs() {
  const { t } = useCostume();
  const { filter, setFilter } = useTasksContext();

  return (
    <div className={styles.tabs}>
      {FILTERS.map((f) => {
        const active = f === filter;
        return (
          <button
            key={f}
            type="button"
            className={active ? `${styles.tab} ${styles.active}` : styles.tab}
            aria-current={active ? 'true' : undefined}
            onClick={() => setFilter(f)}
          >
            {t('tasks.filter.' + f)}
          </button>
        );
      })}
    </div>
  );
}
