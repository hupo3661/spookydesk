import { useEffect, useState } from 'react';
import type { CSSProperties, KeyboardEvent } from 'react';
import { useCostume } from '../../../engine/useCostume';
import styles from './FocusGoalWidget.module.css';

interface FocusGoalWidgetProps {
  focusMinutes: number;
  goal: number;
  onGoalChange: (v: number) => void;
}

const MIN_GOAL = 1;
const MAX_GOAL = 480;

export function FocusGoalWidget({ focusMinutes, goal, onGoalChange }: FocusGoalWidgetProps) {
  const { t } = useCostume();
  const [text, setText] = useState(String(goal));

  useEffect(() => {
    setText(String(goal));
  }, [goal]);

  const pct = goal > 0 ? Math.min(100, (focusMinutes / goal) * 100) : 0;

  const commit = () => {
    const trimmed = text.trim();
    const value = /^\d+$/.test(trimmed) ? parseInt(trimmed, 10) : NaN;
    if (value >= MIN_GOAL && value <= MAX_GOAL) {
      setText(String(value));
      onGoalChange(value);
    } else {
      setText(String(goal));
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') commit();
  };

  return (
    <div className={styles.root}>
      <p className={styles.label}>{t('today.goalLabel')}</p>
      <div className={styles.bar}>
        <div className={styles.fill} style={{ '--progress': pct + '%' } as CSSProperties} />
      </div>
      <p className={styles.amount}>
        {focusMinutes} / {goal} {t('today.goalUnit')}
      </p>
      <input
        className={styles.input}
        type="number"
        inputMode="numeric"
        min={MIN_GOAL}
        max={MAX_GOAL}
        value={text}
        aria-label={t('today.goalLabel')}
        onChange={(e) => setText(e.target.value)}
        onBlur={commit}
        onKeyDown={handleKeyDown}
      />
    </div>
  );
}
