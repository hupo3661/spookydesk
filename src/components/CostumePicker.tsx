import { useCostume } from '../engine/useCostume';
import { COSTUME_REGISTRY, type CostumeId } from '../costumes/registry';
import styles from './CostumePicker.module.css';

export function CostumePicker() {
  const { costumeId, setCostume, t } = useCostume();

  return (
    <div className={styles.picker}>
      <span className={styles.label}>{t('nav.costumePicker')}</span>
      {Object.values(COSTUME_REGISTRY).map((pack) => {
        const isActive = pack.id === costumeId;
        return (
          <button
            key={pack.id}
            type="button"
            aria-pressed={isActive}
            className={isActive ? `${styles.button} ${styles.active}` : styles.button}
            onClick={() => setCostume(pack.id as CostumeId)}
          >
            {pack.label}
          </button>
        );
      })}
    </div>
  );
}

export default CostumePicker;
