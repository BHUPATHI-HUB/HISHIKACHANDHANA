const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

function setup() {
  const element = (extra = {}) => ({
    listeners: {}, attributes: {}, hidden: false, textContent: '',
    addEventListener(name, handler) { this.listeners[name] = handler; },
    setAttribute(name, value) { this.attributes[name] = value; },
    fire(name, event = {}) { this.listeners[name]?.(event); }, ...extra
  });
  const controls = Object.fromEntries(['#album-view-image', '.album-view-frame', '#album-image-status', '#album-view-caption', '#album-view-count', '#album-previous', '#album-next'].map(key => [key, element()]));
  const photos = Array.from({length: 4}, (_, index) => {
    const image = {src: `photo-${index}.jpg`, alt: `Photo ${index}`};
    const caption = {textContent: `Caption ${index}`};
    return element({dataset: {albumIndex: String(index)}, querySelector: selector => selector === 'img' ? image : caption});
  });
  const choices = photos.map((_, index) => element({dataset: {albumSelect: String(index)}}));
  const dialog = element({querySelector: key => controls[key], querySelectorAll: () => choices});
  const requests = [], openings = [];
  class Image { constructor() { requests.push(this); } }
  vm.runInNewContext(fs.readFileSync('dist/album.js', 'utf8'), {
    Image, document: {querySelector: () => dialog, querySelectorAll: selector => selector === '.album-photo' ? photos : photos},
    openDialog: (name, trigger) => openings.push({name, trigger})
  });
  return {controls, photos, choices, dialog, requests, openings};
}

test('opening uses the selected photo; arrows wrap and update the active thumbnail', () => {
  const s = setup();
  s.photos[3].fire('click');
  assert.equal(s.openings[0].trigger, s.photos[3]);
  assert.equal(s.controls['#album-view-count'].textContent, '4 / 4');
  s.controls['#album-next'].fire('click');
  assert.equal(s.controls['#album-view-count'].textContent, '1 / 4');
  assert.equal(s.choices[0].attributes['aria-pressed'], 'true');
  s.controls['#album-previous'].fire('click');
  assert.equal(s.controls['#album-view-count'].textContent, '4 / 4');
  let prevented = false;
  s.dialog.fire('keydown', {key: 'ArrowLeft', preventDefault: () => prevented = true});
  assert.equal(prevented, true);
  assert.equal(s.controls['#album-view-count'].textContent, '3 / 4');
});

test('a late photo response cannot replace a newer selection or update a closed viewer', () => {
  const s = setup();
  s.photos[0].fire('click');
  const stale = s.requests[0];
  s.choices[2].fire('click');
  const latest = s.requests[1];
  latest.onload();
  assert.equal(s.controls['#album-view-image'].src, 'photo-2.jpg');
  stale.onload();
  assert.equal(s.controls['#album-view-image'].src, 'photo-2.jpg');
  s.choices[3].fire('click');
  s.dialog.fire('close');
  s.requests[2].onload();
  assert.equal(s.controls['#album-view-image'].src, 'photo-2.jpg');
});

test('photo failure shows recovery instructions and another selection can load normally', () => {
  const s = setup();
  s.photos[0].fire('click');
  s.requests[0].onerror();
  assert.equal(s.controls['#album-image-status'].hidden, false);
  assert.match(s.controls['#album-image-status'].textContent, /couldn’t load/);
  assert.equal(s.controls['.album-view-frame'].attributes['aria-busy'], 'false');
  s.controls['#album-next'].fire('click');
  s.requests[1].onload();
  assert.equal(s.controls['#album-image-status'].hidden, true);
  assert.equal(s.controls['#album-view-image'].hidden, false);
});
