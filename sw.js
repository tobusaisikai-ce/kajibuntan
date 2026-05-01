const CACHE_NAME = 'ouchi-bunktan-v2';
const ASSETS = ['./index.html','./manifest.json','./icon.svg'];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE_NAME).then(c => c.addAll(ASSETS).catch(()=>{})));
  self.skipWaiting();
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k=>k!==CACHE_NAME).map(k=>caches.delete(k)))));
  self.clients.claim();
});
self.addEventListener('fetch', e => {
  e.respondWith(fetch(e.request).then(res=>{const c=res.clone();caches.open(CACHE_NAME).then(ca=>ca.put(e.request,c));return res;}).catch(()=>caches.match(e.request)));
});
