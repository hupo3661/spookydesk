import { CSS_VAR_KEYS, type CostumePack } from '../costumes/types';
import type { CostumeId } from '../costumes/registry';
import { setCostumeId } from './storage';

/** Writes every CSS variable of the pack to :root, then persists the costume id. */
export function applyCostume(pack: CostumePack): void {
  const style = document.documentElement.style;
  for (const key of CSS_VAR_KEYS) {
    style.setProperty('--' + key, pack.cssVars[key]);
  }
  setCostumeId(pack.id as CostumeId);
}
