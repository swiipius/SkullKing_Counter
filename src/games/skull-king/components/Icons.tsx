import type { JSX } from 'preact';

type SvgProps = { size?: number; label?: string };

const a11y = (label?: string) =>
  label ? { role: 'img' as const, 'aria-label': label } : { 'aria-hidden': true as const };

export function Skull({ size = 80, label }: SvgProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="var(--gold)" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" {...a11y(label)}>
      <path d="M12 3c-4.4 0-8 3.2-8 7.3 0 2.4 1.2 4.4 3 5.7V19a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1v-3c1.8-1.3 3-3.3 3-5.7C20 6.2 16.4 3 12 3Z" />
      <circle cx="9" cy="11" r="1.6" />
      <circle cx="15" cy="11" r="1.6" />
      <path d="M10 20v-2M14 20v-2M12 13.5l-.8 1.5h1.6Z" />
    </svg>
  );
}

export function Chevron({ size = 18, up = false }: SvgProps & { up?: boolean }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style={{ transform: up ? 'rotate(180deg)' : undefined, transition: 'transform .15s' }}>
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

export function Arrow({ dir }: { dir: 'up' | 'down' }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      {dir === 'up' ? <path d="M12 19V5M6 11l6-6 6 6" /> : <path d="M12 5v14M6 13l6 6 6-6" />}
    </svg>
  );
}

export function Cross() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true">
      <path d="M6 6l12 12M18 6 6 18" />
    </svg>
  );
}

export function Chest({ size = 34 }: SvgProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="var(--gold)" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <path d="M3 11a5 5 0 0 1 5-5h8a5 5 0 0 1 5 5v8a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-8Z" />
      <path d="M3 11h18M10 11v3h4v-3" />
    </svg>
  );
}

/** Small pink octopus marking the dealer. */
export function Octopus({ size = 22, label }: SvgProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...a11y(label)}>
      <g stroke="var(--fraise)" stroke-width="2" stroke-linecap="round" fill="none">
        <path d="M7.6 13.4C6 15 4.4 15.6 3 15" />
        <path d="M8.8 14.2c-.4 2.2-1.8 3.9-3.4 4.4" />
        <path d="M10.2 14.7c.1 2.4-.5 4.4-1.6 5.5" />
        <path d="M11.4 14.9c0 2.2-.2 4-.6 5.6" />
        <path d="M12.6 14.9c0 2.2.2 4 .6 5.6" />
        <path d="M13.8 14.7c-.1 2.4.5 4.4 1.6 5.5" />
        <path d="M15.2 14.2c.4 2.2 1.8 3.9 3.4 4.4" />
        <path d="M16.4 13.4C18 15 19.6 15.6 21 15" />
      </g>
      <path d="M12 2.5c-4 0-6.6 2.9-6.6 6.5 0 2.3 1 3.9 2.4 5h8.4c1.4-1.1 2.4-2.7 2.4-5 0-3.6-2.6-6.5-6.6-6.5Z" fill="var(--fraise)" />
      <circle cx="9.6" cy="9" r="1.7" fill="#fff" />
      <circle cx="14.4" cy="9" r="1.7" fill="#fff" />
      <circle cx="9.9" cy="9.3" r=".85" fill="#2a1a10" />
      <circle cx="14.7" cy="9.3" r=".85" fill="#2a1a10" />
    </svg>
  );
}

/** Big octopus dealing cards, for the deal reminder. */
export function DealerOctopus() {
  const card = (x: number, y: number, rot: number) => (
    <rect x={x} y={y} width="13" height="18" rx="2.5" transform={`rotate(${rot} ${x + 6.5} ${y + 9})`} fill="var(--parch)" stroke="#2a1a10" stroke-width="1.5" />
  );
  return (
    <svg width="140" height="112" viewBox="0 0 120 96" aria-hidden="true">
      <g stroke="var(--fraise)" stroke-width="6" stroke-linecap="round" fill="none">
        <path d="M42 56 C30 62 20 60 12 50" />
        <path d="M46 62 C40 74 30 80 18 80" />
        <path d="M52 66 C52 78 46 86 38 92" />
        <path d="M57 67 C57 78 55 86 52 93" />
        <path d="M63 67 C63 78 65 86 68 93" />
        <path d="M68 66 C68 78 74 86 82 92" />
        <path d="M74 62 C80 74 90 80 102 80" />
        <path d="M78 56 C90 62 100 60 108 50" />
      </g>
      {card(3, 36, -24)}
      {card(9, 70, -12)}
      {card(98, 70, 12)}
      {card(104, 36, 24)}
      <path d="M60 8 C40 8 30 22 30 38 C30 50 36 58 44 64 H76 C84 58 90 50 90 38 C90 22 80 8 60 8Z" fill="var(--fraise)" />
      <ellipse cx="49" cy="21" rx="8" ry="5" fill="#fff" opacity=".35" />
      <circle cx="50" cy="38" r="6.5" fill="#fff" />
      <circle cx="70" cy="38" r="6.5" fill="#fff" />
      <circle cx="51" cy="39" r="3.2" fill="#2a1a10" />
      <circle cx="71" cy="39" r="3.2" fill="#2a1a10" />
      <path d="M53 51 Q60 56 67 51" stroke="#7a1530" stroke-width="2.5" fill="none" stroke-linecap="round" />
    </svg>
  );
}

