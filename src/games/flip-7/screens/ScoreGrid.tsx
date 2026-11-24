import { handScore } from '../rules';
import { liveTotals, type Game } from '../state';

/** Rounds × players; the current round (when still open) is highlighted and counts what has been entered. */
export function ScoreGrid({ game }: { game: Game }) {
  const n = game.players.length;
  const totals = liveTotals(game);
  const best = Math.max(...totals);
  const open = game.winner === null;
  const cellW = n <= 5 ? 56 : Math.max(36, Math.floor(286 / n));
  return (
    <div class="f7-grid" role="region" aria-label="Scores par manche" tabIndex={0}>
      <table style={{ minWidth: `${40 + n * cellW}px` }}>
        <colgroup>
          <col style={{ width: '40px' }} />
          {game.players.map((_, i) => (
            <col key={i} style={{ width: `${cellW}px` }} />
          ))}
        </colgroup>
        <thead>
          <tr>
            <th scope="col" aria-label="Manche">
              M.
            </th>
            {game.players.map((p, i) => (
              <th key={i} scope="col" title={p}>
                {p}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {game.history.map((r, k) => (
            <tr key={k}>
              <th scope="row">{k + 1}</th>
              {r.hands.map((h, i) => {
                const v = handScore(h);
                return (
                  <td key={i} class={v === 0 ? 'is-zero' : ''}>
                    {h.bust ? '✕' : v}
                  </td>
                );
              })}
            </tr>
          ))}
          {open && (
            <tr class="is-current">
              <th scope="row">{game.round}</th>
              {game.hands.map((h, i) => (
                <td key={i}>{h ? (h.bust ? '✕' : handScore(h)) : '·'}</td>
              ))}
            </tr>
          )}
        </tbody>
        <tfoot>
          <tr>
            <th scope="row">Tot.</th>
            {totals.map((t, i) => (
              <td key={i} class={t === best && t > 0 ? 'is-best' : ''}>
                {t}
              </td>
            ))}
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
