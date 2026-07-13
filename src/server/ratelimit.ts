import type { APIContext } from 'astro';

const UPSTASH_URL = import.meta.env.UPSTASH_REDIS_REST_URL as string | undefined;
const UPSTASH_TOKEN = import.meta.env.UPSTASH_REDIS_REST_TOKEN as string | undefined;

const upstashAvailable = Boolean(UPSTASH_URL && UPSTASH_TOKEN);

if (!upstashAvailable) {
  console.error('[codi/ratelimit] Upstash env vars missing — falling back to client-side rate limit only. Set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN for production.');
}

async function upstashFetch(cmd: unknown[]): Promise<unknown> {
  const res = await fetch(`${UPSTASH_URL!}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${UPSTASH_TOKEN!}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(cmd),
  });
  const json = await res.json() as { result: unknown };
  return json.result;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfter?: number;
}

export interface StrikeResult {
  blocked: boolean;
  blockedUntil?: number;
}

function getIP(ctx: APIContext): string {
  return (
    ctx.request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    ctx.request.headers.get('x-real-ip') ??
    'unknown'
  );
}

export async function checkRateLimit(ctx: APIContext): Promise<RateLimitResult> {
  if (!upstashAvailable) {
    return { allowed: true, remaining: 30 };
  }

  const ip = getIP(ctx);
  const key = `codi:rl:${ip}`;
  const now = Date.now();
  const windowMs = 3600 * 1000;
  const cutoff = now - windowMs;

  try {
    await upstashFetch(['ZREMRANGEBYSCORE', key, '-inf', cutoff.toString()]);
    const count = (await upstashFetch(['ZCARD', key])) as number;

    if (count >= 30) {
      const oldest = await upstashFetch(['ZRANGE', key, '0', '0', 'WITHSCORES']) as string[];
      const oldestTs = oldest.length >= 2 ? parseInt(oldest[1], 10) : now;
      const retryAfter = Math.ceil((oldestTs + windowMs - now) / 1000);
      return { allowed: false, remaining: 0, retryAfter };
    }

    await upstashFetch(['ZADD', key, now.toString(), `${now}-${Math.random()}`]);
    await upstashFetch(['EXPIRE', key, '3600']);
    return { allowed: true, remaining: 30 - count - 1 };
  } catch (err) {
    console.error('[codi/ratelimit] Upstash error, fail-open:', err);
    return { allowed: true, remaining: 30 };
  }
}

export async function checkBlocked(ctx: APIContext): Promise<StrikeResult> {
  if (!upstashAvailable) {
    return { blocked: false };
  }

  const ip = getIP(ctx);
  const key = `codi:block:${ip}`;

  try {
    const val = await upstashFetch(['GET', key]) as string | null;
    if (!val) return { blocked: false };
    const blockedUntil = parseInt(val, 10);
    if (Date.now() >= blockedUntil) {
      await upstashFetch(['DEL', key]);
      return { blocked: false };
    }
    return { blocked: true, blockedUntil };
  } catch (err) {
    console.error('[codi/ratelimit] Upstash error checking block, fail-open:', err);
    return { blocked: false };
  }
}

export async function recordStrike(ctx: APIContext): Promise<number> {
  if (!upstashAvailable) return 0;

  const ip = getIP(ctx);
  const key = `codi:strikes:${ip}`;

  try {
    const count = (await upstashFetch(['INCR', key])) as number;
    await upstashFetch(['EXPIRE', key, '86400']);

    if (count >= 3) {
      const blockKey = `codi:block:${ip}`;
      const blockedUntil = Date.now() + 3600 * 1000;
      await upstashFetch(['SET', blockKey, blockedUntil.toString(), 'EX', '3600']);
      return count;
    }

    return count;
  } catch (err) {
    console.error('[codi/ratelimit] Upstash error recording strike:', err);
    return 0;
  }
}
