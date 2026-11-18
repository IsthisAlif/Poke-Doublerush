/* Battle engine: AI, turn order, gimmicks, damage, moves, end of turn */
function ai(i){
 const m=B.foe.f[i];
 if(m.rc)return{s:"foe",i,m,mv:m.mv[0],tg:0,gm:""};
 if(m.ch)return{s:"foe",i,m,mv:m.ch.mv,tg:m.ch.tg,gm:""};
 const al=aliveF(B.me),t=rnd(2),tm=B.me.f[t]&&B.me.f[t].hp>0?B.me.f[t]:al[0];
 const sc=x=>x.cls=="status"?(Math.random()<.35?40:0):(x.pw||50)*eff(x.ty,tys(tm))*(tys(m).includes(x.ty)?1.5:1)*(x.id=="fake-out"&&m.fo?0:1);
 let mv=Math.random()<.75?m.mv.reduce((a,x)=>sc(x)>sc(a)?x:a):pick(m.mv),gm="";
 if(Math.random()<.3){const o=["mega","z","dyn","tera"].filter(k=>can(m,k,B.foe));if(o.length){gm=pick(o);if(gm=="z")mv=m.mv.find(x=>zok(m,x))}}
 return{s:"foe",i,m,mv,tg:B.me.f.indexOf(tm),gm};
}
async function gimmick(a){const g=a.gm,m=a.m,sd=B[a.s];if(!g||!can(m,g,sd)||g=="z"&&!zok(m,a.mv))return;sd.used=1;
 if(g=="mega"){const mg=m.mg;await say(`${m.n}'s ${m.item.n} is reacting!`);m.mega=1;m.s=[m.s[0],...calc(mg.b,m.mult).slice(1)];m.t=mg.t;m.ab=mg.ab;await say(`${m.n} Mega Evolved!`);await enter(m,a.s)}
 if(g=="tera"){m.tera=m.tt;await say(`${m.n} Terastallized into ${TY[m.tt]} type!`)}
 if(g=="dyn"){m.dyn=3;m.hp=Math.floor(m.hp*1.5);m.mhp=Math.floor(m.mhp*1.5);await say(`${m.n} ${m.gm?"Gigantamaxed":"Dynamaxed"}!`)}
 if(g=="z"){a.z=1;await say(`${m.n} surrounds itself with Z-Power!`)}}
