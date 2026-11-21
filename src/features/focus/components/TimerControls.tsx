import { useCostume } from '../../../engine/useCostume';
import type { TimerState } from '../types';
import styles from './TimerControls.module.css';

interface TimerControlsProps {
  state: TimerState;
  start: () => void;
  pause: () => void;
  resume: () => void;
  reset: () => void;
  startBreak: () => void;
}

export function TimerControls({
  state,
  start,
  pause,
  resume,
  reset,
  startBreak,
}: TimerControlsProps) {
  const { t } = useCostume();

  function button(labelKey: string, onClick: () => void, primary: boolean) {
    const label = t(labelKey);
    return (
      <button
        type="button"
        className={primary ? styles.primary : styles.secondary}
        onClick={onClick}
        aria-label={label}
      >
        {label}
      </button>
    );
  }

  let buttons: React.ReactNode = null;
  switch (state) {
    case 'idle':
      buttons = button('focus.startLabel', start, true);
      break;
    case 'running':
    case 'break_running':
      buttons = (
        <>
          {button('focus.pauseLabel', pause, true)}
          {button('focus.resetLabel', reset, false)}
        </>
      );
      break;
    case 'paused':
    case 'break_paused':
      buttons = (
        <>
          {button('focus.resumeLabel', resume, true)}
          {button('focus.resetLabel', reset, false)}
        </>
      );
      break;
    case 'completed':
      buttons = (
        <>
          {button('focus.startBreakLabel', startBreak, true)}
          {button('focus.resetLabel', reset, false)}
        </>
      );
      break;
  }

  return <div className={styles.root}>{buttons}</div>;
}