/* ---------- barrels of gummy bears ---------- */

type BearSpec = [x: number, y: number, rot: number, color: string];
type RingSpec = [x: number, y: number, color: string];

function Bear({ spec: [x, y, rot, color] }: { spec: BearSpec }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot})`} fill={color}>
      <circle cx="0" cy="-7" r="5" />
      <circle cx="-4" cy="-11" r="2.2" />
      <circle cx="4" cy="-11" r="2.2" />
      <ellipse cx="0" cy="3" rx="6" ry="7" />
      <circle cx="-6.5" cy="0" r="2.4" />
      <circle cx="6.5" cy="0" r="2.4" />
      <circle cx="-4" cy="9.5" r="2.7" />
      <circle cx="4" cy="9.5" r="2.7" />
      <circle cx="-1.5" cy="-8.5" r="1.4" fill="#fff" opacity=".5" />
    </g>
  );
}

export function Barrel({ width, bears, rings, wood = '#7a4a28' }: { width: number; bears: BearSpec[]; rings: RingSpec[]; wood?: string }) {
  return (
    <svg width={width} height={(width * 132) / 120} viewBox="0 0 120 132" aria-hidden="true">
      <path d="M18 36 Q8 82 18 128 L102 128 Q112 82 102 36 Z" fill={wood} />
      <path d="M39 37 Q33 82 39 128 M60 38 V128 M81 37 Q87 82 81 128" stroke="#4e2e18" stroke-width="2.5" fill="none" />
      <path d="M14 58 Q60 66 106 58 M14 106 Q60 114 106 106" stroke="#2f2b28" stroke-width="6" fill="none" />
      <path d="M14 57 Q60 65 106 57 M14 105 Q60 113 106 105" stroke="#a8946a" stroke-width="1.4" fill="none" opacity=".7" />
      <ellipse cx="60" cy="36" rx="42" ry="9" fill="#2a170c" />
      {bears.map((b, i) => (
        <Bear key={i} spec={b} />
      ))}
      {rings.map(([x, y, c], i) => (
        <circle key={i} cx={x} cy={y} r="5" fill="none" stroke={c} stroke-width="3.5" />
      ))}
      <path d="M18 36 Q60 52 102 36" stroke="#2f2b28" stroke-width="5" fill="none" stroke-linecap="round" />
    </svg>
  );
}

const F = '#e8456e', L = '#ffd447', M = '#5fd3a8', O = '#ff9a3c', W = '#fff1c9';

export function BarrelRow(): JSX.Element {
  return (
    <div class="barrels" aria-hidden="true">
      <Barrel width={92} bears={[[30, 28, -25, L], [47, 20, 12, F], [63, 24, -8, M], [79, 19, 22, O], [91, 29, 30, F], [41, 34, 8, W], [71, 34, -15, F]]} rings={[[56, 38, L]]} />
      <Barrel width={120} wood="#83512c" bears={[[29, 29, -18, F], [45, 19, -4, M], [61, 15, 10, L], [77, 21, 18, F], [92, 30, 28, O], [53, 33, 6, O], [73, 35, -12, W]]} rings={[[36, 38, M], [88, 39, F]]} />
      <Barrel width={92} bears={[[31, 27, -20, M], [48, 21, 8, O], [66, 22, -10, F], [84, 25, 24, L], [57, 35, 4, L]]} rings={[[40, 38, F], [78, 38, M]]} />
    </div>
  );
}
