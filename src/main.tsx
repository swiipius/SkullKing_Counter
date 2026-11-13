import { render } from 'preact';
import '@fontsource/pirata-one/latin-400.css';
import '@fontsource-variable/nunito/wght.css';
import './styles.css';
import { App } from './app';

render(<App />, document.getElementById('app')!);

if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {
      /* offline mode is a bonus: the app works without it */
    });
  });
}
