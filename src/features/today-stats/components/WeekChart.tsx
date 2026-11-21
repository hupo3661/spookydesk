import { useCostume } from '../../../engine/useCostume';
import type { WeekStats } from '../types';
import { DayColumn } from './DayColumn';
import styles from './WeekChart.module.css';

interface WeekChartProps {
  weekStats: WeekStats;
}

export function WeekChart({ weekStats }: WeekChartProps) {
  const { t } = useCostume();

  return (
    <section className={styles.root}>
      <h2 className={styles.heading}>{t('stats.weekHeading')}</h2>
      <div className={styles.row}>
        {weekStats.days.map((day) => (
          <DayColumn
            key={day.date}
            stats={day}
            maxTasks={weekStats.maxTasksCompleted}
            maxFocus={weekStats.maxFocusMinutes}
          />
        ))}
      </div>
      <ul className={styles.legend}>
        <li className={styles.legendItem}>
          <span className={styles.swatchTasks} />
          {t('stats.seriesTasksLabel')}
        </li>
        <li className={styles.legendItem}>
          <span className={styles.swatchFocus} />
          {t('stats.seriesFocusLabel')}
        </li>
      </ul>
    </section>
  );
}

export default WeekChart;
