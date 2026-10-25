// Shared helpers for the Pages Functions (contact + feedback).
// Env vars (Pages > Settings > Variables and Secrets):
//   RESEND_API_KEY (secret), RESEND_FROM_EMAIL, CONTACT_RECIPIENT_EMAIL

export const json = (body, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })

export const isEmail = (s) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s) && s.length <= 254

const DEFAULT_FROM = 'Portfolio <onboarding@resend.dev>'

// Dashboard values often pick up wrapping quotes or stray whitespace when
// pasted; Resend rejects those (422 "Invalid `from` field").
const clean = (v) => String(v ?? '').trim().replace(/^(['"])(.*)\1$/s, '$2').trim()

// Resend accepts "email@x.y" or "Name <email@x.y>". Anything else falls back.
function fromAddress(raw) {
  const v = clean(raw)
  const m = v.match(/^(?:(.*?)\s*<([^<>\s]+)>|([^<>\s]+))$/)
  const email = m && (m[2] || m[3])
  if (!email || !isEmail(email)) {
    if (v) console.warn('RESEND_FROM_EMAIL is not a valid sender; using the default')
    return DEFAULT_FROM
  }
  const name = clean(m[1] || '')
  return name ? `${name} <${email}>` : email
}

export async function sendMail(env, { subject, text, replyTo, attachments }) {
  const apiKey = clean(env.RESEND_API_KEY)
  const to = clean(env.CONTACT_RECIPIENT_EMAIL)
  if (!apiKey || !isEmail(to)) {
    throw new Error('Email is not configured (RESEND_API_KEY / CONTACT_RECIPIENT_EMAIL)')
  }
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: fromAddress(env.RESEND_FROM_EMAIL),
      to: [to],
      reply_to: replyTo,
      subject,
      text,
      attachments,
    }),
  })
  if (!res.ok) throw new Error(`Resend ${res.status}: ${await res.text()}`)
}
