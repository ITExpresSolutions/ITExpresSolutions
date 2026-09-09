# FrozeNat Desktop

Aplicación Windows separada del portal web de FrozeNat.

## Objetivo

- Mantener el portal web actual sin modificaciones.
- Ofrecer una aplicación de escritorio para administración y POS.
- Compartir autenticación, permisos y datos con Supabase.
- Preparar instaladores Windows `.exe`/MSI mediante Tauri.
- Dejar lista la base para actualizaciones automáticas y modo offline en fases posteriores.

## Seguridad

El cliente solo debe usar la URL de Supabase y la llave pública/publicable. Nunca incluir `service_role`, contraseña de Postgres ni credenciales administrativas dentro del ejecutable. Los privilegios deben hacerse cumplir con Auth + perfiles + RLS en Supabase.

## Arranque local

1. Instalar Node.js, Rust y los prerrequisitos de Tauri para Windows.
2. Copiar `.env.example` como `.env` y completar la URL y la llave pública de Supabase.
3. Ejecutar `npm install`.
4. Ejecutar `npm run desktop:dev`.
5. Para generar instalador: `npm run desktop:build`.

## Fases

### Fase 1 — Base
- Tauri + React + TypeScript.
- Login contra Supabase.
- Validación de perfil activo.
- Separación total del portal web.

### Fase 2 — Shell administrativo
- Menú por módulos.
- System Admin con acceso completo.
- RH, producción, inventario, ventas, reportes y configuración.

### Fase 3 — POS
- Caja y turnos.
- Venta rápida.
- Pedidos y notificaciones.
- Impresión de tickets.

### Fase 4 — Resiliencia
- Caché local segura.
- Cola de operaciones offline.
- Sincronización y resolución de conflictos.

### Fase 5 — Distribución
- Actualizador automático.
- Firma digital del ejecutable.
- Canal estable/beta.
- Diagnóstico y registro de versiones por dispositivo.
