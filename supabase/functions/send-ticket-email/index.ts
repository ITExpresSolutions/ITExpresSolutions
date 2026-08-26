import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const esc = (v: unknown) =>
  String(v ?? "").replace(/[&<>\"]/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;" }[c] ?? c)
  );

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    const payload = await req.json();
    const ticket = payload?.ticket || payload?.record || null;
    const ticketId = String(payload?.ticket_id || ticket?.id || "").trim();
    if (!ticketId || ticketId.length < 20) return json({ error: "Invalid ticket" }, 400);

    const resendKey = Deno.env.get("RESEND_API_KEY");
    const adminEmail = Deno.env.get("RESEND_ADMIN_EMAIL") || "itexpressolutions@gmail.com";
    const fromEmail = Deno.env.get("RESEND_FROM_EMAIL") || "onboarding@resend.dev";
    if (!resendKey) return json({ error: "RESEND_API_KEY is not configured" }, 500);

    let t = ticket;
    if (!t) {
      const supabaseUrl = Deno.env.get("SUPABASE_URL");
      const keysRaw = Deno.env.get("SUPABASE_SECRET_KEYS");
      let secretKey = null;
      if (keysRaw) {
        try { secretKey = JSON.parse(keysRaw)?.default || null; } catch {}
      }
      secretKey = secretKey || Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || Deno.env.get("SUPABASE_SECRET_KEY");
      if (!supabaseUrl || !secretKey) return json({ error: "No Supabase server key configured" }, 500);

      const r = await fetch(
        `${supabaseUrl}/rest/v1/trabajos?id=eq.${encodeURIComponent(ticketId)}&select=id,titulo,descripcion,cliente_nombre,cliente_telefono,cliente_email,ciudad,tipo_servicio,prioridad,estado,creado_at`,
        { headers: { apikey: secretKey, Authorization: `Bearer ${secretKey}` } }
      );
      const body = await r.text();
      if (!r.ok) return json({ error: "Could not load ticket" }, 500);
      const rows = JSON.parse(body);
      t = rows?.[0] || null;
    }

    if (!t) return json({ error: "Ticket not found" }, 404);
    const createdAt = new Date(t.creado_at || Date.now()).getTime();
    if (Number.isFinite(createdAt) && Date.now() - createdAt > 15 * 60 * 1000) {
      return json({ ok: true, skipped: true });
    }

    const ref = ticketId.slice(0, 8).toUpperCase();
    const priority = String(t.prioridad || "normal");
    const subject = `${priority === "urgente" ? "🚨 URGENTE — " : ""}Nuevo ticket #${ref} | ITExpresSolutions`;
    const problem = esc(t.descripcion || "Sin descripción").replace(/\n/g, "<br>");
    const details = `<p><strong>Estado:</strong> ${esc(t.estado || "pendiente")}<br><strong>Prioridad:</strong> ${esc(priority)}<br><strong>Servicio:</strong> ${esc(t.tipo_servicio || t.titulo || "Soporte técnico")}<br><strong>Ciudad:</strong> ${esc(t.ciudad || "No indicada")}</p><h3>Cliente</h3><p><strong>Nombre:</strong> ${esc(t.cliente_nombre)}<br><strong>Teléfono / WhatsApp:</strong> ${esc(t.cliente_telefono || "No indicado")}<br><strong>Correo:</strong> ${esc(t.cliente_email || "No indicado")}</p><h3>Solicitud</h3><p>${problem}</p>`;

    const send = async (to: string, mailSubject: string, html: string) => {
      const r = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({ from: `ITExpresSolutions <${fromEmail}>`, to: [to], subject: mailSubject, html }),
      });
      const b = await r.text();
      if (!r.ok) return { sent: false, error: `HTTP ${r.status}: ${b.slice(0, 500)}` };
      return { sent: true, error: null as string | null };
    };

    const adminHtml = `<!doctype html><html><body style="font-family:Arial,sans-serif;line-height:1.5;color:#123047"><h2>🎫 Nuevo ticket — ITExpresSolutions</h2><p>Referencia: <strong>#${esc(ref)}</strong></p><hr>${details}<p style="color:#6b7b87;font-size:12px">Aviso automático del sistema de tickets.</p></body></html>`;
    const adminResult = await send(adminEmail, subject, adminHtml);

    let customerResult = { sent: false, error: null as string | null };
    const customerEmail = String(t.cliente_email || "").trim().toLowerCase();
    if (/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(customerEmail) && customerEmail !== adminEmail.toLowerCase()) {
      const customerHtml = `<!doctype html><html><body style="font-family:Arial,sans-serif;line-height:1.6;color:#123047"><h2>🎫 ITExpresSolutions — Ticket recibido</h2><p>Hola <strong>${esc(t.cliente_nombre || "")}</strong>,</p><p>Hemos recibido correctamente tu solicitud de soporte.</p><p><strong>Número de referencia:</strong> #${esc(ref)}<br><strong>Estado:</strong> 🟡 Pendiente<br><strong>Prioridad:</strong> ${esc(priority)}</p><p>Guarda esta referencia para consultar el estado de tu ticket.</p><hr><p style="color:#6b7b87;font-size:12px">Este mensaje fue generado automáticamente por ITExpresSolutions.</p></body></html>`;
      customerResult = await send(customerEmail, `🎫 Ticket recibido #${ref} | ITExpresSolutions`, customerHtml);
    }

    return json({ ok: adminResult.sent || customerResult.sent, admin_sent: adminResult.sent, admin_error: adminResult.error, customer_sent: customerResult.sent, customer_error: customerResult.error, reference: ref, from: fromEmail });
  } catch (err) {
    console.error("send-ticket-email error", err);
    return json({ error: "Unexpected error" }, 500);
  }
});
