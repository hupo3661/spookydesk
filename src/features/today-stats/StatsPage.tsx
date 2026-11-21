import { useCostume } from '../../engine/useCostume';
import { getMonstersDefeated, loadTasksStore } from '../tasks/storage';
import { getAllSessions } from '../focus/storage';
import { getLifetimeFocusMinutes, getWeekStats } from './aggregations';
import { toLocalDate } from './dateUtils';
import { LifetimeCounters } from './components/LifetimeCounters';
import { WeekChart } from './components/WeekChart';
import styles from './components/StatsPage.module.css';

export function StatsPage() {
  const { t } = useCostume();
  const today = toLocalDate();
  const tasks = loadTasksStore().tasks;
  const sessions = getAllSessions();
  const weekStats = getWeekStats(tasks, sessions, today);
  const lifetimeFocusMinutes = getLifetimeFocusMinutes(sessions);
  const monstersDefeated = getMonstersDefeated();

  return (
    <main className={styles.page}>
      <h1 className={styles.heading}>{t('stats.heading')}</h1>
      <WeekChart weekStats={weekStats} />
      <LifetimeCounters
        monstersDefeated={monstersDefeated}
        lifetimeFocusMinutes={lifetimeFocusMinutes}
      />
    </main>
  );
}

export default StatsPage;
