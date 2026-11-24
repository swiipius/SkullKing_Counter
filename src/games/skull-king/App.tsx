import { useEffect, useReducer } from 'preact/hooks';
import { reducer, type Action, type AppState } from './game/state';
import { loadState, saveState } from './game/storage';
import { Bids } from './screens/Bids';
import { Deal } from './screens/Deal';
import { End } from './screens/End';
import { flushOutbox } from './leaderboard/api';
import { Home } from './screens/Home';
import { Leaderboard } from './screens/Leaderboard';
import { Play } from './screens/Play';
import { Setup } from './screens/Setup';
import { takeAction } from '../../shared/router';
import './styles.css';

export function SkullKingApp() {
  const [state, rawDispatch] = useReducer(reducer, undefined as unknown as AppState, loadState);

  // Light haptic tick on score changes (Android; iOS Safari has no vibration API).
  const dispatch = (action: Action) => {
    if (action.type === 'bid/set' || action.type === 'trick/add' || action.type === 'round/next') {
      try {
        navigator.vibrate?.(action.type === 'round/next' ? 20 : 8);
      } catch {
        /* not supported */
      }
    }
    rawDispatch(action);
  };

  useEffect(() => saveState(state), [state]);

  // Each screen change starts at the top of the page.
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [state.screen]);

  // Buttons on the landing page open the game on a given screen (?action=resume|new|leaderboard).
  useEffect(() => {
    const action = takeAction();
    if (action === 'resume') rawDispatch({ type: 'resume' });
    else if (action === 'new') rawDispatch({ type: 'go', screen: 'setup' });
    else if (action === 'leaderboard') rawDispatch({ type: 'go', screen: 'leaderboard' });
  }, []);

  // Send any finished game still waiting on this phone, now and whenever the network comes back.
  useEffect(() => {
    flushOutbox();
    const onOnline = () => flushOutbox();
    window.addEventListener('online', onOnline);
    return () => window.removeEventListener('online', onOnline);
  }, []);

  const props = { state, dispatch };
  const needsGame = state.screen === 'deal' || state.screen === 'bids' || state.screen === 'play' || state.screen === 'end';
  const screen = needsGame && !state.game ? 'home' : state.screen;

  return (
    <div class="app" data-screen={screen}>
      {screen === 'home' && <Home {...props} />}
      {screen === 'setup' && <Setup {...props} />}
      {screen === 'deal' && <Deal {...props} />}
      {screen === 'bids' && <Bids {...props} />}
      {screen === 'play' && <Play {...props} />}
      {screen === 'end' && <End {...props} />}
      {screen === 'leaderboard' && <Leaderboard {...props} />}
    </div>
  );
}
