const CACHE='eddies-basement-v17';
const CORE=['./','./index.html','./styles.css','./randomizer.css','./launch.css','./polish.css','./command-ui.css','./app-flow.css','./copy-cleanup.js','./app.js','./launch.js','./vault-data.js','./catalog-fallback.js','./previews.js','./artwork-data.js','./favicon.svg','./social-card.svg','./manifest.webmanifest','./privacy.html','./terms.html','./contact.html','./feedback.html'];
const NETWORK_FIRST=new Set(['index.html','styles.css','randomizer.css','launch.css','polish.css','command-ui.css','app-flow.css','copy-cleanup.js','app.js','launch.js','vault-data.js','catalog-fallback.js','previews.js','artwork-data.js','health.json']);

self.addEventListener('install',event=>{
  event.waitUntil(
    caches.open(CACHE)
      .then(cache=>cache.addAll(CORE))
      .then(()=>self.skipWaiting())
  );
});

self.addEventListener('activate',event=>{
  event.waitUntil(
    caches.keys()
      .then(keys=>Promise.all(keys.filter(key=>key!==CACHE).map(key=>caches.delete(key))))
      .then(()=>self.clients.claim())
  );
});

async function networkFirst(request){
  const cache=await caches.open(CACHE);
  try{
    const response=await fetch(request,{cache:'no-store'});
    if(response&&response.ok)cache.put(request,response.clone());
    return response;
  }catch(error){
    const cached=await cache.match(request);
    if(cached)return cached;
    throw error;
  }
}

async function cacheFirst(request){
  const cache=await caches.open(CACHE);
  const cached=await cache.match(request);
  if(cached)return cached;
  const response=await fetch(request);
  if(response&&response.ok)cache.put(request,response.clone());
  return response;
}

self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET')return;
  const url=new URL(event.request.url);
  if(url.origin!==location.origin)return;
  const file=url.pathname.split('/').pop()||'index.html';
  const isNavigation=event.request.mode==='navigate';
  event.respondWith(
    (isNavigation||NETWORK_FIRST.has(file)?networkFirst(event.request):cacheFirst(event.request))
      .catch(async()=>{
        if(isNavigation)return (await caches.match('./index.html'))||Response.error();
        return Response.error();
      })
  );
});