import { useContext, useState } from 'react';
import { useCostume } from '../../engine/useCostume';
import { getSetting, setSetting } from '../../engine/storage';
import { getAllSessions } from '../focus/storage';
import { TasksContext } from '../tasks/TasksContext';
import { getTodayFocusMinutes, getTodayTasks } from './aggregations';
import { DailyGreeting } from './components/DailyGreeting';
import { FocusGoalWidget } from './components/FocusGoalWidget';
import { StreakDisplay } from './components/StreakDisplay';
import { TodayTaskList } from './components/TodayTaskList';
import styles from './components/TodayPage.module.css';
import { toLocalDate } from './dateUtils';
import { loadStreakStore } from './streakStorage';

const DEFAULT_GOAL = 25;

function readGoal(): number {
  const v = getSetting('focusGoal');
  return typeof v === 'number' && Number.isInteger(v) && v >= 1 && v <= 480
    ? v
    : DEFAULT_GOAL;
}

export default function TodayPage() {
  const { t } = useCostume();
  const tasksCtx = useContext(TasksContext);
  const [goal, setGoal] = useState<number>(readGoal);

  const today = toLocalDate();
  const todayTasks = getTodayTasks(tasksCtx?.tasks ?? [], today);
  const focusMinutes = getTodayFocusMinutes(getAllSessions(), today);
  const streak = loadStreakStore();

  const handleGoalChange = (v: number) => {
    setSetting('focusGoal', v);
    setGoal(v);
  };

  return (
    <main className={styles.page}>
      <DailyGreeting today={today} />
      <StreakDisplay
        currentStreak={streak.currentStreak}
        longestStreak={streak.longestStreak}
      />
      <FocusGoalWidget
        focusMinutes={focusMinutes}
        goal={goal}
        onGoalChange={handleGoalChange}
      />
      <h2 className={styles.heading}>{t('today.heading')}</h2>
      <TodayTaskList tasks={todayTasks} />
    </main>
  );
}
