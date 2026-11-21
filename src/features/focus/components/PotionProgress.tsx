import { useId } from 'react';
import styles from './PotionProgress.module.css';

interface PotionProgressProps {
  fraction: number;
}

const BOTTLE_PATH = 'M40 10 V36 A40 40 0 1 0 60 36 V10 Z';

export function PotionProgress({ fraction }: PotionProgressProps) {
  const clipId = useId().replace(/:/g, '');
  const clamped = Number.isFinite(fraction) ? Math.min(1, Math.max(0, fraction)) : 0;

  return (
    <div
      className={styles.root}
      style={{ '--fill-fraction': clamped } as React.CSSProperties}
      aria-hidden="true"
    >
      <svg className={styles.svg} viewBox="0 0 100 120" focusable="false">
        <defs>
          <clipPath id={clipId}>
            <path d={BOTTLE_PATH} />
          </clipPath>
        </defs>
        <path className={styles.glass} d={BOTTLE_PATH} />
        <g clipPath={`url(#${clipId})`}>
          <rect className={styles.liquid} x="0" y="10" width="100" height="105" />
        </g>
        <path className={styles.outline} d={BOTTLE_PATH} />
      </svg>
    </div>
  );
}
