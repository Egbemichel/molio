import { json, isEmail, sendMail } from '../_lib.js'

export async function onRequestPost({ request, env }) {
  let data
  try {
    data = await request.json()
  } catch {
    return json({ error: 'Invalid request.' }, 400)
  }
  const field = (k) => String(data[k] ?? '').trim()

  // Honeypot: humans never fill the hidden "company" field.
  if (field('company')) return json({ success: true, message: 'Thanks!' })

  const name = field('name')
  const email = field('email')
  const subject = field('subject')
  const message = field('message')

  if (!name) return json({ error: 'Please enter your name.' }, 400)
  if (!isEmail(email)) return json({ error: 'Please enter a valid email address.' }, 400)
  if (!message) return json({ error: 'Please write a message.' }, 400)
  if (message.length > 5000) return json({ error: 'Message is too long.' }, 400)

  try {
    await sendMail(env, {
      subject: `[Portfolio] ${subject || 'New message'} — from ${name}`,
      text: `Name: ${name}\nEmail: ${email}\nSubject: ${subject || '(none)'}\n\n${message}`,
      replyTo: email,
    })
  } catch (err) {
    console.error('Contact email failed', err)
    return json({ error: 'Could not send right now. Please email me directly.' }, 500)
  }
  return json({ success: true, message: "Message sent — I'll get back to you soon." })
}
