/* ITExpresSolutions - Bot de tickets sin IA
   Flujo: abrir ticket + consultar ticket + regresar/cancelar.
   Requiere window.ITExpresSupabase.
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

    const state={step:'menu',data:{}};

    function safe(v,max=500){return String(v??'').trim().slice(0,max);}
    function addMessage(text,who='bot'){
      const row=document.createElement('div');row.className='service-bot-message '+who;
      const bubble=document.createElement('div');bubble.className='service-bot-bubble';bubble.textContent=text;
      row.appendChild(bubble);messages.appendChild(row);messages.scrollTop=messages.scrollHeight;
    }
    function flagSvg(country){
      if(country==='México') return '<svg viewBox="0 0 24 16" aria-hidden="true"><rect width="8" height="16" fill="#006847"/><rect x="8" width="8" height="16" fill="#fff"/><rect x="16" width="8" height="16" fill="#ce1126"/><circle cx="12" cy="8" r="2" fill="#9b7b32"/></svg>';
      if(country==='Costa Rica') return '<svg viewBox="0 0 24 16" aria-hidden="true"><rect width="24" height="16" fill="#002b7f"/><rect y="3" width="24" height="10" fill="#fff"/><rect y="5" width="24" height="6" fill="#ce1126"/></svg>';
      return '';
    }
    function setQuick(items,nav=true){
      quick.innerHTML='';
      (items||[]).forEach(item=>{
        const b=document.createElement('button');b.type='button';b.dataset.ticketValue=item.value;b.dataset.ticketLabel=item.label;
        if(item.country)b.innerHTML='<span class="ticket-flag">'+flagSvg(item.country)+'</span><span>'+item.label+'</span>';
        else b.textContent=item.label;
        quick.appendChild(b);
      });
      if(nav && state.step!=='menu' && state.step!=='sending' && state.step!=='lookup_sending' && state.step!=='done' && state.step!=='lookup_done'){
        const back=document.createElement('button');back.type='button';back.dataset.ticketValue='back';back.dataset.ticketLabel='Regresar';back.textContent='← Regresar';quick.appendChild(back);
        const cancel=document.createElement('button');cancel.type='button';cancel.dataset.ticketValue='cancel';cancel.dataset.ticketLabel='Cancelar solicitud';cancel.textContent='✖ Cancelar solicitud';quick.appendChild(cancel);
      }
    }
    function ask(step,text,items){state.step=step;addMessage(text);setQuick(items,true);}

    function setRobotBrand(){
      const avatar=document.querySelector('.service-bot-avatar');
      if(avatar){avatar.textContent='🤖';avatar.setAttribute('aria-label','Asistente robot');}
    }
    function start(){
      state.step='menu';state.data={};messages.innerHTML='';setRobotBrand();
      addMessage('¡Hola! 👋 Soy el asistente de servicio de ITExpresSolutions.');
      addMessage('Puedo ayudarte a abrir un ticket o consultar uno que ya tengas.');
      setQuick([{label:'🎫 Abrir un ticket',value:'open'},{label:'🔎 Consultar mi ticket',value:'lookup'}],false);
    }
    function startOpenTicket(){
      state.step='pais';state.data={};
      addMessage('Primero, ¿en qué país necesitas el servicio?');
      setQuick([{label:'México',value:'México',country:'México'},{label:'Costa Rica',value:'Costa Rica',country:'Costa Rica'}],true);
    }
    function nextAfterCountry(){ask('ciudad','¿En qué ciudad estás?',[]);}
    function nextAfterCity(){ask('servicio','¿Qué tipo de servicio necesitas?',[{label:'💻 Soporte técnico',value:'Soporte técnico'},{label:'🔧 Reparación / mantenimiento',value:'Reparación / mantenimiento'},{label:'🌐 Red / Wi‑Fi',value:'Red / Wi‑Fi'},{label:'🖨️ Impresora',value:'Impresora'},{label:'📱 Celular',value:'Celular'},{label:'🌎 Soporte remoto',value:'Soporte remoto'},{label:'🖥️ Página web / digital',value:'Página web / digital'},{label:'Otro',value:'Otro'}]);}
    function nextAfterService(){ask('equipo','¿Qué equipo o sistema está involucrado? Por ejemplo: laptop, PC, Mac, impresora, router, celular o página web.',[]);}
    function nextAfterEquipo(){ask('problema','Cuéntame brevemente qué está pasando o qué necesitas realizar.',[]);}
    function nextAfterProblema(){ask('nombre','¿Cuál es tu nombre?',[]);}
    function nextAfterNombre(){ask('contacto','¿Cuál es el mejor medio para contactarte? Puedes escribir teléfono, WhatsApp o correo.',[]);}
    function nextAfterContacto(){ask('prioridad','¿Qué tan urgente es la solicitud?',[{label:'Normal',value:'normal'},{label:'Alta',value:'alta'},{label:'🚨 Urgente',value:'urgente'}]);}

    async function createTicket(){
      state.step='sending';setQuick([],false);addMessage('Creando tu ticket…');
      const sb=window.ITExpresSupabase;
      if(!sb){addMessage('No se pudo conectar con el sistema de tickets. Intenta nuevamente en unos momentos.');setQuick([{label:'↻ Intentar de nuevo',value:'restart'},{label:'🏠 Inicio',value:'home'}],false);return;}
      const d=state.data;
      const {data,error}=await sb.rpc('crear_ticket_web',{p_pais:d.pais,p_ciudad:d.ciudad,p_servicio:d.servicio,p_equipo:d.equipo,p_problema:d.problema,p_nombre:d.nombre,p_contacto:d.contacto,p_prioridad:d.prioridad});
      if(error){console.error('crear_ticket_web:',error);addMessage('No pude crear el ticket en este momento. Intenta nuevamente.');setQuick([{label:'↻ Intentar de nuevo',value:'restart'},{label:'🏠 Inicio',value:'home'}],false);return;}
      const ticketId=String(data||'');state.data.ticketId=ticketId;
      const ref=ticketId.slice(0,8).toUpperCase()||'REGISTRADO';state.step='done';
      addMessage('✅ Ticket creado correctamente.');addMessage('Número de referencia: #'+ref);addMessage('Guarda este número. Lo necesitarás para consultar el estado de tu ticket.');
      setQuick([{label:'🔎 Consultar este ticket',value:'lookup_now'},{label:'↻ Abrir otro ticket',value:'restart'},{label:'🏠 Inicio',value:'home'}],false);
    }

    function startLookup(prefill){
      state.step='lookup_ref';state.data={ticketId:prefill||''};
      if(prefill)addMessage('Referencia: #'+prefill);
      addMessage('Escribe el número de referencia de tu ticket. Puedes usar los primeros 8 caracteres, por ejemplo: A1B2C3D4.');
      setQuick([],true);
    }
    function askLookupContact(){ask('lookup_contact','Ahora escribe el mismo teléfono, WhatsApp o correo que registraste al abrir el ticket.',[]);}
    async function lookupTicket(){
      state.step='lookup_sending';setQuick([],false);addMessage('Consultando tu ticket…');
      const sb=window.ITExpresSupabase;
      if(!sb){addMessage('No se pudo conectar con el sistema de tickets. Intenta nuevamente más tarde.');setQuick([{label:'🏠 Inicio',value:'home'}],false);return;}
      const {data,error}=await sb.rpc('consultar_ticket_web',{p_referencia:state.data.referencia,p_contacto:state.data.lookupContacto});
      if(error){console.error('consultar_ticket_web:',error);state.step='lookup_error';addMessage('No encontré un ticket con esos datos. Verifica la referencia y el medio de contacto e inténtalo nuevamente.');setQuick([{label:'🔎 Intentar otra vez',value:'lookup'},{label:'🏠 Inicio',value:'home'}],false);return;}
      const t=data||{};state.step='lookup_done';
      addMessage('🎫 Ticket #'+String(t.referencia||state.data.referencia).toUpperCase());
      addMessage('Estado: '+statusLabel(t.estado)+' · Prioridad: '+String(t.prioridad||'normal'));
      if(t.titulo)addMessage('Servicio: '+t.titulo.replace(/^Solicitud web - /,'')+'.');
      if(t.ciudad)addMessage('Ciudad registrada: '+t.ciudad+'.');
      setQuick([{label:'🔎 Consultar otro ticket',value:'lookup'},{label:'🏠 Inicio',value:'home'}],false);
    }
    function statusLabel(v){return ({pendiente:'🟡 Pendiente',asignado:'🔵 Asignado',en_proceso:'🟠 En proceso',completado:'🟢 Completado',cancelado:'🔴 Cancelado'}[v]||v||'Pendiente');}

    function previousStep(){
      const map={ciudad:'pais',servicio:'ciudad',equipo:'servicio',problema:'equipo',nombre:'problema',contacto:'nombre',prioridad:'contacto',lookup_contact:'lookup_ref'};
      const prev=map[state.step];
      if(!prev){start();return;}
      if(state.step==='ciudad')state.data.ciudad='';
      if(state.step==='servicio')state.data.servicio='';
      if(state.step==='equipo')state.data.equipo='';
      if(state.step==='problema')state.data.problema='';
      if(state.step==='nombre')state.data.nombre='';
      if(state.step==='contacto')state.data.contacto='';
      if(state.step==='prioridad')state.data.prioridad='';
      if(state.step==='lookup_contact')state.data.lookupContacto='';
      if(prev==='pais'){state.step='pais';addMessage('← Regresamos. ¿En qué país necesitas el servicio?');setQuick([{label:'México',value:'México',country:'México'},{label:'Costa Rica',value:'Costa Rica',country:'Costa Rica'}],true);return;}
      const prompts={ciudad:'¿En qué ciudad estás?',servicio:'¿Qué tipo de servicio necesitas?',equipo:'¿Qué equipo o sistema está involucrado?',problema:'Cuéntame brevemente qué está pasando o qué necesitas realizar.',nombre:'¿Cuál es tu nombre?',contacto:'¿Cuál es el mejor medio para contactarte? Puedes escribir teléfono, WhatsApp o correo.',prioridad:'¿Qué tan urgente es la solicitud?',lookup_ref:'Escribe el número de referencia de tu ticket.'};
      if(prev==='servicio')nextAfterCity();else if(prev==='equipo')nextAfterService();else if(prev==='problema')nextAfterEquipo();else if(prev==='nombre')nextAfterProblema();else if(prev==='contacto')nextAfterNombre();else if(prev==='prioridad')nextAfterContacto();else if(prev==='lookup_ref')startLookup(state.data.ticketId);else ask(prev,prompts[prev]||'Regresemos al paso anterior.',[]);
    }
    function cancel(){
      state.step='menu';state.data={};
      addMessage('❌ Solicitud cancelada. No se creó ningún ticket.');
      addMessage('¿Qué deseas hacer ahora?');
      setQuick([{label:'🎫 Abrir un ticket',value:'open'},{label:'🔎 Consultar mi ticket',value:'lookup'}],false);
    }

    function handleChoice(value,label){
      if(value==='home'){start();return;}
      if(value==='cancel'){addMessage('✖ Cancelar solicitud','user');cancel();return;}
      if(value==='back'){addMessage('← Regresar','user');previousStep();return;}
      if(value==='restart'){start();startOpenTicket();return;}
      if(value==='open'){addMessage(label,'user');startOpenTicket();return;}
      if(value==='lookup'){addMessage(label,'user');startLookup();return;}
      if(value==='lookup_now'){addMessage(label,'user');startLookup(state.data.ticketId.slice(0,8));return;}
      addMessage(label,'user');
      if(state.step==='pais'){state.data.pais=value;nextAfterCountry();return;}
      if(state.step==='servicio'){state.data.servicio=value;nextAfterService();return;}
      if(state.step==='prioridad'){state.data.prioridad=value;createTicket();return;}
    }

    function handleText(text){
      const value=safe(text);if(!value)return;addMessage(value,'user');
      if(state.step==='menu'){addMessage('Selecciona si quieres abrir un ticket o consultar uno existente.');setQuick([{label:'🎫 Abrir un ticket',value:'open'},{label:'🔎 Consultar mi ticket',value:'lookup'}],false);return;}
      if(state.step==='ciudad'){state.data.ciudad=value;nextAfterCity();return;}
      if(state.step==='equipo'){state.data.equipo=value;nextAfterEquipo();return;}
      if(state.step==='problema'){state.data.problema=value;nextAfterProblema();return;}
      if(state.step==='nombre'){state.data.nombre=value;nextAfterNombre();return;}
      if(state.step==='contacto'){state.data.contacto=value;nextAfterContacto();return;}
      if(state.step==='lookup_ref'){state.data.referencia=value.replace(/[^a-fA-F0-9-]/g,'').slice(0,36);askLookupContact();return;}
      if(state.step==='lookup_contact'){state.data.lookupContacto=value;lookupTicket();return;}
      if(state.step==='sending'||state.step==='lookup_sending'){addMessage('Estoy terminando la operación.');return;}
      if(state.step==='done'){addMessage('Tu ticket ya fue registrado. Puedes consultarlo con su número de referencia.');return;}
      if(state.step==='lookup_done'||state.step==='lookup_error'){addMessage('Usa una de las opciones disponibles.');return;}
    }

    function openBot(){panel.hidden=false;toggle.setAttribute('aria-expanded','true');if(!messages.children.length)start();setTimeout(()=>input.focus(),50);}
    function closeBot(){panel.hidden=true;toggle.setAttribute('aria-expanded','false');}
    setRobotBrand();
    toggle.addEventListener('click',e=>{e.preventDefault();e.stopImmediatePropagation();panel.hidden?openBot():closeBot();},true);
    close.addEventListener('click',e=>{e.preventDefault();e.stopImmediatePropagation();closeBot();},true);
    quick.addEventListener('click',e=>{const b=e.target.closest('[data-ticket-value]');if(!b)return;e.preventDefault();e.stopImmediatePropagation();handleChoice(b.dataset.ticketValue,b.dataset.ticketLabel||b.textContent.trim());},true);
    form.addEventListener('submit',e=>{e.preventDefault();e.stopImmediatePropagation();const text=input.value;input.value='';handleText(text);},true);
  }
  function wait(){if(window.ITExpresSupabase)boot();else setTimeout(wait,100);}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',wait);else wait();
})();
