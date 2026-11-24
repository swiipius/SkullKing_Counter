import type { Action, AppState } from '../game/state';

export interface ScreenProps {
  state: AppState;
  dispatch: (action: Action) => void;
}
