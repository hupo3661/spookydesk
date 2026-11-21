import type { CSSProperties } from 'react';
import { useCostume } from '../../../engine/useCostume';
import type { DayStats } from '../types';
import styles from './DayColumn.module.css';

interface DayColumnProps {
  stats: DayStats;
  maxTasks: number;
  maxFocus: number;
}

export function DayColumn({ stats, maxTasks, maxFocus }: DayColumnProps) {
  const { t } = useCostume();
  const weekday = new Intl.DateTimeFormat('en', { weekday: 'short' }).format(
    new Date(stats.date + 'T00:00:00'),
  );
  const tasksPct = maxTasks > 0 ? (stats.tasksCompleted / maxTasks) * 100 : 0;
  const focusPct = maxFocus > 0 ? (stats.focusMinutes / maxFocus) * 100 : 0;
  const title = `${weekday}: ${stats.tasksCompleted} ${t('stats.tasksUnit')}, ${stats.focusMinutes} ${t('stats.focusUnit')}`;

  return (
    <div className={styles.column} title={title}>
      <div className={styles.chart}>
        <div className={styles.track}>
          <div className={styles.tasksBar} style={{ '--tasks-h': tasksPct + '%' } as CSSProperties} />
        </div>
        <div className={styles.track}>
          <div className={styles.focusBar} style={{ '--focus-h': focusPct + '%' } as CSSProperties} />
        </div>
      </div>
      <span className={styles.label}>{weekday}</span>
    </div>
  );
}

export default DayColumn;
