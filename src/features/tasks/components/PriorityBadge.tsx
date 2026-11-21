import { useCostume } from '../../../engine/useCostume';
import type { TaskPriority } from '../types';
import styles from './PriorityBadge.module.css';

interface PriorityBadgeProps {
  priority: TaskPriority;
}

export function PriorityBadge({ priority }: PriorityBadgeProps) {
  const { t } = useCostume();
  return (
    <span className={`${styles.badge} ${styles[priority]}`}>
      {t('tasks.priority.' + priority)}
    </span>
  );
}
