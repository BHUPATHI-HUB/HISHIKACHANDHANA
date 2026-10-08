const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync(require('node:path').resolve(__dirname,'../dist/intro.js'),'utf8');
function setup({reduced=false,paused=false,width=1280,height=800,unsupported=false,failAnimation=false}={}) {
  let now=0,id=0; const timers=new Map(), records=[];
  class Target {
    constructor(){this.listeners={};}
    addEventListener(type,fn){(this.listeners[type] ||= []).push(fn);}
    removeEventListener(type,fn){this.listeners[type]=(this.listeners[type]||[]).filter(x=>x!==fn);}
    emit(type,event={}){for(const fn of [...(this.listeners[type]||[])])fn(event);}
  }
  class Element extends Target {
    constructor(){super();this.children=[];this.attributes={};this.style={setProperty(){}};this.classes=new Set();this.classList={add:(...xs)=>xs.forEach(x=>this.classes.add(x)),remove:(...xs)=>xs.forEach(x=>this.classes.delete(x)),contains:x=>this.classes.has(x)};}
    append(node){node.remove();this.children.push(node);node.parentNode=this;}
    insertBefore(node,before){node.remove();const index=this.children.indexOf(before);this.children.splice(index<0?this.children.length:index,0,node);node.parentNode=this;}
    remove(){if(this.parentNode)this.parentNode.children=this.parentNode.children.filter(x=>x!==this);this.parentNode=null;}
    getAttribute(name){return this.attributes[name]??null;}
    setAttribute(name,value){this.attributes[name]=value;}
    removeAttribute(name){delete this.attributes[name];if(name==='style')this.style={setProperty(){}};}
    getBoundingClientRect(){return{left:width<650?21:50,top:55,width:width<650?220:270,height:38};}
    contains(node){return node===this||this.children.some(x=>x.contains(node));}
    replaceChildren(){this.children.forEach(x=>x.parentNode=null);this.children=[];}
    focus(){document.activeElement=this;}
    querySelectorAll(){return sections;}
    animate(frames,options){if(failAnimation)throw Error('Animation unavailable');const record={node:this,frames,options,cancelled:false,cancel(){this.cancelled=true;}};records.push(record);return record;}
  }
  const root=new Element(),page=new Element(),screen=new Element(),brand=new Element(),home=new Element(),paper=new Element(),garden=new Element(),skip=new Element();
  const portrait=new Element();
  const sections=[new Element(),new Element(),new Element(),new Element()];
  page.append(home);home.append(brand);screen.append(paper);screen.append(garden);screen.append(skip);root.classList.add('intro-pending');
  if(unsupported)brand.animate=null;
  const document={documentElement:root,activeElement:null,querySelector:s=>({'#journal-page':page,'#journal-intro':screen,'.site-header .brand':brand})[s],createElement:()=>new Element()};
  screen.querySelector=s=>({'.intro-paper':paper,'.intro-garden':garden,'.intro-skip':skip,'.intro-portrait':portrait})[s];
  const motion=new Target();motion.matches=reduced;
  const window=new Target();Object.assign(window,{innerWidth:width,innerHeight:height,scrollY:0,matchMedia:()=>motion,journalIntroFallback:999});
  vm.runInNewContext(source,{document,window,localStorage:{getItem:()=>paused?'paused':null},Math,Promise,setTimeout:(fn,delay)=>{const key=++id;timers.set(key,{fn,time:now+delay});return key;},clearTimeout:key=>timers.delete(key)});
  function tick(ms){const end=now+ms;while(true){const next=[...timers].filter(([,t])=>t.time<=end).sort((a,b)=>a[1].time-b[1].time)[0];if(!next)break;now=next[1].time;timers.delete(next[0]);next[1].fn();}now=end;}
  function restored(){assert.equal(brand.parentNode,home);assert.equal(home.children.length,1);assert.equal(page.inert,false);assert(screen.hidden);assert(!root.classList.contains('intro-active'));assert(!root.classList.contains('intro-pending'));assert.equal(brand.getAttribute('style'),null);assert.equal(brand.getAttribute('tabindex'),null);assert(records.every(x=>x.cancelled));assert.equal(garden.children.length,0);}
  return {root,page,screen,brand,home,paper,garden,skip,portrait,motion,window,document,records,tick,restored};
}
for(const width of [360,390,768,1440]) {
  const h=setup({width}); assert(h.page.inert); assert(h.root.classList.contains('intro-active'));assert.equal(h.brand.parentNode,h.screen);assert.equal(h.home.children.length,1);assert.equal(h.garden.children.length,14);
  assert.equal(h.records[0].options.duration,1300);
  assert.equal(h.records.filter(x=>x.node===h.portrait).length,1);
  h.tick(4299);assert(!h.root.classList.contains('intro-revealing'));h.tick(1);assert(h.root.classList.contains('intro-revealing'));assert(h.page.inert);
  const returns=h.records.filter(x=>x.node===h.brand);assert.equal(returns.length,2);assert.equal(returns[1].options.duration,1900);
  h.tick(1899);assert(h.window.journalIntro.active);h.tick(1);h.restored();assert(!h.window.journalIntro.active);
}
for(const mode of [{reduced:true},{paused:true}]){
  const h=setup(mode);assert.equal(h.brand.parentNode,h.home);assert.equal(h.garden.children.length,0);assert.equal(h.records.length,2);assert(h.records.every(x=>x.options.duration===400));h.tick(399);assert(h.page.inert);h.tick(1);h.restored();
}
for(const interruption of ['skip','resize','journal-intro-timeout','pageshow','motion']){
  const h=setup();h.tick(2300);
  if(interruption==='skip'){h.document.activeElement=h.skip;h.skip.emit('click');assert.equal(h.document.activeElement,h.brand);}
  else if(interruption==='motion'){h.motion.matches=true;h.motion.emit('change');}
  else h.window.emit(interruption,{persisted:true});
  h.restored();h.tick(15000);h.restored();
}
setup({unsupported:true}).restored();setup({failAnimation:true}).restored();
console.log('PASS: 6.2s lifecycle, mobile/desktop geometry setup, one original logo, scroll/control unlock, 0.4s reduced-motion fade, skip/focus, resize, back-cache, loading/error recovery.');
