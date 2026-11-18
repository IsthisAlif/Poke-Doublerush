/* Hover and touch tooltips for moves and Pokémon stats */
const SN=["HP","Attack","Defense","Sp. Atk","Sp. Def","Speed"];
let tipK=null,LE={clientX:0,clientY:0};
document.body.insertAdjacentHTML("beforeend",'<div id="tip"></div>');
const mvTip=x=>`<b>${x.n}</b> ${tpl([x.ty])}<br>${cap(x.cls)} · Power ${x.pw||"—"} · Accuracy ${x.acc||"—"}${x.pri?` · Priority ${x.pri>0?"+":""}${x.pri}`:""}<br><small>${x.ds}</small>`;
function monTip(m){
 const rows=m.s.map((v,i)=>{const g=i?m.sg[i]:0,now=i?Math.floor(S(m,i)):m.hp+"/"+m.mhp,c=i&&now>v?"#1f8f45":i&&now<v?"#c0392b":"inherit";
  return`<tr><td>${SN[i]}</td><td>${i?v:m.mhp}</td><td>${g?(g>0?"+":"")+g:"—"}</td><td style="font-weight:700;color:${c}">${now}</td></tr>`}).join("");
 return`<b>${m.n}</b> Lv50 ${tpl(tys(m))}${m.st?` <b style="color:#c0392b">${m.st.toUpperCase()}</b>`:""}${m.conf?" <b>CONFUSED</b>":""}<br><small>Ability: ${cap(m.ab)} · Item: ${m.item?m.item.n:"none"}</small><table><tr><th></th><th>Stat</th><th>Stage</th><th>Now</th></tr>${rows}</table>`;
}
function tipHTML(k){
 if(!B||!B.me)return"";const a=k.split(":");
 if(a[0]=="m"){const m=B.ui?B.me.f[B.ui.i]:null,x=m&&m.mv[+a[1]];return x?mvTip(x):""}
 const m=B[a[1]].f[+a[2]];return m?monTip(m):"";
}
function showTip(){
 const t=$("tip"),h=tipK?tipHTML(tipK):"";
 if(!h){t.style.display="none";return}
 t.innerHTML=h;t.style.display="block";
 const w=t.offsetWidth,hh=t.offsetHeight;
 t.style.left=Math.max(4,Math.min(innerWidth-w-4,LE.clientX+16))+"px";
 t.style.top=Math.max(4,Math.min(innerHeight-hh-4,TOUCH?LE.clientY-hh-28:LE.clientY+16))+"px";
}
document.addEventListener("mouseover",e=>{if(TOUCH)return;LE=e;const t=e.target.closest&&e.target.closest("[data-t]");tipK=t?t.dataset.t:null;showTip()});
document.addEventListener("mousemove",e=>{if(TOUCH)return;LE=e;if(tipK)showTip()});
if(TOUCH){let tm=null,held=0;
 document.addEventListener("touchstart",e=>{clearTimeout(tm);held=0;const c=e.touches[0];LE={clientX:c.clientX,clientY:c.clientY};
  const t=e.target.closest("[data-t]");
  if(!t){tipK=null;showTip();return}
  const k=t.dataset.t;
  if(k[0]=="p"){tipK=tipK==k?null:k;showTip();return}
  tm=setTimeout(()=>{held=1;tipK=k;showTip()},380)},{passive:true});
 document.addEventListener("touchmove",()=>clearTimeout(tm),{passive:true});
 document.addEventListener("touchend",e=>{clearTimeout(tm);if(held){e.preventDefault();held=0}},{passive:false});
}
