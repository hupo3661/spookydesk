import styles from './RingProgress.module.css';

interface RingProgressProps {
  fraction: number;
}

export function RingProgress({ fraction }: RingProgressProps) {
  const clamped = Number.isFinite(fraction) ? Math.min(1, Math.max(0, fraction)) : 0;

  return (
    <div
      className={styles.root}
      style={{ '--fill-fraction': clamped } as React.CSSProperties}
      aria-hidden="true"
    >
      <svg className={styles.svg} viewBox="0 0 100 100" focusable="false">
        <circle className={styles.track} cx="50" cy="50" r="45" />
        <circle className={styles.progress} cx="50" cy="50" r="45" />
      </svg>
    </div>
  );
}
