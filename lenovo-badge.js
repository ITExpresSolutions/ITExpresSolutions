/* ITExpresSolutions - ITSM asset/ticket integration.
   Loaded by service-prices.js on the public site. It only enhances the existing
   portal form/table; it does not replace the current ticket workflow. */
(function(){
  'use strict';
  const SUPABASE_URL='https://wfdxbgohwejawmkpninz.supabase.co';
  const SUPABASE_KEY='sb_publishable_SxcHBgFdBO4O6Aq1wQAU7A_BCJN98yb';
  let sb=window.ITExpresSupabase;
  if(!sb && window.supabase?.createClient){ sb=window.supabase.createClient(SUPABASE_URL,SUPABASE_KEY); window.ITExpresSupabase=sb; }
  if(!sb)return;

  function esc(v){return String(v??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]))}
  function addStyles(){
    if(document.getElementById('itxAssetTicketStyles'))return;
    const s=document.createElement('style');s.id='itxAssetTicketStyles';s.textContent=`
      .itx-asset-field{grid-column:span 2}
      .itx-asset-field select{width:100%;box-sizing:border-box}
      .itx-asset-meta{display:block;margin-top:5px;color:#6a7d87;font-size:12px;font-weight:500}
      .itx-asset-badge{display:inline-flex;align-items:center;gap:6px;margin-top:5px;padding:5px 8px;border-radius:999px;background:#eef8fa;color:#087f8e;font-size:11px;font-weight:800}
      .itx-ticket-asset{font-size:12px;color:#46606d;margin-top:4px}
      .itx-ticket-asset strong{color:#062f52}
      @media(max-width:760px){.itx-asset-field{grid-column:span 1}}
    `;document.head.appendChild(s)
  }

  async function loadAssetsForClient(){
    const select=document.getElementById('jobActivo');
    if(!select)return;
    const client=(document.getElementById('jobCliente')?.value||'').trim();
    const email=(document.getElementById('jobEmail')?.value||'').trim();
    select.innerHTML='<option value="">Sin activo asociado</option>';
    if(!client && !email)return;
    const filters=[];
    if(client)filters.push(`cliente_nombre.eq.${client.replace(/[,]/g,'')}`);
    if(email)filters.push(`cliente_email.eq.${email.replace(/[,]/g,'')}`);
    let query=sb.from('it_assets').select('id,cliente_nombre,cliente_email,marca,modelo,numero_serie,tipo,estado,ubicacion').order('marca',{ascending:true}).order('modelo',{ascending:true});
    if(client && email) query=query.or(`cliente_nombre.eq.${client.replace(/[,]/g,'')},cliente_email.eq.${email.replace(/[,]/g,'')}`);
    else if(client) query=query.eq('cliente_nombre',client);
    else query=query.eq('cliente_email',email);
    const {data,error}=await query.limit(100);
    if(error){console.warn('ITSM activos:',error.message);return}
    (data||[]).forEach(a=>{
      const opt=document.createElement('option');opt.value=a.id;
      const name=[a.marca,a.modelo].filter(Boolean).join(' ');
      opt.textContent=(name||a.tipo||'Equipo')+(a.numero_serie?' · SN '+a.numero_serie:'');
      opt.dataset.meta=[a.tipo,a.estado,a.ubicacion].filter(Boolean).join(' · ');
      select.appendChild(opt);
    });
  }

  async function loadAllAssets(){
    const select=document.getElementById('jobActivo');
    if(!select)return;
    const {data,error}=await sb.from('it_assets').select('id,cliente_nombre,cliente_email,marca,modelo,numero_serie,tipo,estado,ubicacion').order('cliente_nombre',{ascending:true}).order('marca',{ascending:true}).limit(200);
    if(error){console.warn('ITSM activos:',error.message);return}
    select.innerHTML='<option value="">Sin activo asociado</option>'+(data||[]).map(a=>`<option value="${esc(a.id)}">${esc([a.cliente_nombre,a.marca,a.modelo,a.numero_serie?'SN '+a.numero_serie:''].filter(Boolean).join(' · '))}</option>`).join('');
  }

  function enhanceTicketForm(){
    const form=document.getElementById('jobForm');
    const priority=document.getElementById('jobPrioridad');
    if(!form||!priority||document.getElementById('jobActivo'))return;
    const label=document.createElement('label');label.className='itx-asset-field';label.innerHTML='Activo / equipo relacionado<select id="jobActivo" aria-label="Activo o equipo relacionado"><option value="">Sin activo asociado</option></select><span class="itx-asset-meta">Opcional. Relaciona el ticket con un equipo registrado en el inventario.</span></label>';
    priority.closest('label')?.insertAdjacentElement('afterend',label);
    const client=document.getElementById('jobCliente'),email=document.getElementById('jobEmail');
    [client,email].forEach(el=>el?.addEventListener('change',loadAssetsForClient));
    [client,email].forEach(el=>el?.addEventListener('blur',loadAssetsForClient));
    loadAssetsForClient();
  }

  function enhanceAdminRows(){
    const body=document.getElementById('adminJobsBody');
    if(!body)return;
    body.querySelectorAll('tr').forEach(async row=>{
      if(row.dataset.itxAssetDone==='1')return;
      const tech=row.querySelector('.job-tech-select');if(!tech)return;
      const id=tech.dataset.jobId;if(!id)return;
      row.dataset.itxAssetDone='1';
      const {data,error}=await sb.from('trabajos').select('activo_id').eq('id',id).maybeSingle();
      if(error||!data?.activo_id)return;
      const {data:asset}=await sb.from('it_assets').select('marca,modelo,numero_serie,tipo').eq('id',data.activo_id).maybeSingle();
      if(!asset)return;
      const cell=row.querySelector('td:first-child');if(!cell)return;
      const div=document.createElement('div');div.className='itx-ticket-asset';div.innerHTML='💻 <strong>Activo:</strong> '+esc([asset.marca,asset.modelo,asset.numero_serie?'SN '+asset.numero_serie:''].filter(Boolean).join(' · '));cell.appendChild(div);
    });
  }

  function enhanceTechRows(){
    const body=document.getElementById('techJobsBody');
    if(!body)return;
    body.querySelectorAll('tr').forEach(async row=>{
      if(row.dataset.itxAssetDone==='1')return;
      const sel=row.querySelector('.job-status-select');if(!sel)return;
      const id=sel.dataset.jobId;if(!id)return;row.dataset.itxAssetDone='1';
      const {data}=await sb.from('trabajos').select('activo_id').eq('id',id).maybeSingle();
      if(!data?.activo_id)return;
      const {data:asset}=await sb.from('it_assets').select('marca,modelo,numero_serie,tipo').eq('id',data.activo_id).maybeSingle();
      if(!asset)return;
      const cell=row.querySelector('td:first-child');if(!cell)return;
      const div=document.createElement('div');div.className='itx-ticket-asset';div.textContent='💻 Activo: '+[asset.marca,asset.modelo,asset.numero_serie?'SN '+asset.numero_serie:''].filter(Boolean).join(' · ');cell.appendChild(div);
    });
  }

  function interceptJobSubmit(){
    const form=document.getElementById('jobForm');if(!form||form.dataset.itxAssetSubmit==='1')return;
    form.dataset.itxAssetSubmit='1';
    form.addEventListener('submit',async function(){
      const select=document.getElementById('jobActivo');
      if(!select?.value)return;
      const existing=form.__itxOriginalSubmit;
      if(existing)return;
      // The native portal handler reads the form and inserts its own payload.
      // Capture the active asset after the insert and attach it to the newest matching ticket.
      const title=(document.getElementById('jobTitulo')?.value||'').trim();
      const email=(document.getElementById('jobEmail')?.value||'').trim();
      const assetId=select.value;
      setTimeout(async()=>{
        let q=sb.from('trabajos').select('id,creado_at').eq('titulo',title).order('creado_at',{ascending:false}).limit(1);
        if(email)q=q.eq('cliente_email',email);
        const {data}=await q;
        const job=data?.[0];
        if(job)await sb.from('trabajos').update({activo_id:assetId,actualizado_at:new Date().toISOString()}).eq('id',job.id);
      },900);
    },true);
  }

  function boot(){
    addStyles();
    enhanceTicketForm();
    interceptJobSubmit();
    enhanceAdminRows();
    enhanceTechRows();
  }
  const observer=new MutationObserver(boot);observer.observe(document.documentElement,{childList:true,subtree:true});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
  setTimeout(boot,500);setTimeout(boot,1500);setTimeout(boot,3000);
})();
