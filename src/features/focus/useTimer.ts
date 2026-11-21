import { useCallback, useEffect, useReducer, useRef } from 'react';
import { useCostume } from '../../engine/useCostume';
import { linkSession, unlinkSession } from '../tasks/storage';
import { appendSession } from './storage';
import { updateStreak } from '../today-stats/streakStorage';
import { toLocalDate } from '../today-stats/dateUtils';
import type { TimerRecord, TimerState } from './types';

// --- Timestamp helpers (Design §3.2 to §3.4) ---

function getRemainingMs(record: TimerRecord): number {
  const now = record.pausedAt
    ? new Date(record.pausedAt).getTime()
    : Date.now();
  const elapsed = now - new Date(record.startedAt).getTime() - record.totalPausedMs;
  return Math.max(0, record.plannedMs - elapsed);
}

function getFraction(record: TimerRecord): number {
  const elapsed = record.plannedMs - getRemainingMs(record);
  return Math.min(1, Math.max(0, elapsed / record.plannedMs));
}

function computeActualSeconds(startedAt: string, totalPausedMs: number): number {
  return Math.round(
    (Date.now() - new Date(startedAt).getTime() - totalPausedMs) / 1000,
  );
}

// --- Reducer (Design §2.2) ---

export type TimerAction =
  | { type: 'START' }
  | { type: 'PAUSE' }
  | { type: 'RESUME' }
  | { type: 'RESET' }
  | { type: 'START_BREAK' }
  | { type: 'TICK' }
  | { type: 'FOCUS_COMPLETE' }
  | { type: 'BREAK_COMPLETE' }
  | { type: 'BIND_TASK'; taskId: string | null };

export interface TimerReducerState {
  state: TimerState;
  record: TimerRecord | null;
  boundTaskId: string | null;
  sessionId: string | null;
  plannedMinutes: number;
}

export const initialTimerState: TimerReducerState = {
  state: 'idle',
  record: null,
  boundTaskId: null,
  sessionId: null,
  plannedMinutes: 0,
};

export function timerReducer(
  state: TimerReducerState,
  action: TimerAction,
  config: { focusDuration: number; breakDuration: number },
): TimerReducerState {
  const { record } = state;

  switch (action.type) {
    case 'START': {
      if (state.state !== 'idle') return state;
      return {
        ...state,
        state: 'running',
        sessionId: crypto.randomUUID(),
        plannedMinutes: config.focusDuration,
        record: {
          phase: 'focus',
          startedAt: new Date().toISOString(),
          pausedAt: null,
          totalPausedMs: 0,
          plannedMs: config.focusDuration * 60000,
        },
      };
    }

    case 'PAUSE': {
      if (!record || (state.state !== 'running' && state.state !== 'break_running')) {
        return state;
      }
      return {
        ...state,
        state: record.phase === 'focus' ? 'paused' : 'break_paused',
        record: { ...record, pausedAt: new Date().toISOString() },
      };
    }

    case 'RESUME': {
      if (
        !record ||
        !record.pausedAt ||
        (state.state !== 'paused' && state.state !== 'break_paused')
      ) {
        return state;
      }
      return {
        ...state,
        state: record.phase === 'focus' ? 'running' : 'break_running',
        record: {
          ...record,
          totalPausedMs:
            record.totalPausedMs + (Date.now() - new Date(record.pausedAt).getTime()),
          pausedAt: null,
        },
      };
    }

    case 'TICK':
      // New reference so useReducer re-renders and derived values recompute from Date.now().
      return { ...state };

    case 'FOCUS_COMPLETE': {
      if (state.state !== 'running' || !record || !state.sessionId) return state;
      appendSession({
        id: state.sessionId,
        taskId: state.boundTaskId,
        startedAt: record.startedAt,
        plannedMinutes: state.plannedMinutes,
        actualSeconds: computeActualSeconds(record.startedAt, record.totalPausedMs),
        completed: true,
      });
      return { ...state, state: 'completed' };
    }

    case 'RESET': {
      if (state.state === 'idle') return state;
      if (
        (state.state === 'running' || state.state === 'paused') &&
        record &&
        state.sessionId
      ) {
        const openPauseMs = record.pausedAt
          ? Date.now() - new Date(record.pausedAt).getTime()
          : 0;
        appendSession({
          id: state.sessionId,
          taskId: state.boundTaskId,
          startedAt: record.startedAt,
          plannedMinutes: state.plannedMinutes,
          actualSeconds: computeActualSeconds(
            record.startedAt,
            record.totalPausedMs + openPauseMs,
          ),
          completed: false,
        });
      }
      return { ...initialTimerState, boundTaskId: state.boundTaskId };
    }

    case 'START_BREAK': {
      if (state.state !== 'completed') return state;
      return {
        ...state,
        state: 'break_running',
        sessionId: null,
        record: {
          phase: 'break',
          startedAt: new Date().toISOString(),
          pausedAt: null,
          totalPausedMs: 0,
          plannedMs: config.breakDuration * 60000,
        },
      };
    }

    case 'BREAK_COMPLETE': {
      if (state.state !== 'break_running') return state;
      return { ...initialTimerState, boundTaskId: state.boundTaskId };
    }

    case 'BIND_TASK': {
      if (state.state !== 'idle') return state;
      return { ...state, boundTaskId: action.taskId };
    }
  }
}

