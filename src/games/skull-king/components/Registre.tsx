import { ROUND_COUNT, cardsForRound, roundScore } from '../game/scoring';
import { liveTotals, projectedRound, type Game } from '../game/state';

const fmt = (v: number) => (v > 0 ? `+${v}` : v < 0 ? `−${Math.abs(v)}` : '0');

interface Props {
  game: Game;
  /** Show the current round's projected points (play screen). */
  live: boolean;
  compact?: boolean;
}

/** The score grid: rounds × players, columns striped, current round in gold, leader gold and last pink. */
export function Registre({ game, live, compact }: Props) {
  const n = game.players.length;
  const finished = game.history.length >= ROUND_COUNT;
  const projected = live ? projectedRound(game) : null;
  const totals = liveTotals(game, live);
  const best = Math.max(...totals);
  const worst = Math.min(...totals);
  const cellW = n <= 5 ? 56 : Math.max(36, Math.floor(286 / n));
  const col = (k: number) => (k % 2 ? 'reg__cell--odd' : '');

  const rows = [];
  for (let r = 1; r <= ROUND_COUNT; r++) {
    const cards = cardsForRound(r, n);
    const isCur = r === game.round && !finished;
    const cells = game.players.map((_, i) => {
      let value: number | null = null;
      if (r <= game.history.length) {
        const h = game.history[r - 1];
        value = roundScore(h.bids[i], h.tricks[i], cards);
      } else if (isCur && projected) {
        value = projected[i];
      }
      const tone = value === null ? 'reg__cell--empty' : value >= 0 ? 'reg__cell--pos' : 'reg__cell--neg';
      return (
        <td key={i} class={`reg__cell ${col(i)} ${tone}`}>
          {value === null ? '·' : fmt(value)}
        </td>
      );
    });
    rows.push(
      <tr key={r} class={isCur ? 'reg__row--current' : ''} aria-current={isCur ? 'step' : undefined}>
        <th scope="row" class="reg__round">
          {r}
        </th>
        {cells}
      </tr>,
    );
  }

  return (
    <div class={`reg ${compact ? 'reg--compact' : ''}`} role="region" aria-label="Registre des scores" tabIndex={0}>
      <table style={{ minWidth: `${40 + n * cellW}px` }}>
        <colgroup>
          <col style={{ width: '40px' }} />
          {game.players.map((_, i) => (
            <col key={i} style={{ width: `${cellW}px` }} />
          ))}
        </colgroup>
        <thead>
          <tr>
            <th scope="col" class="reg__round" aria-label="Manche">
              M.
            </th>
            {game.players.map((name, i) => (
              <th key={i} scope="col" class={`reg__name ${col(i)}`} title={name}>
                {name}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{rows}</tbody>
        <tfoot>
          <tr>
            <th scope="row" class="reg__round">
              Total
            </th>
            {totals.map((v, i) => {
              const spread = best !== worst;
              const mark = spread && v === best ? 'reg__total--best' : spread && v === worst ? 'reg__total--worst' : col(i);
              const hint = spread && v === best ? ' (en tête)' : spread && v === worst ? ' (dernier)' : '';
              return (
                <td key={i} class={`reg__total ${mark}`} aria-label={`${game.players[i]} : ${v}${hint}`}>
                  {v}
                </td>
              );
            })}
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
