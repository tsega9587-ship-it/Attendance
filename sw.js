// Keeps the app opening without internet. Uses the network first so updates arrive,
// except the large face check files, which never change and are kept once downloaded.
const CACHE = 'nfc-attendance-v2';
const FILES = ['./', 'index.html', 'manifest.webmanifest', 'icon.svg'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => e.waitUntil(
  caches.keys()
    .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim())
));
const keep = (req, res) => { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); return res; };
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.includes('/face/')) {
    e.respondWith(caches.match(e.request).then(hit => hit || fetch(e.request).then(res => (res.ok ? keep(e.request, res) : res))));
    return;
  }
  e.respondWith(
    fetch(e.request)
      .then(res => keep(e.request, res))
      .catch(() => caches.match(e.request).then(r => r || caches.match('index.html')))
  );
});
