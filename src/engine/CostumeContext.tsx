import { createContext, useState, type ReactNode } from 'react';
import type { CostumePack } from '../costumes/types';
import { COSTUME_REGISTRY, type CostumeId } from '../costumes/registry';
import { applyCostume } from './applyCostume';

export interface CostumeContextValue {
  costumeId: CostumeId;
  pack: CostumePack;
  setCostume: (id: CostumeId) => void;
}

export const CostumeContext = createContext<CostumeContextValue | null>(null);

export function CostumeProvider({
  initialId,
  children,
}: {
  initialId: CostumeId;
  children: ReactNode;
}) {
  const [pack, setPack] = useState<CostumePack>(COSTUME_REGISTRY[initialId]);

  const setCostume = (id: CostumeId): void => {
    const next = COSTUME_REGISTRY[id];
    applyCostume(next);
    setPack(next);
  };

  return (
    <CostumeContext.Provider
      value={{ costumeId: pack.id as CostumeId, pack, setCostume }}
    >
      {children}
    </CostumeContext.Provider>
  );
}
