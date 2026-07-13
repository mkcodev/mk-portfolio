import type { Lang } from '../data/site';

export type MetaAction = 'calculator' | 'tour' | 'calendly' | 'brief' | 'contact';

export interface CodiRequestMessage {
  role: 'user' | 'codi';
  text: string;
}

export interface CodiRequest {
  messages: CodiRequestMessage[];
  lang: Lang;
  path: string;
  condense?: boolean;
  sessionTokens?: number;
}

export type ValidationResult =
  | { ok: true; data: CodiRequest }
  | { ok: false; error: string };

export function validateRequest(body: unknown): ValidationResult {
  if (typeof body !== 'object' || body === null) {
    return { ok: false, error: 'Request body must be an object' };
  }

  const b = body as Record<string, unknown>;

  if (!Array.isArray(b.messages)) {
    return { ok: false, error: '`messages` must be an array' };
  }

  if (b.messages.length === 0) {
    return { ok: false, error: '`messages` must not be empty' };
  }

  if (b.messages.length > 20) {
    return { ok: false, error: '`messages` exceeds max length of 20' };
  }

  for (const msg of b.messages) {
    if (typeof msg !== 'object' || msg === null) {
      return { ok: false, error: 'Each message must be an object' };
    }
    const m = msg as Record<string, unknown>;
    if (m.role !== 'user' && m.role !== 'codi') {
      return { ok: false, error: 'Each message role must be "user" or "codi"' };
    }
    if (typeof m.text !== 'string' || m.text.trim().length === 0) {
      return { ok: false, error: 'Each message must have a non-empty text string' };
    }
    if (m.text.length > 4000) {
      return { ok: false, error: 'Message text exceeds 4000 characters' };
    }
  }

  const lang = b.lang;
  if (lang !== 'es' && lang !== 'en') {
    return { ok: false, error: '`lang` must be "es" or "en"' };
  }

  if (typeof b.path !== 'string') {
    return { ok: false, error: '`path` must be a string' };
  }

  return {
    ok: true,
    data: {
      messages: b.messages as CodiRequestMessage[],
      lang: lang as Lang,
      path: String(b.path).slice(0, 200),
      condense: b.condense === true,
      sessionTokens: typeof b.sessionTokens === 'number' ? b.sessionTokens : 0,
    },
  };
}
