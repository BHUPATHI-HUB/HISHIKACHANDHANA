'use strict';
const $ = (selector) => document.querySelector(selector);
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const storage = {
  get(key) { try { return localStorage.getItem('hishika:' + key); } catch { return null; } },
  set(key, value) { try { localStorage.setItem('hishika:' + key, value); return true; } catch { return false; } }
};
let toastTimer;
function toast(message) {
  $('#toast').textContent = message;
  $('#toast').classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => $('#toast').classList.remove('show'), 4300);
}
function download(name, text, type = 'text/plain;charset=utf-8') {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const link = document.createElement('a');
  link.href = url; link.download = name; document.body.append(link);
  link.click(); link.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000);
}
function setTheme(evening) {
  document.body.classList.toggle('evening', evening);
  $('#theme-toggle').setAttribute('aria-pressed', String(evening));
  $('#theme-toggle').setAttribute('aria-label', evening ? 'Switch to morning colours' : 'Switch to evening colours');
  $('#theme-toggle').textContent = evening ? '☼' : '☾';
  $('meta[name="theme-color"]').content = evening ? '#30262f' : '#f7e8e7';
}
setTheme(storage.get('theme') === 'evening');
$('#theme-toggle').addEventListener('click', () => {
  const evening = !document.body.classList.contains('evening');
  setTheme(evening); storage.set('theme', evening ? 'evening' : 'morning');
});
function setMotion(paused, initial = false) {
  document.body.classList.toggle('motion-paused', paused);
  document.documentElement.classList.toggle('motion-paused', paused);
  if (paused && !initial) window.journalTransitions.settle(true);
  $('#motion-toggle').setAttribute('aria-pressed', String(paused));
  $('#motion-toggle').textContent = paused ? 'Resume the little animations' : 'Pause the little animations';
}
setMotion(storage.get('motion') === 'paused', true);
$('#motion-toggle').addEventListener('click', () => {
  const paused = !document.body.classList.contains('motion-paused');
  setMotion(paused); storage.set('motion', paused ? 'paused' : 'playing');
  if (!paused) window.journalTransitions.settle(false);
});
if ('IntersectionObserver' in window && !reducedMotion.matches) {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => { if (entry.isIntersecting) { entry.target.classList.add('visible'); observer.unobserve(entry.target); } });
  }, { threshold: 0.07 });
  document.querySelectorAll('.reveal').forEach((element) => observer.observe(element));
  document.body.classList.add('js-reveal');
}
let dialogTrigger;
function openDialog(name, trigger) {
  dialogTrigger = trigger; $('#' + name + '-dialog').showModal();
}
document.querySelectorAll('[data-open]').forEach((button) => button.addEventListener('click', () => openDialog(button.dataset.open, button)));
document.querySelectorAll('dialog').forEach((dialog) => {
  dialog.querySelector('.dialog-close').addEventListener('click', () => window.journalTransitions.closeDialog(dialog));
  dialog.addEventListener('cancel', (event) => { event.preventDefault(); window.journalTransitions.closeDialog(dialog); });
  dialog.addEventListener('click', (event) => {
    const rect = dialog.getBoundingClientRect();
    if (event.target === dialog && (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom)) window.journalTransitions.closeDialog(dialog);
  });
  dialog.addEventListener('close', () => dialogTrigger?.focus());
});
let bookmarked = storage.get('bookmark') === 'yes';
function renderBookmark() {
  $('#bookmark').setAttribute('aria-pressed', String(bookmarked));
  $('#bookmark').querySelector('span').textContent = bookmarked ? 'A little line, bookmarked' : 'Keep this little line';
}
renderBookmark();
$('#bookmark').addEventListener('click', () => {
  bookmarked = !bookmarked;
  const saved = storage.set('bookmark', bookmarked ? 'yes' : 'no');
  renderBookmark();
  toast(bookmarked ? (saved ? 'Bookmarked on this device. A little line to come back to. ♡' : 'Bookmarked for this visit. Device storage is unavailable.') : 'Bookmark removed.');
});
$('#reminder').addEventListener('click', () => {
  const now = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  const calendar = [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Rose Journal//Book Reminder//EN', 'CALSCALE:GREGORIAN',
    'BEGIN:VEVENT', 'UID:hishika-december-check-2026@rose-journal', 'DTSTAMP:' + now,
    'DTSTART;VALUE=DATE:20261201', 'DTEND;VALUE=DATE:20261202',
    'SUMMARY:Check for Hishika’s new poetry collection',
    'DESCRIPTION:Check the reference journal for news of the December 2026 collection. The exact release date has not been announced.',
    'URL:https://hishika.netlify.app/', 'END:VEVENT', 'END:VCALENDAR'
  ].join('\r\n');
  download('a-little-december-reminder.ics', calendar + '\r\n', 'text/calendar;charset=utf-8');
  toast('Your reminder file is ready. Open it in your calendar to add it.');
});
$('#dedication-download').addEventListener('click', () => {
  const name = $('#dedication').value.trim();
  download('signed-copy-dedication.txt', 'Dedication request for Us, Unscripted\n\n' + (name ? 'Please make the signed copy out to: ' + name : 'A signed copy without a personal dedication.') + '\n\nThis is a prepared note, not a placed order. The signed-copy order link has not been provided.');
  toast('Your dedication note is ready to keep. ♡');
});
const form = $('#letter-form');
const message = $('#letter-message');
function countCharacters() { $('#character-count').textContent = message.value.length.toLocaleString('en-IN') + ' / 4,000'; }
message.addEventListener('input', () => { countCharacters(); message.setCustomValidity(''); });
const rawDraft = storage.get('draft');
let restoredDraft = false;
if (rawDraft) {
  try {
    const draft = JSON.parse(rawDraft);
    if (draft && typeof draft.message === 'string' && typeof draft.name === 'string') {
      message.value = draft.message.slice(0, 4000); $('#letter-name').value = draft.name.slice(0, 100);
      restoredDraft = true;
      if (typeof draft.type === 'string' && Array.from($('#letter-type').options).some((option) => option.value === draft.type)) $('#letter-type').value = draft.type;
      $('#draft-status').textContent = 'Your saved draft is here. It stays on this device.';
    }
  } catch { /* An invalid stored draft leaves the writing space empty. */ }
}
countCharacters();
const draftButton = $('#save-draft');
const draftSnapshot = () => JSON.stringify({ type: $('#letter-type').value, message: message.value, name: $('#letter-name').value });
let lastSavedDraft = restoredDraft ? draftSnapshot() : null;
if (lastSavedDraft) draftButton.textContent = 'Update saved draft';
function updateDraftStatus() {
  const unchanged = lastSavedDraft === draftSnapshot();
  const status = unchanged ? 'Your saved draft is up to date. Nothing has been sent.' : 'Your edits aren’t saved yet. Save a draft to keep them on this device.';
  if ($('#draft-status').textContent !== status) $('#draft-status').textContent = status;
  draftButton.textContent = unchanged ? 'Update saved draft' : 'Save changes';
}
form.addEventListener('input', updateDraftStatus);
form.addEventListener('change', updateDraftStatus);
$('#save-draft').addEventListener('click', () => {
  const saved = storage.set('draft', draftSnapshot());
  if (saved) { lastSavedDraft = draftSnapshot(); draftButton.textContent = 'Draft saved ♡'; }
  $('#draft-status').textContent = saved ? 'Draft saved on this device. Nothing has been sent.' : 'This browser cannot save drafts. Download a copy to keep your letter.';
});
let sealedLetter = '';
$('#download-letter').addEventListener('click', () => { download('a-little-letter.txt', sealedLetter); toast('Your letter is ready to keep. Your words stay yours. ♡'); });
function petals(trigger) {
  if (reducedMotion.matches || document.body.classList.contains('motion-paused')) return;
  const rect = trigger.getBoundingClientRect();
  const centerX = rect.left + rect.width / 2, centerY = rect.top + rect.height / 2;
  for (let i = 0; i < 16; i++) {
    const petal = document.createElement('span'); petal.className = 'petal';
    petal.textContent = ['✿', '♡', '✧'][i % 3];
    petal.style.left = centerX + 'px'; petal.style.top = centerY + 'px';
    petal.style.setProperty('--dx', (Math.random() - .5) * 300 + 'px');
    petal.style.setProperty('--dy', -(Math.random() * 170 + 50) + 'px');
    petal.style.setProperty('--dr', (Math.random() - .5) * 260 + 'deg');
    $('#petals').append(petal); petal.addEventListener('animationend', () => petal.remove(), { once: true });
    setTimeout(() => petal.remove(), 2000);
  }
}
[$('#wish'), $('.flower-one')].forEach((button) => button.addEventListener('click', () => { petals(button); toast('Here’s to the little things you’re hoping for. ✧'); }));
