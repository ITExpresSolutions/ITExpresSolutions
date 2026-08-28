/* ITExpresSolutions - administrator second authentication + idle session control. */
(function () {
  'use strict';

  const IDLE_FOR_MS = 15 * 60 * 1000;
  const VERIFIED_KEY = 'itx_admin_2fa_verified_session';
  let gateShown = false;
  let idleTimer = null;
  let activityBound = false;
  let resendTimer = null;
  let resendUntil = 0;

  const sb = () => window.ITExpresSupabase;
  const auth = () => sb()?.auth;
  const $ = id => document.getElementById(id);

  function isVerified(userId) {
    if (!userId) return false;
    try {
      return sessionStorage.getItem(VERIFIED_KEY) === userId;
    } catch (_) {
      return false;
    }
  }

  function clearVerification() {
    try { sessionStorage.removeItem(VERIFIED_KEY); } catch (_) {}
  }

  function markVerified(userId) {
    try { sessionStorage.setItem(VERIFIED_KEY, userId); } catch (_) {}
    startIdleLogout();
  }

  async function logoutForInactivity() {
    clearTimeout(idleTimer);
    clearVerification();
    try { await auth()?.signOut({ scope: 'local' }); } catch (_) {}
    location.href = '/';
  }

  function resetIdleTimer() {
    if (!isAdminPanelVisible()) return;
    clearTimeout(idleTimer);
    idleTimer = setTimeout(logoutForInactivity, IDLE_FOR_MS);
  }

  function startIdleLogout() {
    if (!activityBound) {
      activityBound = true;
      ['click', 'keydown', 'mousemove', 'mousedown', 'touchstart', 'scroll'].forEach(eventName => {
        document.addEventListener(eventName, resetIdleTimer, { passive: true });
      });
      document.addEventListener('visibilitychange', () => {
        if (!document.hidden) resetIdleTimer();
      });
    }
    resetIdleTimer();
  }

  function isAdminPanelVisible() {
    const panel = $('adminPanel');
    return !!panel && !panel.hidden;
  }

  async function getAdminUser() {
    const a = auth();
    if (!a) return null;
    const { data: { session }, error: sessionError } = await a.getSession();
    if (sessionError || !session?.user) return null;
    const { data: profile, error } = await sb().from('public_profiles').select('rol,activo').eq('id', session.user.id).single();
    if (error || !profile || profile.rol !== 'admin' || !profile.activo) return null;
    return session.user;
  }

  function installStyles() {
    if ($('itxAdmin2FAStyles')) return;
    const style = document.createElement('style');
    style.id = 'itxAdmin2FAStyles';
    style.textContent = `
      #itxAdmin2FAOverlay{position:fixed;inset:0;z-index:30000;display:grid;place-items:center;padding:20px;background:rgba(3,25,43,.76);backdrop-filter:blur(7px)}
      #itxAdmin2FACard{width:min(470px,100%);background:#fff;border-radius:24px;padding:28px;box-shadow:0 28px 80px rgba(0,0,0,.34);font-family:inherit;color:#173042}
      #itxAdmin2FACard h2{margin:0 0 8px;color:#062f52;font-size:25px}
      #itxAdmin2FACard p{color:#526875;line-height:1.55;margin:8px 0}
      #itxAdmin2FAEmail{font-weight:800;color:#087f8e;word-break:break-word}
      #itxAdmin2FACard label{display:block;margin:18px 0 7px;font-weight:800;color:#173042}
      #itxAdmin2FACode{width:100%;box-sizing:border-box;border:1px solid #cfe0e6;border-radius:12px;padding:14px;text-align:center;letter-spacing:7px;font-size:24px;font-weight:900;color:#062f52}
      #itxAdmin2FAActions{display:flex;gap:10px;flex-wrap:wrap;margin-top:18px}
      #itxAdmin2FAActions button{flex:1 1 190px;border:0;border-radius:12px;padding:13px 15px;background:#087f8e;color:#fff;font-weight:800;cursor:pointer}
      #itxAdmin2FAActions button.secondary{background:#eef6f8;color:#062f52}
      #itxAdmin2FAActions button:disabled{opacity:.6;cursor:wait}
      #itxAdmin2FAMessage{min-height:24px;margin-top:14px;font-size:14px;font-weight:700}
      #itxAdmin2FAMessage.error{color:#b42318}#itxAdmin2FAMessage.success{color:#087f62}
      #itxAdmin2FAStatus{margin-top:14px;padding:10px 12px;border-radius:10px;background:#f3f8fa;color:#526875;font-size:13px}
    `;
    document.head.appendChild(style);
  }

  function setMessage(text, type='') {
    const el = $('itxAdmin2FAMessage');
    if (!el) return;
    el.textContent = text;
    el.className = type;
  }

  function startResendCountdown(seconds) {
    clearInterval(resendTimer);
    resendUntil = Date.now() + Math.max(1, Number(seconds || 60)) * 1000;
    const send = $('itxAdmin2FASend');
    const tick = () => {
      const remaining = Math.max(0, Math.ceil((resendUntil - Date.now()) / 1000));
      if (!send) return;
      if (remaining > 0) {
        send.disabled = true;
        send.textContent = `📧 Reenviar código (${remaining}s)`;
      } else {
        send.disabled = false;
        send.textContent = '📧 Enviar código';
        clearInterval(resendTimer);
      }
    };
    tick();
    resendTimer = setInterval(tick, 1000);
  }

  function render(user) {
    if ($('itxAdmin2FAOverlay')) return;
    installStyles();
    const overlay = document.createElement('div');
    overlay.id = 'itxAdmin2FAOverlay';
    overlay.innerHTML = `
      <section id="itxAdmin2FACard" role="dialog" aria-modal="true" aria-labelledby="itxAdmin2FATitle">
        <h2 id="itxAdmin2FATitle">🔐 Verificación de seguridad</h2>
        <p>Tu contraseña ya fue validada. Antes de abrir el panel de administración necesitamos una segunda autenticación.</p>
        <p>Enviaremos un <strong>código de 6 dígitos</strong> al correo:</p>
        <p id="itxAdmin2FAEmail"></p>
        <form id="itxAdmin2FAForm" autocomplete="off">
          <label for="itxAdmin2FACode">Código de verificación</label>
          <input id="itxAdmin2FACode" inputmode="numeric" autocomplete="one-time-code" maxlength="6" pattern="[0-9]{6}" placeholder="000000" aria-label="Código de 6 dígitos">
          <div id="itxAdmin2FAActions">
            <button id="itxAdmin2FASend" type="button">📧 Enviar código</button>
            <button id="itxAdmin2FAVerify" type="submit" class="secondary">✓ Verificar</button>
          </div>
          <div id="itxAdmin2FAMessage" aria-live="polite"></div>
          <div id="itxAdmin2FAStatus">El panel permanecerá bloqueado hasta completar la verificación.</div>
        </form>
      </section>`;
    document.body.appendChild(overlay);
    $('itxAdmin2FAEmail').textContent = user?.email || 'tu correo de administrador';

    const send = $('itxAdmin2FASend');
    const verify = $('itxAdmin2FAVerify');
    const code = $('itxAdmin2FACode');
    const form = $('itxAdmin2FAForm');

    async function sendCode() {
      const currentUser = await getAdminUser();
      if (!currentUser) { setMessage('La sesión de administrador no es válida. Inicia sesión nuevamente.', 'error'); return; }
      if (Date.now() < resendUntil) return;
      send.disabled = true;
      setMessage('Enviando el código de seguridad…');
      try {
        const { data, error } = await sb().functions.invoke('admin-2fa', { body: { action: 'send' } });
        if (error) {
          let detail = error.message || 'No se pudo enviar el código.';
          try {
            if (error.context) {
              const body = await error.context.json();
              if (body?.error === 'rate_limited') detail = `Por seguridad, espera ${body.wait_seconds}s antes de solicitar otro código.`;
              else if (body?.error) detail = body.error;
            }
          } catch (_) {}
          throw new Error(detail);
        }
        if (!data?.ok) throw new Error(data?.error || 'No se pudo enviar el código.');
        setMessage('Código enviado. Revisa tu correo y escribe los 6 dígitos.', 'success');
        startResendCountdown(60);
        code.focus();
      } catch (error) {
        setMessage(error?.message || 'No se pudo enviar el código. Intenta nuevamente.', 'error');
        send.disabled = false;
      }
    }

    async function verifyCode(event) {
      event.preventDefault();
      const token = code.value.replace(/\D/g, '');
      if (token.length !== 6) { setMessage('Escribe el código completo de 6 dígitos.', 'error'); return; }
      const currentUser = await getAdminUser();
      if (!currentUser?.email) { setMessage('La sesión de administrador no es válida. Inicia sesión nuevamente.', 'error'); return; }
      verify.disabled = true;
      send.disabled = true;
      setMessage('Verificando código…');
      try {
        const { data, error } = await sb().functions.invoke('admin-2fa', { body: { action: 'verify', code: token } });
        if (error) {
          let detail = error.message || 'Código incorrecto o expirado.';
          try {
            if (error.context) {
              const body = await error.context.json();
              if (body?.error) detail = body.error;
            }
          } catch (_) {}
          throw new Error(detail);
        }
        if (!data?.ok) throw new Error(data?.error || 'Código incorrecto o expirado.');
        markVerified(currentUser.id);
        setMessage('✓ Verificación completada. Abriendo el panel…', 'success');
        setTimeout(() => {
          gateShown = false;
          clearInterval(resendTimer);
          overlay.remove();
          revealAdminPanel();
          startIdleLogout();
        }, 450);
      } catch (error) {
        setMessage(error?.message || 'Código incorrecto o expirado.', 'error');
        verify.disabled = false;
        if (Date.now() >= resendUntil) send.disabled = false;
        code.select();
      }
    }

    send.addEventListener('click', sendCode);
    form.addEventListener('submit', verifyCode);
    code.addEventListener('input', () => { code.value = code.value.replace(/\D/g, '').slice(0, 6); });
    sendCode();
  }

  function revealAdminPanel() {
    const panel = $('adminPanel');
    if (panel) panel.hidden = false;
  }

  async function protectAdminPanel() {
    const panel = $('adminPanel');
    if (!panel || panel.hidden || $('itxAdmin2FAOverlay')) return;
    const user = await getAdminUser();
    if (!user) return;

    if (isVerified(user.id)) {
      startIdleLogout();
      return;
    }

    panel.hidden = true;
    if (!gateShown) {
      gateShown = true;
      render(user);
    }
  }

  function startObserver() {
    const run = () => { protectAdminPanel().catch(() => {}); };
    run();
    const observer = new MutationObserver(run);
    observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['hidden'] });
    setInterval(run, 3000);
  }

  auth()?.onAuthStateChange((event) => {
    if (event === 'SIGNED_OUT') {
      clearVerification();
      clearTimeout(idleTimer);
    }
  });

  function boot() {
    startObserver();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
