const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
module.exports=function makeRuntime(root,options={}){
 let document;
 class Node{
  constructor(tag='#text',attrs={}){this.tagName=tag.toUpperCase();this.attrs={...attrs};this.children=[];this.events={};this.dataset={};this.style={};this.hidden='hidden'in attrs;this.checked='checked'in attrs;this.disabled='disabled'in attrs;this.open=false;this._value=attrs.value||'';this._text='';this.clientHeight=300;this.offsetWidth=100;for(const[k,v]of Object.entries(attrs))if(k.startsWith('data-'))this.dataset[k.slice(5).replace(/-([a-z])/g,(_,c)=>c.toUpperCase())]=v}
  get id(){return this.attrs.id}set id(v){this.attrs.id=v}
  get src(){return this.attrs.src}set src(v){this.attrs.src=v}
  get name(){return this.attrs.name}set name(v){this.attrs.name=v}
  get value(){return this._value}set value(v){this._value=v}
  get className(){return this.attrs.class||''}set className(v){this.attrs.class=v}
  get classList(){const n=this;return{contains:v=>n.className.split(/\s+/).includes(v),add:(...a)=>{for(const v of a)if(!n.classList.contains(v))n.className+=' '+v},remove:(...a)=>n.className=n.className.split(/\s+/).filter(v=>!a.includes(v)).join(' '),toggle:(v,on)=>{on=on??!n.classList.contains(v);on?n.classList.add(v):n.classList.remove(v);return on}}}
  get textContent(){return this._text+this.children.map(n=>n.textContent).join('')}set textContent(v){this._text=String(v);this.children=[]}
  get innerText(){return this.textContent}set innerText(v){this.textContent=v}
  get innerHTML(){return this._html||this.textContent}set innerHTML(v){this._html=v;this.children=[];this._text='';parse(v,this)}
  setAttribute(k,v){this.attrs[k]=String(v)}getAttribute(k){return this.attrs[k]??null}removeAttribute(k){delete this.attrs[k]}
  append(...nodes){for(let n of nodes){if(typeof n==='string')n=document.createTextNode(n);n.parentElement=this;this.children.push(n)}}
  appendChild(n){this.append(n);return n}replaceChildren(...nodes){this.children=[];this._text='';this.append(...nodes)}
  remove(){if(this.parentElement)this.parentElement.children=this.parentElement.children.filter(n=>n!==this)}
  addEventListener(t,f){(this.events[t]??=[]).push(f)}removeEventListener(t,f){this.events[t]=(this.events[t]||[]).filter(x=>x!==f)}
  dispatch(t,extra={}){const e={target:this,currentTarget:this,preventDefault(){},...extra};const p=[];if(this['on'+t])p.push(this['on'+t](e));for(const f of [...this.events[t]||[]])p.push(f(e));return Promise.all(p)}
  click(){if(!this.disabled)return this.dispatch('click')}
  focus(){document.activeElement=this}showModal(){this.open=true}close(){this.open=false}
  matches(s){const parts=s.trim().split(/\s+/);if(parts.length>1){const last=parts.pop();if(!this.matches(last))return false;let n=this.parentElement;while(n){if(n.matches(parts.join(' ')))return true;n=n.parentElement}return false}if(s.includes(':checked')&&!this.checked)return false;s=s.replace(':checked','');const id=s.match(/#([\w-]+)/);if(id&&this.id!==id[1])return false;const tag=s.match(/^[\w-]+/);if(tag&&this.tagName!==tag[0].toUpperCase())return false;for(const c of s.matchAll(/\.([\w-]+)/g))if(!this.classList.contains(c[1]))return false;for(const a of s.matchAll(/\[([\w-]+)(?:="([^"]*)")?\]/g))if(a[2]!==undefined?(this[a[1]]??this.attrs[a[1]])!==a[2]:!Object.hasOwn(this.attrs,a[1]))return false;return true}
  querySelectorAll(s){return this.children.flatMap(n=>[...(n.matches(s)?[n]:[]),...n.querySelectorAll(s)])}querySelector(s){return this.querySelectorAll(s)[0]||null}
  closest(s){let n=this;while(n){if(n.matches(s))return n;n=n.parentElement}return null}
 }
 function parse(html,parent){const stack=[parent],voids=new Set(['meta','link','input','img','br','hr']);for(const token of html.matchAll(/<\/?[a-zA-Z][^>]*>|[^<]+/g)){const t=token[0];if(t.startsWith('</')){if(stack.length>1)stack.pop();continue}if(!t.startsWith('<')){const n=new Node();n.textContent=t;stack.at(-1).append(n);continue}const tag=t.match(/^<([\w-]+)/)[1],attrs={};for(const a of t.slice(tag.length+1).matchAll(/([\w-]+)(?:="([^"]*)")?/g))attrs[a[1]]=a[2]??'';const n=new Node(tag,attrs);stack.at(-1).append(n);if(!voids.has(tag)&&!t.endsWith('/>'))stack.push(n)}}
 document=new Node('document');document.createElement=tag=>new Node(tag);document.createTextNode=t=>{const n=new Node();n.textContent=t;return n};document.getElementById=id=>document.querySelector('#'+id);document.hidden=false;parse(fs.readFileSync(path.join(root,options.html||'demo.html'),'utf8'),document);document.body=document.querySelector('body');
 const clock={now:0,next:1,tasks:new Map()};function schedule(f,d,r){const id=clock.next++;clock.tasks.set(id,{f,due:clock.now+d,d,r});return id}function tick(ms){const target=clock.now+ms;for(let guard=0;guard<20000;guard++){const item=[...clock.tasks.entries()].filter(([,t])=>t.due<=target).sort((a,b)=>a[1].due-b[1].due)[0];if(!item)break;const[id,t]=item;clock.now=t.due;if(t.r)t.due+=t.d;else clock.tasks.delete(id);t.f()}clock.now=target}
 const storage=new Map([['geobr_sound_enabled','false']]);const window={location:{protocol:'file:'},matchMedia:()=>({matches:true,addEventListener(){}}),addEventListener(){},scrollTo(){}};
 const context=vm.createContext({document,window,console,Image:class{},AbortController:class{constructor(){this.signal={aborted:false}}abort(){this.signal.aborted=true}},setInterval:(f,d)=>schedule(f,d,true),setTimeout:(f,d)=>schedule(f,d,false),clearInterval:id=>clock.tasks.delete(id),clearTimeout:id=>clock.tasks.delete(id),requestAnimationFrame:f=>schedule(f,0,false),cancelAnimationFrame:id=>clock.tasks.delete(id),performance:{now:()=>clock.now},Date:class extends Date{static now(){return 1800000000000+clock.now}},localStorage:{getItem:k=>storage.get(k)??null,setItem:(k,v)=>storage.set(k,v),removeItem:k=>storage.delete(k)},confirm:()=>true,fetch:async url=>({json:async()=>JSON.parse(fs.readFileSync(path.join(root,url),'utf8'))})});
 function run(s){return vm.runInContext(s,context)}function load(file){return run(fs.readFileSync(path.join(root,file),'utf8'))}
 return {document,storage,window,run,load,tick,$:id=>document.getElementById(id),Node};
};
