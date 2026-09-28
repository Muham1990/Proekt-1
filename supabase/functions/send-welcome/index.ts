import 'jsr:@supabase/functions-js/edge-runtime.d.ts';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, 'Content-Type': 'application/json' }
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  let payload: { name?: string; email?: string; code?: string } = {};
  try {
    payload = await req.json();
  } catch {
    return json({ error: 'Invalid JSON' }, 400);
  }

  const email = String(payload.email || '').trim().toLowerCase();
  const name = String(payload.name || 'меҳмон').replace(/[<>&]/g, '').slice(0, 80);
  const code = String(payload.code || '').replace(/\D/g, '').slice(0, 6);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return json({ error: 'email required' }, 400);

  const key = Deno.env.get('RESEND_API_KEY');
  if (!key) return json({ error: 'RESEND_API_KEY missing' }, 500);

  const isOtp = code.length === 6;
  const html = isOtp
    ? `<!doctype html><html><body style="margin:0;background:#0a0806;font-family:Georgia,serif;color:#f3ead9;"><table width="100%" cellpadding="0" cellspacing="0" style="padding:32px 12px;"><tr><td align="center"><table width="560" cellpadding="0" cellspacing="0" style="background:#14100a;border:1px solid #d9b56a;border-radius:16px;padding:36px;"><tr><td><p style="letter-spacing:.2em;color:#d9b56a;font-size:12px;margin:0 0 12px;">PLOV TG</p><h1 style="margin:0 0 16px;font-size:26px;color:#f3d99c;">Код подтверждения</h1><p style="line-height:1.6;">${name}, ваш код: <strong style="letter-spacing:.2em;font-size:28px;color:#f3d99c;">${code}</strong></p><p>Код действует 10 минут.</p></td></tr></table></td></tr></table></body></html>`
    : `<!doctype html><html><body style="margin:0;background:#0a0806;font-family:Georgia,serif;color:#f3ead9;"><table width="100%" cellpadding="0" cellspacing="0" style="padding:32px 12px;"><tr><td align="center"><table width="560" cellpadding="0" cellspacing="0" style="background:#14100a;border:1px solid #d9b56a;border-radius:16px;padding:36px;"><tr><td><p style="letter-spacing:.2em;color:#d9b56a;font-size:12px;margin:0 0 12px;">PLOV TG</p><h1 style="margin:0 0 16px;font-size:28px;color:#f3d99c;">Хуш омадед, ${name}</h1><p style="line-height:1.6;">Спасибо за регистрацию. Дастархан уже накрыт: плов, манты и курутоб ждут вас.</p></td></tr></table></td></tr></table></body></html>`;

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from: Deno.env.get('RESEND_FROM') || 'PLOV TG <noreply@karate.pp.ua>',
      to: [email],
      subject: isOtp ? 'Код подтверждения PLOV TG' : `${name}, хуш омадед в PLOV TG`,
      html
    })
  });

  const data = await res.json();
  if (!res.ok) return json({ error: data }, 502);
  return json({ ok: true, id: data.id || null });
});
