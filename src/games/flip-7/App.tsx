import { useEffect, useReducer } from 'preact/hooks';
import { takeAction } from '../../shared/router';
import './flip7.css';
import { End } from './screens/End';
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

  // Landing page buttons: ?action=resume opens the game in progress, ?action=new the player setup.
  useEffect(() => {
    const action = takeAction();
    if (action === 'new') rawDispatch({ type: 'go', screen: 'setup' });
    else if (action === 'resume' && state.game) rawDispatch({ type: 'go', screen: state.game.winner !== null ? 'end' : 'round' });
  }, []);

  const screen = state.game ? state.screen : 'setup';
  const props = { state, dispatch };
  return (
    <div class="f7">
      {screen === 'setup' && <Setup {...props} />}
      {screen === 'round' && <RoundScreen {...props} />}
      {screen === 'end' && <End {...props} />}
    </div>
  );
}

export interface F7Props {
  state: State;
  dispatch: (a: Action) => void;
}
