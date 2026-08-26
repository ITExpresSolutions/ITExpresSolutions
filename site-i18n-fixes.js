/* ITExpresSolutions - visual fixes for site language switcher and service bot. */
(function () {
  function installStyles() {
    if (document.getElementById('itxUiFixes')) return;
    const style = document.createElement('style');
    style.id = 'itxUiFixes';
    style.textContent = `
      .site-language-switcher { display:inline-flex!important; align-items:center!important; gap:3px!important; padding:3px!important; margin-left:6px!important; border:1px solid #cfe0e6!important; border-radius:999px!important; background:#f3f8fa!important; box-shadow:0 3px 10px rgba(6,59,103,.08)!important; flex:0 0 auto!important; white-space:nowrap!important; }
      .site-language-switcher button { appearance:none!important; border:0!important; min-width:34px!important; height:28px!important; padding:0 8px!important; border-radius:999px!important; background:transparent!important; color:#46606d!important; font:800 11px/28px Inter,ui-sans-serif,system-ui,sans-serif!important; cursor:pointer!important; }
      .site-language-switcher button[aria-pressed="true"] { background:#087f8e!important; color:#fff!important; box-shadow:0 2px 7px rgba(8,127,142,.22)!important; }
      .site-language-switcher button:hover { background:#e2f0f3!important; color:#062f52!important; }
      .site-language-switcher button[aria-pressed="true"]:hover { background:#087f8e!important; color:#fff!important; }
      #serviceBotToggle { position:fixed!important; right:22px!important; left:auto!important; bottom:22px!important; top:auto!important; margin:0!important; transform:none!important; z-index:9998!important; }
      #serviceBot { position:fixed!important; right:22px!important; left:auto!important; bottom:90px!important; top:auto!important; margin:0!important; transform:none!important; width:min(390px,calc(100vw - 32px))!important; max-width:calc(100vw - 32px)!important; max-height:min(680px,calc(100vh - 110px))!important; z-index:9999!important; overflow:hidden!important; }
      #serviceBotMessages { min-height:0!important; max-height:min(500px,calc(100vh - 250px))!important; overflow-y:auto!important; }
      #serviceBotQuick { max-width:100%!important; }
      .service-bot-toggle { cursor:pointer!important; }
      @media(max-width:760px){ .site-language-switcher{margin-left:0!important}.site-language-switcher button{min-width:32px!important;height:26px!important;line-height:26px!important;padding:0 7px!important}#serviceBotToggle{right:16px!important;bottom:16px!important}#serviceBot{right:16px!important;bottom:82px!important;width:calc(100vw - 32px)!important;max-width:calc(100vw - 32px)!important;max-height:calc(100vh - 98px)!important} }
    `;
    document.head.appendChild(style);
  }

  function moveLanguageSwitcher(){const nav=document.querySelector('.container.nav');const switcher=document.getElementById('siteLanguageSwitch');const call=nav&&nav.querySelector('.desktop-call');if(nav&&switcher&&call&&switcher.nextElementSibling!==call)nav.insertBefore(switcher,call);}
  function loadPrices(){if(document.getElementById('itxServicePricesScript'))return;const s=document.createElement('script');s.id='itxServicePricesScript';s.src='service-prices.js';s.defer=true;document.head.appendChild(s);}

  // Password recovery fix:
  // The portal used a URL with #portal as redirectTo. Supabase Auth also uses
  // the URL hash for the recovery tokens, which can corrupt the hash and cause
  // the portal to report an error. Intercept the click and use a clean URL.
  function installPasswordRecoveryFix(){
    document.addEventListener('click', async (event) => {
      const button = event.target && event.target.closest ? event.target.closest('#forgotPassword') : null;
      if(!button) return;
      event.preventDefault();
      event.stopImmediatePropagation();

      const emailInput = document.getElementById('loginEmail');
      const message = document.getElementById('loginMessage');
      const email = (emailInput?.value || '').trim();
      if(!email){
        if(typeof window.msg === 'function') window.msg(message,'Escribe primero tu correo electrónico.','error');
        else if(message) message.textContent='Escribe primero tu correo electrónico.';
        return;
      }

      try{
        if(typeof window.ITExpresSupabase === 'undefined') throw new Error('No se pudo inicializar el servicio de autenticación.');
        if(message) message.textContent='Enviando instrucciones…';
        const { error } = await window.ITExpresSupabase.auth.resetPasswordForEmail(email, {
          redirectTo: 'https://itexpressolutions.com/?recovery=1'
        });
        if(message){
          message.textContent = error ? error.message : 'Te enviamos las instrucciones para restablecer tu contraseña.';
          message.className = 'portal-message ' + (error ? 'error' : 'success');
        }
      }catch(error){
        if(message){
          message.textContent = error?.message || 'No se pudo solicitar el cambio de contraseña.';
          message.className = 'portal-message error';
        }
      }
    }, true);
  }

  function boot(){installStyles();moveLanguageSwitcher();loadPrices();installPasswordRecoveryFix();setTimeout(moveLanguageSwitcher,300);setTimeout(moveLanguageSwitcher,1000);}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
  new MutationObserver(moveLanguageSwitcher).observe(document.documentElement,{childList:true,subtree:true});
})();
