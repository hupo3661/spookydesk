import { useCostume } from '../../../engine/useCostume';
import styles from './StreakDisplay.module.css';

interface StreakDisplayProps {
  currentStreak: number;
  longestStreak: number;
}

const MAX_ICONS = 10;

export function StreakDisplay({ currentStreak, longestStreak }: StreakDisplayProps) {
  const { t, costumeId } = useCostume();
  const litCount = Math.min(currentStreak, MAX_ICONS);

  return (
    <div className={styles.root}>
      {costumeId === 'haunted' ? (
        <div className={styles.row}>
          {Array.from({ length: MAX_ICONS }, (_, i) => (
            <span
              key={i}
              className={`${styles.icon} ${i < litCount ? styles.lit : styles.unlit}`}
              aria-hidden="true"
            />
          ))}
          {currentStreak > MAX_ICONS && (
            <span className={styles.extra}>+{currentStreak - MAX_ICONS}</span>
          )}
        </div>
      ) : (
        <p className={styles.badge}>
          {currentStreak} {t('streak.unit')}
        </p>
      )}
      <p className={styles.longest}>
        {t('streak.longestLabel')}: {longestStreak}
      </p>
    </div>
  );
}
