const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync(require('node:path').resolve(__dirname,'../dist/transitions.js'), 'utf8');
function setup({ reduced = false, paused = false } = {}) {
  let now = 0, sequence = 0, reloads = 0;
  const timers = new Map(), nodes = [], assignments = [];
  class Target {
    constructor() { this.listeners = {}; }
    addEventListener(type, fn) { (this.listeners[type] ||= []).push(fn); }
    emit(type, event = {}) { for (const fn of this.listeners[type] || []) fn(event); }
  }
  class Element extends Target {
    constructor() {
      super(); this.classes = new Set(); this.children = []; this.scrollLeft = 0; this.scrollTop = 0;
      this.classList = { add: (...a) => a.forEach(v => this.classes.add(v)), remove: (...a) => a.forEach(v => this.classes.delete(v)), contains: v => this.classes.has(v) };
      this.style = { setProperty() {} }; this.disabled = false; nodes.push(this);
    }
    append(node) { node.parent = this; this.children.push(node); }
    remove() { if (this.parent) this.parent.children = this.parent.children.filter(x => x !== this); this.removed = true; }
    setAttribute() {}
    closest() { return null; }
    getBoundingClientRect() { return { left: 0, top: 0 }; }
    close() { this.open = false; this.closes = (this.closes || 0) + 1; }
  }
  const body = new Element(), refresh = new Element(), sparkles = new Element();
  const document = new Target();
  document.body = body;
  document.querySelector = selector => selector === '#journal-refresh' ? refresh : sparkles;
  document.querySelectorAll = () => nodes.filter(x => x.className === 'tap-sparkle' && !x.removed);
  document.createElement = () => new Element();
  const motion = new Target(); motion.matches = reduced;
  const window = new Target(); window.matchMedia = () => motion;
  window.location = { href: 'https://example.com/', reload: () => reloads++, assign: href => assignments.push(href) };
  vm.runInNewContext(source, { document, window, localStorage: { getItem: () => paused ? 'paused' : null }, URL, Math,
    setTimeout: (fn, delay) => { const id = ++sequence; timers.set(id, { fn, time: now + delay }); return id; },
    clearTimeout: id => timers.delete(id) });
  function tick(ms) {
    const end = now + ms;
    while (true) {
      const next = [...timers].filter(([, t]) => t.time <= end).sort((a,b) => a[1].time - b[1].time)[0];
      if (!next) break; now = next[1].time; timers.delete(next[0]); next[1].fn();
    }
    now = end;
  }
  return { body, refresh, sparkles, document, window, motion, Element, tick, assignments, get reloads() { return reloads; }, particles: () => document.querySelectorAll('.tap-sparkle').length };
}
let h = setup();
h.refresh.emit('click'); assert(h.refresh.disabled); h.tick(299); assert.equal(h.reloads,0);
h.tick(1); assert.equal(h.reloads,1); assert(h.body.classList.contains('journal-leaving'));
h.window.emit('pageshow',{ persisted:true }); assert(!h.body.classList.contains('journal-leaving')); assert(!h.refresh.disabled);
const dialog = new h.Element(); dialog.open = true;
h.window.journalTransitions.closeDialog(dialog); h.window.journalTransitions.closeDialog(dialog);
h.tick(219); assert(dialog.open); h.tick(1); assert.equal(dialog.closes,1);
const target = new h.Element();
const pointer = { isPrimary:true, button:0, pointerId:1, clientX:80, clientY:80, target };
h.document.emit('pointerdown',pointer); h.document.emit('pointerup',pointer); assert.equal(h.particles(),3);
for(let i=0;i<12;i++) { h.document.emit('pointerdown',pointer); h.document.emit('pointerup',pointer); }
assert.equal(h.particles(),24); h.tick(850); assert.equal(h.particles(),0);
h.document.emit('pointerdown',pointer); h.document.emit('pointerup',{ ...pointer,clientY:140 }); assert.equal(h.particles(),0);
h.document.emit('pointerdown',pointer); h.document.emit('pointercancel'); h.document.emit('pointerup',pointer); assert.equal(h.particles(),0);
dialog.open=true; h.window.journalTransitions.closeDialog(dialog); h.window.journalTransitions.settle(true);
assert(!dialog.open); h.tick(500); assert.equal(dialog.closes,2);
h.refresh.emit('click'); assert.equal(h.reloads,2);
h.document.emit('pointerdown',pointer); h.document.emit('pointerup',pointer); assert.equal(h.particles(),0);
h.window.journalTransitions.settle(false); h.document.emit('pointerdown',pointer); h.document.emit('pointerup',pointer); assert.equal(h.particles(),3);
h.motion.matches=true; h.motion.emit('change'); assert.equal(h.particles(),0);
for(const options of [{reduced:true},{paused:true}]) { const quiet=setup(options); assert(!quiet.body.classList.contains('journal-entering')); quiet.refresh.emit('click'); assert.equal(quiet.reloads,1); }
h = setup(); h.tick(300);
function click(href, targetName='', mods={}) {
  let prevented=false;
  const link={href,target:targetName,hasAttribute:()=>false};
  h.document.emit('click',{target:{closest:()=>link},button:0,preventDefault:()=>prevented=true,...mods});
  return prevented;
}
assert(!click('https://example.com/#books'));
assert(!click('https://amazon.in/book','_blank'));
assert(!click('https://example.com/other','',{ctrlKey:true}));
assert(click('https://example.com/other')); h.tick(299); assert.equal(h.assignments.length,0); h.tick(1); assert.deepEqual(h.assignments,['https://example.com/other']);
h.tick(2000); assert(!h.refresh.disabled);
console.log('PASS: 300ms controlled reload, dialog closing, pause/reduced motion, tap vs scroll, particle cap/cleanup, navigation and back-cache recovery.');
