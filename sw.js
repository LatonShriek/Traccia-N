const CACHE = 'traccian-v4'; // v4: corretto il bug che intercettava anche le chiamate cross-origin a Supabase — bump per pulire qualunque risposta rimasta in cache dalla versione precedente
const ASSETS = ['./', './index.html', './manifest.json', './icon-192.png', './icon-512.png'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  // BUG REALE corretto qui: prima di questa modifica, QUALUNQUE richiesta
  // GET veniva intercettata — comprese le chiamate a Supabase (*.supabase.co),
  // che sono letture dinamiche (operatori, sessioni_login, pazienti,
  // accessi, storico...), mai risorse statiche dell'app da mettere in
  // cache. Intercettarle con la stessa strategia "cache-first" pensata per
  // icone/manifest significa sia servire dati vecchi, sia — quello che ha
  // fatto scoprire il problema — una race fra caches.match() e fetch() in
  // parallelo che a volte produce "Failed to execute 'clone' on
  // 'Response': Response body is already used". Il service worker di
  // un'app deve gestire solo le risorse del proprio stesso dominio.
  if (new URL(e.request.url).origin !== self.location.origin) return;
  const isNavigation = e.request.mode === 'navigate' || e.request.destination === 'document';
  if (isNavigation) {
    // Network-first for the app shell: always show the latest deployed
    // version when online; fall back to cache only if offline.
    e.respondWith(
      fetch(e.request).then(resp => {
        if (resp && resp.status === 200) caches.open(CACHE).then(c => c.put(e.request, resp.clone()));
        return resp;
      }).catch(() => caches.match(e.request).then(r => r || caches.match('./index.html')))
    );
    return;
  }
  // Cache-first for static assets (icons, manifest) — these rarely change.
  e.respondWith(
    caches.match(e.request).then(cached => {
      const network = fetch(e.request).then(resp => {
        if (resp && resp.status === 200) caches.open(CACHE).then(c => c.put(e.request, resp.clone()));
        return resp;
      }).catch(() => cached);
      return cached || network;
    })
  );
});

