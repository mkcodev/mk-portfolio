import { useEffect, useRef } from 'react';
import type { CodiMessage, Reaction } from './useCodiStore';
import Message from './Message';

interface Props {
  messages: CodiMessage[];
  reactions: Record<string, Reaction>;
  activeMessageId: string | null;
  typewriterText: string;
  waveformActive: boolean;
  watermark: string;
  onReact: (id: string, r: Reaction) => void;
}

export default function MessageList({
  messages,
  reactions,
  activeMessageId,
  typewriterText,
  waveformActive,
  watermark,
  onReact,
}: Props) {
  const endRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const isAtBottomRef = useRef(true);

  const checkBottom = () => {
    const el = listRef.current;
    if (!el) return;
    isAtBottomRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 60;
  };

  useEffect(() => {
    if (isAtBottomRef.current) {
      endRef.current?.scrollIntoView({ behavior: 'instant' });
    }
  }, [messages.length, typewriterText]);

  const isEmpty = messages.length === 0;

  return (
    <div
      ref={listRef}
      className="codi-messages"
      role="log"
      aria-live="polite"
      aria-label="Conversación con Codi"
      onScroll={checkBottom}
    >
      {isEmpty && (
        <div className="codi-watermark" aria-hidden="true">
          {watermark}
        </div>
      )}

      {messages.map((msg) => (
        <Message
          key={msg.id}
          msg={msg}
          reaction={reactions[msg.id]}
          onReact={onReact}
          typewriterText={msg.id === activeMessageId ? typewriterText : undefined}
          waveformActive={msg.id === activeMessageId ? waveformActive : undefined}
        />
      ))}

      <div ref={endRef} className="codi-messages__end" aria-hidden="true" />
    </div>
  );
}
