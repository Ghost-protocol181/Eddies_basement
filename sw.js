// Cache cleanup only. The site is being actively rebuilt, so avoid serving stale HTML/CSS/JS.
const CACHE_PREFIX='eddies-basement-';

self.addEventListener('install',event=>{
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate',event=>{
  event.waitUntil(
    caches.keys()
      .then(keys=>Promise.all(keys.filter(key=>key.startsWith(CACHE_PREFIX)).map(key=>caches.delete(key))))
      .then(()=>self.registration.unregister())
      .then(()=>self.clients.matchAll({type:'window'}))
      .then(clients=>clients.forEach(client=>client.navigate(client.url)))
  );
});

self.addEventListener('fetch',event=>{
  // Let the browser/network handle every request. No caching.
});
