import { FormEvent, useState } from 'react';
import { supabase } from './lib/supabase';

type Status = 'idle' | 'loading' | 'error' | 'success';

export default function App() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [message, setMessage] = useState('');

  async function handleLogin(event: FormEvent) {
    event.preventDefault();
    setStatus('loading');
    setMessage('');

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setStatus('error');
      setMessage(error.message);
      return;
    }

    const userId = data.user?.id;
    if (!userId) {
      setStatus('error');
      setMessage('No fue posible identificar al usuario.');
      return;
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('full_name, role, is_active')
      .eq('user_id', userId)
      .single();

    if (profileError || !profile?.is_active) {
      await supabase.auth.signOut();
      setStatus('error');
      setMessage('Tu cuenta no tiene un perfil activo en FrozeNat.');
      return;
    }

    setStatus('success');
    setMessage(`Bienvenido, ${profile.full_name}. Rol: ${profile.role}.`);
  }

  return (
    <main className="app-shell">
      <section className="brand-panel">
        <div className="brand-mark">F</div>
        <p className="eyebrow">FrozeNat Business Suite</p>
        <h1>FrozeNat Desktop</h1>
        <p className="subtitle">
          Aplicación de escritorio para administración, operaciones y punto de venta.
          El portal web permanece independiente y disponible como acceso alternativo.
        </p>
        <div className="status-card">
          <span className="status-dot" />
          <div>
            <strong>Arquitectura híbrida</strong>
            <p>Windows + Web + Supabase, compartiendo datos y permisos.</p>
          </div>
        </div>
      </section>

      <section className="login-panel">
        <div className="login-card">
          <p className="eyebrow">Acceso seguro</p>
          <h2>Iniciar sesión</h2>
          <p className="hint">Usa la misma cuenta autorizada de FrozeNat.</p>

          <form onSubmit={handleLogin}>
            <label>
              Correo electrónico
              <input
                type="email"
                autoComplete="username"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="usuario@frozenat.com"
                required
              />
            </label>

            <label>
              Contraseña
              <input
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="••••••••"
                required
              />
            </label>

            <button type="submit" disabled={status === 'loading'}>
              {status === 'loading' ? 'Conectando…' : 'Entrar a FrozeNat Desktop'}
            </button>
          </form>

          {message && <p className={`message ${status}`}>{message}</p>}

          <div className="security-note">
            <strong>Importante:</strong> el ejecutable utiliza únicamente la llave pública de cliente.
            Los privilegios reales se validan en Supabase mediante autenticación, roles y RLS.
          </div>
        </div>
      </section>
    </main>
  );
}
