import { useCostume } from '../../../engine/useCostume';
import { localDateInt } from '../dateUtils';
import styles from './DailyGreeting.module.css';

interface DailyGreetingProps {
  today: string; // YYYY-MM-DD
}

export function DailyGreeting({ today }: DailyGreetingProps) {
  const { t } = useCostume();
  const parsed = parseInt(t('today.greetings.count'), 10);
  const count = Number.isNaN(parsed) || parsed < 1 ? 1 : parsed;
  const index = localDateInt(new Date(today + 'T00:00:00')) % count;

  return <p className={styles.greeting}>{t('today.greetings.' + index)}</p>;
}
