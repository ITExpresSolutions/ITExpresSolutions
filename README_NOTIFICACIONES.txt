ITExpresSolutions V23 - Notificaciones de trabajos

1. En Supabase > SQL Editor ejecuta NOTIFICACIONES.sql UNA VEZ.
2. Publica todo el contenido de esta carpeta en GitHub (reemplazando la V22).
3. Cuando un administrador cree un trabajo y seleccione un técnico:
   - el trabajo se crea como "asignado";
   - Supabase crea automáticamente una notificación para ese técnico;
   - si el técnico tiene el portal abierto, recibe el aviso en tiempo real;
   - si el navegador permite notificaciones, también recibe una notificación del navegador.
4. El técnico verá la campana 🔔 en su panel.

IMPORTANTE:
Esta versión implementa notificación dentro del portal + navegador.
Para enviar además correo electrónico o WhatsApp aunque el técnico tenga el portal cerrado,
hay que conectar un proveedor de correo/WhatsApp (por ejemplo SMTP/Resend para email o un proveedor de WhatsApp).
No se debe poner una clave secreta de proveedor dentro de index.html.
