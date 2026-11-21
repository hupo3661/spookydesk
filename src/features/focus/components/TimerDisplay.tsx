import { useCostume } from '../../../engine/useCostume';
import type { TimerState } from '../types';
import { PotionProgress } from './PotionProgress';
import { RingProgress } from './RingProgress';
import styles from './TimerDisplay.module.css';

interface TimerDisplayProps {
  fraction: number;
  remainingMs: number;
  state: TimerState;
}

function formatMmSs(ms: number): string {
  const totalSeconds = Math.max(0, Math.ceil((Number.isFinite(ms) ? ms : 0) / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

export function TimerDisplay({ fraction, remainingMs, state }: TimerDisplayProps) {
  const { costumeId, t } = useCostume();
  const isBreak = state === 'break_running' || state === 'break_paused';
  const showProgress = state !== 'idle' && !isBreak;

  return (
    <section className={styles.root}>
      <h2 className={styles.heading}>
        {isBreak ? t('focus.breakHeading') : t('focus.heading')}
      </h2>
      {showProgress && costumeId === 'haunted' && <PotionProgress fraction={fraction} />}
      {showProgress && costumeId === 'classic' && <RingProgress fraction={fraction} />}
      <div className={styles.countdown} aria-live="polite">
        {formatMmSs(remainingMs)}
      </div>
      {state === 'completed' && (
        <p className={styles.message}>{t('focus.completedMessage')}</p>
      )}
    </section>
  );
}
