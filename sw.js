const CACHE = 'traccian-v24'; // v24: record della seduta e punteggi in js/exercises/record.js (5i), stesse formule. v23: registro degli esercizi e configurazione di partenza in js/exercises/registry.js (5h), stessi valori. v22: brani, liste e percorsi delle strategie di memoria in js/exercises/memoria.js (5g), logica invariata. v21: motore e scenari del compito a obiettivi in js/exercises/goaltask.js (5f), logica invariata. v20: valutazione delle prove e adattamento del livello in js/exercises/resolve.js (5e), logica invariata. v19: tavole Neglect in js/exercises/neglect.js (5d), logica invariata. v18: sequenze chiuse e tabelle di regole in js/core/rules.js e js/exercises/ (5c), logica invariata. v17: generatori Go/No-Go, TAPAT, Doppio compito e Running Span in js/exercises/ (5b), logica invariata. v16: generatore N-back in js/exercises/nback.js, materiale misto in pools.js (5a), logica invariata. v15: query Supabase in js/services/cloud.js (4b), stesse query e regole. v14: salvataggio locale in js/services/local-store.js (4a), stessi dati e chiavi. v13: regola di titolazione unica in js/core/adapt.js (3c), stessi valori. v12: fasce strutturali in js/core/bands.js (3c), tabella ISI Simon=ANT e forma non verbale delle sonde di screening derivata dalla verbale (3d), valori invariati. v11: dati stimoli (POOLS) e motore di screening spostati in js/core/pools.js e screening.js (passo 3b, valori invariati). v10: punteggi (EZ-diffusion, LISAS, riepilogo esercizi) spostati in js/core/scores.js (passo 3b, formule invariate). v9: titolazione e hint spostati in js/core/titration.js (passo 3b, testi invariati). v8: tabelle dei livelli spostate in js/core/levels.js (passo 3b, valori invariati). v7: logica pura spostata in js/core/ (moduli ES, nuovi file in precache). v6: un account senza ruolo (né operatore né paziente) non entra più nell'app. v5: CSS spostato in css/app.css. v4: corretto il bug che intercettava anche le chiamate cross-origin a Supabase — bump per pulire qualunque risposta rimasta in cache dalla versione precedente
const ASSETS = ['./', './index.html', './css/app.css', './js/core/keylayout.js', './js/core/stats.js', './js/core/records.js', './js/core/rci.js', './js/core/levels.js', './js/core/titration.js', './js/core/scores.js', './js/core/pools.js', './js/core/screening.js', './js/core/bands.js', './js/core/adapt.js', './js/services/local-store.js', './js/services/cloud.js', './js/exercises/nback.js', './js/exercises/gonogo.js', './js/exercises/tapat.js', './js/exercises/dualtask.js', './js/exercises/runningspan.js', './js/core/rules.js', './js/exercises/sequenza.js', './js/exercises/stopsignal.js', './js/exercises/ant.js', './js/exercises/switching.js', './js/exercises/simon.js', './js/exercises/mantenimento.js', './js/exercises/categorizzazione.js', './js/exercises/neglect.js', './js/exercises/resolve.js', './js/exercises/goaltask.js', './js/exercises/memoria.js', './js/exercises/registry.js', './js/exercises/record.js', './manifest.json', './icon-192.png', './icon-512.png'];

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

