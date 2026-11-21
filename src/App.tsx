import { lazy, Suspense, useEffect, useState, type ComponentType } from 'react';
import { useCostume } from './engine/useCostume';
import TasksPage from './features/tasks/TasksPage';
import { TasksProvider } from './features/tasks/TasksContext';
import styles from './App.module.css';

const TimerPage = lazy(() => import('./features/focus/TimerPage'));

const DEFAULT_ROUTE = '/tasks';

// Route table. Later phases register '/', '/focus' and '/stats' here.
const ROUTES: Record<string, ComponentType> = {
  '/tasks': TasksPage,
  '/focus': TimerPage,
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
        <a href="#/tasks" className={styles.link}>
          {t('nav.tasks')}
        </a>
        <a href="#/focus" className={styles.link}>
          {t('nav.focus')}
        </a>
      </nav>
      <Suspense fallback={null}>
        <Page />
      </Suspense>
    </TasksProvider>
  );
}
