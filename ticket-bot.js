/* ITExpresSolutions - Bot de tickets sin IA
   Este archivo reemplaza el flujo guiado del bot existente sin cambiar su HTML/CSS.
   Requiere que window.ITExpresSupabase ya exista.
*/
(function(){
  function boot(){
    const toggle=document.getElementById('serviceBotToggle');
    const panel=document.getElementById('serviceBot');
    const close=document.getElementById('serviceBotClose');
    const messages=document.getElementById('serviceBotMessages');
    const quick=document.getElementById('serviceBotQuick');
    const form=document.getElementById('serviceBotInputForm');
    const input=document.getElementById('serviceBotInput');
    if(!toggle||!panel||!close||!messages||!quick||!form||!input) return;

    const FORM_URL='https://forms.gle/6QHaxfYMQFeeVf3RA';
    const state={step:'pais',data:{}};

    function esc(v){return String(v??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));}
    function safe(v,max=500){return String(v||'').trim().slice(0,max);}
    function addMessage(text,who='bot'){
      const row=document.createElement('div'); row.className='service-bot-message '+who;
      const bubble=document.createElement('div'); bubble.className='service-bot-bubble'; bubble.textContent=text;
      row.appendChild(bubble); messages.appendChild(row); messages.scrollTop=messages.scrollHeight;
    }
    function setQuick(items){
      quick.innerHTML='';
      (items||[]).forEach(item=>{
        const b=document.createElement('button'); b.type='button'; b.textContent=item.label;
        b.dataset.ticketValue=item.value; b.dataset.ticketLabel=item.label;
        quick.appendChild(b);
      });
    }
    function ask(step,text,items){state.step=step; addMessage(text); setQuick(items);}
    function start(){
      state.step='pais'; state.data={}; messages.innerHTML='';
      addMessage('¡Hola! 👋 Soy el asistente de servicio de ITExpresSolutions. Voy a ayudarte a abrir un ticket de soporte.');
      addMessage('Primero, ¿en qué país necesitas el servicio?');
      setQuick([{label:'🇲🇽 México',value:'México'},{label:'🇨🇷 Costa Rica',value:'Costa Rica'}]);
    }
    function nextAfterCountry(){
      ask('ciudad','¿En qué ciudad estás? Escribe tu ciudad para registrar correctamente el ticket.',[]);
    }
    function nextAfterCity(){
      ask('servicio','¿Qué tipo de servicio necesitas?',[
        {label:'💻 Soporte técnico',value:'Soporte técnico'},
        {label:'🔧 Reparación / mantenimiento',value:'Reparación / mantenimiento'},
        {label:'🌐 Red / Wi‑Fi',value:'Red / Wi‑Fi'},
        {label:'🖨️ Impresora',value:'Impresora'},
        {label:'📱 Celular',value:'Celular'},
        {label:'🌎 Soporte remoto',value:'Soporte remoto'},
        {label:'🖥️ Página web / digital',value:'Página web / digital'},
        {label:'Otro',value:'Otro'}
      ]);
    }
    function nextAfterService(){
      ask('equipo','¿Qué equipo o sistema está involucrado? Por ejemplo: laptop, PC, Mac, impresora, router, celular o página web.',[]);
    }
    function nextAfterEquipo(){
      ask('problema','Cuéntame brevemente qué está pasando o qué necesitas realizar.',[]);
    }
    function nextAfterProblema(){
      ask('nombre','¿Cuál es tu nombre?',[]);
    }
    function nextAfterNombre(){
      ask('contacto','¿Cuál es el mejor medio para contactarte? Puedes escribir teléfono, WhatsApp o correo.',[]);
    }
    function nextAfterContacto(){
      ask('prioridad','¿Qué tan urgente es la solicitud?',[
        {label:'Normal',value:'normal'},
        {label:'Alta',value:'alta'},
        {label:'🚨 Urgente',value:'urgente'}
      ]);
    }
    async function createTicket(){
      state.step='sending'; setQuick([]); addMessage('Creando tu ticket…');
      const sb=window.ITExpresSupabase;
      if(!sb){addMessage('No se pudo conectar con el sistema de tickets. Puedes usar el formulario para registrar tu solicitud.'); showFallback(); return;}
      const d=state.data;
      const {data,error}=await sb.rpc('crear_ticket_web',{
        p_pais:d.pais,p_ciudad:d.ciudad,p_servicio:d.servicio,p_equipo:d.equipo,
        p_problema:d.problema,p_nombre:d.nombre,p_contacto:d.contacto,p_prioridad:d.prioridad
      });
      if(error){
        console.error('crear_ticket_web:',error);
        addMessage('No pude crear el ticket automáticamente. Tu información no se perdió en el chat. Puedes abrir el formulario para registrarla.');
        showFallback(); return;
      }
      const ticketId=String(data||'');
      const shortId=ticketId ? ticketId.slice(0,8).toUpperCase() : 'REGISTRADO';
      state.step='done';
      addMessage('✅ Ticket creado correctamente. Número de referencia: #'+shortId);
      addMessage('Tu solicitud quedó registrada como pendiente. Nuestro equipo podrá verla desde el portal de ITExpresSolutions.');
      setQuick([{label:'↻ Abrir otro ticket',value:'restart'}]);
    }
    function showFallback(){
      quick.innerHTML='';
      const a=document.createElement('a'); a.className='service-bot-action primary'; a.href=FORM_URL; a.target='_blank'; a.rel='noopener'; a.textContent='📋 Abrir formulario'; quick.appendChild(a);
      const b=document.createElement('button'); b.type='button'; b.textContent='↻ Intentar de nuevo'; b.dataset.ticketValue='restart'; quick.appendChild(b);
    }
    function handleChoice(value,label){
      if(value==='restart'){start();return;}
      addMessage(label,'user');
      if(state.step==='pais'){state.data.pais=value;nextAfterCountry();return;}
      if(state.step==='servicio'){state.data.servicio=value;nextAfterService();return;}
      if(state.step==='prioridad'){state.data.prioridad=value;createTicket();return;}
      if(state.step==='done')return;
    }
    function handleText(text){
      const value=safe(text); if(!value)return;
      addMessage(value,'user');
      if(state.step==='ciudad'){state.data.ciudad=value;nextAfterCity();return;}
      if(state.step==='equipo'){state.data.equipo=value;nextAfterEquipo();return;}
      if(state.step==='problema'){state.data.problema=value;nextAfterProblema();return;}
      if(state.step==='nombre'){state.data.nombre=value;nextAfterNombre();return;}
      if(state.step==='contacto'){state.data.contacto=value;nextAfterContacto();return;}
      if(state.step==='sending'){addMessage('Estoy terminando de registrar tu ticket.');return;}
      if(state.step==='done'){addMessage('Tu ticket ya fue registrado. Pulsa “Abrir otro ticket” si necesitas registrar otra solicitud.');return;}
      addMessage('Selecciona una de las opciones disponibles.');
    }
    function openBot(){panel.hidden=false;toggle.setAttribute('aria-expanded','true');if(!messages.children.length)start();setTimeout(()=>input.focus(),50);}
    function closeBot(){panel.hidden=true;toggle.setAttribute('aria-expanded','false');}

    // Captura los eventos antes del bot anterior para que este flujo sea el único activo.
    toggle.addEventListener('click',e=>{e.preventDefault();e.stopImmediatePropagation();panel.hidden?openBot():closeBot();},true);
    close.addEventListener('click',e=>{e.preventDefault();e.stopImmediatePropagation();closeBot();},true);
    quick.addEventListener('click',e=>{
      const b=e.target.closest('[data-ticket-value]');
      if(!b)return;
      e.preventDefault(); e.stopImmediatePropagation(); handleChoice(b.dataset.ticketValue,b.dataset.ticketLabel||b.textContent.trim());
    },true);
    form.addEventListener('submit',e=>{e.preventDefault();e.stopImmediatePropagation();const text=input.value;input.value='';handleText(text);},true);
  }

  function wait(){
    if(window.ITExpresSupabase) boot();
    else setTimeout(wait,100);
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',wait); else wait();
})();
