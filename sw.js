const CACHE='eddies-basement-v54';
const CORE=['./','./index.html','./styles.css','./randomizer.css','./launch.css','./polish.css','./command-ui.css','./app-flow.css','experience.css','./brand-polish.css','./decision-flow.css','./browse-bar.css','./real-art-policy.css','./cta-balance.css','./logo-presence.css','./arcade-stage.css','./copy-cleanup.js','./app.js','./safety-filter.js','./catalog-vetted-expansion.js','./image-reliability.js','./hit-art.js','./image-display-guard.js','./library-expansion.js','./filter-view-fixes.js','./browse-bar.js','./launch.js','./vault-data.js','./catalog-fallback.js','./previews.js','./artwork-data.js','./favicon.svg','./social-card.svg','./manifest.webmanifest','./browser-multiplayer-games.html','./no-download-multiplayer-games.html','./free-party-games-online.html','./two-player-online-games.html','./phone-party-games.html','./privacy.html','./terms.html','./contact.html','./feedback.html','./sitemap.xml'];
const NETWORK_FIRST=new Set(['index.html','styles.css','randomizer.css','launch.css','polish.css','command-ui.css','app-flow.css','experience.css','brand-polish.css','decision-flow.css','browse-bar.css','real-art-policy.css','cta-balance.css','logo-presence.css','arcade-stage.css','copy-cleanup.js','app.js','safety-filter.js','catalog-vetted-expansion.js','image-reliability.js','hit-art.js','image-display-guard.js','library-expansion.js','filter-view-fixes.js','browse-bar.js','launch.js','vault-data.js','catalog-fallback.js','previews.js','artwork-data.js','browser-multiplayer-games.html','no-download-multiplayer-games.html','free-party-games-online.html','two-player-online-games.html','sitemap.xml','health.json']);

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