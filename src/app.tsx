import { useEffect, useReducer } from 'preact/hooks';
import { reducer, type Action, type AppState } from './game/state';
import { loadState, saveState } from './game/storage';
import { Bids } from './screens/Bids';
import { Deal } from './screens/Deal';
import { End } from './screens/End';
import { Home } from './screens/Home';
import { Play } from './screens/Play';
import { Setup } from './screens/Setup';

export function App() {
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

  const props = { state, dispatch };
  const screen = state.game ? state.screen : state.screen === 'setup' ? 'setup' : 'home';

  return (
    <div class="app" data-screen={screen}>
      {screen === 'home' && <Home {...props} />}
      {screen === 'setup' && <Setup {...props} />}
      {screen === 'deal' && <Deal {...props} />}
      {screen === 'bids' && <Bids {...props} />}
      {screen === 'play' && <Play {...props} />}
      {screen === 'end' && <End {...props} />}
    </div>
  );
}
