'use strict';
// app.js owns dialog focus return and toast messages; load this file after it.
(() => {
  const share = document.querySelector('#share-journal');
  const linkField = document.querySelector('#share-url');
  const copy = document.querySelector('#copy-journal-link');
  const status = document.querySelector('#share-status');
  share.addEventListener('click', async () => {
    const url = new URL(window.location.href);
    if (!/^https?:$/.test(url.protocol)) { toast('Open the live website to share this journal.'); return; }
    for (const key of [...url.searchParams.keys()]) {
      if (/^(utm_.+|fbclid|gclid)$/i.test(key)) url.searchParams.delete(key);
    }
    const data = { title: document.title, url: url.href };
    share.disabled = true;
    try {
      if (typeof navigator.share === 'function' && (!navigator.canShare || navigator.canShare(data))) {
        await navigator.share(data);
        return;
      }
    } catch (error) {
      if (error.name === 'AbortError') return;
      // Unsupported or denied native sharing falls back to a readable, copyable link.
    } finally { share.disabled = false; }
    linkField.value = data.url;
    status.textContent = 'Copy this link and send it wherever you like.';
    copy.innerHTML = 'Copy the link <span aria-hidden="true">♡</span>';
    openDialog('share', share);
  });
  copy.addEventListener('click', async () => {
    copy.disabled = true;
    try {
      if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable');
      await navigator.clipboard.writeText(linkField.value);
      copy.textContent = 'Copied ♡';
      status.textContent = 'Link copied. Paste it wherever you’d like.';
    } catch {
      status.textContent = 'Select the link and copy it using your browser’s copy command.';
      linkField.focus(); linkField.select();
    } finally { copy.disabled = false; }
  });

  const progress = document.querySelector('.reading-progress span');
  const links = [...document.querySelectorAll('nav a[href^="#"]')];
  const sections = ['books', 'december', 'letters', 'letterbox'].map(id => document.getElementById(id));
  let queued = false;
  function updateNavigation() {
    queued = false;
    const travel = document.documentElement.scrollHeight - window.innerHeight;
    const position = travel > 0 ? Math.min(1, Math.max(0, window.scrollY / travel)) : 0;
    progress.style.transform = `scaleX(${position})`;
    let current = null;
    sections.forEach(section => {
      if (section.getBoundingClientRect().top <= window.innerHeight * .35) current = section.id === 'letterbox' ? 'letters' : section.id;
    });
    links.forEach(link => {
      if (link.hash === '#' + current) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
  }
  function scheduleNavigation() {
    if (queued) return;
    queued = true;
    window.requestAnimationFrame(updateNavigation);
  }
  window.addEventListener('scroll', scheduleNavigation, { passive: true });
  window.addEventListener('resize', scheduleNavigation);
  window.addEventListener('pageshow', scheduleNavigation);
  scheduleNavigation();
})();
