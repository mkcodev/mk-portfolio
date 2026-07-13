import type { MetaResult } from './useCodiStore';
import type { CalcSeed } from '../../../data/codi/calculator';
import type { Lang } from '../../../data/site';

export interface SendMessageParams {
  messages: Array<{ role: 'user' | 'codi'; text: string }>;
  lang: Lang;
  path: string;
  sessionTokens: number;
  onChunk: (text: string) => void;
  onDone: (meta: MetaResult) => void;
  onError: (error: string) => void;
}

const META_DELIMITER = '<<<META';

function parseMeta(raw: string): MetaResult {
  const empty: MetaResult = {
    quickReplies: [],
    action: null,
    calcSeed: null,
    briefPatch: null,
    leadTemp: null,
    strike: false,
  };

  try {
    const jsonStr = raw.slice(META_DELIMITER.length).replace(/>>>$/, '').trim();
    const parsed = JSON.parse(jsonStr) as {
      quickReplies?: unknown;
      action?: unknown;
      calcSeed?: unknown;
      briefPatch?: unknown;
      leadTemp?: unknown;
      strike?: unknown;
    };

    return {
      quickReplies: Array.isArray(parsed.quickReplies)
        ? (parsed.quickReplies as string[]).slice(0, 4)
        : [],
      action: isValidAction(parsed.action) ? parsed.action : null,
      calcSeed: isValidCalcSeed(parsed.calcSeed) ? (parsed.calcSeed as CalcSeed) : null,
      briefPatch: typeof parsed.briefPatch === 'object' && parsed.briefPatch !== null
        ? (parsed.briefPatch as MetaResult['briefPatch'])
        : null,
      leadTemp: parsed.leadTemp === 'cold' || parsed.leadTemp === 'warm' || parsed.leadTemp === 'hot'
        ? parsed.leadTemp
        : null,
      strike: parsed.strike === true,
    };
  } catch {
    return empty;
  }
}

function isValidAction(v: unknown): v is MetaResult['action'] {
  return v === 'calculator' || v === 'tour' || v === 'calendly' || v === 'brief' || v === 'contact';
}

function isValidCalcSeed(v: unknown): v is CalcSeed {
  if (typeof v !== 'object' || v === null) return false;
  const obj = v as Record<string, unknown>;
  return (
    typeof obj.base === 'string' &&
    Array.isArray(obj.features) &&
    typeof obj.animations === 'string'
  );
}

export async function sendMessage(params: SendMessageParams): Promise<void> {
  const { messages, lang, path, sessionTokens, onChunk, onDone, onError } = params;

  const condense = sessionTokens > 12000;

  let response: Response;
  try {
    response = await fetch('/api/codi', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: messages.slice(-12),
        lang,
        path,
        condense,
        sessionTokens,
      }),
    });
  } catch {
    onError('network_error');
    return;
  }

  if (!response.ok) {
    try {
      const errBody = await response.json() as { error?: string; retryAfter?: number; blockedUntil?: number };
      if (response.status === 429) {
        onError(`rate_limited:${errBody.retryAfter ?? 60}`);
      } else if (response.status === 403) {
        onError(`blocked:${errBody.blockedUntil ?? 0}`);
      } else {
        onError(errBody.error ?? 'api_error');
      }
    } catch {
      onError('api_error');
    }
    return;
  }

  if (!response.body) {
    onError('no_stream');
    return;
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let fullText = '';
  let metaLine = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        const raw = line.slice(6).trim();
        if (raw === '[DONE]') continue;

        try {
          const chunk = JSON.parse(raw) as { t?: string; err?: string };

          if (chunk.err) {
            onError(chunk.err);
            return;
          }

          if (chunk.t) {
            const text = chunk.t;

            if (metaLine || text.includes(META_DELIMITER)) {
              metaLine += text;
            } else {
              const metaIdx = (fullText + text).indexOf(META_DELIMITER);
              if (metaIdx >= 0) {
                const beforeMeta = (fullText + text).slice(0, metaIdx);
                const toShow = beforeMeta.slice(fullText.length);
                if (toShow) onChunk(toShow);
                metaLine = (fullText + text).slice(metaIdx);
              } else {
                fullText += text;
                onChunk(text);
              }
            }
          }
        } catch {
          // skip malformed
        }
      }
    }
  } catch (err) {
    onError('stream_read_error');
    return;
  } finally {
    reader.releaseLock();
  }

  const meta = metaLine.includes(META_DELIMITER) ? parseMeta(metaLine) : {
    quickReplies: [],
    action: null,
    calcSeed: null,
    briefPatch: null,
    leadTemp: null,
    strike: false,
  };

  onDone(meta);
}
