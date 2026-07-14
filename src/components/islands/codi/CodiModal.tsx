import { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useCodiStore } from './useCodiStore';
import type { Reaction } from './useCodiStore';
import { sendMessage } from './stream';
import { STRINGS } from '../../../data/codi/strings';
import type { Lang } from '../../../data/site';
import MessageList from './MessageList';
import QuickReplies from './QuickReplies';
import Composer from './Composer';
import './CodiChat.css';

interface Props {
  lang: Lang;
  open: boolean;
  onClose: () => void;
}

const SPRING = { type: 'spring' as const, stiffness: 320, damping: 26, mass: 0.9 };
const EXIT = { duration: 0.3, ease: [0.36, 0, 0.66, -0.56] as [number, number, number, number] };

export default function CodiModal({ lang, open, onClose }: Props) {
  const { state, dispatch, isRateLimited, getMessageCount, isBlocked } = useCodiStore(lang);
  const s = STRINGS[lang];

  // ---- Typewriter drain ----
  const bufferRef = useRef('');
  const displayedRef = useRef('');
  const drainRafRef = useRef(0);
  const isStreamingRef = useRef(false);
  const [typewriterText, setTypewriterText] = useState('');

  // ---- Waveform ----
  const [waveformActive, setWaveformActive] = useState(false);
  const firstChunkRef = useRef(false);

  // ---- Misc ----
  const lastUserMsgRef = useRef('');
  const greetedRef = useRef(false);
  const [localQuickReplies, setLocalQuickReplies] = useState<string[]>([]);
  const [blockedDisplay, setBlockedDisplay] = useState('');

  // Keep streaming ref in sync
  useEffect(() => {
    isStreamingRef.current = state.streaming;
    if (!state.streaming) {
      cancelAnimationFrame(drainRafRef.current);
      drainRafRef.current = 0;
      if (displayedRef.current !== bufferRef.current) {
        displayedRef.current = bufferRef.current;
        setTypewriterText(bufferRef.current);
      }
    }
  }, [state.streaming]);

  // Keep buffer ref in sync with store streamingText
  useEffect(() => {
    bufferRef.current = state.streamingText;
  }, [state.streamingText]);

  // Reset for new stream start
  useEffect(() => {
    if (state.streaming && state.streamingText === '') {
      bufferRef.current = '';
      displayedRef.current = '';
      setTypewriterText('');
      firstChunkRef.current = false;
      setWaveformActive(true);
    }
  }, [state.streaming, state.streamingText]);

  // Start drain loop when streaming
  useEffect(() => {
    if (!state.streaming) return;

    const tick = () => {
      const current = displayedRef.current;
      const target = bufferRef.current;

      if (current.length < target.length) {
        const remaining = target.length - current.length;
        const chars = remaining > 300 ? 4 : 2;
        const next = target.slice(0, current.length + chars);
        displayedRef.current = next;
        setTypewriterText(next);
      }

      if (isStreamingRef.current) {
        drainRafRef.current = requestAnimationFrame(tick);
      }
    };

    drainRafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(drainRafRef.current);
  }, [state.streaming]);

  // Greeting on first open
  useEffect(() => {
    if (!open || greetedRef.current) return;
    greetedRef.current = true;

    const { messages, profile } = state.persist;

    if (messages.length === 0) {
      const path = window.location.pathname;
      let greeting: string;
      if (path === '/' || path === '/en' || path === '/en/') {
        greeting = s.greetingFirst.home;
      } else if (path.includes('/proyectos/') || path.includes('/projects/')) {
        greeting = s.greetingFirst.caseStudy;
      } else {
        greeting = s.greetingFirst.default;
      }
      dispatch({ type: 'ADD_CODI_MESSAGE', text: greeting });
      setLocalQuickReplies(s.quickRepliesDefault as unknown as string[]);
    } else {
      const topic = profile.lastTopic;
      const greeting = topic ? s.greetingReturn.replace('{topic}', topic) : s.greetingReturnNoTopic;
      dispatch({ type: 'ADD_CODI_MESSAGE', text: greeting });
      setLocalQuickReplies(s.quickRepliesReturn as unknown as string[]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Blocked countdown
  useEffect(() => {
    if (!isBlocked()) {
      setBlockedDisplay('');
      return;
    }

    const tick = () => {
      const { blockedUntil } = state.persist.strikes;
      if (!blockedUntil) return;
      const ms = blockedUntil - Date.now();
      if (ms <= 0) {
        setBlockedDisplay('');
        return;
      }
      const total = Math.ceil(ms / 1000);
      const m = Math.floor(total / 60);
      const sec = total % 60;
      setBlockedDisplay(`${m}:${sec.toString().padStart(2, '0')}`);
    };

    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [state.persist.strikes, isBlocked]);

  // Cleanup on unmount
  useEffect(() => () => cancelAnimationFrame(drainRafRef.current), []);

  const handleSend = useCallback(
    (text: string) => {
      if (state.streaming || isBlocked() || isRateLimited()) return;

      lastUserMsgRef.current = text;
      dispatch({ type: 'SET_ERROR', error: null });

      const messageId = crypto.randomUUID();
      const historySnapshot = state.persist.messages.map((m) => ({
        role: m.role,
        text: m.text,
      }));
      const history: Array<{ role: 'user' | 'codi'; text: string }> = [
        ...historySnapshot,
        { role: 'user', text },
      ];

      dispatch({ type: 'SEND_USER', text });
      dispatch({ type: 'STREAMING_START', messageId });
      setLocalQuickReplies([]);

      sendMessage({
        messages: history,
        lang,
        path: window.location.pathname,
        sessionTokens: state.persist.sessionTokens,
        onChunk: (chunk) => {
          if (!firstChunkRef.current) {
            firstChunkRef.current = true;
            setWaveformActive(false);
          }
          dispatch({ type: 'STREAMING_CHUNK', text: chunk });
        },
        onDone: (meta) => {
          dispatch({ type: 'STREAMING_DONE', meta });
        },
        onError: (error) => {
          dispatch({ type: 'STREAMING_ERROR', error });
          setWaveformActive(false);
        },
      });
    },
    [state.streaming, state.persist, lang, isBlocked, isRateLimited, dispatch],
  );

  const handleRetry = useCallback(() => {
    const text = lastUserMsgRef.current;
    if (text) handleSend(text);
  }, [handleSend]);

  const handleQuickReply = useCallback(
    (text: string) => {
      const clearMemoryLabel = s.quickRepliesReturn[2] as string;
      if (text === clearMemoryLabel) {
        dispatch({ type: 'CLEAR_MEMORY' });
        greetedRef.current = false;
        setLocalQuickReplies([]);
        return;
      }
      setLocalQuickReplies([]);
      handleSend(text);
    },
    [handleSend, dispatch, s],
  );

  const handleReact = useCallback(
    (messageId: string, reaction: Reaction) => {
      dispatch({ type: 'SET_REACTION', messageId, reaction });
    },
    [dispatch],
  );

  const quickReplies = state.quickReplies.length > 0 ? state.quickReplies : localQuickReplies;
  const blocked = isBlocked();
  const showError =
    !!state.lastError &&
    !state.streaming &&
    !state.lastError.startsWith('rate_limited:') &&
    !state.lastError.startsWith('blocked:');
  const showRateLimit = state.lastError?.startsWith('rate_limited:');

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="codi-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={onClose}
            aria-hidden="true"
          />

          <motion.div
            className="codi-modal"
            initial={{ scale: 0.18, opacity: 0.4 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.15, opacity: 0, transition: EXIT }}
            transition={SPRING}
            style={{ transformOrigin: 'bottom right' }}
            role="dialog"
            aria-label={s.modalLabel}
          >
            {blocked && (
              <div className="codi-blocked">
                <span className="codi-blocked__icon" aria-hidden="true">
                  🔒
                </span>
                <p className="codi-blocked__msg">{s.blocked}</p>
                {blockedDisplay && (
                  <span className="codi-blocked__timer" aria-live="polite">
                    {blockedDisplay}
                  </span>
                )}
              </div>
            )}

            <header className="codi-header">
              <div className="codi-header__orb" aria-hidden="true" />
              <div className="codi-header__info">
                <span className="codi-header__name">{s.title}</span>
                <span className="codi-header__sub">{s.subtitle}</span>
              </div>
              <div className="codi-header__actions">
                <button
                  type="button"
                  className="codi-icon-btn"
                  aria-label={s.clearMemory}
                  title={s.clearMemory}
                  onClick={() => {
                    dispatch({ type: 'CLEAR_MEMORY' });
                    greetedRef.current = false;
                    setLocalQuickReplies([]);
                    setTypewriterText('');
                    bufferRef.current = '';
                    displayedRef.current = '';
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                    <path
                      d="M2 2L12 12M12 2L2 12"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                    />
                  </svg>
                </button>
                <button
                  type="button"
                  className="codi-icon-btn"
                  aria-label={s.close}
                  onClick={onClose}
                >
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                    <path
                      d="M1 1L13 13M13 1L1 13"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                    />
                  </svg>
                </button>
              </div>
            </header>

            <MessageList
              messages={state.persist.messages}
              reactions={state.persist.reactions}
              activeMessageId={state.activeMessageId}
              typewriterText={typewriterText}
              waveformActive={waveformActive}
              watermark={s.watermark}
              onReact={handleReact}
            />

            {quickReplies.length > 0 && !state.streaming && (
              <QuickReplies options={quickReplies} onPick={handleQuickReply} />
            )}

            {showError && (
              <div className="codi-error-row">
                <span className="codi-error-text">{s.error}</span>
                <button type="button" className="codi-retry-btn" onClick={handleRetry}>
                  {s.retry}
                </button>
              </div>
            )}

            {showRateLimit && (
              <div className="codi-error-row">
                <span className="codi-error-text">{s.rateLimitHit}</span>
              </div>
            )}

            <Composer
              disabled={state.streaming || blocked}
              rateCount={getMessageCount()}
              rateError={state.lastError}
              s={s}
              onSend={handleSend}
            />
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
