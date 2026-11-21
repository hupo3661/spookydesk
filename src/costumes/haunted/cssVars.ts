import type { CssVarPack } from '../types';

/**
 * Haunted Halloween palette: midnight-violet backgrounds, pumpkin-orange
 * primary, ectoplasm-green accent, and a spooky display font with safe
 * fallbacks (Creepster must be loaded by the host page; fallbacks keep the
 * UI legible if it is not).
 */
export const hauntedCssVars: CssVarPack = {
  // Colors
  'color-bg': '#1a0a2e', // midnight violet
  'color-surface': '#2d1b4e', // crypt purple, lifts cards off the bg
  'color-text': '#f0e6ff', // moonlit lavender-white
  'color-primary': '#ff6b35', // pumpkin orange
  'color-accent': '#7fff6b', // ectoplasm green
  'color-muted': '#a898c8', // fog; readable on bg and surface

  // Priority colors
  'color-priority-low': '#5ee6c0', // eerie mint
  'color-priority-medium': '#ffc247', // candle amber
  'color-priority-high': '#ff4d6d', // fresh blood

  // Streak colors
  'color-streak-lit': '#ffa31a', // glowing jack-o'-lantern
  'color-streak-unlit': '#4a3570', // unlit carved pumpkin

  // Chart colors
  'color-bar-bg': '#3b2766', // empty bar track

  // Typography
  'font-family-base':
    "'Creepster', 'Chiller', 'Papyrus', 'Trebuchet MS', system-ui, cursive",

  // Shape
  'radius-card': '14px',
  'shadow-card': '0 4px 24px #7b2fff55, 0 0 0 1px #7b2fff33',
};
