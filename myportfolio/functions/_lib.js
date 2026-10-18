// Shared helpers for the Pages Functions (contact + feedback).
// Env vars (Pages > Settings > Variables and Secrets):
//   RESEND_API_KEY (secret), RESEND_FROM_EMAIL, CONTACT_RECIPIENT_EMAIL

export const json = (body, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })

export const isEmail = (s) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s) && s.length <= 254

export async function sendMail(env, { subject, text, replyTo, attachments }) {
  if (!env.RESEND_API_KEY || !env.CONTACT_RECIPIENT_EMAIL) {
    throw new Error('Email is not configured')
  }
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: env.RESEND_FROM_EMAIL || 'Portfolio <onboarding@resend.dev>',
      to: [env.CONTACT_RECIPIENT_EMAIL],
      reply_to: replyTo,
      subject,
      text,
      attachments,
    }),
  })
  if (!res.ok) throw new Error(`Resend ${res.status}: ${await res.text()}`)
}
