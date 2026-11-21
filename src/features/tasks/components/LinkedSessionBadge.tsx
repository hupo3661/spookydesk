import { useCostume } from '../../../engine/useCostume';
import styles from './LinkedSessionBadge.module.css';

interface LinkedSessionBadgeProps {
  linkedSessionId: string | null;
}

export function LinkedSessionBadge({ linkedSessionId }: LinkedSessionBadgeProps) {
  const { t } = useCostume();
  if (linkedSessionId === null) return null;
  return <span className={styles.badge}>{t('tasks.linkedIndicator')}</span>;
}