// --- Hook (Design §6.1) ---

export interface UseTimerReturn {
  state: TimerState;
  remainingMs: number;
  fraction: number;
  boundTaskId: string | null;
  start: () => void;
  pause: () => void;
  resume: () => void;
  reset: () => void;
  startBreak: () => void;
  bindTask: (id: string | null) => void;
}

export function useTimer(focusDuration: number, breakDuration: number): UseTimerReturn {
  const [timer, dispatch] = useReducer(
    (s: TimerReducerState, a: TimerAction) =>
      timerReducer(s, a, { focusDuration, breakDuration }),
    initialTimerState,
  );
  const { play } = useCostume();
  const { state, record, boundTaskId, sessionId } = timer;

  const prevStateRef = useRef<TimerState>('idle');
  const linkedRef = useRef(false);

  // Tick loop: the interval only triggers a re-read of the timestamp-derived value.
  useEffect(() => {
    if (state !== 'running' && state !== 'break_running') return;
    const id = setInterval(() => {
      if (record === null) return;
      if (getRemainingMs(record) === 0) {
        dispatch({ type: record.phase === 'focus' ? 'FOCUS_COMPLETE' : 'BREAK_COMPLETE' });
      } else {
        dispatch({ type: 'TICK' });
      }
    }, 500);
    return () => clearInterval(id);
  }, [state, record]);

  // Transition side effects (sound + task linking).
  useEffect(() => {
    const prev = prevStateRef.current;
    if (prev !== state) {
      if (prev === 'idle' && state === 'running') {
        play('session-start');
        if (boundTaskId && sessionId) {
          linkSession(boundTaskId, sessionId);
          linkedRef.current = true;
        }
      } else if (state === 'completed') {
        play('session-end');
        updateStreak(toLocalDate());
        if (linkedRef.current && boundTaskId) unlinkSession(boundTaskId);
        linkedRef.current = false;
      } else if (state === 'idle' && (prev === 'running' || prev === 'paused')) {
        if (linkedRef.current && boundTaskId) unlinkSession(boundTaskId);
        linkedRef.current = false;
      }
    }
    prevStateRef.current = state;
  }, [state, sessionId, boundTaskId, play]);

  const remainingMs =
    record === null
      ? focusDuration * 60000
      : state === 'completed'
        ? 0
        : getRemainingMs(record);
  const fraction =
    record === null ? 0 : state === 'completed' ? 1 : getFraction(record);

  const start = useCallback(() => dispatch({ type: 'START' }), []);
  const pause = useCallback(() => dispatch({ type: 'PAUSE' }), []);
  const resume = useCallback(() => dispatch({ type: 'RESUME' }), []);
  const reset = useCallback(() => dispatch({ type: 'RESET' }), []);
  const startBreak = useCallback(() => dispatch({ type: 'START_BREAK' }), []);
  const bindTask = useCallback(
    (id: string | null) => dispatch({ type: 'BIND_TASK', taskId: id }),
    [],
  );

  return {
    state,
    remainingMs,
    fraction,
    boundTaskId,
    start,
    pause,
    resume,
    reset,
    startBreak,
    bindTask,
  };
}
