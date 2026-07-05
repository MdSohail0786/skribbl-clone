export default function TimerRing({ secondsLeft, totalSeconds }) {
  const safeTotal = totalSeconds || 1;
  const pct = Math.max(0, Math.min(1, (secondsLeft ?? safeTotal) / safeTotal));
  const isUrgent = secondsLeft !== null && secondsLeft <= 10;
  const radius = 26;
  const circumference = 2 * Math.PI * radius;

  return (
    <div className="relative w-16 h-16 flex items-center justify-center">
      <svg width="64" height="64" className="-rotate-90">
        <circle cx="32" cy="32" r={radius} stroke="var(--color-border)" strokeWidth="5" fill="none" />
        <circle
          cx="32"
          cy="32"
          r={radius}
          stroke={isUrgent ? 'var(--color-danger)' : 'var(--color-accent)'}
          strokeWidth="5"
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - pct)}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.9s linear' }}
        />
      </svg>
      <span className={`absolute text-lg font-bold ${isUrgent ? 'text-[var(--color-danger)]' : ''}`}>
        {secondsLeft ?? '-'}
      </span>
    </div>
  );
}
