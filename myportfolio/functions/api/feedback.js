import { json, isEmail, sendMail } from '../_lib.js'

const MAX_IMAGE_BYTES = 5 * 1024 * 1024
const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']

// Feedback is emailed to the site owner for moderation; approved entries are
// added in the admin and appear in the carousel on the next build.
export async function onRequestPost({ request, env }) {
  let form
  try {
    form = await request.formData()
  } catch {
    return json({ error: 'We could not read your submission. Please try again.' }, 400)
  }
  const field = (k) => String(form.get(k) ?? '').trim()
  const name = field('name')
  const email = field('email')
  const message = field('message')
  const rating = parseInt(field('rating'), 10)
  const image = form.get('image')

  if (!name) return json({ error: 'Please enter your name.' }, 400)
  if (!isEmail(email)) return json({ error: 'Please enter a valid email address.' }, 400)
  if (!(rating >= 1 && rating <= 5)) return json({ error: 'Please pick a rating from 1 to 5 stars.' }, 400)
  if (!message) return json({ error: 'Please write a short message.' }, 400)
  if (message.length > 500) return json({ error: 'Your message is too long (max 500 characters).' }, 400)

  let attachments
  if (image && typeof image === 'object' && image.size > 0) {
    if (!IMAGE_TYPES.includes(image.type)) {
      return json({ error: 'Please attach a JPG, PNG, WEBP or GIF image.' }, 400)
    }
    if (image.size > MAX_IMAGE_BYTES) {
      return json({ error: 'That image is too large (max 5 MB).' }, 400)
    }
    const bytes = new Uint8Array(await image.arrayBuffer())
    let bin = ''
    for (let i = 0; i < bytes.length; i += 0x8000) {
      bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000))
    }
    attachments = [{ filename: image.name || 'feedback-image', content: btoa(bin) }]
  }

  try {
    await sendMail(env, {
      subject: `[Portfolio feedback] ${rating}/5 from ${name}`,
      text: `Name: ${name}\nEmail: ${email}\nRating: ${rating}/5\n\n${message}`,
      replyTo: email,
      attachments,
    })
  } catch (err) {
    console.error('Feedback email failed', err)
    return json({ error: 'Something went wrong sending your feedback. Please try again in a moment.' }, 500)
  }
  return json({ success: true, message: 'Thank you! Your feedback has been received.' }, 201)
}
