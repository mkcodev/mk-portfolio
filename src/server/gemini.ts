import type { GeminiMessage } from './prompt';

const GEMINI_API_KEY = import.meta.env.GEMINI_API_KEY as string | undefined;
const MODEL = 'gemini-3.1-flash-lite-preview';
const BASE_URL = 'https://generativelanguage.googleapis.com/v1beta';

export interface GeminiStreamParams {
  systemInstruction: string;
  contents: GeminiMessage[];
  maxOutputTokens: number;
}

export async function streamGemini(
  params: GeminiStreamParams,
): Promise<ReadableStream<Uint8Array>> {
  if (!GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY is not configured');
  }

  const url = `${BASE_URL}/models/${MODEL}:streamGenerateContent?alt=sse&key=${GEMINI_API_KEY}`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30_000);

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    signal: controller.signal,
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: params.systemInstruction }] },
      contents: params.contents,
      generationConfig: {
        maxOutputTokens: params.maxOutputTokens,
        temperature: 0.7,
        topP: 0.9,
      },
    }),
  });

  clearTimeout(timeout);

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Gemini API error ${response.status}: ${err}`);
  }

  if (!response.body) {
    throw new Error('Gemini response has no body');
  }

  return response.body;
}

const META_MARKER = '<<<META';

export function createSSERelay(
  geminiStream: ReadableStream<Uint8Array>,
  onStrike?: () => Promise<void>,
): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();

  return new ReadableStream({
    async start(controller) {
      const reader = geminiStream.getReader();
      let buffer = '';
      let fullText = '';

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
              const parsed = JSON.parse(raw) as {
                candidates?: Array<{
                  content?: { parts?: Array<{ text?: string }> };
                  finishReason?: string;
                }>;
              };

              const text = parsed.candidates?.[0]?.content?.parts?.[0]?.text;
              if (text) {
                fullText += text;
                const chunk = JSON.stringify({ t: text });
                controller.enqueue(encoder.encode(`data: ${chunk}\n\n`));
              }

              const finish = parsed.candidates?.[0]?.finishReason;
              if (finish && finish !== 'STOP' && finish !== 'MAX_TOKENS') {
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ err: finish })}\n\n`));
              }
            } catch {
              // skip malformed chunks
            }
          }
        }

        // Parse META for strike detection before closing the stream
        if (onStrike) {
          const metaIdx = fullText.indexOf(META_MARKER);
          if (metaIdx >= 0) {
            try {
              const jsonStr = fullText
                .slice(metaIdx + META_MARKER.length)
                .replace(/>>>$/, '')
                .trim();
              const meta = JSON.parse(jsonStr) as { strike?: boolean };
              if (meta.strike === true) {
                await onStrike();
              }
            } catch {
              // ignore parse errors
            }
          }
        }

        controller.enqueue(encoder.encode('data: [DONE]\n\n'));
        controller.close();
      } catch {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ err: 'stream_error' })}\n\n`));
        controller.close();
      } finally {
        reader.releaseLock();
      }
    },
  });
}
