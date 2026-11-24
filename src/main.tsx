import { render } from 'preact';
import { useEffect } from 'preact/hooks';
import '@fontsource/pirata-one/latin-400.css';
import '@fontsource-variable/nunito/wght.css';
import '@fontsource/bungee/latin-400.css';
import { Flip7App } from './games/flip-7/App';
import { SkullKingApp } from './games/skull-king/App';
import { Hub } from './hub/Hub';
import { usePath } from './shared/router';

const ROUTES = [
  { prefix: '/skull-king', id: 'skull-king', title: 'Skull King – Pari, plis et bonbons', theme: '#2b1a11', View: SkullKingApp },
  { prefix: '/flip-7', id: 'flip-7', title: 'Flip 7 – compteur de points', theme: '#14072e', View: Flip7App },
];

function Root() {
  const path = usePath();
  const route = ROUTES.find((r) => path === r.prefix || path.startsWith(`${r.prefix}/`));

  useEffect(() => {
    document.body.dataset.route = route?.id ?? 'hub';
    document.title = route?.title ?? 'Salle de jeux';
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', route?.theme ?? '#141418');
  }, [route?.id]);

  if (!route) return <Hub />;
  const View = route.View;
  return <View />;
}

render(<Root />, document.getElementById('app')!);

if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {
      /* offline mode is a bonus: the app works without it */
    });
  });
}
