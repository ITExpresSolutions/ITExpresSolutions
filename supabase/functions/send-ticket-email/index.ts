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

    const companyEmail = "itexpressolutions@gmail.com";
    const companyPhone = "+52 56 6388 5856";
    const companyPhoneHref = "+525663885856";
    const website = "https://itexpressolutions.com";
    const portal = "https://itexpressolutions.com/#portal";
    const logoUrl = "https://itexpressolutions.com/logo-badge.webp";

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
    const status = String(t.estado || "pendiente");
    const subject = `${priority === "urgente" ? "🚨 URGENTE — " : ""}Nuevo ticket #${ref} | ITExpresSolutions`;
    const problem = esc(t.descripcion || "Sin descripción").replace(/\n/g, "<br>");
    const customerName = esc(t.cliente_nombre || "Cliente");
    const customerEmail = esc(t.cliente_email || "No indicado");
    const customerPhone = esc(t.cliente_telefono || "No indicado");
    const service = esc(t.tipo_servicio || t.titulo || "Soporte técnico");
    const city = esc(t.ciudad || "No indicada");
    const priorityLabel = esc(priority.charAt(0).toUpperCase() + priority.slice(1));
    const statusLabel = esc(status.charAt(0).toUpperCase() + status.slice(1));

    const send = async (to: string, mailSubject: string, html: string) => {
      const r = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          from: `ITExpresSolutions <${fromEmail}>`,
          to: [to],
          subject: mailSubject,
          html,
        }),
      });
      const b = await r.text();
      if (!r.ok) return { sent: false, error: `HTTP ${r.status}: ${b.slice(0, 500)}` };
      return { sent: true, error: null as string | null };
    };

    const baseStyles = `
      font-family:Arial,Helvetica,sans-serif;
      background:#f4f7f9;
      color:#17212b;
      margin:0;
      padding:0;
    `;

    const header = `
      <div style="background:#061a2b;padding:26px 24px 22px;text-align:center;border-bottom:4px solid #63c92f;">
        <a href="${website}" target="_blank" style="text-decoration:none;">
          <img src="${logoUrl}" alt="ITExpresSolutions" width="88" style="display:block;width:88px;height:auto;margin:0 auto 12px;border:0;">
        </a>
        <div style="font-size:28px;line-height:34px;font-weight:800;color:#ffffff;">
          ITExpres<span style="color:#63c92f;">Solutions</span>
        </div>
        <div style="color:#d8e3ea;font-size:13px;margin-top:5px;letter-spacing:.3px;">Soporte • Soluciones • Tecnología</div>
      </div>
    `;

    const contactBox = `
      <div style="background:#f7fafb;border:1px solid #dce6eb;border-radius:14px;padding:18px;margin-top:22px;">
        <div style="font-size:17px;font-weight:700;color:#176f2c;margin-bottom:12px;">¿Necesitas ayuda?</div>
        <div style="font-size:14px;line-height:1.8;">
          ✉️ <strong>Correo:</strong> <a href="mailto:${companyEmail}" style="color:#176f2c;text-decoration:none;">${companyEmail}</a><br>
          📞 <strong>Teléfono / WhatsApp:</strong> <a href="tel:${companyPhoneHref}" style="color:#176f2c;text-decoration:none;">${companyPhone}</a><br>
          🌐 <strong>Sitio web:</strong> <a href="${website}" target="_blank" style="color:#176f2c;text-decoration:none;">${website.replace("https://", "")}</a>
        </div>
      </div>
    `;

    const footer = `
      <div style="background:#061a2b;color:#dce8ee;padding:24px;text-align:center;border-top:4px solid #63c92f;">
        <div style="font-weight:700;font-size:15px;color:#ffffff;">ITExpres<span style="color:#63c92f;">Solutions</span></div>
        <div style="font-size:12px;margin-top:8px;">Soporte técnico profesional • Atención personalizada</div>
        <div style="font-size:12px;margin-top:12px;">
          <a href="mailto:${companyEmail}" style="color:#9ee36f;text-decoration:none;">${companyEmail}</a>
          &nbsp;|&nbsp;
          <a href="tel:${companyPhoneHref}" style="color:#9ee36f;text-decoration:none;">${companyPhone}</a>
        </div>
        <div style="font-size:12px;margin-top:8px;">
          <a href="${website}" target="_blank" style="color:#9ee36f;text-decoration:none;">${website}</a>
        </div>
        <div style="font-size:11px;color:#9aaab4;margin-top:16px;">Este mensaje fue generado automáticamente por ITExpresSolutions.</div>
      </div>
    `;

    const ticketCard = `
      <div style="background:#ffffff;border:1px solid #e1e8ed;border-radius:16px;padding:22px;margin-top:20px;">
        <div style="font-size:13px;color:#647582;text-transform:uppercase;letter-spacing:.6px;">Número de referencia</div>
        <div style="font-size:25px;font-weight:800;color:#123047;margin-top:5px;">#${esc(ref)}</div>
        <hr style="border:0;border-top:1px solid #e6ecef;margin:18px 0;">
        <div style="font-size:14px;line-height:1.9;">
          <strong>Estado:</strong> 🟡 ${statusLabel}<br>
          <strong>Prioridad:</strong> ${priority === "urgente" ? "🚨 " : ""}${priorityLabel}<br>
          <strong>Servicio:</strong> ${service}<br>
          <strong>Ciudad:</strong> ${city}
        </div>
      </div>
    `;

    const adminHtml = `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body style="${baseStyles}">
      <div style="max-width:720px;margin:0 auto;background:#ffffff;">
        ${header}
        <div style="padding:28px 24px 30px;">
          <div style="font-size:28px;font-weight:800;color:${priority === "urgente" ? "#c62828" : "#123047"};">${priority === "urgente" ? "🚨 URGENTE — " : "🎫 "}Nuevo ticket</div>
          <p style="font-size:16px;color:#536570;">Se ha recibido una nueva solicitud de soporte en ITExpresSolutions.</p>
          ${ticketCard}
          <div style="margin-top:24px;font-size:18px;font-weight:800;color:#176f2c;">Detalles del cliente</div>
          <div style="background:#f7fafb;border-radius:14px;padding:18px;margin-top:10px;font-size:14px;line-height:1.9;">
            <strong>Nombre:</strong> ${customerName}<br>
            <strong>Correo:</strong> ${customerEmail}<br>
            <strong>Teléfono / WhatsApp:</strong> ${customerPhone}<br>
            <strong>Problema:</strong><br>${problem}
          </div>
          ${contactBox}
          <div style="text-align:center;margin:26px 0 6px;">
            <a href="${portal}" target="_blank" style="display:inline-block;background:#45a829;color:#ffffff;text-decoration:none;font-weight:700;padding:13px 22px;border-radius:9px;">Abrir portal de ITExpresSolutions</a>
          </div>
        </div>
        ${footer}
      </div>
    </body></html>`;

    const adminResult = await send(adminEmail, subject, adminHtml);

    let customerResult = { sent: false, error: null as string | null };
    const rawCustomerEmail = String(t.cliente_email || "").trim().toLowerCase();
    if (/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(rawCustomerEmail) && rawCustomerEmail !== adminEmail.toLowerCase()) {
      const customerHtml = `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body style="${baseStyles}">
        <div style="max-width:720px;margin:0 auto;background:#ffffff;">
          ${header}
          <div style="padding:28px 24px 30px;">
            <div style="font-size:27px;font-weight:800;color:#123047;">✅ Ticket recibido</div>
            <p style="font-size:17px;margin-top:20px;">Hola <strong>${customerName}</strong>,</p>
            <p style="font-size:16px;color:#536570;line-height:1.7;">Hemos recibido correctamente tu solicitud de soporte. Nuestro equipo podrá dar seguimiento usando la referencia de abajo.</p>
            ${ticketCard}
            <div style="background:#edf9e9;border:1px solid #cde9c4;border-radius:12px;padding:16px;margin-top:20px;font-size:14px;line-height:1.6;">
              🔒 <strong>Guarda esta referencia:</strong> #${esc(ref)}. La necesitarás para consultar el estado de tu ticket.
            </div>
            <div style="text-align:center;margin:26px 0;">
              <a href="${portal}" target="_blank" style="display:inline-block;background:#45a829;color:#ffffff;text-decoration:none;font-weight:700;padding:14px 26px;border-radius:9px;">Consultar estado de mi ticket</a>
            </div>
            ${contactBox}
          </div>
          ${footer}
        </div>
      </body></html>`;
      customerResult = await send(rawCustomerEmail, `🎫 Ticket recibido #${ref} | ITExpresSolutions`, customerHtml);
    }

    return json({
      ok: adminResult.sent || customerResult.sent,
      admin_sent: adminResult.sent,
      admin_error: adminResult.error,
      customer_sent: customerResult.sent,
      customer_error: customerResult.error,
      reference: ref,
      from: fromEmail,
    });
  } catch (err) {
    console.error("send-ticket-email error", err);
    return json({ error: "Unexpected error" }, 500);
  }
});
