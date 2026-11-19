/* Pokémon creation from PokéAPI (gender, dimorphism, forms, items), stat helpers, reset */
const normMove=d=>({n:cap(d.name),id:d.name,ty:TY.indexOf(d.type.name),pw:d.power,acc:d.accuracy,cls:d.damage_class.name,pri:d.priority,tg:d.target.name,mt:d.meta||{},sc:d.stat_changes||[],ds:(((d.effect_entries||[]).find(e=>e.language.name=="en")||{}).short_effect||"").replace("$effect_chance",d.effect_chance)||((d.flavor_text_entries||[]).filter(e=>e.language.name=="en").pop()||{}).flavor_text||"No description available."});
const okMv=x=>!BAN.includes(x.id)&&x.ty>=0&&(x.cls!="status"||x.sc.length||(x.mt.ailment&&x.mt.ailment.name!="none")||x.mt.healing>0||ONCE[x.id]||PERT[x.id]||PROT.includes(x.id)||WX[x.id]);
/* species with an alternate battle form: [name part, alt name part, trigger] */
const FRM={palafin:["zero","hero","out"],aegislash:["shield","blade","stance"],darmanitan:["standard","zen","zen"],wishiwashi:["solo","school","school"],mimikyu:["disguised","busted","disguise"],eiscue:["-ice","-noice","iceface"],morpeko:["full-belly","hangry","hunger"]};
async function mkMon(id,mult){
 const spc=await J(API+"pokemon-species/"+id).catch(()=>null),vs=spc?spc.varieties.map(v=>v.pokemon.name):[];
 const gr=spc?spc.gender_rate:-1,g=gr<0?"N":rnd(8)<gr?"F":"M";
 const fem=vs.find(n=>/-female$/.test(n)),mal=vs.find(n=>/-male$/.test(n)),vn=fem&&mal?(g=="F"?fem:mal):null;
 const p=await J(API+"pokemon/"+(vn||id)),sn=spc?spc.name:p.name,bn=cap(sn);
 const b=p.stats.map(s=>s.base_stat),s=calc(b,mult);
 const cand=[...p.moves].sort(()=>Math.random()-.5).slice(0,16);
 const ms=(await Promise.all(cand.map(x=>J(x.move.url).catch(()=>null)))).filter(Boolean).map(normMove).filter(okMv);
 const dm=ms.filter(x=>x.cls!="status"),st=ms.filter(x=>x.cls=="status"),mv=[...dm.slice(0,3),...st.slice(0,1)];
 for(const x of ms)if(mv.length<4&&!mv.includes(x))mv.push(x);
 const mgs=vs.filter(n=>/-mega/.test(n)),mgn=mgs.length?pick(mgs):null,gxn=vs.find(n=>/-gmax$/.test(n));
 const F=FRM[sn],an=F&&p.name.includes(F[0])?p.name.replace(F[0],F[1]):null;
 const [mp,gp,ap]=await Promise.all([mgn?J(API+"pokemon/"+mgn).catch(()=>null):null,gxn?J(API+"pokemon/"+gxn).catch(()=>null):null,an?J(API+"pokemon/"+an).catch(()=>null):null]);
 const f=g=="F";
 const mg=mp&&{b:mp.stats.map(s=>s.base_stat),t:mp.types.map(x=>TY.indexOf(x.type.name)),ab:mp.abilities[0].ability.name,...spr(mp,f)},gm=gp?spr(gp,f):null;
 const fa=ap&&{b:ap.stats.map(s=>s.base_stat),t:ap.types.map(x=>TY.indexOf(x.type.name)),trg:F[2],...spr(ap,f)};
 const ab=pick(p.abilities.filter(a=>!a.is_hidden).concat(p.abilities)).ability.name;
 const rr=Math.random(),dt=[...new Set(mv.filter(x=>x.cls!="status").map(x=>x.ty))],pl=pick(PL);
 let item={k:pl[0],n:pl[1]};
 if(mg&&rr<.55)item={k:"mega",n:bn+"ite"+(/-x$/.test(mgn)?" X":/-y$/.test(mgn)?" Y":"")};
 else if(dt.length&&rr>.55&&rr<.8){const z=pick(dt);item={k:"z",n:ZC[z],zt:z}}
 const o={id,n:bn,g,wt:p.weight/10,t:p.types.map(x=>TY.indexOf(x.type.name)),s,s0:s,bhp:s[0],ab,ab0:ab,mv,mv0:mv,tt:rnd(18),item,item0:item,mult,mg,gm,fa,...spr(p,f)};
 o.t0=o.t;return o;
}
function clearVol(m){
 m.sg=newSg();
 ["conf","sub","love","taunt","tor","seed","ing","aq","trap","bind","db","yawn","rc","inv","fe","nm","hh","prot","lp","hd","turns","gas","unb","ss","endure","moved","lm","lh","cm","curse","salt","loaf","pro","sf"].forEach(k=>m[k]=0);
 m.ch=null;m.fl=0;m.lk=null;m.enc=null;m.dis=null;m.lmv=null;
}
function reset(m){
 m.mhp=m.hp=m.bhp;m.st=0;m.sl=0;m.fo=0;m.mega=0;m.dyn=0;m.tera=null;m.fd=0;m.once=0;m.rf=0;m.tfd=0;m.mv=m.mv0;
 clearVol(m);m.dw=null;m.fx="";m.s=m.s0;m.t=m.t0;m.ab=m.ab0;m.item=m.item0;m.dg=1;
}
function setForm(m,on){
 if(!m.fa||!!m.fo==!!on||m.mega)return false;
 if(on){m.fo=1;m.s=[m.s[0],...calc(m.fa.b,m.mult).slice(1)];m.t=m.fa.t.slice()}
 else{m.fo=0;m.s=[m.s[0],...m.s0.slice(1)];m.t=m.t0.slice()}
 return true;
}
function formCheck(m){
 if(!m.fa||m.hp<=0||m.mega)return;
 const t=m.fa.trg,h=m.hp/m.mhp;
 if(t=="zen"&&AB(m)=="zen-mode")setForm(m,h<=.5);
 if(t=="school"&&AB(m)=="schooling")setForm(m,h>.25);
}
const tys=m=>m.tera!=null?[m.tera]:m.t;
const tpl=a=>a.map(t=>`<span class="tp" style="background:${TC[t]}">${TY[t]}</span>`).join("");
