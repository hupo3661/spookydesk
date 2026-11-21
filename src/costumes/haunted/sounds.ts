import type { SoundPack } from '../types';

// No audio assets exist yet under public/sounds/haunted/, so every slot is
// intentionally silent (null). Replace a null with a path such as
// 'sounds/haunted/task-complete.mp3' once the file is added.
export const hauntedSounds: SoundPack = {
  'task-complete': null,
  'task-add': null,
  'session-start': null,
  'session-end': null,
  'costume-change': null,
};
