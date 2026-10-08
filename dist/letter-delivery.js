'use strict';
(() => {
  const form = document.querySelector('#letter-form');
  const send = form.querySelector('[type="submit"]');
  const status = document.querySelector('#letter-delivery-status');
  const consent = document.querySelector('#letter-consent');
  const email = document.querySelector('#letter-email');
  const name = document.querySelector('#letter-name');
  const message = document.querySelector('#letter-message');
  const type = document.querySelector('#letter-type');
  const verification = document.querySelector('#letter-verification');
  let ready = false, busy = false, token = '', widgetId, lastSent = '', attempt;
  const snapshot = () => JSON.stringify({ message: message.value.trim(), name: name.value.trim(), email: email.value.trim(), type: type.value });
  function updateSend() { send.disabled = !ready || busy || !token || !consent.checked || snapshot() === lastSent; }
  function resetVerification() { token = ''; if (widgetId !== undefined && window.turnstile) window.turnstile.reset(widgetId); updateSend(); }
  const localCopy = () => `Dear Hishika,\n\n${message.value.trim()}\n\nWith love,\n${name.value.trim() || 'a soft-hearted reader'}\n\n— ${type.value}\n${snapshot() === lastSent ? 'Accepted for email delivery through the Rose Journal.' : 'Personal copy. Delivery has not been confirmed.'}`;
  document.querySelector('#keep-letter-copy').addEventListener('click', () => {
    if (message.value.trim().length < 3) { status.textContent = 'Write at least three characters before keeping a copy.'; message.focus(); return; }
    download('a-little-letter.txt', localCopy());
  });
  form.addEventListener('input', updateSend);
  form.addEventListener('change', updateSend);
  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (!ready || busy || !token || snapshot() === lastSent || !form.reportValidity()) return;
    const current = snapshot();
    if (!attempt || attempt.snapshot !== current) attempt = { snapshot: current, id: crypto.randomUUID() };
    const payload = { ...JSON.parse(current), consent: consent.checked, website: document.querySelector('#letter-website').value, requestId: attempt.id, token };
    const copy = localCopy();
    busy = true; updateSend(); form.setAttribute('aria-busy', 'true'); send.textContent = 'Sending your letter…';
    status.textContent = 'Sending your words to Hishika…';
    // Keep this submission stable until the server has answered.
    const fields = [message, name, email, type, consent]; fields.forEach(field => field.disabled = true);
    try {
      const response = await fetch('/api/letters', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload), signal: AbortSignal.timeout(22000) });
      const result = await response.json();
      if (response.status !== 202 || result.accepted !== true || typeof result.id !== 'string') throw new Error(result.error || 'Delivery could not be confirmed. Please retry in a moment.');
      lastSent = current;
      sealedLetter = copy.replace('Personal copy. Delivery has not been confirmed.', 'Accepted for email delivery through the Rose Journal.');
      status.textContent = 'Your letter has been accepted for delivery to Hishika. You can keep a copy below.';
      openDialog('sealed', send);
    } catch (error) {
      status.textContent = error.name === 'TimeoutError' || error.name === 'TypeError' ? 'Delivery could not be confirmed. Your words are still here; please retry the same letter in a moment.' : error.message;
    } finally {
      busy = false; fields.forEach(field => field.disabled = false); form.setAttribute('aria-busy', 'false');
      send.textContent = 'Send my letter ♡'; resetVerification();
    }
  });
  updateSend();
  (async () => {
    try {
      const response = await fetch('/api/letters', { signal: AbortSignal.timeout(8000) });
      const config = await response.json();
      if (!response.ok || config.ready !== true || !config.siteKey) throw new Error('Unavailable');
      const script = document.createElement('script');
      script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'; script.async = true;
      script.onload = () => {
        try {
          widgetId = window.turnstile.render(verification, { sitekey: config.siteKey, action: 'letter',
            callback: value => { token = value; status.textContent = 'Ready when you are. Your letter will be emailed to Hishika.'; updateSend(); },
            'expired-callback': () => { token = ''; updateSend(); },
            'error-callback': () => { token = ''; status.textContent = 'Verification couldn’t load. Refresh to retry, or keep a draft.'; updateSend(); }
          });
          ready = true; status.textContent = 'Complete the verification and consent to send your letter.'; updateSend();
        } catch { status.textContent = 'Verification is unavailable. Keep a draft and try again later.'; }
      };
      script.onerror = () => { status.textContent = 'Verification couldn’t load. Keep a draft and try again later.'; };
      document.head.append(script);
    } catch { status.textContent = 'Letter delivery is not available yet. You can save a draft or download a copy.'; }
  })();
})();
