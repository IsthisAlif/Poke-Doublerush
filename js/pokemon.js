/* Pokémon creation from PokéAPI, stat helpers, reset */
async function mkMon(id,mult){
 const p=await J(API+"pokemon/"+id);
 const b=p.stats.map(s=>s.base_stat),s=b.map((v,i)=>Math.floor(((i?Math.floor((2*v+31)/2)+5:Math.floor((2*v+31)/2)+60))*mult));
 const cand=[...p.moves].sort(()=>Math.random()-.5).slice(0,10);
 const ms=(await Promise.all(cand.map(x=>J(x.move.url).catch(()=>null)))).filter(Boolean).map(d=>({n:cap(d.name),id:d.name,ty:TY.indexOf(d.type.name),pw:d.power,acc:d.accuracy,cls:d.damage_class.name,pri:d.priority,tg:d.target.name,mt:d.meta||{},sc:d.stat_changes||[],ds:(((d.effect_entries||[]).find(e=>e.language.name=="en")||{}).short_effect||"").replace("$effect_chance",d.effect_chance)||((d.flavor_text_entries||[]).filter(e=>e.language.name=="en").pop()||{}).flavor_text||"No description available."}));
 const dm=ms.filter(x=>x.cls!="status"),st=ms.filter(x=>x.cls=="status"),mv=[...dm.slice(0,3),...st.slice(0,1)];
 for(const x of ms)if(mv.length<4&&!mv.includes(x))mv.push(x);
 const spc=await J(API+"pokemon-species/"+id).catch(()=>null),vs=spc?spc.varieties.map(v=>v.pokemon.name):[],mgs=vs.filter(n=>/-mega/.test(n)),mgn=mgs.length?pick(mgs):null,gxn=vs.find(n=>/-gmax$/.test(n));
 const [mp,gp]=await Promise.all([mgn?J(API+"pokemon/"+mgn).catch(()=>null):null,gxn?J(API+"pokemon/"+gxn).catch(()=>null):null]);
 const mg=mp&&{b:mp.stats.map(s=>s.base_stat),t:mp.types.map(x=>TY.indexOf(x.type.name)),ab:mp.abilities[0].ability.name,...spr(mp)},gm=gp?spr(gp):null,bn=cap(p.name.split("-")[0]);
 const ab=pick(p.abilities.filter(a=>!a.is_hidden).concat(p.abilities)).ability.name;
 const rr=Math.random(),dt=[...new Set(mv.filter(x=>x.cls!="status").map(x=>x.ty))],pl=pick(PL);
 let item={k:pl[0],n:pl[1]};
 if(mg&&rr<.55)item={k:"mega",n:bn+"ite"+(/-x$/.test(mgn)?" X":/-y$/.test(mgn)?" Y":"")};
 else if(dt.length&&rr>.55&&rr<.8){const z=pick(dt);item={k:"z",n:ZC[z],zt:z}}
 const o={id,n:bn,t:p.types.map(x=>TY.indexOf(x.type.name)),s,s0:s,bhp:s[0],ab,ab0:ab,mv,tt:rnd(18),item,item0:item,mult,mg,gm,...spr(p)};o.t0=o.t;return o;
}
function reset(m){m.mhp=m.hp=m.bhp;m.st=0;m.conf=0;m.sg=[0,0,0,0,0,0];m.mega=0;m.dyn=0;m.tera=null;m.prot=0;m.lp=0;m.fl=0;m.sl=0;m.dw=null;m.fx="";m.s=m.s0;m.t=m.t0;m.ab=m.ab0;m.item=m.item0;m.rc=0;m.ch=null;m.inv=0}
const tys=m=>m.tera!=null?[m.tera]:m.t;
const S=(m,i)=>{let v=m.s[i],g=m.sg[i];v*=g>=0?(2+g)/2:2/(2-g);if(i==1&&/huge|pure-power/.test(m.ab))v*=2;if(i==5&&m.st=="par")v*=.5;return v};
const tpl=a=>a.map(t=>`<span class="tp" style="background:${TC[t]}">${TY[t]}</span>`).join("");

