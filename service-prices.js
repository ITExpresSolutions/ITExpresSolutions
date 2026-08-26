/* ITExpresSolutions - unified service pricing modal.
   This file is the single source of truth for service-price popups.
   It intentionally removes/intercepts the legacy inline price modal so two dialogs
   can never be displayed at the same time. */
(function () {
  'use strict';

  const DATA = {
    es: {
      eyebrow: 'PRECIO APROXIMADO',
      subtitle: 'El precio mostrado es aproximado y puede variar según el alcance, equipo, ubicación, materiales o necesidades específicas.',
      mxLabel: 'Mx México',
      crLabel: 'CR Costa Rica',
      note: 'El precio final depende del diagnóstico y alcance. Piezas, licencias, dominios, hosting y servicios de terceros se cotizan por separado cuando corresponda.',
      close: 'Cerrar',
      request: 'Solicitar este servicio',
      services: {
        'Computadoras': { mx: 'Desde $500 MXN', cr: 'Desde ₡25,000 CRC', desc: 'Diagnóstico, reparación, mantenimiento, instalación y optimización de Windows y equipos.' },
        'Virus y seguridad': { mx: 'Desde $600 MXN', cr: 'Desde ₡30,000 CRC', desc: 'Detección de malware, limpieza, configuración de seguridad y recomendaciones para proteger tus equipos.' },
        'Redes e Internet': { mx: 'Desde $700 MXN', cr: 'Desde ₡35,000 CRC', desc: 'Configuración de Wi‑Fi, routers y redes domésticas o pequeñas oficinas, además de solución de problemas de conexión.' },
        'Impresoras': { mx: 'Desde $450 MXN', cr: 'Desde ₡22,000 CRC', desc: 'Instalación, configuración, controladores y solución de problemas de impresión.' },
        'Celulares y dispositivos': { mx: 'Desde $400 MXN', cr: 'Desde ₡20,000 CRC', desc: 'Configuración de cuentas, aplicaciones, conectividad y asistencia técnica para celulares y dispositivos.' },
        'Soporte para negocios': { mx: 'Desde $700 MXN / hora', cr: 'Desde ₡35,000 CRC / hora', desc: 'Soporte para equipos, usuarios, redes y operación tecnológica de pequeñas empresas.' },
        'Gestión de redes sociales': { mx: 'Desde $3,500 MXN / mes', cr: 'Desde ₡55,000 CRC / mes', desc: 'Gestión básica de perfiles, publicaciones y orientación. Publicidad pagada no incluida.' },
        'Páginas web': { mx: 'Desde $6,000 MXN', cr: 'Desde ₡90,000 CRC', desc: 'Sitios informativos o de servicios para pequeños negocios. Funciones avanzadas se cotizan aparte.' },
        'Presencia digital': { mx: 'Desde $2,500 MXN', cr: 'Desde ₡40,000 CRC', desc: 'Configuración y organización de información, perfiles empresariales, enlaces y orientación digital.' },
        'Tienda en línea': { mx: 'Desde $18,000 MXN', cr: 'Desde ₡300,000 CRC', desc: 'E-commerce básico con catálogo y funciones esenciales. Pagos, envíos e integraciones avanzadas pueden aumentar el precio.' }
      }
    },
    en: {
      eyebrow: 'APPROXIMATE PRICE',
      subtitle: 'The displayed price is approximate and may vary according to scope, equipment, location, materials or specific needs.',
      mxLabel: 'Mx Mexico',
      crLabel: 'CR Costa Rica',
      note: 'Final pricing depends on diagnosis and scope. Parts, licenses, domains, hosting and third-party services are quoted separately when applicable.',
      close: 'Close',
      request: 'Request this service',
      services: {
        'Computadoras': { mx: 'From $500 MXN', cr: 'From ₡25,000 CRC', desc: 'Diagnostics, repair, maintenance, installation and optimization of Windows and equipment.' },
        'Virus y seguridad': { mx: 'From $600 MXN', cr: 'From ₡30,000 CRC', desc: 'Malware detection and cleanup, security configuration and recommendations.' },
        'Redes e Internet': { mx: 'From $700 MXN', cr: 'From ₡35,000 CRC', desc: 'Wi‑Fi, router and home or small-office network setup and connectivity troubleshooting.' },
        'Impresoras': { mx: 'From $450 MXN', cr: 'From ₡22,000 CRC', desc: 'Installation, configuration, drivers and printing troubleshooting.' },
        'Celulares y dispositivos': { mx: 'From $400 MXN', cr: 'From ₡20,000 CRC', desc: 'Account, application and connectivity setup and general device assistance.' },
        'Soporte para negocios': { mx: 'From $700 MXN / hour', cr: 'From ₡35,000 CRC / hour', desc: 'Support for equipment, users, networks and technology operations for small businesses.' },
        'Gestión de redes sociales': { mx: 'From $3,500 MXN / month', cr: 'From ₡55,000 CRC / month', desc: 'Basic profile management, posting and guidance. Paid advertising is not included.' },
        'Páginas web': { mx: 'From $6,000 MXN', cr: 'From ₡90,000 CRC', desc: 'Informational or service websites for small businesses. Advanced features are quoted separately.' },
        'Presencia digital': { mx: 'From $2,500 MXN', cr: 'From ₡40,000 CRC', desc: 'Business information setup, profiles, links and basic digital guidance.' },
        'Tienda en línea': { mx: 'From $18,000 MXN', cr: 'From ₡300,000 CRC', desc: 'Basic e-commerce with catalog and essential features. Payments, shipping and advanced integrations may increase the price.' }
      }
    }
  };

  const aliases = {
    'Social media management': 'Gestión de redes sociales',
    'Websites': 'Páginas web',
    'Digital presence': 'Presencia digital',
    'Online store': 'Tienda en línea',
    'Business support': 'Soporte para negocios'
  };

  function currentLang() {
    return localStorage.getItem('itexpress-language') === 'en' ? 'en' : 'es';
  }

  function removeLegacyModals() {
    const selectors = [
      '.service-price-modal',
      '#servicePriceModal',
      '#service-price-modal',
      '[data-service-price-modal]'
    ];
    document.querySelectorAll(selectors.join(',')).forEach((node) => node.remove());
  }

  function installStyles() {
    if (document.getElementById('itxUnifiedPriceStyles')) return;
    const style = document.createElement('style');
    style.id = 'itxUnifiedPriceStyles';
    style.textContent = `
      .itx-price-modal{position:fixed;inset:0;z-index:10050;background:rgba(3,28,48,.62);display:flex;align-items:center;justify-content:center;padding:20px;backdrop-filter:blur(4px)}
      .itx-price-modal[hidden]{display:none!important}
      .itx-price-box{position:relative;width:min(560px,100%);max-height:calc(100vh - 40px);overflow:auto;background:#fff;border-radius:24px;box-shadow:0 24px 70px rgba(0,0,0,.28)}
      .itx-price-body{padding:30px}
      .itx-price-eyebrow{margin:0 0 10px;color:#087f8e;font-size:12px;font-weight:900;letter-spacing:2px}
      .itx-price-title{margin:0 0 12px;color:#062f52;font-size:25px;line-height:1.2}
      .itx-price-sub{margin:0 0 20px;color:#526875;font-size:15px;line-height:1.65}
      .itx-price-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin:18px 0}
      .itx-price-country{padding:15px;border:1px solid #dcebf0;border-radius:15px;background:#f8fcfd}
      .itx-price-country span{display:block;color:#617785;font-size:12px;margin-bottom:5px}
      .itx-price-country b{display:block;color:#062f52;font-size:18px;line-height:1.3}
      .itx-price-desc{margin:18px 0 0;color:#405864;font-size:14px;line-height:1.65}
      .itx-price-note{margin-top:16px;padding:12px 13px;border-radius:12px;background:#f1f6f7;color:#6b7d85;font-size:11px;line-height:1.5}
      .itx-price-close{position:absolute;right:18px;top:14px;border:0;background:transparent;color:#456;font-size:31px;line-height:1;cursor:pointer;padding:4px}
      .itx-price-request{display:inline-flex;margin-top:18px;text-decoration:none}
      .itx-price-hint{display:block;margin-top:10px;font-size:12px;font-weight:800;color:#087f8e}
      @media(max-width:600px){.itx-price-modal{padding:12px}.itx-price-box{max-height:calc(100vh - 24px)}.itx-price-body{padding:24px 20px}.itx-price-grid{grid-template-columns:1fr}.itx-price-title{font-size:22px}}
    `;
    document.head.appendChild(style);
  }

  function getServiceKey(card) {
    const heading = card.querySelector('h3,h2,strong');
    let key = heading ? heading.textContent.trim() : '';
    if (aliases[key]) key = aliases[key];
    return key;
  }

  function getItem(card, key, lang) {
    const fallback = DATA[lang].services[key];
    if (!fallback) return null;
    const mx = card.dataset.mx || fallback.mx;
    const cr = card.dataset.cr || fallback.cr;
    const desc = card.dataset.details || fallback.desc;
    return { mx, cr, desc };
  }

  function closeModal() {
    const modal = document.getElementById('itxPriceModal');
    if (modal) modal.remove();
    document.body.classList.remove('itx-price-open');
  }

  function openModal(card) {
    removeLegacyModals();
    const lang = currentLang();
    const key = getServiceKey(card);
    const item = getItem(card, key, lang);
    if (!item) return;

    closeModal();
    const d = DATA[lang];
    const modal = document.createElement('div');
    modal.id = 'itxPriceModal';
    modal.className = 'itx-price-modal';
    modal.innerHTML = `
      <div class="itx-price-box" role="dialog" aria-modal="true" aria-labelledby="itxPriceTitle">
        <button class="itx-price-close" type="button" aria-label="${d.close}">×</button>
        <div class="itx-price-body">
          <p class="itx-price-eyebrow">${d.eyebrow}</p>
          <h2 class="itx-price-title" id="itxPriceTitle">${key}</h2>
          <p class="itx-price-sub">${item.desc}</p>
          <div class="itx-price-grid">
            <div class="itx-price-country"><span>${d.mxLabel}</span><b>${item.mx}</b></div>
            <div class="itx-price-country"><span>${d.crLabel}</span><b>${item.cr}</b></div>
          </div>
          <p class="itx-price-note">${d.note}</p>
          <a class="btn itx-price-request" href="#contacto" data-page="contacto">🎫 ${d.request}</a>
        </div>
      </div>`;

    modal.addEventListener('click', (event) => {
      if (event.target === modal || event.target.closest('.itx-price-close')) {
        closeModal();
      }
    });

    const request = modal.querySelector('.itx-price-request');
    request.addEventListener('click', () => {
      closeModal();
      setTimeout(() => {
        const bot = document.getElementById('serviceBotToggle');
        if (bot) bot.click();
      }, 80);
    });

    document.body.appendChild(modal);
    document.body.classList.add('itx-price-open');
    modal.querySelector('.itx-price-close').focus();
  }

  function isPriceCard(target) {
    const card = target.closest && target.closest('#servicios .service-cards .card, #pymes .card');
    if (!card) return null;
    const key = getServiceKey(card);
    if (!DATA.es.services[key]) return null;
    return card;
  }

  function interceptLegacyHandlers() {
    document.addEventListener('click', (event) => {
      const card = isPriceCard(event.target);
      if (!card) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      openModal(card);
    }, true);

    document.addEventListener('keydown', (event) => {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      const card = isPriceCard(event.target);
      if (!card) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      openModal(card);
    }, true);

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') closeModal();
    });
  }

  function addHints() {
    document.querySelectorAll('#servicios .service-cards .card,#pymes .card').forEach((card) => {
      const key = getServiceKey(card);
      if (!DATA.es.services[key] || card.dataset.itxPriceHint) return;
      card.dataset.itxPriceHint = '1';
      const hint = document.createElement('span');
      hint.className = 'itx-price-hint';
      hint.textContent = currentLang() === 'en' ? 'Click for approximate pricing' : 'Haz clic para ver precio aproximado';
      card.appendChild(hint);
    });
  }

  function boot() {
    installStyles();
    removeLegacyModals();
    interceptLegacyHandlers();
    addHints();
    setTimeout(addHints, 500);
    setTimeout(addHints, 1500);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();

  window.ITXPriceModal = { open: openModal, close: closeModal };
})();
