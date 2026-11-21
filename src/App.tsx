import { lazy, Suspense, useEffect, useState, type ComponentType } from 'react';
import { useCostume } from './engine/useCostume';
import TasksPage from './features/tasks/TasksPage';
import { TasksProvider } from './features/tasks/TasksContext';
import CostumePicker from './components/CostumePicker';
import styles from './App.module.css';

const TodayPage = lazy(() => import('./features/today-stats/TodayPage'));
const StatsPage = lazy(() => import('./features/today-stats/StatsPage'));
const TimerPage = lazy(() => import('./features/focus/TimerPage'));

const SettingsPage = lazy(() => import('./features/settings/SettingsPage'));

const DEFAULT_ROUTE = '/';

// Route table: hash path -> page component.
const ROUTES: Record<string, ComponentType> = {
  '/': TodayPage,
  '/tasks': TasksPage,
  '/focus': TimerPage,
  '/stats': StatsPage,
  '/settings': SettingsPage,
};

function readRoute(): string {
  const path = window.location.hash.replace(/^#/, '');
  return path === '' || path === '/' ? DEFAULT_ROUTE : path;
}

export default function App() {
  const { t } = useCostume();
  const [route, setRoute] = useState(readRoute);

  useEffect(() => {
    const onChange = () => setRoute(readRoute());
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);

  const Page = ROUTES[route] ?? ROUTES[DEFAULT_ROUTE];

  return (
    <TasksProvider>
      <h1 className={styles.title}>{t('app.title')}</h1>
      <nav className={styles.nav}>
        <a href="#/" className={styles.link}>
          {t('today.heading')}
        </a>
        <a href="#/tasks" className={styles.link}>
          {t('nav.tasks')}
        </a>
        <a href="#/focus" className={styles.link}>
          {t('nav.focus')}
        </a>
        <a href="#/stats" className={styles.link}>
          {t('stats.heading')}
        </a>
        <a href="#/settings" className={styles.link}>
          {t('nav.settings')}
        </a>
        <CostumePicker />
      </nav>
      <Suspense fallback={null}>
        <Page />
      </Suspense>
    </TasksProvider>
  );
}
