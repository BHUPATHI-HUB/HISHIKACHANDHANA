'use strict';
// Reuse app.js's native dialog opening, closing and focus return.
(() => {
  const dialog = document.querySelector('#album-dialog');
  const photos = [...document.querySelectorAll('.album-photo')];
  const image = dialog.querySelector('#album-view-image');
  const frame = dialog.querySelector('.album-view-frame');
  const status = dialog.querySelector('#album-image-status');
  const choices = [...dialog.querySelectorAll('[data-album-select]')];
  let current = 0;
  let pendingImage;

  function showPhoto(index) {
    current = (index + photos.length) % photos.length;
    const source = photos[current].querySelector('img');
    const caption = photos[current].querySelector('.photo-caption').textContent.trim();
    dialog.querySelector('#album-view-caption').textContent = caption;
    dialog.querySelector('#album-view-count').textContent = `${current + 1} / ${photos.length}`;
    choices.forEach(button => button.setAttribute('aria-pressed', String(Number(button.dataset.albumSelect) === current)));
    image.hidden = true;
    image.alt = source.alt;
    frame.setAttribute('aria-busy', 'true');
    status.hidden = false;
    status.textContent = 'Opening this little moment…';
    // An obsolete request must never replace a newer selected photo.
    const requested = new Image();
    pendingImage = requested;
    requested.onload = () => {
      if (pendingImage !== requested) return;
      image.src = requested.src;
      image.hidden = false;
      frame.setAttribute('aria-busy', 'false');
      status.hidden = true;
    };
    requested.onerror = () => {
      if (pendingImage !== requested) return;
      frame.setAttribute('aria-busy', 'false');
      status.textContent = 'This photo couldn’t load. Choose another photo or reopen this one to try again.';
    };
    requested.src = source.src;
  }
  document.querySelectorAll('[data-album-index]').forEach(button => {
    button.addEventListener('click', () => {
      showPhoto(Number(button.dataset.albumIndex));
      openDialog('album', button);
    });
  });
  dialog.querySelector('#album-previous').addEventListener('click', () => showPhoto(current - 1));
  dialog.querySelector('#album-next').addEventListener('click', () => showPhoto(current + 1));
  choices.forEach(button => button.addEventListener('click', () => showPhoto(Number(button.dataset.albumSelect))));
  dialog.addEventListener('keydown', event => {
    if (event.altKey || event.ctrlKey || event.metaKey) return;
    if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
      event.preventDefault();
      showPhoto(current + (event.key === 'ArrowRight' ? 1 : -1));
    }
  });
  dialog.addEventListener('close', () => { pendingImage = null; });
})();
