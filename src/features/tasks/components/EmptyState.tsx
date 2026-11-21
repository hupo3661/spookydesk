import { useCostume } from '../../../engine/useCostume';
import type { TaskFilter } from '../types';
import styles from './EmptyState.module.css';

interface EmptyStateProps {
  filter: TaskFilter;
}

export function EmptyState({ filter }: EmptyStateProps) {
  const { t } = useCostume();
  return <p className={styles.empty}>{t('tasks.emptyState.' + filter)}</p>;
}
