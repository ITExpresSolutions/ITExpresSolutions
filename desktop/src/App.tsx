import { FormEvent, useEffect, useMemo, useState } from 'react';
import { supabase } from './lib/supabase';

type Status = 'idle' | 'loading' | 'error';
type Profile = { user_id: string; full_name: string; role: string; is_active: boolean };
type UserPermissions = {
  access_inventory?: boolean | null;
  inventory_import?: boolean | null;
  inventory_adjust?: boolean | null;
  access_reports?: boolean | null;
  download_documents?: boolean | null;
  edit_products?: boolean | null;
  manage_orders?: boolean | null;
  access_sales?: boolean | null;
  access_cash?: boolean | null;
  view_audit?: boolean | null;
  access_pos?: boolean | null;
  access_catalog?: boolean | null;
  access_special_orders?: boolean | null;
  access_production?: boolean | null;
  access_hr?: boolean | null;
};

type ModuleKey =
  | 'home'
  | 'pos'
  | 'sales'
  | 'orders'
  | 'inventory'
  | 'production'
  | 'hr'
  | 'payroll'
  | 'reports'
  | 'audit'
  | 'settings';

type NavItem = {
  key: ModuleKey;
  label: string;
  icon: string;
  permission?: keyof UserPermissions;
  adminOnly?: boolean;
};

const navItems: NavItem[] = [
  { key: 'home', label: 'Inicio', icon: '⌂' },
  { key: 'pos', label: 'Punto de venta', icon: '▣', permission: 'access_pos' },
  { key: 'sales', label: 'Ventas', icon: '$', permission: 'access_sales' },
  { key: 'orders', label: 'Pedidos', icon: '◫', permission: 'manage_orders' },
  { key: 'inventory', label: 'Inventario', icon: '▤', permission: 'access_inventory' },
  { key: 'production', label: 'Producción', icon: '⚙', permission: 'access_production' },
  { key: 'hr', label: 'Recursos Humanos', icon: '♙', permission: 'access_hr' },
  { key: 'payroll', label: 'Nómina', icon: '≋', permission: 'access_hr' },
  { key: 'reports', label: 'Reportes', icon: '▥', permission: 'access_reports' },
  { key: 'audit', label: 'Auditoría', icon: '◎', permission: 'view_audit' },
  { key: 'settings', label: 'Configuración', icon: '⚒', adminOnly: true }
];

const moduleDescriptions: Record<ModuleKey, { title: string; subtitle: string }> = {
  home: { title: 'Centro de operaciones', subtitle: 'Resumen general de FrozeNat Business Suite.' },
  pos: { title: 'Punto de venta', subtitle: 'Caja, turnos, ventas rápidas, pagos y tickets.' },
  sales: { title: 'Ventas', subtitle: 'Consulta de ventas, métodos de pago y movimientos.' },
  orders: { title: 'Pedidos', subtitle: 'Pedidos de mayoristas, fábrica y seguimiento de entrega.' },
  inventory: { title: 'Inventario', subtitle: 'Existencias, movimientos, ajustes e importaciones.' },
  production: { title: 'Producción', subtitle: 'Lotes, materiales, compras, proveedores y costos.' },
  hr: { title: 'Recursos Humanos', subtitle: 'Empleados, expedientes, horarios y asistencia.' },
  payroll: { title: 'Nómina', subtitle: 'Cálculo, revisión y generación de nómina.' },
  reports: { title: 'Reportes', subtitle: 'Reportes operativos, PDF, Excel y entregas programadas.' },
  audit: { title: 'Auditoría', subtitle: 'Trazabilidad de acciones administrativas y cambios.' },
  settings: { title: 'Configuración', subtitle: 'Usuarios, permisos, sistema y preferencias.' }
};

