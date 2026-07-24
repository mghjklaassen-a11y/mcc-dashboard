/* MCC PWA service-worker — offline app-shell. Wordt op de site-ROOT gedeployd
   (/mcc-dashboard/service-worker.js) zodat de scope de hele site dekt.
   Same-origin GET's: network-first met cache-fallback (offline opent de laatste shell).
   Supabase (cross-origin, POST/GET): NOOIT cachen -> altijd live data, nooit stale cijfers. */
var CACHE = 'mcc-shell-v1';
var SHELL = ['./', './index.html', './manifest.webmanifest',
             './pwa/icon-192.png', './pwa/icon-512.png', './pwa/apple-touch-icon.png'];
self.addEventListener('install', function(e){
  e.waitUntil(caches.open(CACHE).then(function(c){ return c.addAll(SHELL); }).then(function(){ return self.skipWaiting(); }));
});
self.addEventListener('activate', function(e){
  e.waitUntil(caches.keys().then(function(ks){
    return Promise.all(ks.map(function(k){ if(k!==CACHE) return caches.delete(k); }));
  }).then(function(){ return self.clients.claim(); }));
});
self.addEventListener('fetch', function(e){
  var req = e.request;
  if (req.method !== 'GET') return;                 // Supabase POST's ongemoeid -> live
  var url = new URL(req.url);
  if (url.origin !== self.location.origin) return;  // externe (Supabase) niet cachen -> live
  e.respondWith(
    fetch(req).then(function(res){
      var copy = res.clone();
      caches.open(CACHE).then(function(c){ c.put(req, copy); });
      return res;
    }).catch(function(){
      return caches.match(req).then(function(m){ return m || caches.match('./index.html'); });
    })
  );
});
