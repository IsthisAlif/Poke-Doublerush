/* Visual effects. Drawn on a fixed overlay so scene redraws never wipe them. */
const TE=["⚪","🔥","💧","⚡","🍃","❄️","👊","☠️","⛰️","🌪️","🔮","🐛","🪨","👻","🐉","🌑","⚙️","✨"];
const fxl=()=>{let l=document.getElementById("fxl");if(!l){l=document.createElement("div");l.id="fxl";document.body.appendChild(l)}return l};
function fpos(m){try{const sd=B.me.t.includes(m)?"me":"foe",i=B[sd].f.indexOf(m),e=document.querySelector(`.sp[data-t="p:${sd}:${i}"]`);if(!e)return null;const r=e.getBoundingClientRect();return{x:r.left+r.width/2,y:r.top+r.height/2,s:r.width}}catch(e){return null}}
function fpart(css,txt,kf,ms,ease){return new Promise(res=>{try{const d=document.createElement("div");d.style.cssText="position:fixed;pointer-events:none;"+css;d.textContent=txt||"";fxl().appendChild(d);const an=d.animate(kf,{duration:ms,easing:ease||"ease-out",fill:"forwards"});an.onfinish=()=>{d.remove();res()};setTimeout(()=>{d.remove();res()},ms+250)}catch(e){res()}})}
const safe=f=>async(...a)=>{try{return await f(...a)}catch(e){}};
const C0="translate(-50%,-50%)";
const fxBurst=safe(async(m,ty,big)=>{const p=fpos(m);if(!p)return;const n=big?8:5;await Promise.all([...Array(n)].map((_,i)=>{const g=i/n*6.283;return fpart(`left:${p.x}px;top:${p.y}px;font-size:${big?30:22}px;filter:drop-shadow(0 0 6px ${TC[ty]})`,TE[ty],[{transform:`${C0} scale(.3)`,opacity:1},{transform:`translate(calc(-50% + ${Math.cos(g)*(big?70:48)}px),calc(-50% + ${Math.sin(g)*(big?70:48)}px)) scale(1.3)`,opacity:0}],520)}))});
const fxShot=safe(async(s,d,ty)=>{const a=fpos(s),b=fpos(d);if(!a||!b)return;await fpart(`width:28px;height:28px;margin:-14px;border-radius:50%;background:radial-gradient(${TC[ty]},transparent 70%);box-shadow:0 0 16px ${TC[ty]}`,"",[{left:a.x+"px",top:a.y+"px"},{left:b.x+"px",top:b.y+"px"}],380,"ease-in")});
const fxAura=safe(async(m,ty)=>{const p=fpos(m);if(!p)return;await fpart(`left:${p.x}px;top:${p.y}px;width:60px;height:60px;border-radius:50%;border:4px solid ${TC[ty]};box-shadow:0 0 18px ${TC[ty]}`,"",[{transform:`${C0} scale(.5)`,opacity:1},{transform:`${C0} scale(2.2)`,opacity:0}],600)});
const fxStat=safe(async(m,up)=>{const p=fpos(m);if(!p)return;await fpart(`left:${p.x}px;top:${p.y}px;font-size:34px;font-weight:900;color:${up?"#e33":"#38f"};text-shadow:0 0 6px #fff`,up?"▲▲":"▼▼",[{transform:`${C0}`,opacity:1},{transform:`translate(-50%,${up?-120:20}%)`,opacity:0}],700)});
const fxHeal=safe(async(m)=>{const p=fpos(m);if(!p)return;await Promise.all([-30,0,30].map((dx,i)=>fpart(`left:${p.x+dx}px;top:${p.y}px;font-size:24px;color:#3c6;text-shadow:0 0 6px #fff`,"✚",[{transform:`${C0}`,opacity:1},{transform:"translate(-50%,-160%)",opacity:0}],700+i*120)))});
const fxPop=safe(async(m,t)=>{const p=fpos(m);if(!p)return;await fpart(`left:${p.x}px;top:${p.y-40}px;font-size:30px`,t,[{transform:`${C0} scale(.4)`,opacity:0},{transform:`${C0} scale(1.2)`,opacity:1,offset:.4},{transform:"translate(-50%,-160%)",opacity:0}],800)});
const fxShield=safe(async(m)=>{const p=fpos(m);if(!p)return;await fpart(`left:${p.x}px;top:${p.y}px;width:${p.s*1.3}px;height:${p.s*1.3}px;border-radius:50%;background:radial-gradient(circle,#9ff3,#4cf8);border:3px solid #cff;box-shadow:0 0 20px #6cf`,"",[{transform:`${C0} scale(.4)`,opacity:0},{transform:`${C0} scale(1)`,opacity:1,offset:.3},{transform:`${C0} scale(1.05)`,opacity:.9,offset:.7},{transform:`${C0} scale(1.1)`,opacity:0}],700)});
const fxFlash=safe(async(col)=>{await fpart(`inset:0;background:${col};mix-blend-mode:screen`,"",[{opacity:0},{opacity:.7,offset:.3},{opacity:0}],600)});
async function fxSub(m,k){m.sf=k;draw();await nap(k=="break"?700:550);m.sf=""}
/* picks an animation for a move */
async function fxMove(m,tl,mv,ty,big){
 if(big)await fxFlash(TC[ty]+"99");
 if(mv.cls=="status"){const foes=tl.filter(x=>x!=m);if(foes.length)await Promise.all(foes.map(d=>fxShot(m,d,ty)));else await fxAura(m,ty);return}
 if(contact(mv)||/punch|kick|slam|tackle|bite|claw|slash|strike/.test(mv.id)){await Promise.all(tl.map(d=>fxBurst(d,ty,big)));return}
 await Promise.all(tl.map(async d=>{await fxShot(m,d,ty);await fxBurst(d,ty,big)}));
}
