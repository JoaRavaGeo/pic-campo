/* Service worker · PIC Campo */
const VERSION = 'a9e7edf3';
const SHELL = 'pic-app-' + VERSION;
const TILES = 'pic-teselas-v1';
const ARCHIVOS = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png', './relieve.bin', './teledeteccion.bin'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(SHELL).then(c => c.addAll(ARCHIVOS.map(u => new Request(u, { cache: 'reload' })))));
});
self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    for (const k of await caches.keys()) if (k !== SHELL && k !== TILES) await caches.delete(k);
    await self.clients.claim();
  })());
});
self.addEventListener('message', e => { if (e.data === 'activar') self.skipWaiting(); });

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.hostname === 'server.arcgisonline.com') { e.respondWith(tesela(req)); return; }
  if (url.origin !== location.origin) return;
  if (req.mode === 'navigate') {
    e.respondWith((async () => {
      const c = await caches.open(SHELL);
      return (await c.match('./index.html')) || (await c.match('./')) || fetch(req);
    })());
    return;
  }
  e.respondWith((async () => {
    const hit = await caches.match(req, { ignoreSearch: true });
    if (hit) return hit;
    try { return await fetch(req); } catch (err) { return new Response('', { status: 504 }); }
  })());
});

async function tesela(req) {
  const c = await caches.open(TILES);
  const hit = await c.match(req.url);
  if (hit) return hit;
  try {
    let r;
    try { r = await fetch(req.url, { mode: 'cors', credentials: 'omit' }); }
    catch (err) { return await fetch(req); }
    if (r.ok) c.put(req.url, r.clone());
    return r;
  } catch (err) {
    return new Response('', { status: 504, statusText: 'sin conexión' });
  }
}
