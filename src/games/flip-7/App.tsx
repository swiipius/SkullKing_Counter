import { useEffect, useReducer, useState } from 'preact/hooks';
import { takeAction } from '../../shared/router';
import './flip7.css';
import { client } from './leaderboard';
import { End } from './screens/End';
import { Leaderboard } from './screens/Leaderboard';
import { RoundScreen } from './screens/Round';
import { Setup } from './screens/Setup';
import { reducer, type Action, type State } from './state';
import { loadState, saveState } from './storage';

export function Flip7App() {
  const [state, rawDispatch] = useReducer(reducer, undefined as unknown as State, loadState);

  const dispatch = (action: Action) => {
    if (action.type === 'hand' || action.type === 'round/next') {
      try {
        navigator.vibrate?.(action.type === 'round/next' ? 20 : 8);
      } catch {
        /* not supported */
      }
    }
    rawDispatch(action);
  };

  useEffect(() => saveState(state), [state]);

  // The leaderboard's back button returns to the landing page when it was opened from there.
  const [fromHub, setFromHub] = useState(false);

  // Landing page buttons: ?action=resume opens the game in progress, ?action=new the player setup.
  useEffect(() => {
    const action = takeAction();
    if (action === 'new') rawDispatch({ type: 'go', screen: 'setup' });
    else if (action === 'leaderboard') {
      setFromHub(true);
      rawDispatch({ type: 'go', screen: 'leaderboard' });
    }
    else if (action === 'resume' && state.game) rawDispatch({ type: 'go', screen: state.game.winner !== null ? 'end' : 'round' });
  }, []);

  // Send finished games still waiting on this phone, now and when the network comes back.
  useEffect(() => {
    client.flushOutbox();
    const onOnline = () => client.flushOutbox();
    window.addEventListener('online', onOnline);
    return () => window.removeEventListener('online', onOnline);
  }, []);

  const screen = state.game || state.screen === 'leaderboard' ? state.screen : 'setup';
  const props = { state, dispatch };
  return (
    <div class="f7">
      {screen === 'setup' && <Setup {...props} />}
      {screen === 'round' && <RoundScreen {...props} />}
      {screen === 'end' && <End {...props} />}
      {screen === 'leaderboard' && <Leaderboard {...props} fromHub={fromHub} />}
    </div>
  );
}

export interface F7Props {
  state: State;
  dispatch: (a: Action) => void;
}
