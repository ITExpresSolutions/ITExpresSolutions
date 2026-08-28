/* ITExpresSolutions - Lenovo service badge. Uses the logo supplied by the site owner. */
(function(){
  'use strict';
  const LOGO='https://p2-ofp.static.pub/ShareResource/about/whoweare/LenovoLogo-POS-Red.9884167629b8dc3e.png';
  function install(){
    if(document.getElementById('itxLenovoBadge')) return;
    const footer=document.querySelector('footer');
    if(!footer) return;
    const wrap=document.createElement('div');
    wrap.id='itxLenovoBadge';
    wrap.innerHTML=`<div class="itx-lenovo-badge"><img src="${LOGO}" alt="Lenovo"><div><strong>Servicios de mantenimiento para equipos Lenovo</strong><span>Proveedor registrado en Lenovo Empresas</span></div></div><small class="itx-lenovo-attribution">Lenovo y el logotipo de Lenovo son marcas de Lenovo.</small>`;
    footer.appendChild(wrap);
    const style=document.createElement('style');
    style.id='itxLenovoBadgeStyles';
    style.textContent=`#itxLenovoBadge{margin:22px auto 0;text-align:center}.itx-lenovo-badge{display:flex;align-items:center;justify-content:center;gap:16px;max-width:760px;margin:0 auto;padding:18px 22px;border:1px solid #dcebf0;border-radius:18px;background:#fff;box-shadow:0 8px 24px rgba(6,47,82,.07)}.itx-lenovo-badge img{width:112px;height:auto;display:block;flex:0 0 auto}.itx-lenovo-badge strong{display:block;color:#062f52;font-size:15px;line-height:1.35}.itx-lenovo-badge span{display:block;margin-top:4px;color:#617785;font-size:12px}.itx-lenovo-attribution{display:block;margin:8px 0 0;color:#81919a;font-size:10px}@media(max-width:600px){.itx-lenovo-badge{flex-direction:column;gap:10px;padding:16px}.itx-lenovo-badge img{width:100px}.itx-lenovo-badge strong{font-size:14px}}`;
    document.head.appendChild(style);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install);else install();
  new MutationObserver(install).observe(document.documentElement,{childList:true,subtree:true});
})();