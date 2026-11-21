import { useCostume } from '../../../engine/useCostume';
import styles from './LifetimeCounters.module.css';

interface LifetimeCountersProps {
  monstersDefeated: number;
  lifetimeFocusMinutes: number;
}

export function LifetimeCounters({ monstersDefeated, lifetimeFocusMinutes }: LifetimeCountersProps) {
  const { t } = useCostume();

  return (
    <div className={styles.root}>
      <div className={styles.block}>
        <span className={styles.value}>{monstersDefeated}</span>
        <span className={styles.label}>{t('stats.monstersDefeated')}</span>
      </div>
      <div className={styles.block}>
        <span className={styles.value}>{lifetimeFocusMinutes}</span>
        <span className={styles.label}>{t('stats.lifetimeFocusMinutes')}</span>
      </div>
    </div>
  );
}

export default LifetimeCounters;
