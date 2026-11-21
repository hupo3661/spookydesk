import { getSetting } from '../../engine/storage';
import { useTimer } from './useTimer';
import { TimerDisplay } from './components/TimerDisplay';
import { TimerControls } from './components/TimerControls';
import { TaskBinder } from './components/TaskBinder';
import styles from './TimerPage.module.css';


export default function TimerPage() {
  const focusRaw = getSetting('focusDuration');
  const focusDuration =
    typeof focusRaw === 'number' && focusRaw >= 1 && focusRaw <= 120 ? Math.round(focusRaw) : 25;
  const breakRaw = getSetting('breakDuration');
  const breakDuration =
    typeof breakRaw === 'number' && breakRaw >= 1 && breakRaw <= 60 ? Math.round(breakRaw) : 5;

  const { state, remainingMs, fraction, boundTaskId, start, pause, resume, reset, startBreak, bindTask } =
    useTimer(focusDuration, breakDuration);

  return (
    <main className={styles.page}>
      <div className={styles.card}>
        <TimerDisplay fraction={fraction} remainingMs={remainingMs} state={state} />
        <TimerControls
          state={state}
          start={start}
          pause={pause}
          resume={resume}
          reset={reset}
          startBreak={startBreak}
        />
        <TaskBinder boundTaskId={boundTaskId} bindTask={bindTask} state={state} />
      </div>
    </main>
  );
}
