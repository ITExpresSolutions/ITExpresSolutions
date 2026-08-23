ITExpresSolutions Web V18 - GitHub Pages + Supabase
====================================================

ESTA VERSIÓN CORRIGE EL ERROR:
    permission denied for table public_profiles

1. PRIMERO arregla Supabase
--------------------------------
En Supabase > SQL Editor abre el archivo:
    supabase_fix.sql

Copia TODO su contenido, pégalo en SQL Editor y pulsa RUN.

La corrección cambia es_admin() a SECURITY DEFINER para evitar que la
política de public_profiles se llame a sí misma a través de RLS.

2. DESPUÉS SUBE ESTOS ARCHIVOS A GITHUB
---------------------------------------
Mantén index.html en la raíz del repositorio.
Sube/reemplaza todo el contenido de esta carpeta.

GitHub Pages no necesita npm para este proyecto.

3. SUPABASE
-----------
URL:
https://wfdxbgohwejawmkpninz.supabase.co

Frontend:
- Usa solamente la Publishable Key.
- La Publishable Key puede estar en index.html.

SEGURIDAD:
- NUNCA subas una clave sb_secret_... a GitHub.
- NUNCA pongas la contraseña de PostgreSQL en HTML/JS.

4. USUARIOS
-----------
Cada usuario de Authentication que entre al portal debe tener una fila en:
public.public_profiles

El administrador debe tener:
rol = admin
activo = true

El técnico debe tener:
rol = tecnico
activo = true

5. PRUEBA
---------
Después de ejecutar supabase_fix.sql:
- abre el sitio de GitHub Pages
- entra a Portal
- inicia sesión con tu cuenta admin
- debe desaparecer "permission denied for table public_profiles"
- debe aparecer el Panel de administración
- debe cargar Técnicos y Todos los trabajos

6. NO MODIFICAR
---------------
No borres las políticas RLS ni desactives RLS para solucionar errores.
El portal está diseñado para trabajar con Authentication + RLS.
