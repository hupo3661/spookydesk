import type { SoundPack } from '../types';

// Synthesized locally (soft bright chimes); files live under
// public/sounds/classic/. Paths are relative so they resolve against the
// document base URL on any deployment subpath.
export const classicSounds: SoundPack = {
  'task-complete': 'sounds/classic/task-complete.mp3',
  'task-add': 'sounds/classic/task-add.mp3',
  'session-start': 'sounds/classic/session-start.mp3',
  'session-end': 'sounds/classic/session-end.mp3',
  'costume-change': 'sounds/classic/costume-change.mp3',
};
