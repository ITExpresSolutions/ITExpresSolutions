ITExpresSolutions Web V17
========================

Esta versión conserva el sitio V16 y añade un Portal privado conectado a Supabase.

CONFIGURACIÓN
- Supabase URL: https://wfdxbgohwejawmkpninz.supabase.co
- Se usa únicamente la Publishable Key en el navegador.
- NO subir jamás una sb_secret_... al repositorio.

GITHUB PAGES
1. Reemplaza los archivos del repositorio por el contenido de esta carpeta.
2. Mantén index.html en la raíz del repositorio.
3. GitHub Pages puede publicar el sitio directamente; no requiere npm.

PORTAL
- Abre #portal en el sitio.
- Administrador: puede crear/asignar trabajos y ver todos los trabajos.
- Técnico: puede ver sus trabajos y cambiar el estado.
- Los usuarios deben existir en Supabase Authentication y tener fila en public.public_profiles.

SEGURIDAD
- La Publishable Key está diseñada para uso público en frontend con RLS.
- La Secret Key nunca debe estar en HTML, JS, GitHub o GitHub Pages.
- El acceso real depende de Authentication + RLS de Supabase.
