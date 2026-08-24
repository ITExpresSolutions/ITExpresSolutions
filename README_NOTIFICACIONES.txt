ITExpresSolutions V24 - Notificaciones y reasignación

CAMBIOS
- Campana 🔔 con contador de no leídas y panel desplegable.
- Realtime para avisos de asignación/reasignación.
- Notificación del navegador cuando el usuario da permiso.
- Admin puede reasignar un trabajo desde la tabla Todos los trabajos.
- Reasignar Técnico 1 -> Técnico 2 genera aviso solo para Técnico 2.
- El SQL elimina el trigger antiguo que podía duplicar notificaciones.

SUPABASE
1. Ejecuta notificaciones.sql UNA SOLA VEZ.
2. Verifica al final que solo quede el trigger trg_notificar_trabajo_asignado.
3. Prueba creando un trabajo asignado y después reasignándolo.

GITHUB
- Reemplaza index.html, style.css y notificaciones.sql por esta versión.
- Mantén index.html en la raíz.
- No publiques claves secretas; la Publishable Key del frontend puede permanecer en HTML con RLS activo.
