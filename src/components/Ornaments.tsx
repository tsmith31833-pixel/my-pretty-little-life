// Shared illustrations: the pink bow and the butterfly. Drawn once, reused everywhere.

export function OrnamentDefs() {
  return (
    <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden="true">
      <defs>
        <g id="bow">
          <path d="M60 40 C40 8, 6 6, 9 30 C12 52, 42 52, 60 40 Z" fill="var(--baby)" stroke="var(--hot)" strokeWidth="2.2" />
          <path d="M60 40 C80 8, 114 6, 111 30 C108 52, 78 52, 60 40 Z" fill="var(--baby)" stroke="var(--hot)" strokeWidth="2.2" />
          <path d="M44 30 C34 22, 22 22, 20 30 M76 30 C86 22, 98 22, 100 30" fill="none" stroke="var(--rose)" strokeWidth="1.6" />
          <path d="M55 45 L42 77 L52 71 L56 79 Z M65 45 L78 77 L68 71 L64 79 Z" fill="var(--hot)" />
          <ellipse cx="60" cy="40" rx="8" ry="9" fill="var(--hot)" />
        </g>
        <g id="butterfly">
          <g className="wings">
            <path d="M-1 -2 C -12 -26, -34 -22, -28 -4 C -24 6, -10 4, -1 0Z" fill="var(--rose)" stroke="var(--hot)" strokeWidth="1.4" />
            <path d="M-1 1 C -16 6, -22 22, -11 22 C -4 22, -1 12, -1 3Z" fill="var(--baby)" stroke="var(--hot)" strokeWidth="1.4" />
            <path d="M1 -2 C 12 -26, 34 -22, 28 -4 C 24 6, 10 4, 1 0Z" fill="var(--rose)" stroke="var(--hot)" strokeWidth="1.4" />
            <path d="M1 1 C 16 6, 22 22, 11 22 C 4 22, 1 12, 1 3Z" fill="var(--baby)" stroke="var(--hot)" strokeWidth="1.4" />
            <circle cx="-17" cy="-11" r="3.2" fill="var(--card)" />
            <circle cx="17" cy="-11" r="3.2" fill="var(--card)" />
            <circle cx="-10" cy="13" r="2" fill="var(--gold)" />
            <circle cx="10" cy="13" r="2" fill="var(--gold)" />
          </g>
          <ellipse cx="0" cy="2" rx="2.2" ry="11" fill="var(--rose-deep)" />
          <path d="M-1 -8 C -4 -16, -7 -19, -9 -20 M1 -8 C 4 -16, 7 -19, 9 -20" fill="none" stroke="var(--rose-deep)" strokeWidth="1.2" strokeLinecap="round" />
        </g>
      </defs>
    </svg>
  );
}

export function Bow({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg className={className} style={style} viewBox="0 0 120 80" aria-hidden="true">
      <use href="#bow" />
    </svg>
  );
}

export function Butterfly({ className = "bf", style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <div className={className} style={style} aria-hidden="true">
      <svg viewBox="-32 -26 64 52">
        <use href="#butterfly" />
      </svg>
    </div>
  );
}
