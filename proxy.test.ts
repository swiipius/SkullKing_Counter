import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import proxy from './proxy';

const BASE = 'https://skull.example.test';

function cookieFrom(res: Response): string {
  const set = res.headers.get('set-cookie') ?? '';
  return set.split(';')[0];
}

describe('crew code proxy', () => {
  beforeEach(() => {
    process.env.CREW_CODE = 'tortuga';
  });
  afterEach(() => {
    delete process.env.CREW_CODE;
  });

  it('shows the code page without a cookie', async () => {
    const res = (await proxy(new Request(`${BASE}/`))) as Response;
    expect(res.status).toBe(401);
    expect(await res.text()).toContain("Code d'équipage");
    expect(res.headers.get('x-robots-tag')).toContain('noindex');
  });

  it('lets the PWA manifest through', async () => {
    const res = (await proxy(new Request(`${BASE}/manifest.webmanifest`))) as Response;
    expect(res.status).not.toBe(401);
  });

  it('rejects a wrong code', async () => {
    const body = new URLSearchParams({ code: 'port-royal' });
    const res = (await proxy(new Request(`${BASE}/__crew`, { method: 'POST', body }))) as Response;
    expect(res.status).toBe(401);
    expect(await res.text()).toContain('Mauvais code');
  });

  it('sets a cookie for the right code, then lets the crew in', async () => {
    const body = new URLSearchParams({ code: ' tortuga ' });
    const login = (await proxy(new Request(`${BASE}/__crew`, { method: 'POST', body }))) as Response;
    expect(login.status).toBe(303);
    expect(login.headers.get('location')).toBe('/');
    const cookie = cookieFrom(login);
    expect(cookie).toMatch(/^sk_crew=[0-9a-f]{64}$/);
    expect(login.headers.get('set-cookie')).toContain('HttpOnly');

    const page = (await proxy(new Request(`${BASE}/`, { headers: { cookie } }))) as Response;
    expect(page.status).not.toBe(401);
  });

  it('logs everyone out when the code changes', async () => {
    const body = new URLSearchParams({ code: 'tortuga' });
    const cookie = cookieFrom((await proxy(new Request(`${BASE}/__crew`, { method: 'POST', body }))) as Response);
    process.env.CREW_CODE = 'nouveau-code';
    const page = (await proxy(new Request(`${BASE}/`, { headers: { cookie } }))) as Response;
    expect(page.status).toBe(401);
  });

  it('refuses everything when CREW_CODE is missing', async () => {
    delete process.env.CREW_CODE;
    const res = (await proxy(new Request(`${BASE}/`))) as Response;
    expect(res.status).toBe(503);
  });
});
