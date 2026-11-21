import { useCallback, useContext } from 'react';
import { CostumeContext } from './CostumeContext';
import type { CostumeId } from '../costumes/registry';

export interface UseCostumeResult {
  costumeId: CostumeId;
  setCostume: (id: CostumeId) => void;
  t: (id: string) => string;
  play: (slot: string) => void;
}

export function useCostume(): UseCostumeResult {
  const ctx = useContext(CostumeContext);
  if (!ctx) {
    throw new Error('useCostume must be used within a CostumeProvider');
  }
  const { costumeId, pack, setCostume } = ctx;

  const t = useCallback(
    (id: string): string => {
      const copy: Readonly<Record<string, string | undefined>> = pack.copy;
      const value = copy[id];
      if (value === undefined) {
        if (import.meta.env.DEV) {
          console.warn(`[costume] missing copy key: ${id}`);
        }
        return id;
      }
      return value;
    },
    [pack],
  );

  const play = useCallback(
    (slot: string): void => {
      const sounds: Readonly<Record<string, string | null | undefined>> = pack.sounds;
      const path = sounds[slot];
      if (path == null) return;
      new Audio(path).play().catch((e: unknown) => console.warn(e));
    },
    [pack],
  );

  return { costumeId, setCostume, t, play };
}
