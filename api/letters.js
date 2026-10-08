'use strict';
const { createHash } = require('node:crypto');
const TYPES = ['A little letter', 'A thought about the book', 'Something I needed to say', 'A simple hello'];
const emailPattern = /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/;

function createHandler({ env = process.env, fetchImpl = globalThis.fetch } = {}) {
  return async function letters(req, res) {
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    const respond = (code, data) => res.status(code).json(data);
    let origin;
    try { origin = new URL(env.LETTER_SITE_ORIGIN); } catch { /* Missing configuration fails closed. */ }
    const ready = Boolean(origin && origin.origin === env.LETTER_SITE_ORIGIN &&
      (origin.protocol === 'https:' || ['localhost', '127.0.0.1'].includes(origin.hostname)) &&
      env.RESEND_API_KEY && emailPattern.test(env.LETTER_TO_EMAIL || '') &&
      emailPattern.test(env.LETTER_FROM_EMAIL || '') && env.TURNSTILE_SITE_KEY && env.TURNSTILE_SECRET_KEY);
    if (req.method === 'GET') return respond(200, { ready, siteKey: ready ? env.TURNSTILE_SITE_KEY : null });
    if (req.method !== 'POST') { res.setHeader('Allow', 'GET, POST'); return respond(405, { error: 'Method not allowed.' }); }
    if (!ready) return respond(503, { error: 'Letter delivery is not available yet. Keep a draft or download a copy.' });
    if (req.headers.origin !== origin.origin) return respond(403, { error: 'Please send your letter from the journal website.' });
    if (!/^application\/json(?:;|$)/i.test(req.headers['content-type'] || '')) return respond(415, { error: 'Invalid letter format.' });
    const body = req.body;
    if (!body || typeof body !== 'object' || Array.isArray(body)) return respond(400, { error: 'Invalid letter.' });
    if (Buffer.byteLength(JSON.stringify(body)) > 20000) return respond(413, { error: 'Your letter is too large.' });
    const { message, name = '', email = '', type, consent, website = '', requestId, token } = body;
    if (typeof message !== 'string' || message.trim().length < 3 || message.length > 4000 ||
        typeof name !== 'string' || name.length > 100 || /[\r\n\x00]/.test(name) ||
        typeof email !== 'string' || email.length > 254 || (email && !emailPattern.test(email)) ||
        !TYPES.includes(type) || consent !== true || website !== '' ||
        typeof requestId !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(requestId) ||
        typeof token !== 'string' || !token || token.length > 2048) {
      return respond(400, { error: 'Check your message, name, reply address and consent, then complete the verification.' });
    }
    try {
      const check = await fetchImpl('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ secret: env.TURNSTILE_SECRET_KEY, response: token }),
        signal: AbortSignal.timeout(8000)
      });
      const verification = await check.json();
      if (!check.ok || verification.success !== true || verification.hostname !== origin.hostname || verification.action !== 'letter') {
        return respond(403, { error: 'Please complete the verification again before sending.' });
      }
      const text = `Dear Hishika,\n\n${message.trim()}\n\nWith love,\n${name.trim() || 'a soft-hearted reader'}\n\nLetter type: ${type}\n${email ? 'Reply address: ' + email : 'No reply address provided.'}\nSent through the Rose Journal.`;
      // A retry uses the same provider key; changing the letter creates a different key.
      const key = createHash('sha256').update(JSON.stringify([requestId, env.LETTER_TO_EMAIL, text])).digest('hex');
      const response = await fetchImpl('https://api.resend.com/emails', {
        method: 'POST', headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json', 'Idempotency-Key': `letter/${key}` },
        body: JSON.stringify({ from: env.LETTER_FROM_EMAIL, to: [env.LETTER_TO_EMAIL], subject: `A reader’s letter — ${type}`, text, ...(email ? { reply_to: email } : {}) }),
        signal: AbortSignal.timeout(10000)
      });
      const result = await response.json();
      if (!response.ok || typeof result.id !== 'string' || !result.id) {
        console.error('Letter delivery provider rejected request', { status: response.status });
        return respond(response.status === 429 ? 429 : 502, { error: 'Your letter was not confirmed as sent. Please wait a moment and retry; your words are still here.' });
      }
      return respond(202, { accepted: true, id: result.id });
    } catch {
      console.error('Letter delivery service unavailable');
      return respond(503, { error: 'Delivery could not be confirmed. Retry this same letter in a moment; your words are still here.' });
    }
  };
}
module.exports = createHandler();
module.exports.createHandler = createHandler;
