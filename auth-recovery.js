/* ITExpresSolutions - Supabase password recovery UI.
   The email request is handled by Supabase Auth; this file handles the
   PASSWORD_RECOVERY session after the user clicks the email link. */
(function () {
  'use strict';

  const RECOVERY_PARAM = 'recovery';
  const sbReady = () => window.ITExpresSupabase && window.ITExpresSupabase.auth;

  function isRecoveryRoute() {
    const url = new URL(window.location.href);
    return url.searchParams.get(RECOVERY_PARAM) === '1' ||
      url.hash.includes('type=recovery') ||
      url.hash.includes('access_token=');
  }

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

  function render() {
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
    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      const password = document.getElementById('itxRecoveryPassword').value;
      const confirm = document.getElementById('itxRecoveryConfirm').value;
      message.className = '';
      if (password.length < 8) { message.textContent = 'La contraseña debe tener al menos 8 caracteres.'; message.className = 'error'; return; }
      if (password !== confirm) { message.textContent = 'Las contraseñas no coinciden.'; message.className = 'error'; return; }
      if (!sbReady()) { message.textContent = 'El servicio de autenticación todavía no está listo. Recarga la página e inténtalo de nuevo.'; message.className = 'error'; return; }
      submit.disabled = true;
      submit.textContent = 'Guardando…';
      const { error } = await window.ITExpresSupabase.auth.updateUser({ password });
      if (error) {
        message.textContent = error.message || 'No se pudo actualizar la contraseña.';
        message.className = 'error';
        submit.disabled = false;
        submit.textContent = 'Cambiar contraseña';
        return;
      }
      message.textContent = 'Contraseña actualizada correctamente. Ya puedes iniciar sesión.';
      message.className = 'success';
      setTimeout(() => {
        const clean = new URL(window.location.href);
        clean.searchParams.delete(RECOVERY_PARAM);
        clean.hash = '';
        window.history.replaceState({}, '', clean.pathname + clean.search);
        overlay.remove();
        window.location.hash = '#portal';
      }, 1400);
    });
  }

  function boot() {
    if (!isRecoveryRoute()) return;
    render();
    if (!sbReady()) {
      setTimeout(() => { if (sbReady()) render(); }, 1200);
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
