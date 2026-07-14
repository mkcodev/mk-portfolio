import type { CodiMessage, Reaction } from './useCodiStore';
import Waveform from './Waveform';

interface Props {
  msg: CodiMessage;
  reaction?: Reaction;
  onReact: (id: string, r: Reaction) => void;
  typewriterText?: string;
  waveformActive?: boolean;
}

const REACTIONS: Array<{ emoji: Reaction; label: string }> = [
  { emoji: '👍', label: 'Me gusta' },
  { emoji: '👎', label: 'No me gusta' },
  { emoji: '❤️', label: 'Me encanta' },
];

function RichText({ text }: { text: string }) {
  const parts: React.ReactNode[] = [];
  const codeBlockRe = /```(?:\w+\n)?([\s\S]*?)```/g;
  let last = 0;
  let match: RegExpExecArray | null;

  while ((match = codeBlockRe.exec(text)) !== null) {
    if (match.index > last) {
      parts.push(<InlineText key={last} text={text.slice(last, match.index)} />);
    }
    parts.push(
      <pre key={match.index}>
        <code>{match[1]?.trimEnd()}</code>
      </pre>,
    );
    last = match.index + match[0].length;
  }

  if (last < text.length) {
    parts.push(<InlineText key={last} text={text.slice(last)} />);
  }

  return <div className="codi-rich">{parts}</div>;
}

function InlineText({ text }: { text: string }) {
  const segments: React.ReactNode[] = [];
  const re = /(`[^`]+`|\*\*[^*]+\*\*)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let i = 0;

  while ((m = re.exec(text)) !== null) {
    if (m.index > last) {
      segments.push(<span key={i++}>{text.slice(last, m.index)}</span>);
    }
    const raw = m[0];
    if (raw.startsWith('`')) {
      segments.push(<code key={i++}>{raw.slice(1, -1)}</code>);
    } else {
      segments.push(<strong key={i++}>{raw.slice(2, -2)}</strong>);
    }
    last = m.index + raw.length;
  }

  if (last < text.length) {
    segments.push(<span key={i++}>{text.slice(last)}</span>);
  }

  return <>{segments}</>;
}

export default function Message({ msg, reaction, onReact, typewriterText, waveformActive }: Props) {
  const isUser = msg.role === 'user';
  const isStreaming = msg.streaming === true;
  const hasActiveReaction = reaction !== undefined;

  const displayText = isStreaming && typewriterText !== undefined ? typewriterText : msg.text;
  const showWaveform = isStreaming && (waveformActive ?? false) && !displayText;

  return (
    <div
      className={[
        'codi-message',
        isUser ? 'codi-message--user' : 'codi-message--codi',
        msg.error ? 'codi-message--error' : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <div className="codi-message__row">
        {!isUser && <div className="codi-message__avatar" aria-hidden="true" />}

        <div className="codi-message__bubble">
          {showWaveform && <Waveform active={true} />}

          {!showWaveform && (
            <>
              {isUser ? <span>{displayText}</span> : <RichText text={displayText} />}
              {isStreaming && (
                <span className="codi-caret" aria-hidden="true">
                  ▍
                </span>
              )}
            </>
          )}
        </div>
      </div>

      {!isStreaming && !msg.error && msg.role === 'codi' && msg.text && (
        <div
          className={[
            'codi-message__reactions',
            hasActiveReaction ? 'codi-message__reactions--has-active' : '',
          ]
            .filter(Boolean)
            .join(' ')}
        >
          {REACTIONS.map((r) => (
            <button
              key={r.emoji}
              type="button"
              className="codi-reaction-btn"
              aria-label={r.label}
              aria-pressed={reaction === r.emoji}
              onClick={() => onReact(msg.id, r.emoji)}
            >
              {r.emoji}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
