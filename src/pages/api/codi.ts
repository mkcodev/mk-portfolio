import type { APIRoute } from 'astro';
import { validateRequest } from '../../server/validate';
import { checkBlocked, checkRateLimit, recordStrike } from '../../server/ratelimit';
import { buildPrompt } from '../../server/prompt';
import { streamGemini, createSSERelay } from '../../server/gemini';

export const prerender = false;
export const maxDuration = 60;

export const POST: APIRoute = async (ctx) => {
  let body: unknown;
  try {
    body = await ctx.request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const validation = validateRequest(body);
  if (!validation.ok) {
    return new Response(JSON.stringify({ error: validation.error }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const req = validation.data;

  const blockCheck = await checkBlocked(ctx);
  if (blockCheck.blocked) {
    return new Response(
      JSON.stringify({ error: 'blocked', blockedUntil: blockCheck.blockedUntil }),
      { status: 403, headers: { 'Content-Type': 'application/json' } },
    );
  }

  const rlResult = await checkRateLimit(ctx);
  if (!rlResult.allowed) {
    return new Response(
      JSON.stringify({ error: 'rate_limited', retryAfter: rlResult.retryAfter }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': String(rlResult.retryAfter ?? 60),
        },
      },
    );
  }

  const strikeLevel = 0;

  const { systemInstruction, contents, maxOutputTokens } = buildPrompt(req, strikeLevel);

  let geminiStream: ReadableStream<Uint8Array>;
  try {
    geminiStream = await streamGemini({ systemInstruction, contents, maxOutputTokens });
  } catch (err) {
    console.error('[codi/api] Gemini error:', err);
    return new Response(JSON.stringify({ error: 'gemini_error' }), {
      status: 502,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const sseStream = createSSERelay(geminiStream);

  return new Response(sseStream, {
    status: 200,
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
      'X-Codi-Remaining': String(rlResult.remaining),
    },
  });
};

export const HEAD: APIRoute = async () => {
  return new Response(null, { status: 200 });
};