export default function App() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [message, setMessage] = useState('');
  const [profile, setProfile] = useState<Profile | null>(null);
  const [permissions, setPermissions] = useState<UserPermissions>({});
  const [activeModule, setActiveModule] = useState<ModuleKey>('home');
  const [booting, setBooting] = useState(true);

  const isSystemAdmin = profile?.role === 'system_admin';

  const visibleNav = useMemo(
    () =>
      navItems.filter((item) => {
        if (isSystemAdmin) return true;
        if (item.adminOnly) return false;
        if (!item.permission) return true;
        return permissions[item.permission] === true;
      }),
    [isSystemAdmin, permissions]
  );

  useEffect(() => {
    void restoreSession();

    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session?.user) {
        setProfile(null);
        setPermissions({});
        setActiveModule('home');
      }
    });

    return () => data.subscription.unsubscribe();
  }, []);

  async function restoreSession() {
    setBooting(true);
    const { data } = await supabase.auth.getSession();
    if (data.session?.user?.id) {
      await loadAuthorizedUser(data.session.user.id);
    }
    setBooting(false);
  }

  async function loadAuthorizedUser(userId: string) {
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('user_id, full_name, role, is_active')
      .eq('user_id', userId)
      .single();

    if (profileError || !profileData?.is_active) {
      await supabase.auth.signOut();
      setStatus('error');
      setMessage('Tu cuenta no tiene un perfil activo en FrozeNat.');
      return false;
    }

    const normalizedProfile = profileData as Profile;
    setProfile(normalizedProfile);

    if (normalizedProfile.role === 'system_admin') {
      setPermissions({});
      return true;
    }

    const { data: permissionData } = await supabase
      .from('user_permissions')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    setPermissions((permissionData as UserPermissions | null) ?? {});
    return true;
  }

  async function handleLogin(event: FormEvent) {
    event.preventDefault();
    setStatus('loading');
    setMessage('');

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setStatus('error');
      setMessage('Correo o contraseña incorrectos.');
      return;
    }

    const userId = data.user?.id;
    if (!userId) {
      setStatus('error');
      setMessage('No fue posible identificar al usuario.');
      return;
    }

    const allowed = await loadAuthorizedUser(userId);
    setStatus(allowed ? 'idle' : 'error');
    if (allowed) {
      setPassword('');
      setActiveModule('home');
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    setProfile(null);
    setPermissions({});
    setEmail('');
    setPassword('');
  }

  if (booting) {
    return (
      <main className="boot-screen">
        <div className="brand-mark">F</div>
        <h1>FrozeNat Desktop</h1>
        <p>Iniciando sistema…</p>
      </main>
    );
  }

  if (!profile) {
    return (
      <main className="app-shell">
        <section className="brand-panel">
          <div className="brand-mark">F</div>
          <p className="eyebrow">FrozeNat Business Suite</p>
          <h1>FrozeNat Desktop</h1>
          <p className="subtitle">
            Administración y operación interna para Windows, conectada a la misma plataforma de FrozeNat.
            El portal web permanece independiente y disponible como acceso alternativo.
          </p>
          <div className="status-card">
            <span className="status-dot" />
            <div>
              <strong>Windows + Web + Nube</strong>
              <p>Una sola identidad, permisos centralizados y datos sincronizados.</p>
            </div>
          </div>
        </section>

        <section className="login-panel">
          <div className="login-card">
            <p className="eyebrow">Acceso seguro</p>
            <h2>Iniciar sesión</h2>
            <p className="hint">Usa tu cuenta autorizada de FrozeNat.</p>

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
              Los privilegios se validan con autenticación, rol y políticas de seguridad en Supabase.
            </div>
          </div>
        </section>
      </main>
    );
  }

  const moduleInfo = moduleDescriptions[activeModule];

  return (
    <main className="desktop-layout">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="brand-mark compact">F</div>
          <div>
            <strong>FrozeNat</strong>
            <span>Business Suite</span>
          </div>
        </div>

        <nav className="nav-list">
          {visibleNav.map((item) => (
            <button
              key={item.key}
              className={`nav-item ${activeModule === item.key ? 'active' : ''}`}
              onClick={() => setActiveModule(item.key)}
            >
              <span className="nav-icon">{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="user-chip">
            <span className="avatar">{profile.full_name.slice(0, 1).toUpperCase()}</span>
            <div>
              <strong>{profile.full_name}</strong>
              <span>{isSystemAdmin ? 'System Admin' : profile.role}</span>
            </div>
          </div>
          <button className="logout-button" onClick={handleLogout}>Cerrar sesión</button>
        </div>
      </aside>

      <section className="workspace">
        <header className="topbar">
          <div>
            <p className="eyebrow">FrozeNat Desktop</p>
            <h2>{moduleInfo.title}</h2>
          </div>
          <div className="topbar-actions">
            <span className="connection-badge"><i /> Conectado</span>
            {isSystemAdmin && <span className="admin-badge">Acceso total</span>}
          </div>
        </header>

        <div className="content-area">
          <section className="hero-card">
            <div>
              <p className="eyebrow">{isSystemAdmin ? 'Control administrativo completo' : 'Área autorizada'}</p>
              <h3>{moduleInfo.title}</h3>
              <p>{moduleInfo.subtitle}</p>
            </div>
            <div className="hero-orb">F</div>
          </section>

          {activeModule === 'home' ? (
            <>
              <section className="stats-grid">
                <article className="stat-card"><span>Estado</span><strong>Operativo</strong><small>Conexión activa con Supabase</small></article>
                <article className="stat-card"><span>Rol</span><strong>{isSystemAdmin ? 'Administrador' : 'Usuario'}</strong><small>{profile.role}</small></article>
                <article className="stat-card"><span>Módulos</span><strong>{visibleNav.length}</strong><small>Disponibles para tu cuenta</small></article>
                <article className="stat-card"><span>Versión</span><strong>0.1.0</strong><small>FrozeNat Desktop</small></article>
              </section>

              <section className="module-grid">
                {visibleNav.filter((item) => item.key !== 'home').map((item) => (
                  <button className="module-card" key={item.key} onClick={() => setActiveModule(item.key)}>
                    <span className="module-icon">{item.icon}</span>
                    <div>
                      <strong>{item.label}</strong>
                      <small>{moduleDescriptions[item.key].subtitle}</small>
                    </div>
                    <span className="arrow">›</span>
                  </button>
                ))}
              </section>
            </>
          ) : (
            <section className="module-placeholder">
              <div className="module-placeholder-icon">{navItems.find((item) => item.key === activeModule)?.icon}</div>
              <h3>{moduleInfo.title}</h3>
              <p>{moduleInfo.subtitle}</p>
              <div className="development-pill">Módulo preparado para integración</div>
              <p className="placeholder-note">
                Esta pantalla ya forma parte del shell de escritorio. La siguiente fase conecta aquí las funciones operativas reales sin modificar el portal web.
              </p>
            </section>
          )}
        </div>
      </section>
    </main>
  );
}
