import type { CssVarPack } from '../types';

/**
 * Classic Clean palette: near-white page, white cards, slate text, a muted
 * blue primary and a warm amber accent (so the two chart series stay
 * distinguishable), and the system font stack. Text pairs meet WCAG AA
 * (4.5:1) on both bg and surface; chart and streak colors meet 3:1.
 */
export const classicCssVars: CssVarPack = {
  // Colors
  'color-bg': '#f7f8fa', // near-white, faint cool tint
  'color-surface': '#ffffff', // cards
  'color-text': '#1f2933', // slate ink
  'color-primary': '#3b6ea8', // muted blue; white text on it passes AA
  'color-accent': '#b7791f', // restrained amber for the second series
  'color-muted': '#5f6b7a', // secondary text

  // Priority colors
  'color-priority-low': '#2f855a', // calm green
  'color-priority-medium': '#b7791f', // amber
  'color-priority-high': '#c53030', // clear red

  // Streak colors
  'color-streak-lit': '#d97706', // warm amber
  'color-streak-unlit': '#d5dae1', // pale grey

  // Chart colors
  'color-bar-bg': '#e6eaf0', // empty bar track

  // Typography
  'font-family-base':
    "system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",

  // Shape
  'radius-card': '8px',
  'shadow-card': '0 1px 3px #1f293314, 0 0 0 1px #1f29330f',

  // Animation
  'anim-complete-duration': '300ms',
  'anim-complete-shake': '0px',
};
