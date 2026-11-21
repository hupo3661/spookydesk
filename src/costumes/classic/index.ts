import type { CostumePack } from '../types';
import { classicCssVars } from './cssVars';
import { classicCopy } from './copy';
import { classicSounds } from './sounds';

export const classicPack: CostumePack = {
  id: 'classic',
  label: 'Classic Clean',
  cssVars: classicCssVars,
  copy: classicCopy,
  sounds: classicSounds,
};
