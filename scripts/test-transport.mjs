import fs from 'node:fs';
import vm from 'node:vm';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../extension');
const sent = [];
class RequestMock {
  constructor(input, init = {}) {
    this.url = typeof input === 'string' ? input : input.url;
    this.method = init.method || input.method || 'GET';
    this.body = init.body ?? input.body;
  }
  clone() { return new RequestMock(this); }
  async text() { return this.body || ''; }
}
const context = {
  URL, URLSearchParams, Request: RequestMock, console,
  location: {hostname:'chatgpt.com', origin:'https://chatgpt.com', href:'https://chatgpt.com/'},
  document: {documentElement:null, addEventListener(){}},
  navigator: {sendBeacon(_url,data){sent.push(data);return true}},
  XMLHttpRequest: class {open(method,url){this.method=method;this.url=url} send(body){sent.push(body)}},
  window: {addEventListener(){}, postMessage(){}, WebSocket: class {constructor(url){this.url=url} send(data){sent.push(data)}}, fetch(input, init){sent.push(init?.body ?? input.body);return Promise.resolve({ok:true})}},
};
context.window.window = context.window;
vm.createContext(context);
for(const name of ['platforms.js','redact-core.js','injected.js']) vm.runInContext(fs.readFileSync(path.join(root,name),'utf8'), context, {filename:name});
await context.window.fetch('/backend-api/f/conversation',{method:'POST',body:JSON.stringify({messages:[{content:'ana@empresa.com'}]})});
await context.window.fetch(new RequestMock('/backend-api/f/conversation',{method:'POST',body:'carlos@empresa.com'}),{credentials:'same-origin'});
await context.window.fetch('/backend-api/f/conversation',{method:'POST',body:'prueba@empresa.com'});
await context.window.fetch('/backend-api/f/conversation',{method:'POST',body:new URLSearchParams({message:'eva@empresa.com'})});
const xhr = new context.XMLHttpRequest();xhr.open('POST','/backend-api/f/conversation');xhr.send('{"message":"luis@empresa.com"}');
const ws = new context.window.WebSocket('wss://chatgpt.com/backend-api/conversation');
ws.send('{"message":"websocket@empresa.com"}');
context.navigator.sendBeacon('/backend-api/f/conversation','{"message":"beacon@empresa.com"}');
if(sent.length !== 7 || sent.some(s => !String(s).includes('DLP_EMAIL') || /(?:ana|carlos|prueba|eva|luis|websocket|beacon)@empresa\.com/.test(String(s)))) throw Error(JSON.stringify(sent));
console.log('ok: fetch, Request con init, texto, URLSearchParams, XHR, WebSocket y sendBeacon salen redactados');
