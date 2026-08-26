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
      .itx-admin-status, .itx-admin-service-date { width:100%; min-width:150px; box-sizing:border-box; border:1px solid rgba(120,150,170,.35); border-radius:10px; padding:8px 9px; font:inherit; background:#fff; color:#173042; }
      .itx-admin-service-date { min-width:205px; }
      .itx-admin-status:focus, .itx-admin-service-date:focus { outline:2px solid rgba(67,213,142,.45); outline-offset:1px; }
      .itx-login-password-wrap{position:relative;width:100%}
      .itx-login-password-wrap input{padding-right:48px!important}
      .itx-login-password-toggle{position:absolute;right:7px;top:50%;transform:translateY(-50%);width:36px;height:36px;border:0!important;background:transparent!important;color:#526875!important;padding:0!important;display:grid;place-items:center;font-size:19px;cursor:pointer;box-shadow:none!important}
      .itx-login-password-toggle:hover{color:#087f8e!important}
      .itx-tech-invite-card{margin-top:18px!important}
      .itx-tech-invite-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}
      .itx-tech-invite-grid label{display:flex;flex-direction:column;gap:6px;font-weight:700;color:#36515f}
      .itx-tech-invite-grid input{width:100%;box-sizing:border-box;border:1px solid #d6e4ea;border-radius:10px;padding:11px 12px;font:inherit;background:#fff;color:#173042}
      .itx-tech-invite-grid input:focus{outline:2px solid rgba(67,213,142,.4);outline-offset:1px}
      .itx-tech-invite-note{margin:0 0 16px;color:#617785;font-size:.9rem;line-height:1.5}
      .itx-tech-invite-message{margin-top:10px;font-weight:700}
      .itx-tech-invite-message.success{color:#087f62}.itx-tech-invite-message.error{color:#b42318}
      @media(max-width:760px){ .site-language-switcher{margin-left:0!important}.site-language-switcher button{min-width:32px!important;height:26px!important;line-height:26px!important;padding:0 7px!important}#serviceBotToggle{right:16px!important;bottom:16px!important}#serviceBot{right:16px!important;bottom:82px!important;width:calc(100vw - 32px)!important;max-width:calc(100vw - 32px)!important;max-height:calc(100vh - 98px)!important}.itx-admin-service-date{min-width:190px}.itx-tech-invite-grid{grid-template-columns:1fr} }
    `;
    document.head.appendChild(style);
  }

  function moveLanguageSwitcher(){const nav=document.querySelector('.container.nav');const switcher=document.getElementById('siteLanguageSwitch');const call=nav&&nav.querySelector('.desktop-call');if(nav&&switcher&&call&&switcher.nextElementSibling!==call)nav.insertBefore(switcher,call);}
  function loadPrices(){if(document.getElementById('itxServicePricesScript'))return;const s=document.createElement('script');s.id='itxServicePricesScript';s.src='service-prices.js';s.defer=true;document.head.appendChild(s);}
  function loadAuthRecovery(){if(document.getElementById('itxAuthRecoveryScript'))return;const s=document.createElement('script');s.id='itxAuthRecoveryScript';s.src='auth-recovery.js?v=2';s.defer=true;document.head.appendChild(s);}

  function installLoginPasswordToggle(){
    const install = () => {
      const email = document.getElementById('loginEmail');
      if(!email) return;
      const form = email.closest('form') || email.parentElement?.parentElement;
      if(!form) return;
      const password = form.querySelector('input[type="password"]');
      if(!password || password.dataset.itxEyeInstalled === '1') return;
      password.dataset.itxEyeInstalled = '1';
      const wrap = document.createElement('div');
      wrap.className = 'itx-login-password-wrap';
      password.parentNode.insertBefore(wrap,password);
      wrap.appendChild(password);
      const button = document.createElement('button');
      button.type='button';
      button.className='itx-login-password-toggle';
      button.textContent='👁';
      button.setAttribute('aria-label','Mostrar contraseña');
      button.title='Mostrar contraseña';
      button.addEventListener('click',()=>{
        const showing=password.type==='text';
        password.type=showing?'password':'text';
        button.textContent=showing?'👁':'🙈';
        button.setAttribute('aria-label',showing?'Mostrar contraseña':'Ocultar contraseña');
        button.title=showing?'Mostrar contraseña':'Ocultar contraseña';
      });
      wrap.appendChild(button);
    };
    install();
    const observer=new MutationObserver(install);
    observer.observe(document.body,{childList:true,subtree:true});
    setTimeout(install,300);
    setTimeout(install,1000);
    setTimeout(install,2500);
  }

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
        const redirectTo = `${window.location.origin}/?recovery=1`;
        const { error } = await window.ITExpresSupabase.auth.resetPasswordForEmail(email, { redirectTo });
        if(message){ message.textContent = error ? error.message : 'Te enviamos las instrucciones para restablecer tu contraseña.'; message.className = 'portal-message ' + (error ? 'error' : 'success'); }
      }catch(error){
        if(message){ message.textContent = error?.message || 'No se pudo solicitar el cambio de contraseña.'; message.className = 'portal-message error'; }
      }
    }, true);
  }

  function toDateTimeLocal(value){
    if(!value) return '';
    const d=new Date(value); if(isNaN(d)) return '';
    const pad=n=>String(n).padStart(2,'0');
    return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }

  function parseDisplayedDate(text){
    const m=String(text||'').trim().match(/(\d{1,2})\/(\d{1,2})\/(\d{4})(?:,?\s+(\d{1,2}):(\d{2}))?/);
    if(!m) return '';
    const day=Number(m[1]), month=Number(m[2]), year=Number(m[3]);
    const hour=Number(m[4]||0), minute=Number(m[5]||0);
    const d=new Date(year,month-1,day,hour,minute,0,0);
    return isNaN(d)?'':toDateTimeLocal(d.toISOString());
  }

  async function updateAdminJob(id, payload, control, successText){
    const sb=window.ITExpresSupabase;
    if(!sb) return;
    control.disabled=true;
    const {error}=await sb.from('trabajos').update({...payload, actualizado_at:new Date().toISOString()}).eq('id',id);
    control.disabled=false;
    if(error){ alert('No se pudo guardar el cambio: '+error.message); return; }
    control.title=successText || 'Guardado';
    control.dataset.saved='1';
  }

  function enhanceAdminJobs(){
    const panel=document.getElementById('adminPanel');
    const body=document.getElementById('adminJobsBody');
    if(!panel || panel.hidden || !body) return;
    body.querySelectorAll('tr').forEach(row=>{
      const tech=row.querySelector('.job-tech-select');
      if(!tech) return;
      const id=tech.dataset.jobId;
      if(!id) return;
      const cells=row.querySelectorAll('td');
      if(cells.length<7) return;

      if(!row.querySelector('.itx-admin-status')){
        const statusCell=cells[2];
        const current=statusCell.querySelector('.status')?.textContent?.trim().toLowerCase() || '';
        const map={'pendiente':'pendiente','asignado':'asignado','en proceso':'en_proceso','completado':'completado','cancelado':'cancelado'};
        const value=map[current] || 'pendiente';
        statusCell.innerHTML=`<select class="itx-admin-status" data-job-id="${id}" aria-label="Cambiar estado"><option value="pendiente">Pendiente</option><option value="asignado">Asignado</option><option value="en_proceso">En proceso</option><option value="completado">Completado</option><option value="cancelado">Cancelado</option></select>`;
        const select=statusCell.querySelector('.itx-admin-status');
        select.value=value;
        select.addEventListener('change',()=>updateAdminJob(id,{estado:select.value},select,'Estado guardado'));
      }

      if(!row.querySelector('.itx-admin-service-date')){
        const dateCell=cells[5];
        const localValue=parseDisplayedDate(dateCell.textContent);
        dateCell.innerHTML=`<input class="itx-admin-service-date" type="datetime-local" value="${localValue}" data-job-id="${id}" aria-label="Fecha de servicio">`;
        const input=dateCell.querySelector('.itx-admin-service-date');
        input.addEventListener('change',()=>updateAdminJob(id,{fecha_programada:input.value?new Date(input.value).toISOString():null},input,'Fecha de servicio guardada'));
      }
    });
  }

  function watchAdminJobs(){
    const body=document.getElementById('adminJobsBody');
    if(!body) return;
    const observer=new MutationObserver(()=>enhanceAdminJobs());
    observer.observe(body,{childList:true,subtree:true});
    setTimeout(enhanceAdminJobs,500);
    setTimeout(enhanceAdminJobs,1500);
  }

  function installTechnicianInvite(){
    const adminPanel=document.getElementById('adminPanel');
    if(!adminPanel || document.getElementById('itxTechInviteCard')) return;
    const card=document.createElement('div');
    card.id='itxTechInviteCard';
    card.className='portal-card itx-tech-invite-card';
    card.innerHTML=`
      <div class="portal-card-head"><div><h3>Invitar técnico</h3><p>Crear la cuenta y enviar el correo de bienvenida.</p></div><span>✉️</span></div>
      <p class="itx-tech-invite-note">El técnico recibirá su correo de acceso y un enlace seguro para crear su propia contraseña. Por seguridad, nunca enviamos contraseñas por correo.</p>
      <form id="itxTechInviteForm" class="portal-form" autocomplete="off">
        <div class="itx-tech-invite-grid">
          <label>Nombre completo *<input id="itxTechNombre" required maxlength="120" placeholder="Nombre del técnico"></label>
          <label>Correo electrónico *<input id="itxTechEmail" type="email" required maxlength="160" placeholder="tecnico@correo.com"></label>
          <label>Teléfono<input id="itxTechTelefono" maxlength="50" placeholder="+52 ..."></label>
          <label>Especialidad<input id="itxTechEspecialidad" maxlength="120" placeholder="Soporte, redes, hardware..."></label>
        </div>
        <button class="btn" type="submit" id="itxTechInviteBtn">✉️ Enviar invitación</button>
        <div class="itx-tech-invite-message" id="itxTechInviteMessage" role="status"></div>
      </form>`;
    const firstCard=adminPanel.querySelector('.portal-grid-2');
    if(firstCard) firstCard.insertAdjacentElement('afterend',card); else adminPanel.prepend(card);

    const form=card.querySelector('#itxTechInviteForm');
    const message=card.querySelector('#itxTechInviteMessage');
    const button=card.querySelector('#itxTechInviteBtn');
    form.addEventListener('submit',async event=>{
      event.preventDefault();
      const sb=window.ITExpresSupabase;
      if(!sb){message.textContent='El servicio de autenticación todavía no está listo.';message.className='itx-tech-invite-message error';return;}
      button.disabled=true;
      message.textContent='Creando cuenta y enviando invitación…';
      message.className='itx-tech-invite-message';
      try{
        const {data,error}=await sb.functions.invoke('invite-technician',{body:{
          nombre:card.querySelector('#itxTechNombre').value.trim(),
          email:card.querySelector('#itxTechEmail').value.trim(),
          telefono:card.querySelector('#itxTechTelefono').value.trim(),
          especialidad:card.querySelector('#itxTechEspecialidad').value.trim()
        }});
        if(error) throw new Error(error.message || 'No se pudo enviar la invitación.');
        if(data?.error) throw new Error(data.error);
        message.textContent=data?.message || 'Invitación enviada correctamente.';
        message.className='itx-tech-invite-message success';
        form.reset();
        if(typeof window.loadTechnicians === 'function') await window.loadTechnicians();
      }catch(error){
        message.textContent=error?.message || 'No se pudo enviar la invitación.';
        message.className='itx-tech-invite-message error';
      }finally{button.disabled=false;}
    });
  }

  function watchAdminPanel(){
    const panel=document.getElementById('adminPanel');
    if(!panel) return;
    const observer=new MutationObserver(()=>{if(!panel.hidden)installTechnicianInvite();});
    observer.observe(panel,{attributes:true,childList:true,subtree:true});
    setTimeout(()=>{if(!panel.hidden)installTechnicianInvite();},500);
    setTimeout(()=>{if(!panel.hidden)installTechnicianInvite();},1500);
  }

  function boot(){installStyles();moveLanguageSwitcher();loadPrices();loadAuthRecovery();installLoginPasswordToggle();installPasswordRecoveryFix();watchAdminJobs();watchAdminPanel();setTimeout(moveLanguageSwitcher,300);setTimeout(moveLanguageSwitcher,1000);}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
  new MutationObserver(moveLanguageSwitcher).observe(document.documentElement,{childList:true,subtree:true});
})();
