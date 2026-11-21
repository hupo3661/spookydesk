import { useEffect, useState, type ComponentType } from 'react';
import { useCostume } from './engine/useCostume';
import TasksPage from './features/tasks/TasksPage';
import styles from './App.module.css';

const DEFAULT_ROUTE = '/tasks';

// Route table. Later phases register '/', '/focus' and '/stats' here.
const ROUTES: Record<string, ComponentType> = {
  '/tasks': TasksPage,
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
    <>
      <h1 className={styles.title}>{t('app.title')}</h1>
      <nav className={styles.nav}>
        <a href="#/tasks" className={styles.link}>
          {t('nav.tasks')}
        </a>
      </nav>
      <Page />
    </>
  );
}
