import { useReducer, useCallback, useEffect, useRef } from 'react';
import type { Lang } from '../../../data/site';

export type MetaAction = 'calculator' | 'tour' | 'calendly' | 'brief' | 'contact';
export type Reaction = '👍' | '👎' | '❤️';

export interface CodiMessage {
  id: string;
  role: 'user' | 'codi';
  text: string;
  ts: number;
  streaming?: boolean;
  action?: MetaAction;
  calcSeed?: import('../../../data/codi/calculator').CalcSeed;
  error?: boolean;
}

export interface BriefState {
  objetivo?: string;
  tipo?: string;
  presupuesto?: string;
  timing?: string;
  referencias?: string;
  features?: string;
}

export interface RateInfo {
  timestamps: number[];
  warningShown: boolean;
}

interface CodiPersist {
  v: 1;
  profile: { name?: string; lastTopic?: string; lastSeen: number };
  messages: CodiMessage[];
  reactions: Record<string, Reaction>;
  prefs: { sound: boolean; terminalMode: boolean };
  rate: number[];
  strikes: { count: 0 | 1 | 2 | 3; blockedUntil?: number };
  sessionTokens: number;
}

const STORAGE_KEY = 'mkcodev:codi';
const MAX_MESSAGES = 60;

const DEFAULT_PERSIST: CodiPersist = {
  v: 1,
  profile: { lastSeen: Date.now() },
  messages: [],
  reactions: {},
  prefs: { sound: true, terminalMode: false },
  rate: [],
  strikes: { count: 0 },
  sessionTokens: 0,
};

function loadPersist(): CodiPersist {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_PERSIST };
    const parsed = JSON.parse(raw) as CodiPersist;
    if (parsed.v !== 1) return { ...DEFAULT_PERSIST };
    return parsed;
  } catch {
    return { ...DEFAULT_PERSIST };
  }
}

function savePersist(state: CodiPersist): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (err) {
    console.error('[codi/store] localStorage write failed:', err);
  }
}

export interface CodiState {
  persist: CodiPersist;
  open: boolean;
  streaming: boolean;
  streamingText: string;
  quickReplies: string[];
  brief: BriefState;
  briefPanelOpen: boolean;
  lastError: string | null;
  lang: Lang;
  activeMessageId: string | null;
}

type CodiAction =
  | { type: 'OPEN' }
  | { type: 'CLOSE' }
  | { type: 'SEND_USER'; text: string }
  | { type: 'STREAMING_START'; messageId: string }
  | { type: 'STREAMING_CHUNK'; text: string }
  | { type: 'STREAMING_DONE'; meta: MetaResult }
  | { type: 'STREAMING_ERROR'; error: string }
  | { type: 'SET_REACTION'; messageId: string; reaction: Reaction }
  | { type: 'SET_LANG'; lang: Lang }
  | { type: 'TOGGLE_SOUND' }
  | { type: 'TOGGLE_TERMINAL_MODE' }
  | { type: 'CLEAR_MEMORY' }
  | {
      type: 'ADD_CODI_MESSAGE';
      text: string;
      action?: MetaAction;
      calcSeed?: import('../../../data/codi/calculator').CalcSeed;
    }
  | { type: 'OPEN_BRIEF' }
  | { type: 'CLOSE_BRIEF' }
  | { type: 'RECORD_RATE' }
  | { type: 'SET_ERROR'; error: string | null }
  | { type: 'SET_ACTIVE_MESSAGE'; id: string | null };

export interface MetaResult {
  quickReplies: string[];
  action: MetaAction | null;
  calcSeed: import('../../../data/codi/calculator').CalcSeed | null;
  briefPatch: Partial<BriefState> | null;
  leadTemp: 'cold' | 'warm' | 'hot' | null;
  strike: boolean;
}

