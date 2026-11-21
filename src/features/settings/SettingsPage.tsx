import { useState } from 'react';
import { getSetting, setSetting } from '../../engine/storage';
import { useCostume } from '../../engine/useCostume';
import styles from './SettingsPage.module.css';

interface FieldConfig {
  id: string;
  settingKey: 'focusDuration' | 'breakDuration';
  labelKey: 'focus.settingsFocusLabel' | 'focus.settingsBreakLabel';
  min: number;
  max: number;
  fallback: number;
}

const FIELDS: FieldConfig[] = [
  {
    id: 'focus-duration',
    settingKey: 'focusDuration',
    labelKey: 'focus.settingsFocusLabel',
    min: 1,
    max: 120,
    fallback: 25,
  },
  {
    id: 'break-duration',
    settingKey: 'breakDuration',
    labelKey: 'focus.settingsBreakLabel',
    min: 1,
    max: 60,
    fallback: 5,
  },
];

function readInitial(field: FieldConfig): number {
  const raw = getSetting(field.settingKey);
  return typeof raw === 'number' &&
    Number.isInteger(raw) &&
    raw >= field.min &&
    raw <= field.max
    ? raw
    : field.fallback;
}

function DurationField({ field }: { field: FieldConfig }) {
  const { t } = useCostume();
  const [stored, setStored] = useState<number>(() => readInitial(field));
  const [text, setText] = useState<string>(() => String(stored));
  const label = t(field.labelKey);

  const handleBlur = () => {
    const trimmed = text.trim();
    const value = /^\d+$/.test(trimmed) ? parseInt(trimmed, 10) : NaN;
    if (Number.isInteger(value) && value >= field.min && value <= field.max) {
      setSetting(field.settingKey, value);
      setStored(value);
      setText(String(value));
    } else {
      setText(String(stored));
    }
  };

  return (
    <div className={styles.field}>
      <label htmlFor={field.id} className={styles.label}>
        {label}
      </label>
      <input
        id={field.id}
        className={styles.input}
        type="number"
        inputMode="numeric"
        min={field.min}
        max={field.max}
        value={text}
        aria-label={label}
        onChange={(e) => setText(e.target.value)}
        onBlur={handleBlur}
      />
    </div>
  );
}

export default function SettingsPage() {
  const { t } = useCostume();
  return (
    <main className={styles.page}>
      <section className={styles.card}>
        <h2 className={styles.heading}>{t('nav.settings')}</h2>
        {FIELDS.map((field) => (
          <DurationField key={field.id} field={field} />
        ))}
      </section>
    </main>
  );
}
