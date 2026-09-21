/**
 * All apps share the platform origin, so their localStorage/sessionStorage keys and
 * IndexedDB database names would collide (e.g. two apps from the same template share
 * `appIdentity.id`). This script, injected before any app code, transparently prefixes
 * them with `app:<slug>:` without touching the app sources.
 */
export function storageShimScript(slug: string): string {
  const prefix = JSON.stringify(`app:${slug}:`);
  return `(function(){var P=${prefix};
var S=Storage.prototype,gi=S.getItem,si=S.setItem,ri=S.removeItem,ki=S.key;
var len=Object.getOwnPropertyDescriptor(S,"length").get;
function own(s){var r=[];for(var i=0,n=len.call(s);i<n;i++){var k=ki.call(s,i);if(k!==null&&k.indexOf(P)===0)r.push(k)}return r}
S.getItem=function(k){return gi.call(this,P+k)};
S.setItem=function(k,v){return si.call(this,P+k,v)};
S.removeItem=function(k){return ri.call(this,P+k)};
S.key=function(i){var k=own(this)[i];return k===undefined?null:k.slice(P.length)};
S.clear=function(){var s=this;own(s).forEach(function(k){ri.call(s,k)})};
Object.defineProperty(S,"length",{configurable:true,get:function(){return own(this).length}});
if(typeof IDBFactory!=="undefined"){var I=IDBFactory.prototype,op=I.open,del=I.deleteDatabase,dbs=I.databases;
I.open=function(n,v){return arguments.length>1?op.call(this,P+n,v):op.call(this,P+n)};
I.deleteDatabase=function(n){return del.call(this,P+n)};
if(dbs)I.databases=function(){return dbs.call(this).then(function(l){return l.filter(function(d){return d.name&&d.name.indexOf(P)===0}).map(function(d){return {name:d.name.slice(P.length),version:d.version}})})};}
})();`;
}

/**
 * A small floating "back to workspace" pill, styled like Toolcraft panels. It lives in a
 * Shadow DOM so neither the app's CSS nor ours leak across, and it shrinks to an icon
 * after a moment so it never competes with the app UI.
 */
export function backButtonScript(): string {
  return `(function(){function mount(){if(document.getElementById("platform-back"))return;
var host=document.createElement("div");host.id="platform-back";host.style.cssText="position:fixed;top:10px;left:10px;z-index:2147483646";
var root=host.attachShadow({mode:"closed"});
root.innerHTML='<style>a{all:initial;box-sizing:border-box;display:flex;align-items:center;gap:6px;height:28px;padding:0 7px;border-radius:9px;border:1px solid rgb(255 255 255 / .09);background:rgb(38 38 38 / .72);-webkit-backdrop-filter:blur(40px) saturate(1.5);backdrop-filter:blur(40px) saturate(1.5);color:rgb(250 250 250 / .72);font:500 12px/1 "Inter Variable",ui-sans-serif,system-ui,sans-serif;letter-spacing:-.01em;cursor:pointer;transition:color .15s,border-color .15s,background .15s;overflow:hidden;white-space:nowrap}a:hover,a:focus-visible{color:#fff;border-color:rgb(255 255 255 / .18);background:rgb(38 38 38 / .9);outline:none}svg{flex:none;width:14px;height:14px}span{max-width:120px;transition:max-width .3s ease,opacity .2s}:host(.c) a:not(:hover):not(:focus-visible) span{max-width:0;opacity:0}:host(.c) a:not(:hover):not(:focus-visible){padding:0 6px;gap:0}</style><a href="/" title="Back to your apps"><svg viewBox="0 0 256 256" fill="currentColor"><path d="M224 128a8 8 0 0 1-8 8H59.31l58.35 58.34a8 8 0 0 1-11.32 11.32l-72-72a8 8 0 0 1 0-11.32l72-72a8 8 0 0 1 11.32 11.32L59.31 120H216a8 8 0 0 1 8 8Z"/></svg><span>Your apps</span></a>';
document.body.appendChild(host);setTimeout(function(){host.classList.add("c")},2500)}
if(document.body)mount();else document.addEventListener("DOMContentLoaded",mount)})();`;
}

export function injectIntoHtml(html: string, slug: string): string {
  const tag = `<script>${storageShimScript(slug)}</script>`;
  const headMatch = html.match(/<head[^>]*>/i);
  const withShim =
    !headMatch || headMatch.index === undefined
      ? tag + html
      : html.slice(0, headMatch.index + headMatch[0].length) + tag + html.slice(headMatch.index + headMatch[0].length);
  const back = `<script>${backButtonScript()}</script>`;
  return /<\/body>/i.test(withShim) ? withShim.replace(/<\/body>/i, `${back}</body>`) : withShim + back;
}
