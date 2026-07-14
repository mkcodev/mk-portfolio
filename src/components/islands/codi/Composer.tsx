import { useRef, useCallback, useEffect } from 'react';
import type { CodiStrings } from '../../../data/codi/strings';

interface Props {
  disabled: boolean;
  rateCount: number;
  rateError: string | null;
  s: CodiStrings;
  onSend: (text: string) => void;
}

const RATE_MAX = 30;
const RATE_WARN = 25;

function formatCountdown(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function Composer({ disabled, rateCount, rateError, s, onSend }: Props) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!disabled) {
      textareaRef.current?.focus();
    }
  }, [disabled]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  }, []);

  const submit = useCallback(() => {
    const ta = textareaRef.current;
    if (!ta || disabled) return;
    const text = ta.value.trim();
    if (!text) return;
    ta.value = '';
    ta.style.height = 'auto';
    onSend(text);
  }, [disabled, onSend]);

  const autoResize = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const ta = e.target;
    ta.style.height = 'auto';
    ta.style.height = `${Math.min(ta.scrollHeight, 96)}px`;
  }, []);

  const rateClass =
    rateCount >= RATE_MAX
      ? 'codi-composer__rate--limit'
      : rateCount >= RATE_WARN
        ? 'codi-composer__rate--warn'
        : '';

  const isRateLimited = rateCount >= RATE_MAX;
  const isDisabled = disabled || isRateLimited;

  let retryMs: number | null = null;
  if (rateError?.startsWith('rate_limited:')) {
    const secs = parseInt(rateError.slice(13), 10);
    retryMs = isNaN(secs) ? 60_000 : secs * 1000;
  }

  return (
    <div className="codi-composer">
      <div className="codi-composer__row">
        <span className="codi-composer__prompt" aria-hidden="true">
          &gt;
        </span>
        <textarea
          ref={textareaRef}
          className="codi-composer__input"
          rows={1}
          placeholder={
            isRateLimited
              ? `${s.placeholderDisabled} ${retryMs !== null ? formatCountdown(retryMs) : '…'}`
              : s.placeholder.replace('> ', '').replace('_', '')
          }
          disabled={isDisabled}
          aria-label="Escribe tu mensaje"
          aria-multiline="true"
          onKeyDown={handleKeyDown}
          onChange={autoResize}
        />
        <button
          type="button"
          className="codi-composer__send"
          disabled={isDisabled}
          aria-label={s.send}
          onClick={submit}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
            <path d="M1 13L13 7L1 1V5.5L9 7L1 8.5V13Z" fill="currentColor" />
          </svg>
        </button>
      </div>

      <div className="codi-composer__meta">
        <span className={`codi-composer__rate ${rateClass}`} aria-live="off">
          {rateCount}/{RATE_MAX} {s.rateLimit}
        </span>
      </div>
    </div>
  );
}
