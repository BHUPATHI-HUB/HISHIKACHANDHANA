'use strict';
(() => {
  const body = document.body;
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const refresh = document.querySelector('#journal-refresh');
  const sparkles = document.querySelector('#tap-sparkles');
  const dialogClosings = new Map();
  let pageTimer, afterExit;
  let pointerStart = null;
  let savedPause = false;
  try { savedPause = localStorage.getItem('hishika:motion') === 'paused'; } catch { /* Storage is optional. */ }

  const canAnimate = () => !motion.matches && !savedPause && !body.classList.contains('motion-paused');
  function resetPage() {
    clearTimeout(pageTimer);
    body.classList.remove('journal-entering', 'journal-leaving');
    refresh.disabled = false;
  }
  function completeExit() {
    const next = afterExit;
    afterExit = null;
    clearTimeout(pageTimer);
    // Keep the paper closed during navigation; recover if navigation is interrupted.
    pageTimer = setTimeout(resetPage, 2000);
    try { next?.(); } catch (error) { resetPage(); throw error; }
  }
  function leavePage(next) {
    if (afterExit) return;
    if (!canAnimate()) { next(); return; }
    resetPage();
    afterExit = next;
    refresh.disabled = true;
    body.classList.add('journal-leaving');
    // Always complete navigation, even if animationend is unavailable.
    pageTimer = setTimeout(completeExit, 300);
  }
  function closeDialog(dialog) {
    if (!dialog.open || dialogClosings.has(dialog)) return;
    if (!canAnimate()) { dialog.close(); return; }
    const finish = () => {
      clearTimeout(dialogClosings.get(dialog));
      dialogClosings.delete(dialog);
      dialog.classList.remove('dialog-leaving');
      if (dialog.open) dialog.close();
    };
    dialog.classList.add('dialog-leaving');
    dialogClosings.set(dialog, setTimeout(finish, 220));
  }
  function settle(paused = savedPause) {
    savedPause = paused;
    resetPage();
    if (afterExit) completeExit();
    dialogClosings.forEach((timer, dialog) => {
      clearTimeout(timer);
      dialog.classList.remove('dialog-leaving');
      if (dialog.open) dialog.close();
    });
    dialogClosings.clear();
    document.querySelectorAll('.tap-sparkle').forEach((petal) => petal.remove());
  }
  window.journalTransitions = { closeDialog, settle };
  if (canAnimate()) {
    body.classList.add('journal-entering');
    pageTimer = setTimeout(resetPage, 300);
  }
  motion.addEventListener('change', () => { if (motion.matches) settle(); });
  window.addEventListener('pageshow', (event) => {
    if (event.persisted) { afterExit = null; settle(); }
  });
  refresh.addEventListener('click', () => leavePage(() => window.location.reload()));
  document.addEventListener('click', (event) => {
    const link = event.target.closest('a[href]');
    if (!link || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || link.hasAttribute('download') || (link.target && link.target !== '_self')) return;
    const next = new URL(link.href, window.location.href);
    const current = new URL(window.location.href);
    if (!/^https?:$/.test(next.protocol) || (next.origin === current.origin && next.pathname === current.pathname && next.search === current.search)) return;
    event.preventDefault();
    leavePage(() => window.location.assign(next.href));
  });

  function scatter(x, y, host) {
    if (!canAnimate()) return;
    // Dialogs live above the document's stacking layers; keep their sparkles inside them.
    const rect = host === sparkles ? { left: 0, top: 0 } : host.getBoundingClientRect();
    for (let i = 0; i < 3; i++) {
      if (document.querySelectorAll('.tap-sparkle').length >= 24) break;
      const petal = document.createElement('span');
      petal.className = 'tap-sparkle';
      petal.setAttribute('aria-hidden', 'true');
      petal.textContent = ['🌸', '💕', '✨', '🎀'][Math.floor(Math.random() * 4)];
      petal.style.left = x - rect.left + (host === sparkles ? 0 : host.scrollLeft) + 'px';
      petal.style.top = y - rect.top + (host === sparkles ? 0 : host.scrollTop) + 'px';
      petal.style.setProperty('--tap-x', (i - 1) * 27 + 'px');
      petal.style.setProperty('--tap-y', -(38 + Math.random() * 30) + 'px');
      petal.style.setProperty('--tap-turn', (i - 1) * 18 + 'deg');
      host.append(petal);
      petal.addEventListener('animationend', () => petal.remove(), { once: true });
      setTimeout(() => petal.remove(), 850);
    }
  }
  document.addEventListener('pointerdown', (event) => {
    pointerStart = event.isPrimary && event.button === 0 ? { id: event.pointerId, x: event.clientX, y: event.clientY } : null;
  }, { passive: true });
  document.addEventListener('pointercancel', () => { pointerStart = null; }, { passive: true });
  document.addEventListener('pointerup', (event) => {
    const start = pointerStart;
    pointerStart = null;
    if (!start || start.id !== event.pointerId || Math.hypot(event.clientX - start.x, event.clientY - start.y) > 10) return;
    scatter(event.clientX, event.clientY, event.target.closest('dialog[open]') || sparkles);
  }, { passive: true });
})();
