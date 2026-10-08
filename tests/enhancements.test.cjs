const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const project=require('node:path').resolve(__dirname,'..')+'/';
class Node {
  constructor(){this.events={};this.style={};this.value='';this.textContent='';this.attributes={};this.disabled=false;this.children={};this.classes=new Set();this.classList={toggle:(name,on)=>on?this.classes.add(name):this.classes.delete(name),contains:name=>this.classes.has(name),add:name=>this.classes.add(name),remove:name=>this.classes.delete(name)};}
  addEventListener(name,fn){(this.events[name] ||= []).push(fn);}
  async emit(name,event={}){for(const fn of this.events[name]||[])await fn(event);}
  setAttribute(name,value){this.attributes[name]=value;}
  removeAttribute(name){delete this.attributes[name];}
  querySelector(selector){return this.children[selector] ||= new Node();}
  focus(){this.focused=true;}
  select(){this.selected=true;}
  getBoundingClientRect(){return{top:this.top};}
}
function sharing(navigator={},href='https://example.com/?fbclid=123&utm_source=ig&edition=rose#books'){
  const nodes={},opened=[],toasts=[],frames=[];
  const find=s=>nodes[s] ||=new Node();
  const links=['books','december','letters'].map(id=>Object.assign(new Node(),{hash:'#'+id}));
  const sections=['books','december','letters','letterbox'].map((id,i)=>Object.assign(new Node(),{id,top:1000+i*1000}));
  const floral=Array.from({length:5},()=>new Node());const motion=Object.assign(new Node(),{matches:false});
  const document={body:new Node(),title:'The journal',documentElement:{scrollHeight:3000},querySelector:find,querySelectorAll:selector=>selector==='[data-floral-link]'?floral:links,getElementById:id=>sections.find(s=>s.id===id)};
  const window=Object.assign(new Node(),{matchMedia:()=>motion,location:{href},innerHeight:1000,scrollY:0,requestAnimationFrame:fn=>frames.push(fn)});
  vm.runInNewContext(fs.readFileSync(project+'dist/enhancements.js','utf8'),{document,window,navigator,URL,setTimeout,clearTimeout,toast:s=>toasts.push(s),openDialog:(name,trigger)=>opened.push({name,trigger})});
  return{find,links,floral,motion,document,sections,window,frames,opened,toasts,flush:()=>{while(frames.length)frames.shift()();}};
}
function drafts(raw=null,blocked=false){
  const nodes={},writes=[],values=new Map(raw===null?[]:[['hishika:draft',raw]]);
  const find=s=>nodes[s] ||=new Node();
  find('#letter-type').value='A little letter';find('#letter-type').options=[{value:'A little letter'},{value:'A simple hello'}];
  const document={querySelector:find,querySelectorAll:()=>[],body:new Node(),documentElement:new Node()};
  const localStorage={getItem:key=>values.get(key)??null,setItem:(key,value)=>{if(blocked)throw Error('Quota');writes.push(key);values.set(key,value);}};
  vm.runInNewContext(fs.readFileSync(project+'dist/app.js','utf8'),{document,window:{matchMedia:()=>({matches:false}),journalTransitions:{settle(){}}},localStorage,setTimeout,clearTimeout,Date,URL,Blob});
  return{find,writes,values};
}
(async()=>{
  let h=sharing();await h.find('#share-journal').emit('click');assert.equal(h.opened[0].name,'share');assert.equal(h.find('#share-url').value,'https://example.com/?edition=rose#books');assert(!h.find('#share-journal').disabled);
  await h.find('#copy-journal-link').emit('click');assert(h.find('#share-url').focused&&h.find('#share-url').selected);assert(!h.find('#copy-journal-link').disabled);
  let sent;h=sharing({share:async data=>sent=data});await h.find('#share-journal').emit('click');assert.equal(sent.url,'https://example.com/?edition=rose#books');assert.equal(h.opened.length,0);
  h=sharing({share:async()=>{throw{name:'AbortError'};}});await h.find('#share-journal').emit('click');assert.equal(h.opened.length,0);assert(!h.find('#share-journal').disabled);
  h=sharing({share:async()=>{throw{name:'NotAllowedError'};}});await h.find('#share-journal').emit('click');assert.equal(h.opened.length,1);
  h=sharing({canShare:()=>false,share:async()=>assert.fail('Unsupported native share used')});await h.find('#share-journal').emit('click');assert.equal(h.opened.length,1);
  let copied;h=sharing({clipboard:{writeText:async s=>copied=s}});await h.find('#share-journal').emit('click');await h.find('#copy-journal-link').emit('click');assert.equal(copied,h.find('#share-url').value);assert.equal(h.find('#copy-journal-link').textContent,'Copied ♡');
  h=sharing({clipboard:{writeText:async()=>{throw Error('Denied');}}});await h.find('#copy-journal-link').emit('click');assert(h.find('#share-url').selected);assert(!h.find('#copy-journal-link').disabled);
  h=sharing({},'file:///private/site/index.html');await h.find('#share-journal').emit('click');assert.equal(h.opened.length,0);assert.equal(h.toasts.length,1);
  h=sharing();h.flush();assert(h.links.every(link=>!link.attributes['aria-current']));h.sections[0].top=100;await h.window.emit('scroll');await h.window.emit('scroll');assert.equal(h.frames.length,1);h.flush();assert.equal(h.links[0].attributes['aria-current'],'location');
  h.sections[3].top=100;h.window.scrollY=4000;await h.window.emit('scroll');h.flush();assert.equal(h.links[2].attributes['aria-current'],'location');assert.equal(h.find('.reading-progress span').style.transform,'scaleX(1)');assert(!h.links[0].attributes['aria-current']);
  h.window.scrollY=-100;await h.window.emit('scroll');h.flush();assert.equal(h.find('.reading-progress span').style.transform,'scaleX(0)');
  h=sharing();let prevented=false;await h.floral[0].emit('click',{preventDefault:()=>prevented=true});assert(h.floral[0].classList.contains('link-celebrate'));assert(!prevented);h.motion.matches=true;await h.motion.emit('change');assert(!h.floral[0].classList.contains('link-celebrate'));await h.floral[1].emit('click');assert(!h.floral[1].classList.contains('link-celebrate'));h.motion.matches=false;h.document.body.classList.add('motion-paused');await h.floral[1].emit('click');assert(!h.floral[1].classList.contains('link-celebrate'));
  let d=drafts();d.find('#letter-message').value='A thought';await d.find('#letter-form').emit('input');assert.equal(d.writes.length,0);assert(d.find('#draft-status').textContent.includes('aren’t saved'));await d.find('#save-draft').emit('click');assert.equal(JSON.parse(d.values.get('hishika:draft')).message,'A thought');assert.equal(d.find('#save-draft').textContent,'Draft saved ♡');
  d.find('#letter-message').value='Another thought';await d.find('#letter-form').emit('input');assert.equal(d.find('#save-draft').textContent,'Save changes');assert.equal(d.writes.length,1);d.find('#letter-message').value='A thought';await d.find('#letter-form').emit('input');assert(d.find('#draft-status').textContent.includes('up to date'));
  d=drafts('{bad json');assert.equal(d.find('#save-draft').textContent,'');assert.equal(d.find('#letter-message').value,'');
  d=drafts(JSON.stringify({message:'hello',name:'Reader',type:'A simple hello'}));assert.equal(d.find('#save-draft').textContent,'Update saved draft');assert.equal(d.find('#letter-type').value,'A simple hello');
  d=drafts(null,true);d.find('#letter-message').value='hello';await d.find('#save-draft').emit('click');assert(d.find('#draft-status').textContent.includes('cannot save'));assert.equal(d.writes.length,0);
  console.log('PASS: floral link feedback/reduced motion, native share, cancellation/fallback, clean URLs, clipboard/manual copy, navigation/progress clamping, frame coalescing, explicit-only draft saves, invalid drafts and storage failure.');
})();
