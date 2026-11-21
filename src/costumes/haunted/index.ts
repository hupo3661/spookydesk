import type { CostumePack } from '../types';
import { hauntedCssVars } from './cssVars';
import { hauntedCopy } from './copy';
import { hauntedSounds } from './sounds';

export const hauntedPack: CostumePack = {
  id: 'haunted',
  label: 'Haunted Halloween',
  cssVars: hauntedCssVars,
  copy: hauntedCopy,
  sounds: hauntedSounds,
};
