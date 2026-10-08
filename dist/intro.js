'use strict';
(() => {
  const root = document.documentElement;
  const page = document.querySelector('#journal-page');
  const screen = document.querySelector('#journal-intro');
  const brand = document.querySelector('.site-header .brand');
  const paper = screen.querySelector('.intro-paper');
  const garden = screen.querySelector('.intro-garden');
  const skip = screen.querySelector('.intro-skip');
  const portrait = screen.querySelector('.intro-portrait');
  const portraitPhoto = screen.querySelector('.intro-portrait img');
  if (portraitPhoto) {
    const hidePortrait = () => { portrait.hidden = true; };
    portraitPhoto.addEventListener('error', hidePortrait, { once: true });
    if (portraitPhoto.complete && !portraitPhoto.naturalWidth) hidePortrait();
  }
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const duration = 6200, revealAt = 4300;
  const ease = 'cubic-bezier(.45,0,.2,1)';
  const timers = new Set(), animations = [];
  const home = brand.parentNode;
  const originalStyle = brand.getAttribute('style');
  const originalTabIndex = brand.getAttribute('tabindex');
  let slot, ended = false;
  let paused = false;
  try { paused = localStorage.getItem('hishika:motion') === 'paused'; } catch { /* No storage is required. */ }
  function later(fn, delay) {
    const timer = setTimeout(() => { timers.delete(timer); if (!ended) fn(); }, delay);
    timers.add(timer);
  }
  function animate(element, frames, options) {
    const animation = element.animate(frames, { fill: 'both', easing: ease, ...options });
    animations.push(animation);
  }
  function finish() {
    if (ended) return;
    ended = true;
    const returnFocus = screen.contains(document.activeElement);
    timers.forEach(clearTimeout);
    clearTimeout(window.journalIntroFallback);
    if (slot) { home.insertBefore(brand, slot); slot.remove(); }
    if (originalStyle === null) brand.removeAttribute('style'); else brand.setAttribute('style', originalStyle);
    if (originalTabIndex === null) brand.removeAttribute('tabindex'); else brand.setAttribute('tabindex', originalTabIndex);
    root.classList.remove('intro-pending', 'intro-active', 'intro-revealing');
    page.inert = false;
    screen.hidden = true;
    animations.forEach(animation => animation.cancel());
    garden.replaceChildren();
    window.removeEventListener('resize', finish);
    window.removeEventListener('journal-intro-timeout', finish);
    if (returnFocus) brand.focus({ preventScroll: true });
  }
  window.journalIntro = { finish, get active() { return !ended; } };
  skip.addEventListener('click', finish);
  window.addEventListener('journal-intro-timeout', finish);
  window.addEventListener('resize', finish);
  window.addEventListener('pageshow', event => { if (event.persisted) finish(); });
  motion.addEventListener('change', () => { if (motion.matches) finish(); });
  page.inert = true;

  function start() {
    if (ended) return;
    if (!brand.animate) { finish(); return; }
    root.classList.add('intro-active');
    root.classList.remove('intro-pending');
    if (motion.matches || paused) {
      // Opacity alone: no travelling name, flowers, floating or scroll delay.
      root.classList.add('intro-revealing');
      animate(paper, [{ opacity: 1 }, { opacity: 0 }], { duration: 400, easing: 'ease' });
      animate(page, [{ opacity: 0 }, { opacity: 1 }], { duration: 400, easing: 'ease' });
      later(finish, 400);
      return;
    }
    const rect = brand.getBoundingClientRect();
    const scale = Math.min(1.65, (window.innerWidth - 48) / rect.width);
    const x = (window.innerWidth - rect.width * scale) / 2;
    const y = (window.innerHeight - rect.height * scale) / 2 + Math.min(85, window.innerHeight * .12);
    slot = document.createElement('span');
    slot.className = 'intro-brand-slot';
    slot.setAttribute('aria-hidden', 'true');
    slot.style.width = rect.width + 'px'; slot.style.height = rect.height + 'px';
    home.insertBefore(slot, brand);
    screen.append(brand);
    Object.assign(brand.style, { position: 'fixed', left: '0', top: '0', width: rect.width + 'px', height: rect.height + 'px', margin: '0', transformOrigin: '0 0', zIndex: '3', pointerEvents: 'none' });
    brand.setAttribute('tabindex', '-1');
    const startTop = rect.top < 0 ? rect.top + window.scrollY : rect.top;
    const origin = `translate(${rect.left}px,${startTop}px) scale(1)`;
    const center = `translate(${x}px,${y}px) scale(${scale})`;
    animate(brand, [
      { transform: origin }, { transform: center }
    ], { duration: 1300 });

    if (portrait) animate(portrait, [
      { opacity: 0, transform: 'translate(-50%,-50%) rotate(-12deg) scale(.78)', offset: 0 },
      { opacity: 0, transform: 'translate(-50%,-50%) rotate(-12deg) scale(.78)', offset: .12 },
      { opacity: 1, transform: 'translate(-50%,-50%) rotate(0deg) scale(1)', offset: .36 },
      { opacity: 1, transform: 'translate(-50%,-50%) rotate(0deg) scale(1)', offset: revealAt / duration },
      { opacity: 0, transform: 'translate(-50%,-58%) rotate(5deg) scale(1.04)', offset: 1 }
    ], { duration, easing: 'linear' });

    const rx = Math.min(window.innerWidth * .34, 255);
    const ry = Math.min(window.innerHeight * .22, 145);
    for (let i = 0; i < 14; i++) {
      const flower = i < 8;
      const angle = (i / (flower ? 8 : 6)) * Math.PI * 2 + .22;
      const px = Math.cos(angle) * rx, py = Math.sin(angle) * ry;
      const node = document.createElement(flower ? 'div' : 'span');
      node.className = flower ? 'intro-blossom' : 'intro-petal';
      if (flower) node.innerHTML = '<svg viewBox="0 0 100 100" aria-hidden="true"><use href="#intro-flower"/></svg>';
      node.style.left = `calc(50% + ${px}px)`; node.style.top = `calc(50% + ${py}px)`;
      node.style.setProperty('--flower-size', (flower ? 46 + (i % 3) * 13 : 13 + i % 3 * 3) + 'px');
      node.style.color = ['#d79aac', '#cbb4ce', '#e4b1b5', '#c392a5'][i % 4];
      garden.append(node);
      const starts = 1800 + (i % 8) * 115;
      const pose = (s, dx = 0, dy = 0, turn = 0) => `translate(calc(-50% + ${dx}px),calc(-50% + ${dy}px)) rotate(${turn}deg) scale(${s})`;
      animate(node, [
        { opacity: 0, transform: pose(.12, 0, 12, -18), offset: 0 },
        { opacity: 0, transform: pose(.12, 0, 12, -18), offset: starts / duration, easing: ease },
        { opacity: flower ? .85 : .65, transform: pose(1, 0, 0, 4), offset: (starts + 1250) / duration, easing: 'ease-in-out' },
        { opacity: flower ? .85 : .65, transform: pose(1.04, 0, -6, 9), offset: revealAt / duration, easing: ease },
        { opacity: 0, transform: pose(1.13, px * .4, py * .4 - 12, 18), offset: 1 }
      ], { duration, easing: 'linear' });
    }
    animate(paper, [{ opacity: 1, offset: 0 }, { opacity: 1, offset: revealAt / duration, easing: ease }, { opacity: 0, offset: 1 }], { duration, easing: 'linear' });
    later(() => {
      const destination = slot.getBoundingClientRect();
      animate(brand, [{ transform: center }, { transform: `translate(${destination.left}px,${destination.top}px) scale(1)` }], { duration: duration - revealAt });
      root.classList.add('intro-revealing');
      animate(page, [{ opacity: 0 }, { opacity: 1 }], { duration: duration - revealAt });
      page.querySelectorAll('.preview-note, .site-header, .hero-copy, .hero-art').forEach((section, index) => {
        animate(section, [{ opacity: 0, translate: '0 14px' }, { opacity: 1, translate: '0 0' }], { duration: 1400, delay: index * 100 });
      });
    }, revealAt);
    later(finish, duration);
  }
  // Bound the font wait so a slow connection cannot trap the visitor in a loading screen.
  if (document.fonts?.load) {
    const fontTimeout = new Promise(resolve => later(resolve, 450));
    Promise.race([document.fonts.load('32px Caveat').catch(() => {}), fontTimeout]).then(() => {
      if (!ended) { try { start(); } catch { finish(); } }
    });
  } else { try { start(); } catch { finish(); } }
})();
