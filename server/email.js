'use strict';

const { createClient } = require('@supabase/supabase-js');

function getResend() {
  try {
    const { Resend } = require('resend');
    return Resend;
  } catch {
    return null;
  }
}

function siteUrl() {
  return String(process.env.PUBLIC_SITE_URL || 'https://web-production-d58c8.up.railway.app').replace(/\/$/, '');
}

function welcomeHtml(name) {
  const guest = String(name || 'меҳмон').replace(/[<>&]/g, '');
  const menuUrl = `${siteUrl()}/#menu`;
  return `<!doctype html>
<html><body style="margin:0;background:#0a0806;font-family:Georgia,serif;color:#f3ead9;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0806;padding:32px 12px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#14100a;border:1px solid #d9b56a;border-radius:16px;padding:36px;">
        <tr><td>
          <p style="letter-spacing:.2em;color:#d9b56a;font-size:12px;margin:0 0 12px;">PLOV TG</p>
          <h1 style="margin:0 0 16px;font-size:28px;color:#f3d99c;">Хуш омадед, ${guest}</h1>
          <p style="line-height:1.6;margin:0 0 16px;">Спасибо за регистрацию. Дастархан уже накрыт: плов, манты, курутоб и чай ждут вас в Душанбе.</p>
          <p style="line-height:1.6;margin:0 0 24px;">Откройте меню, забронируйте стол или закажите доставку — мы ответим теплом таджикского гостеприимства.</p>
          <a href="${menuUrl}" style="display:inline-block;background:#d9b56a;color:#14100a;text-decoration:none;padding:12px 22px;border-radius:999px;font-weight:700;">Открыть меню</a>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

async function sendWithResend(name, email) {
  const key = process.env.RESEND_API_KEY;
  const Resend = getResend();
  if (!key || !Resend) return false;
  const resend = new Resend(key);
  const { error } = await resend.emails.send({
    from: process.env.RESEND_FROM || 'PLOV TG <onboarding@resend.dev>',
    to: [email],
    subject: `${name || 'Меҳмон'}, хуш омадед в PLOV TG`,
    html: welcomeHtml(name),
    text: `Хуш омадед, ${name || 'меҳмон'}! Спасибо за регистрацию в PLOV TG.`
  });
  if (error) {
    console.warn('Resend:', error.message || error);
    return false;
  }
  return true;
}

async function sendWithSupabaseFunction(name, email) {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_ANON_KEY;
  if (!url || !key) return false;
  const res = await fetch(`${url}/functions/v1/send-welcome`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${key}`,
      apikey: key,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ name, email })
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    console.warn('Supabase function:', res.status, text);
    return false;
  }
  return true;
}

async function sendWithSupabaseOtp(name, email) {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_ANON_KEY;
  if (!url || !key) return false;
  const supabase = createClient(url, key);
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      data: { name },
      shouldCreateUser: true,
      emailRedirectTo: siteUrl()
    }
  });
  if (error) {
    console.warn('Supabase OTP:', error.message);
    return false;
  }
  return true;
}

async function sendWelcomeEmail(name, email) {
  if (await sendWithResend(name, email)) return { sent: true, via: 'resend' };
  if (await sendWithSupabaseFunction(name, email)) return { sent: true, via: 'supabase-resend' };
  if (await sendWithSupabaseOtp(name, email)) return { sent: true, via: 'supabase' };
  return { sent: false, via: null };
}

module.exports = { sendWelcomeEmail };
