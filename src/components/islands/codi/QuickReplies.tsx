interface Props {
  options: string[];
  onPick: (text: string) => void;
}

export default function QuickReplies({ options, onPick }: Props) {
  if (options.length === 0) return null;

  return (
    <div className="codi-quick-replies" role="group" aria-label="Respuestas rápidas">
      {options.slice(0, 4).map((opt) => (
        <button key={opt} type="button" className="codi-chip" onClick={() => onPick(opt)}>
          {opt}
        </button>
      ))}
    </div>
  );
}
