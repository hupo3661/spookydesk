import type { SoundPack } from '../types';

// Synthesized locally (low bells, creaks, drones); files live under
// public/sounds/haunted/. Paths are relative so they resolve against the
// document base URL on any deployment subpath.
export const hauntedSounds: SoundPack = {
  'task-complete': 'sounds/haunted/task-complete.mp3',
  'task-add': 'sounds/haunted/task-add.mp3',
  'session-start': 'sounds/haunted/session-start.mp3',
  'session-end': 'sounds/haunted/session-end.mp3',
  'costume-change': 'sounds/haunted/costume-change.mp3',
};
