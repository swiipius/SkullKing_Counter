import { BarrelRow } from './Icons';

/** Waves drawn twice side by side so a −50% slide loops seamlessly. */
function Wave({ class: cls, color }: { class: string; color: string }) {
  const crest = 'q25 -14 50 0 t50 0 t50 0 t50 0';
  return (
    <svg class={`wave ${cls}`} viewBox="0 0 400 40" preserveAspectRatio="none" aria-hidden="true">
      <path d={`M0 14 ${crest} ${crest} V40 H0Z`} fill={color} />
    </svg>
  );
}

function Ship() {
  return (
    <svg class="ship" width="150" height="112" viewBox="0 0 160 120" aria-hidden="true">
      <path d="M50 14 V78 M88 6 V78 M124 24 V66" stroke="#140c12" stroke-width="3" />
      <path d="M36 20 Q50 30 64 20 V46 Q50 56 36 46Z" fill="#3b3040" />
      <path d="M70 14 Q88 27 106 14 V52 Q88 64 70 52Z" fill="#43374a" />
      <path d="M112 30 Q124 38 136 30 V50 Q124 58 112 50Z" fill="#3b3040" />
      <path d="M88 6 L106 10 L88 15Z" fill="var(--fraise)" />
      <path d="M118 78 V64 H150 L153 78Z" fill="#140c12" />
      <path d="M6 76 H154 L141 104 H22 Z" fill="#140c12" />
      <g fill="var(--gold)">
        <circle cx="44" cy="88" r="2.6" />
        <circle cx="62" cy="88" r="2.6" />
        <circle cx="80" cy="88" r="2.6" />
        <circle cx="98" cy="88" r="2.6" />
        <circle cx="116" cy="88" r="2.6" />
        <rect x="128" y="68" width="6" height="5" rx="1" />
      </g>
    </svg>
  );
}

function Lantern({ side }: { side: 'left' | 'right' }) {
  return (
    <div class={`post post--${side}`} aria-hidden="true">
      <span class="post__glow" />
      <svg class="post__lantern" width="26" height="34" viewBox="0 0 24 32">
        <path d="M8 2h8M10 2V0h4v2" stroke="#2f2b28" stroke-width="2" fill="none" />
        <path d="M6 5h12l-1.5 20h-9Z" fill="#ffcf6b" stroke="#2f2b28" stroke-width="2" />
        <path d="M5 25h14v4H5Z" fill="#2f2b28" />
        <path d="M12 9v12" stroke="#2f2b28" stroke-width="1.5" />
      </svg>
      <span class="post__pole" />
    </div>
  );
}

const BEAR_COLORS = ['#e8456e', '#ffd447', '#5fd3a8', '#ff9a3c', '#fff1c9'];

function FloatingBear({ i }: { i: number }) {
  return (
    <svg class={`floater floater--${i}`} width="18" height="24" viewBox="-9 -14 18 26" aria-hidden="true">
      <g fill={BEAR_COLORS[i % BEAR_COLORS.length]}>
        <circle cx="0" cy="-7" r="5" />
        <circle cx="-4" cy="-11" r="2.2" />
        <circle cx="4" cy="-11" r="2.2" />
        <ellipse cx="0" cy="3" rx="6" ry="7" />
        <circle cx="-6.5" cy="0" r="2.4" />
        <circle cx="6.5" cy="0" r="2.4" />
        <circle cx="-4" cy="9.5" r="2.7" />
        <circle cx="4" cy="9.5" r="2.7" />
      </g>
    </svg>
  );
}

/** Night harbour behind the title screen: moon, stars, rocking ship, waves, dock with lanterns and candy barrels. */
export function Harbour() {
  return (
    <div class="harbour" aria-hidden="true">
      <div class="harbour__stars" />
      <div class="harbour__moon" />
      <div class="harbour__horizon">
        <Ship />
      </div>
      <div class="harbour__sea">
        <Wave class="wave--back" color="#123a57" />
        <Wave class="wave--mid" color="#0f2f48" />
        <Wave class="wave--front" color="#0b2438" />
      </div>
      <div class="harbour__dock">
        <Lantern side="left" />
        <Lantern side="right" />
        <div class="harbour__barrels">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <FloatingBear key={i} i={i} />
          ))}
          <BarrelRow />
        </div>
      </div>
    </div>
  );
}
