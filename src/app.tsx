import { useEffect, useReducer } from 'preact/hooks';
import { reducer, type AppState } from './game/state';
import { loadState, saveState } from './game/storage';
import { Bids } from './screens/Bids';
import { Deal } from './screens/Deal';
import { End } from './screens/End';
import { Home } from './screens/Home';
import { Play } from './screens/Play';
import { Setup } from './screens/Setup';

export function App() {
  const [state, dispatch] = useReducer(reducer, undefined as unknown as AppState, loadState);

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
