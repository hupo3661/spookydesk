import { useCostume } from './engine/useCostume';
import styles from './App.module.css';

export default function App() {
  const { t } = useCostume();
  return <h1 className={styles.title}>{t('app.title')}</h1>;
}
