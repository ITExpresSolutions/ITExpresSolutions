/* ITExpresSolutions - Supabase password recovery UI.
   Handles both Supabase recovery URL formats: PKCE (?code=...) and implicit (#access_token=...&refresh_token=...&type=recovery).
*/
(function () {
  'use strict';
  const RECOVERY_PARAM = 'recovery';
  let recoverySessionReady = false;
  const auth = () => window.ITExpresSupabase && window.ITExpresSupabase.auth;
  const getUrl = () => new URL(window.location.href);
  const isRecoveryRoute = () => {
    const u = getUrl();
    const h = u.hash || '';
    return u.searchParams.get(RECOVERY_PARAM) === '1' || u.searchParams.has('code') || h.includes('type=recovery') || h.includes('access_token=');
  };

  function installStyles() {
    if (document.getElementById('itxRecoveryStyles')) return;
    const style = document.createElement('style');
    style.id = 'itxRecoveryStyles';
    style.textContent = `
      #itxRecoveryOverlay{position:fixed;inset:0;z-index:20000;display:grid;place-items:center;padding:20px;background:rgba(3,25,43,.72);backdrop-filter:blur(6px)}
      #itxRecoveryCard{width:min(460px,100%);background:#fff;border-radius:24px;padding:30px;box-shadow:0 24px 70px rgba(0,0,0,.3);font-family:inherit}
      #itxRecoveryCard h2{margin:0 0 8px;color:#062f52;font-size:26px}
      #itxRecoveryCard p{color:#526875;line-height:1.55}
      #itxRecoveryCard label{display:block;margin:16px 0 7px;color:#173042;font-weight:700}
      #itxRecoveryCard input{width:100%;box-sizing:border-box;border:1px solid #cfe0e6;border-radius:12px;padding:12px 13px;font:inherit}
      #itxRecoveryCard button{width:100%;margin-top:18px;border:0;border-radius:12px;padding:13px 16px;background:#087f8e;color:#fff;font-weight:800;cursor:pointer}
      #itxRecoveryCard button:disabled{opacity:.6;cursor:wait}
      #itxRecoveryMessage{min-height:24px;margin-top:14px;font-size:14px}
      #itxRecoveryMessage.error{color:#b42318} #itxRecoveryMessage.success{color:#087f8e}
    `;
    document.head.appendChild(style);
  }

  function render(initialMessage='', initialType='') {
    if (document.getElementById('itxRecoveryOverlay')) return;
    installStyles();
    const overlay = document.createElement('div');
    overlay.id = 'itxRecoveryOverlay';
    overlay.innerHTML = `
      <section id="itxRecoveryCard" role="dialog" aria-modal="true" aria-labelledby="itxRecoveryTitle">
        <h2 id="itxRecoveryTitle">Restablecer contraseña</h2>
        <p>Escribe una nueva contraseña para recuperar el acceso a tu cuenta de ITExpresSolutions.</p>
        <form id="itxRecoveryForm">
          <label for="itxRecoveryPassword">Nueva contraseña</label>
          <input id="itxRecoveryPassword" type="password" minlength="8" autocomplete="new-password" required placeholder="Mínimo 8 caracteres">
          <label for="itxRecoveryConfirm">Confirmar contraseña</label>
          <input id="itxRecoveryConfirm" type="password" minlength="8" autocomplete="new-password" required placeholder="Repite la contraseña">
          <button id="itxRecoverySubmit" type="submit">Cambiar contraseña</button>
          <div id="itxRecoveryMessage" aria-live="polite"></div>
        </form>
      </section>`;
    document.body.appendChild(overlay);
    const form = document.getElementById('itxRecoveryForm');
    const message = document.getElementById('itxRecoveryMessage');
    const submit = document.getElementById('itxRecoverySubmit');
    if (initialMessage) { message.textContent = initialMessage; message.className = initialType; }

    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      const password = document.getElementById('itxRecoveryPassword').value;
      const confirm = document.getElementById('itxRecoveryConfirm').value;
      message.className = '';
      if (password.length < 8) { message.textContent = 'La contraseña debe tener al menos 8 caracteres.'; message.className = 'error'; return; }
      if (password !== confirm) { message.textContent = 'Las contraseñas no coinciden.'; message.className = 'error'; return; }
      if (!auth() || !recoverySessionReady) { message.textContent = 'La sesión de recuperación no está lista. Abre nuevamente el enlace recibido por correo.'; message.className = 'error'; return; }
      submit.disabled = true;
      submit.textContent = 'Guardando…';
      try {
        const { data: { session } } = await auth().getSession();
        if (!session) throw new Error('La sesión de recuperación expiró. Solicita un nuevo enlace.');
        const { error } = await auth().updateUser({ password });
        if (error) throw error;
        message.textContent = 'Contraseña actualizada correctamente. Ya puedes iniciar sesión.';
        message.className = 'success';
        setTimeout(async () => {
          const clean = getUrl();
          clean.searchParams.delete(RECOVERY_PARAM);
          clean.searchParams.delete('code');
          clean.hash = '';
          try { await auth().signOut(); } catch (_) {}
          window.history.replaceState({}, '', clean.pathname + clean.search);
          overlay.remove();
          window.location.hash = '#portal';
        }, 1200);
      } catch (error) {
        message.textContent = error?.message || 'No se pudo actualizar la contraseña.';
        message.className = 'error';
        submit.disabled = false;
        submit.textContent = 'Cambiar contraseña';
      }
    });
  }

  async function establishRecoverySession() {
    const a = auth();
    if (!a) return { ok: false, pending: true };
    try {
      const { data: { session } } = await a.getSession();
      if (session) { recoverySessionReady = true; return { ok: true }; }
    } catch (_) {}
    const u = getUrl();
    const code = u.searchParams.get('code');
    if (code) {
      const { error } = await a.exchangeCodeForSession(code);
      if (error) return { ok: false, error };
      recoverySessionReady = true;
      return { ok: true };
    }
    const hashParams = new URLSearchParams((u.hash || '').replace(/^#/, ''));
    const accessToken = hashParams.get('access_token');
    const refreshToken = hashParams.get('refresh_token');
    if (accessToken && refreshToken) {
      const { error } = await a.setSession({ access_token: accessToken, refresh_token: refreshToken });
      if (error) return { ok: false, error };
      recoverySessionReady = true;
      return { ok: true };
    }
    return { ok: false, error: new Error('No se encontró una sesión de recuperación válida.') };
  }

  async function boot() {
    if (!isRecoveryRoute()) return;
    let ready = false;
    for (let i = 0; i < 30; i++) {
      if (auth()) { ready = true; break; }
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    if (!ready) { render('El servicio de autenticación todavía no está listo. Recarga la página.', 'error'); return; }
    const result = await establishRecoverySession();
    if (result.ok) render();
    else render(result.error?.message || 'No se pudo establecer la sesión de recuperación. Solicita un nuevo enlace.', 'error');
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
