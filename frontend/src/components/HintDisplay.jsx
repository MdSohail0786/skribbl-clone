export default function HintDisplay({ wordLength, revealedHints = [] }) {
  if (!wordLength) return null;
  const slots = Array.from({ length: wordLength }, (_, i) => revealedHints[i] || null);

  return (
    <div className="flex gap-1.5 justify-center flex-wrap">
      {slots.map((letter, i) => (
        <span
          key={i}
          className="w-7 h-9 flex items-center justify-center border-b-2 border-[var(--color-border)] text-lg font-bold uppercase"
        >
          {letter || ''}
        </span>
      ))}
    </div>
  );
}
