(() => {
  'use strict';
  const safeRead=(k,f)=>{try{return JSON.parse(localStorage.getItem(k)||JSON.stringify(f))}catch{return f}};
  const save=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v))}catch{}};
  const track=(event,detail={})=>{const rows=safeRead('eb-analytics',[]);rows.push({event,detail,at:new Date().toISOString(),path:location.pathname+location.search+location.hash});save('eb-analytics',rows.slice(-500));};
  window.EddieTrack=track;
  track('page_view',{referrer:document.referrer||null});
  window.addEventListener('online',()=>track('network_online'));
  window.addEventListener('offline',()=>track('network_offline'));
  document.addEventListener('click',e=>{
    const a=e.target.closest('a');
    if(a&&a.target==='_blank')track('outbound_click',{text:(a.textContent||'').trim().slice(0,80),href:a.href});
    const b=e.target.closest('button');
    if(b&&b.id)track('button_click',{id:b.id,text:(b.textContent||'').trim().slice(0,80)});
  });

  if('serviceWorker' in navigator){
    let reloading=false;
    navigator.serviceWorker.addEventListener('controllerchange',()=>{
      if(reloading)return;
      reloading=true;
      track('service_worker_updated');
      location.reload();
    });
    window.addEventListener('load',()=>{
      navigator.serviceWorker.register('./sw.js',{updateViaCache:'none'})
        .then(registration=>{
          track('service_worker_ready');
          registration.update().catch(()=>{});
        })
        .catch(err=>track('service_worker_failed',{message:String(err)}));
    });
  }

  let installPrompt=null;
  const install=document.getElementById('installApp');
  window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();installPrompt=e;if(install)install.hidden=false;});
  install?.addEventListener('click',async()=>{if(!installPrompt)return;installPrompt.prompt();const result=await installPrompt.userChoice;track('install_prompt_result',{outcome:result.outcome});installPrompt=null;install.hidden=true;});
  window.addEventListener('appinstalled',()=>track('app_installed'));
})();