function reducer(state: CodiState, action: CodiAction): CodiState {
  switch (action.type) {
    case 'OPEN':
      return { ...state, open: true };

    case 'CLOSE':
      return { ...state, open: false };

    case 'SET_LANG':
      return { ...state, lang: action.lang };

    case 'SEND_USER': {
      const msg: CodiMessage = {
        id: crypto.randomUUID(),
        role: 'user',
        text: action.text,
        ts: Date.now(),
      };
      const now = Date.now();
      const oneHourAgo = now - 3600 * 1000;
      const newRate = [...state.persist.rate.filter((t) => t > oneHourAgo), now];
      const newMessages = [...state.persist.messages, msg].slice(-MAX_MESSAGES);
      return {
        ...state,
        streaming: false,
        streamingText: '',
        lastError: null,
        persist: {
          ...state.persist,
          messages: newMessages,
          rate: newRate,
          sessionTokens: state.persist.sessionTokens + Math.ceil(action.text.length / 4),
        },
      };
    }

    case 'STREAMING_START': {
      const placeholder: CodiMessage = {
        id: action.messageId,
        role: 'codi',
        text: '',
        ts: Date.now(),
        streaming: true,
      };
      return {
        ...state,
        streaming: true,
        streamingText: '',
        activeMessageId: action.messageId,
        persist: {
          ...state.persist,
          messages: [...state.persist.messages, placeholder].slice(-MAX_MESSAGES),
        },
      };
    }

    case 'STREAMING_CHUNK':
      return { ...state, streamingText: state.streamingText + action.text };

    case 'STREAMING_DONE': {
      const { meta } = action;
      const finalText = state.streamingText;

      const updatedMessages = state.persist.messages.map((m) =>
        m.id === state.activeMessageId
          ? {
              ...m,
              text: finalText,
              streaming: false,
              action: meta.action ?? undefined,
              calcSeed: meta.calcSeed ?? undefined,
            }
          : m,
      );

      const newBrief = meta.briefPatch ? { ...state.brief, ...meta.briefPatch } : state.brief;

      const briefPanelOpen = state.briefPanelOpen || meta.action === 'brief';

      const updatedPersist: CodiPersist = {
        ...state.persist,
        messages: updatedMessages,
        sessionTokens: state.persist.sessionTokens + Math.ceil(finalText.length / 4),
        strikes: meta.strike
          ? {
              ...state.persist.strikes,
              count: Math.min(state.persist.strikes.count + 1, 3) as 0 | 1 | 2 | 3,
            }
          : state.persist.strikes,
      };

      return {
        ...state,
        streaming: false,
        streamingText: '',
        activeMessageId: null,
        quickReplies: meta.quickReplies,
        brief: newBrief,
        briefPanelOpen,
        persist: updatedPersist,
      };
    }

    case 'STREAMING_ERROR': {
      const updatedMessages = state.persist.messages.map((m) =>
        m.id === state.activeMessageId ? { ...m, text: '', streaming: false, error: true } : m,
      );
      return {
        ...state,
        streaming: false,
        streamingText: '',
        activeMessageId: null,
        lastError: action.error,
        persist: { ...state.persist, messages: updatedMessages },
      };
    }

    case 'ADD_CODI_MESSAGE': {
      const msg: CodiMessage = {
        id: crypto.randomUUID(),
        role: 'codi',
        text: action.text,
        ts: Date.now(),
        action: action.action,
        calcSeed: action.calcSeed,
      };
      return {
        ...state,
        persist: {
          ...state.persist,
          messages: [...state.persist.messages, msg].slice(-MAX_MESSAGES),
        },
      };
    }

    case 'SET_REACTION': {
      return {
        ...state,
        persist: {
          ...state.persist,
          reactions: { ...state.persist.reactions, [action.messageId]: action.reaction },
        },
      };
    }

    case 'TOGGLE_SOUND':
      return {
        ...state,
        persist: {
          ...state.persist,
          prefs: { ...state.persist.prefs, sound: !state.persist.prefs.sound },
        },
      };

    case 'TOGGLE_TERMINAL_MODE':
      return {
        ...state,
        persist: {
          ...state.persist,
          prefs: { ...state.persist.prefs, terminalMode: !state.persist.prefs.terminalMode },
        },
      };

    case 'CLEAR_MEMORY':
      return {
        ...state,
        brief: {},
        quickReplies: [],
        persist: {
          ...DEFAULT_PERSIST,
          prefs: state.persist.prefs,
        },
      };

    case 'OPEN_BRIEF':
      return { ...state, briefPanelOpen: true };

    case 'CLOSE_BRIEF':
      return { ...state, briefPanelOpen: false };

    case 'RECORD_RATE': {
      const now = Date.now();
      const newRate = [...state.persist.rate.filter((t) => t > now - 3600 * 1000), now];
      return { ...state, persist: { ...state.persist, rate: newRate } };
    }

    case 'SET_ERROR':
      return { ...state, lastError: action.error };

    case 'SET_ACTIVE_MESSAGE':
      return { ...state, activeMessageId: action.id };

    default:
      return state;
  }
}

export function useCodiStore(lang: Lang) {
  const persistRef = useRef<CodiPersist | null>(null);
  const saveTimerRef = useRef<number>(0);

  const getInitialState = (): CodiState => {
    if (typeof window === 'undefined') {
      return {
        persist: { ...DEFAULT_PERSIST },
        open: false,
        streaming: false,
        streamingText: '',
        quickReplies: [],
        brief: {},
        briefPanelOpen: false,
        lastError: null,
        lang,
        activeMessageId: null,
      };
    }
    const persist = loadPersist();
    persistRef.current = persist;
    return {
      persist,
      open: false,
      streaming: false,
      streamingText: '',
      quickReplies: [],
      brief: {},
      briefPanelOpen: false,
      lastError: null,
      lang,
      activeMessageId: null,
    };
  };

  const [state, dispatch] = useReducer(reducer, undefined, getInitialState);

  useEffect(() => {
    clearTimeout(saveTimerRef.current);
    saveTimerRef.current = window.setTimeout(() => {
      savePersist(state.persist);
    }, 500);
    return () => clearTimeout(saveTimerRef.current);
  }, [state.persist]);

  const isRateLimited = useCallback(() => {
    const now = Date.now();
    const recent = state.persist.rate.filter((t) => t > now - 3600 * 1000);
    return recent.length >= 30;
  }, [state.persist.rate]);

  const getMessageCount = useCallback(() => {
    const now = Date.now();
    return state.persist.rate.filter((t) => t > now - 3600 * 1000).length;
  }, [state.persist.rate]);

  const isBlocked = useCallback(() => {
    const { blockedUntil } = state.persist.strikes;
    if (!blockedUntil) return false;
    return Date.now() < blockedUntil;
  }, [state.persist.strikes]);

  return { state, dispatch, isRateLimited, getMessageCount, isBlocked };
}
