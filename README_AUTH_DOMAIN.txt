ITExpresSolutions - Dominio y usuarios invitados
===============================================

Dominio de producción:
https://itexpressolutions.com/

Supabase Authentication > URL Configuration:
- Site URL: https://itexpressolutions.com/
- Redirect URL: https://itexpressolutions.com/#portal

La página ya no usa localhost:3000 ni itexpressolutions.github.io para autenticación.

Invitaciones:
1. Invita al técnico desde Supabase Authentication > Users.
2. El enlace del correo debe redirigir a https://itexpressolutions.com/#portal.
3. El técnico verá la pantalla "Bienvenido a ITExpresSolutions" y podrá crear su contraseña.
4. Después de activar la cuenta entrará al portal.

GitHub Pages:
- CNAME contiene itexpressolutions.com.
- En Settings > Pages > Custom domain debe aparecer itexpressolutions.com.
- Enforce HTTPS debe quedar activado cuando GitHub termine la validación del certificado.

IMPORTANTE:
- No subir sb_secret_... ni la contraseña de PostgreSQL.
- La Publishable Key del navegador está diseñada para usarse con RLS correctamente configurado.
