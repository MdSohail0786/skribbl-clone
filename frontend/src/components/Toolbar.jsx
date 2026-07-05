import { BRUSH_COLORS } from '../constants/events.js';

export default function Toolbar({
  color,
  setColor,
  brushSize,
  setBrushSize,
  isErasing,
  setIsErasing,
  onUndo,
  onClear,
  disabled,
}) {
  return (
    <div className={`flex flex-wrap items-center gap-3 p-2 card ${disabled ? 'opacity-40 pointer-events-none' : ''}`}>
      <div className="flex gap-1 flex-wrap max-w-[220px]">
        {BRUSH_COLORS.map((c) => (
          <button
            key={c}
            type="button"
            aria-label={`Color ${c}`}
            onClick={() => {
              setColor(c);
              setIsErasing(false);
            }}
            className={`w-6 h-6 rounded-full border-2 ${
              color === c && !isErasing ? 'border-[var(--color-accent)]' : 'border-transparent'
            }`}
            style={{ backgroundColor: c }}
          />
        ))}
      </div>

      <input
        type="range"
        min="2"
        max="24"
        value={brushSize}
        onChange={(e) => setBrushSize(Number(e.target.value))}
        className="w-24 accent-[var(--color-primary)]"
      />

      <button
        type="button"
        onClick={() => setIsErasing((v) => !v)}
        className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
          isErasing ? 'bg-[var(--color-primary)]' : 'bg-[var(--color-surface-hover)]'
        }`}
      >
        Eraser
      </button>
      <button type="button" onClick={onUndo} className="px-3 py-1.5 rounded-lg text-sm font-medium bg-[var(--color-surface-hover)]">
        Undo
      </button>
      <button type="button" onClick={onClear} className="px-3 py-1.5 rounded-lg text-sm font-medium bg-[var(--color-danger)]">
        Clear
      </button>
    </div>
  );
}
