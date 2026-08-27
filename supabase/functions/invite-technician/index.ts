import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "https://itexpressolutions.com",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const LEGACY_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const SECRET_KEYS_RAW = Deno.env.get("SUPABASE_SECRET_KEYS");
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const SITE_URL = "https://itexpressolutions.com";
const FROM_EMAIL = "ITExpresSolutions <soporte@itexpressolutions.com>";
const REPLY_TO = "itexpressolutions@gmail.com";

function getAdminKey() {
  if (LEGACY_SERVICE_ROLE_KEY) return LEGACY_SERVICE_ROLE_KEY;
  if (SECRET_KEYS_RAW) {
    try {
      const keys = JSON.parse(SECRET_KEYS_RAW) as Record<string, string>;
      if (keys.default) return keys.default;
    } catch (_) {}
  }
  throw new Error("No hay una clave administrativa de Supabase disponible para la Edge Function.");
}

const ADMIN_KEY = getAdminKey();
const admin = createClient(SUPABASE_URL, ADMIN_KEY, {
  auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function esc(value: unknown) {
  return String(value ?? "").replace(/[&<>'\"]/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", "\"": "&quot;",
  }[c] ?? c));
}

async function sendWelcomeEmail(to: string, nombre: string, actionLink: string) {
  if (!RESEND_API_KEY) throw new Error("RESEND_API_KEY no está configurada en Supabase.");

  const safeName = esc(nombre || "Técnico");
  const safeEmail = esc(to);
  const html = `<!doctype html><html lang="es"><head><meta charset="utf-8"></head>
  <body style="margin:0;background:#f3f7fa;font-family:Arial,Helvetica,sans-serif;color:#17324d">
    <div style="max-width:640px;margin:30px auto;background:#fff;border-radius:18px;overflow:hidden;box-shadow:0 8px 30px rgba(6,47,82,.12)">
      <div style="background:linear-gradient(135deg,#062f52,#087f8e);padding:28px 32px;color:#fff">
        <img src="${SITE_URL}/logo-badge.webp" alt="ITExpresSolutions" width="58" height="58" style="display:block;border-radius:14px;margin-bottom:14px">
        <div style="font-size:25px;font-weight:800">Bienvenido a ITExpresSolutions</div>
        <div style="margin-top:6px;opacity:.9">Portal de técnicos</div>
      </div>
      <div style="padding:32px">
        <p style="font-size:18px;margin-top:0">Hola <strong>${safeName}</strong>,</p>
        <p>Tu cuenta de técnico ha sido creada correctamente. Desde el portal podrás consultar trabajos, fechas programadas y actualizar el estado de los servicios asignados.</p>
        <div style="background:#f4fafb;border:1px solid #dcebf0;border-radius:14px;padding:18px;margin:24px 0">
          <div style="font-size:13px;color:#607887;margin-bottom:6px">Correo de acceso</div>
          <div style="font-size:17px;font-weight:700;color:#062f52">${safeEmail}</div>
        </div>
        <p><strong>Por seguridad, no enviamos contraseñas por correo.</strong> Usa el siguiente botón para activar tu cuenta y crear tu propia contraseña.</p>
        <p style="text-align:center;margin:30px 0"><a href="${actionLink}" style="display:inline-block;background:#087f8e;color:#fff;text-decoration:none;font-weight:700;padding:14px 24px;border-radius:10px">Activar mi cuenta</a></p>
        <p style="font-size:13px;color:#607887">Si el botón no funciona, copia y pega este enlace en tu navegador:</p>
        <p style="font-size:12px;word-break:break-all;color:#087f8e">${esc(actionLink)}</p>
        <hr style="border:0;border-top:1px solid #e5edf1;margin:28px 0">
        <p style="font-size:13px;color:#607887;margin-bottom:4px">ITExpresSolutions</p>
        <p style="font-size:13px;color:#607887;margin:0">✉️ itexpressolutions@gmail.com · 📞 +52 998 466 1832</p>
        <p style="font-size:13px;margin:8px 0 0"><a href="${SITE_URL}" style="color:#087f8e">${SITE_URL}</a></p>
      </div>
    </div>
  </body></html>`;

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { "Authorization": `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: FROM_EMAIL, reply_to: REPLY_TO, to: [to], subject: "👋 Bienvenido a ITExpresSolutions — Activa tu cuenta de técnico", html }),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Resend rechazó el correo (${response.status}): ${detail}`);
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Método no permitido." }, 405);

  try {
    const authHeader = req.headers.get("Authorization") || "";
    const token = authHeader.replace(/^Bearer\s+/i, "").trim();
    if (!token) return json({ error: "Sesión requerida." }, 401);

    const { data: { user }, error: userError } = await admin.auth.getUser(token);
    if (userError || !user) return json({ error: "Sesión inválida o expirada." }, 401);

    const { data: caller, error: callerError } = await admin
      .from("public_profiles")
      .select("id,rol,activo")
      .eq("id", user.id)
      .maybeSingle();

    if (callerError) throw callerError;
    if (!caller || caller.rol !== "admin" || caller.activo !== true) {
      return json({ error: "Solo un administrador activo puede invitar técnicos." }, 403);
    }

    const body = await req.json();
    const email = String(body.email || "").trim().toLowerCase();
    const nombre = String(body.nombre || "").trim();
    const telefono = String(body.telefono || "").trim();
    const especialidad = String(body.especialidad || "").trim();

    if (!email || !email.includes("@")) return json({ error: "Escribe un correo válido." }, 400);
    if (!nombre) return json({ error: "Escribe el nombre del técnico." }, 400);

    const { data: created, error: createError } = await admin.auth.admin.createUser({
      email,
      email_confirm: false,
      user_metadata: { nombre, telefono, especialidad, rol: "tecnico" },
    });

    if (createError || !created.user) {
      const message = String(createError?.message || "No se pudo crear el usuario.");
      if (/already|registered|exists/i.test(message)) return json({ error: "Ese correo ya tiene una cuenta en Supabase Auth." }, 409);
      throw createError || new Error(message);
    }

    const userId = created.user.id;

    try {
      const { error: profileError } = await admin.from("public_profiles").upsert({
        id: userId,
        email,
        nombre,
        telefono: telefono || null,
        especialidad: especialidad || null,
        rol: "tecnico",
        activo: true,
      }, { onConflict: "id" });
      if (profileError) throw profileError;

      const { data: linkData, error: linkError } = await admin.auth.admin.generateLink({
        type: "invite",
        email,
        options: { redirectTo: `${SITE_URL}/#portal` },
      });
      if (linkError || !linkData?.properties?.action_link) throw linkError || new Error("No se pudo generar el enlace de activación.");

      await sendWelcomeEmail(email, nombre, linkData.properties.action_link);
    } catch (innerError) {
      try { await admin.auth.admin.deleteUser(userId); } catch (_) {}
      throw innerError;
    }

    return json({ ok: true, message: `Invitación enviada a ${email}.`, email });
  } catch (error) {
    console.error("invite-technician:", error);
    return json({ error: error instanceof Error ? error.message : "No se pudo enviar la invitación." }, 500);
  }
});
