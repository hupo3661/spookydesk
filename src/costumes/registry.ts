import type { CostumePack } from './types';
import { hauntedPack } from './haunted';
import { classicPack } from './classic';

/** Every costume the app ships with. Extend this union when adding a pack. */
export type CostumeId = 'haunted' | 'classic';

export const DEFAULT_COSTUME_ID: CostumeId = 'haunted';

/**
 * Lookup of all costume packs by id.
 *
 * The type requires every `CostumeId` to map to a complete pack.
 */
export const COSTUME_REGISTRY: Readonly<Record<CostumeId, CostumePack>> = {
  haunted: hauntedPack,
  classic: classicPack,
};
