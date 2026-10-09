/* Team Forte app: keeps the app itself on the phone so it opens instantly.
   App files: served from the phone, refreshed in the background.
   Your data (quotes, jobs, photos) always comes from Google. */
var VERSION = 'tf-v5';
var SHELL = ['./', 'index.html', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png', 'icon-maskable-512.png', 'apple-touch-icon.png'];

self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(VERSION).then(function (c) { return c.addAll(SHELL); }).then(function () { return self.skipWaiting(); }));
});
self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (k) { return k !== VERSION && k.indexOf('tf-') === 0; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});

function fromCacheThenUpdate(req, key) {
  return caches.open(VERSION).then(function (c) {
    return c.match(key || req).then(function (hit) {
      var net = fetch(req).then(function (res) {
        if (res && (res.ok || res.type === 'opaque')) c.put(key || req, res.clone());
        return res;
      }).catch(function () { return hit; });
      return hit || net;
    });
  });
}

self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET') return;
  var url = new URL(req.url);
  if (url.origin === location.origin) {
    if (req.mode === 'navigate') { e.respondWith(fromCacheThenUpdate(req, 'index.html')); return; }
    e.respondWith(fromCacheThenUpdate(req));
    return;
  }
  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    e.respondWith(fromCacheThenUpdate(req));
  }
  /* everything else (Google Apps Script, photos) goes straight to the network */
});