async function turn(){
 B.ui=null;B.turn++;B.logs.push("— Turn "+B.turn+" —");
 const acts=B.ch.map((c,i)=>c&&{s:"me",i,m:B.me.f[i],...c}).filter(Boolean);
 B.foe.f.forEach((m,i)=>{if(m&&m.hp>0)acts.push(ai(i))});B.ch=[];
 for(const a of acts)await gimmick(a);
 acts.forEach(a=>a.k=(a.sw?8:a.mv.pri)*1e4+S(a.m,5)+Math.random());
 acts.sort((x,y)=>y.k-x.k);
 for(const a of acts){await act(a);if(!aliveF(B.me).length&&!bench().length||!aliveF(B.foe).length&&!B.foe.bn.some(x=>x.hp>0))break}
 await endTurn();
}
async function enter(m,s){
 const en=s=="me"?B.foe:B.me,w={drizzle:"rain",drought:"sun","sand-stream":"sand","snow-warning":"snow"}[m.ab];
 if(w){B.w=w;B.wn=5;await say(`${m.n}'s ${cap(m.ab)} changed the weather!`)}
 if(m.ab=="intimidate")for(const f of aliveF(en)){f.sg[1]=Math.max(-6,f.sg[1]-1);await say(`${m.n}'s Intimidate lowered ${f.n}'s Attack!`)}
}
async function swapIn(s,i,to){
 const sd=B[s],out=sd.f[i],k=sd.bn.indexOf(to);
 if(out&&out.hp>0){out.sg=[0,0,0,0,0,0];out.conf=0;out.rc=0;out.ch=null;out.inv=0;await say(`${out.n}, come back!`)}
 sd.bn.splice(k,1);if(out)sd.bn.push(out);sd.f[i]=to;to.fx="inn";
 await say(`${s=="me"?"Go!":"Opponent sent out"} ${to.n}!`);to.fx="";await enter(to,s);
}
function dmg(a,mv,d,pw,sp){
 const ph=mv.cls=="physical",A=S(a,ph?1:3),D=S(d,ph?2:4);let P=pw||mv.pw||50;
 if(a.ab=="technician"&&P<=60)P*=1.5;
 const e=eff(mv.ty,tys(d)),own=a.t.includes(mv.ty),tr=a.tera==mv.ty;
 let stab=tr&&own?2:own||tr?1.5:1;if(a.ab=="adaptability"&&stab>1)stab+=.5;
 let wx=B.w=="sun"?(mv.ty==1?1.5:mv.ty==2?.5:1):B.w=="rain"?(mv.ty==2?1.5:mv.ty==1?.5:1):1;
 let m=1;if(a.st=="brn"&&ph&&a.ab!="guts")m*=.5;if(a.item&&a.item.k=="orb")m*=1.3;if(a.item&&a.item.k=="belt"&&e>1)m*=1.2;if(a.ab=="guts"&&a.st&&ph)m*=1.5;
 if(d.ab=="multiscale"&&d.hp==d.mhp)m*=.5;if(d.ab=="thick-fat"&&(mv.ty==1||mv.ty==5))m*=.5;
 const crit=Math.random()<1/16;
 let v=((22*P*A/D)/50+2)*stab*e*wx*m*(crit?1.5:1)*(.85+Math.random()*.15)*(sp?.75:1);
 return{v:e==0?0:Math.max(1,Math.floor(v)),e,crit};
}
async function hurt(d,v,cause){
 if(d.ab=="sturdy"&&d.hp==d.mhp&&v>=d.hp){v=d.hp-1;await say(`${d.n} endured the hit with Sturdy!`)}
 if(d.item&&d.item.k=="sash"&&d.hp==d.mhp&&v>=d.hp){v=d.hp-1;d.item=null;await say(`${d.n} hung on using its Focus Sash!`)}
 d.hp=Math.max(0,d.hp-v);d.fx=d.hp<=0?"faint":"hit";draw();await nap(750);d.fx="";if(d.hp<=0)await say(`${d.n} fainted!`);else if(d.item&&d.item.k=="berry"&&d.hp<=d.mhp/2){d.item=null;d.hp=Math.min(d.mhp,d.hp+Math.floor(d.mhp/4));await say(`${d.n} ate its Sitrus Berry!`)}
}
async function act(a){
 const m=a.m;if(m.hp<=0)return;
 const mine=a.s=="me",fr=B[a.s],en=mine?B.foe:B.me;
 if(a.sw){return swapIn(a.s,a.i,a.sw)}
 if(m.rc){m.rc=0;return say(`${m.n} must recharge!`)}
 if(m.st=="slp"){if(--m.sl<=0){m.st=0;await say(`${m.n} woke up!`)}else return say(`${m.n} is fast asleep.`)}
 if(m.st=="frz"){if(Math.random()<.2){m.st=0;await say(`${m.n} thawed out!`)}else return say(`${m.n} is frozen solid!`)}
 if(m.fl){m.fl=0;return say(`${m.n} flinched!`)}
 if(m.st=="par"&&Math.random()<.25)return say(`${m.n} is fully paralyzed!`);
 if(m.conf){if(--m.conf<=0)await say(`${m.n} snapped out of confusion!`);else if(!rnd(3)){await say(`${m.n} hurt itself in confusion!`);return hurt(m,Math.floor(m.mhp/8))}}
 const mv=a.mv,mx=m.dyn&&mv.cls!="status";
 if(!a.z&&!mx&&TW.includes(mv.id)){
  if(!m.ch&&!(["solar-beam","solar-blade"].includes(mv.id)&&B.w=="sun")&&!(mv.id=="electro-shot"&&B.w=="rain")){m.ch={mv,tg:a.tg};m.inv=INV.includes(mv.id);return say(`${m.n} ${m.inv?"vanished from view":"is charging up"} for ${mv.n}!`)}
  m.ch=null;m.inv=0}
 await say(`${m.n} used ${a.z?ZN[mv.ty]:mx?MXN[mv.ty]:mv.n}!`);
 if(PROT.includes(mv.id)){if(m.lp&&rnd(3)){m.lp=0;return say("But it failed!")}m.prot=1;m.lp=1;return say(`${m.n} protected itself!`)}
 if(WX[mv.id]){B.w=WX[mv.id];B.wn=5;return say("The weather changed!")}
 const k=mv.tg,self=/^(user|users-field|user-and-allies|all-allies|ally|user-or-ally)$/.test(k),spr=/all-opponents|all-other/.test(k),fld=/field|all-pokemon|specific|fainting/.test(k);
 let tl=self?[m]:spr?aliveF(en):fld?[]:[mv.tg=="random-opponent"?pick(aliveF(en)):(en.f[a.tg]&&en.f[a.tg].hp>0?en.f[a.tg]:aliveF(en)[0])];
 if(k=="all-other-pokemon")tl=tl.concat(aliveF(fr).filter(x=>x!=m));
 tl=tl.filter(Boolean);
 if(!tl.length&&!fld)return;
 const hm=mv.mt.healing;let hitAny=0;
 if(fld&&mv.cls=="status")return say("But nothing happened!");
 m.fx=mv.cls=="status"?"hop":"lunge";draw();await nap(550);m.fx="";
 for(const d of tl){
  if(d.hp<=0)continue;
  if(d!=m&&d.inv){await say(`${d.n} avoided the attack!`);continue}
  if(d!=m&&d.prot){await say(`${d.n} protected itself!`);continue}
  if(d!=m&&mv.acc&&!a.z&&!mx&&Math.random()*100>mv.acc){await say(`${m.n}'s attack missed!`);continue}
  const im=IMM[d.ab];
  if(d!=m&&im&&mv.ty==im[0]&&(mv.cls!="status"||mv.ty==im[0])&&mv.ty!=null){await say(`${d.n}'s ${cap(d.ab)} made it immune!`);if(im[1]){d.hp=Math.min(d.mhp,d.hp+Math.floor(d.mhp/4))}continue}
  if(mv.cls!="status"){
   const hits=mv.mt.max_hits?(mv.mt.min_hits||1)+rnd(mv.mt.max_hits-(mv.mt.min_hits||1)+1):1;
   for(let h=0;h<hits&&d.hp>0;h++){
    const pw=a.z?160:mx?[90,100,130][Math.min(2,Math.floor((mv.pw||60)/50))]:0,r=dmg(m,mv,d,pw,tl.length>1&&k!="all-other-pokemon"?1:0);
    hitAny=1;await hurt(d,r.v);if(m.item&&m.item.k=="orb"&&m.hp>0){await say(`${m.n} lost some HP to its Life Orb!`);await hurt(m,Math.floor(m.mhp/10))}
    await say(`${r.crit?"Critical hit! ":""}${r.e>1?"It's super effective!":r.e==0?`It doesn't affect ${d.n}…`:r.e<1?"It's not very effective…":`${d.n} lost ${r.v} HP.`}`);
    if(mv.mt.drain&&r.v){const x=Math.floor(r.v*Math.abs(mv.mt.drain)/100);m.hp=mv.mt.drain>0?Math.min(m.mhp,m.hp+x):Math.max(0,m.hp-x);if(m.hp<=0)await say(`${m.n} fainted!`)}
    if(m.item=="x")0;
   }
   if(d.hp>0&&mv.mt.flinch_chance&&rnd(100)<mv.mt.flinch_chance)d.fl=1;
  }
  if(d.hp<=0)continue;
  const ch=mv.cls=="status"?100:(mv.mt.ailment_chance||0);
  const al=AIL[mv.mt.ailment&&mv.mt.ailment.name],tt=tys(d);
  if(al&&rnd(100)<ch){
   if(al=="conf"){if(!d.conf){d.conf=2+rnd(4);await say(`${d.n} became confused!`)}}
   else if(!d.st&&!(al=="brn"&&tt.includes(1))&&!(al=="par"&&tt.includes(3))&&!(al=="psn"&&(tt.includes(7)||tt.includes(16)))&&!(al=="frz"&&tt.includes(5))){d.st=al;if(al=="slp")d.sl=1+rnd(3);await say(`${d.n} ${{par:"is paralyzed",brn:"was burned",psn:"was poisoned",slp:"fell asleep",frz:"was frozen solid"}[al]}!`)}
   else if(mv.cls=="status")await say("But it failed!");
  }
  if(mv.sc.length){
   const toSelf=/user|allies|ally/.test(k)||/raise/.test((mv.mt.category||{}).name||""),tgt=toSelf?m:d,sch=mv.cls=="status"?100:(mv.mt.stat_chance||100);
   if(rnd(100)<sch)for(const c of mv.sc){const i=SK[c.stat.name];if(!i)continue;tgt.sg[i]=Math.max(-6,Math.min(6,tgt.sg[i]+c.change));await say(`${tgt.n}'s ${cap(c.stat.name)} ${c.change>0?"rose":"fell"}!`)}
  }
 }
 if(hm>0&&m.hp>0){m.hp=Math.min(m.mhp,m.hp+Math.floor(m.mhp*hm/100));await say(`${m.n} restored its HP!`)}
 if(hitAny&&!a.z&&!mx&&RCH.includes(mv.id)&&m.hp>0)m.rc=1;
}
async function endTurn(){
 for(const s of[B.me,B.foe])for(const m of s.f){if(!m||m.hp<=0)continue;
  if(m.item&&m.item.k=="leftovers"&&m.hp<m.mhp){m.hp=Math.min(m.mhp,m.hp+Math.floor(m.mhp/16));await say(`${m.n} restored a little HP with Leftovers!`)}
  if(B.w=="sand"&&!tys(m).some(t=>[8,12,16].includes(t))){await say(`${m.n} is buffeted by the sandstorm!`);await hurt(m,Math.floor(m.mhp/16))}
  else if(B.w=="snow"&&0){}
  if(m.hp>0&&(m.st=="brn"||m.st=="psn")){await say(`${m.n} is hurt by its ${m.st=="brn"?"burn":"poison"}!`);await hurt(m,Math.floor(m.mhp/8))}
  if(m.hp>0&&m.ab=="speed-boost")m.sg[5]=Math.min(6,m.sg[5]+1);
  if(m.hp>0&&m.dyn&&--m.dyn==0){m.mhp=Math.ceil(m.mhp/1.5);m.hp=Math.min(m.hp,m.mhp);await say(`${m.n} returned to normal size.`)}
  if(!B.protUsed)m.lp=m.prot?m.lp:0;m.prot=0;m.fl=0}
 if(B.w&&--B.wn<=0){await say("The weather returned to normal.");B.w=null}
 if(!aliveF(B.me).length&&!bench().length)return over();
 if(!aliveF(B.foe).length&&!B.foe.bn.some(x=>x.hp>0))return win();
 for(const s of["foe","me"])for(let i=0;i<2;i++){const sd=B[s];
  if(sd.f[i]&&sd.f[i].hp>0)continue;
  const nb=sd.bn.filter(x=>x.hp>0);if(!nb.length){sd.f[i]=null;continue}
  if(s=="foe")await swapIn("foe",i,nb[0]);
  else{B.msg="Choose a Pokémon to send out!";const k=await new Promise(r=>{B.ui={st:"forced",i,res:r};draw()});B.ui=null;await swapIn("me",i,B.me.bn[k])}}
 nextCmd(0);
}
