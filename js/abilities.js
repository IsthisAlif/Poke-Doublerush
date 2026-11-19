/* Abilities: lookup, stat modifiers, entry, on-hit and end-of-turn effects */
const MBK=["mold-breaker","teravolt","turboblaze"];
const AB=m=>{if(!m)return"";if(m.gas)return"";if(B&&B.me&&[...B.me.f,...B.foe.f].some(x=>x&&x!=m&&x.hp>0&&x.ab=="neutralizing-gas"&&!x.gas))return"";return m.ab};
const ABD=(d,a)=>a&&a!=d&&MBK.includes(AB(a))?"":AB(d);
const W=()=>B&&B.me&&[...B.me.f,...B.foe.f].some(x=>x&&x.hp>0&&["air-lock","cloud-nine"].includes(AB(x)))?null:B&&B.w;
const grounded=m=>!(tys(m).includes(9)||AB(m)=="levitate"||(m.item&&m.item.k=="balloon"));
const newSg=()=>[0,0,0,0,0,0,0,0];
function S(m,i,ign){
 let v=m.s[i],g=m.sg[i],ab=AB(m),w=W(),st=!!m.st,t=tys(m);
 if(!ign)v*=g>=0?(2+g)/2:2/(2-g);
 if(i==1){
  if(ab=="huge-power"||ab=="pure-power")v*=2;
  if(ab=="hustle"||ab=="gorilla-tactics")v*=1.5;
  if(ab=="guts"&&st)v*=1.5;
  if(ab=="defeatist"&&m.hp<=m.mhp/2)v*=.5;
  if(ab=="orichalcum-pulse"&&w=="sun")v*=1.33;
  if(m.ss>0)v*=.5;
  if(m.st=="brn"&&ab!="guts")v*=.5;
 }
 if(i==3){if(ab=="solar-power"&&w=="sun")v*=1.5;if(ab=="hadron-engine"&&B.ter=="elec")v*=1.33;if(ab=="defeatist"&&m.hp<=m.mhp/2)v*=.5}
 if(i==2){if(ab=="marvel-scale"&&st)v*=1.5;if(ab=="fur-coat")v*=2;if(ab=="grass-pelt"&&B.ter=="grass")v*=1.5;if(w=="snow"&&t.includes(5))v*=1.5}
 if(i==4){if(w=="sand"&&t.includes(12))v*=1.5;if(m.item&&m.item.k=="vest")v*=1.5}
 if(i==5){
  const wx={"swift-swim":"rain",chlorophyll:"sun","sand-rush":"sand","slush-rush":"snow"}[ab];
  if(wx&&w==wx)v*=2;
  if(ab=="surge-surfer"&&B.ter=="elec")v*=2;
  if(ab=="unburden"&&m.unb)v*=2;
  if(ab=="quick-feet"&&st)v*=1.5;else if(m.st=="par")v*=.5;
  if(m.ss>0)v*=.5;
  if(m.item&&m.item.k=="scarf")v*=1.5;
  try{if(side(m).sc.tw)v*=2}catch(e){}
 }
 if(i>0&&((ab=="protosynthesis"&&w=="sun")||(ab=="quark-drive"&&B.ter=="elec"))){const hi=[1,2,3,4,5].reduce((a,b)=>m.s[b]>m.s[a]?b:a);if(hi==i)v*=i==5?1.5:1.3}
 return v;
}
/* type-absorbing abilities: [type, effect] effect: "h"=heal 1/4, "f"=flash fire, number=stat +1, [stat,n] */
const ABS={"water-absorb":[2,"h"],"dry-skin":[2,"h"],"storm-drain":[2,3],"volt-absorb":[3,"h"],"lightning-rod":[3,3],"motor-drive":[3,5],"flash-fire":[1,"f"],"sap-sipper":[4,1],"levitate":[8,0],"earth-eater":[8,"h"],"well-baked-body":[1,[2,2]]};
const WAB={drizzle:"rain",drought:"sun","sand-stream":"sand","snow-warning":"snow","orichalcum-pulse":"sun","desolate-land":"sun","primordial-sea":"rain"};
const TAB={"electric-surge":"elec","hadron-engine":"elec","grassy-surge":"grass","psychic-surge":"psy","misty-surge":"mist"};
/* status immunities by ability */
const SIMM={brn:["water-veil","water-bubble","thermal-exchange","purifying-salt"],par:["limber"],psn:["immunity","pastel-veil","purifying-salt"],slp:["insomnia","vital-spirit","sweet-veil","comatose"],frz:["magma-armor"]};

async function abEnter(m){
 const ab=AB(m),en=opp(m),sd=side(m);
 if(!ab)return;
 if(WAB[ab])await setW(WAB[ab],m);
 if(TAB[ab])await setT(TAB[ab]);
 if(ab=="intimidate")for(const f of aliveF(en)){
  const fa=ABD(f,m);
  if(["inner-focus","oblivious","own-tempo","scrappy","guard-dog"].includes(fa)){if(fa=="guard-dog")await stg(f,1,1,f);continue}
  if(f.sub)continue;
  await say(`${m.n}'s Intimidate cuts ${f.n}'s Attack!`);await stg(f,1,-1,m);
 }
 if(ab=="download"){const f=aliveF(en);if(f.length){const d=f.reduce((s,x)=>s+S(x,2),0),sp=f.reduce((s,x)=>s+S(x,4),0);await stg(m,d<sp?1:3,1,m)}}
 if(ab=="trace"){const f=aliveF(en).filter(x=>!["trace","imposter","neutralizing-gas"].includes(x.ab));if(f.length){const x=pick(f);m.ab=x.ab;await say(`${m.n} traced ${x.n}'s ${cap(x.ab)}!`);await abEnter(m)}}
 if(ab=="imposter"&&!m.tfd){const f=aliveF(en)[0];if(f&&!f.sub){m.tfd=1;m.s=[m.s[0],...f.s.slice(1)];m.t=f.t.slice();m.ab=f.ab;m.mv=f.mv.slice();m.sg=f.sg.slice();await say(`${m.n} transformed into ${f.n}!`)}}
 if(ab=="frisk")for(const f of aliveF(en))if(f.item)await say(`${m.n} frisked ${f.n} and found its ${f.item.n}!`);
 if(ab=="slow-start"){m.ss=5;await say(`${m.n} can't get it going!`)}
 if(!m.once){
  if(ab=="dauntless-shield"){m.once=1;await stg(m,2,1,m)}
  if(ab=="intrepid-sword"){m.once=1;await stg(m,1,1,m)}
  const em={"embody-aspect-teal":5,"embody-aspect-wellspring":4,"embody-aspect-hearthflame":1,"embody-aspect-cornerstone":2}[ab];
  if(em){m.once=1;await stg(m,em,1,m)}
 }
 if(ab=="hospitality"){const al=ally(m);if(al)await heal(al,al.mhp/4)}
 if(ab=="screen-cleaner"){for(const s of[B.me,B.foe])for(const k of["rf","ls","av"])s.sc[k]=0;await say("All screens were cleared!")}
 if(ab=="costar"){const al=ally(m);if(al){m.sg=al.sg.slice();await say(`${m.n} copied ${al.n}'s stat changes!`)}}
 if(ab=="curious-medicine"){const al=ally(m);if(al){al.sg=newSg();await say(`${al.n}'s stat changes were reset!`)}}
 if(ab=="supersweet-syrup")for(const f of aliveF(en))await stg(f,7,-1,m);
 if(MBK.includes(ab))await say(`${m.n} breaks the mold!`);
 if(ab=="pressure")await say(`${m.n} is exerting its pressure!`);
 if(ab=="neutralizing-gas")await say("Neutralizing gas filled the area!");
 if(ab=="air-lock"||ab=="cloud-nine")await say("The effects of the weather disappeared.");
 if(ab=="wind-rider"&&sd.sc.tw)await stg(m,1,1,m);
 formCheck(m);
}

/* attacker m hit defender d with damaging move mv. v=damage, hb=defender HP before, con=contact */
async function onHit(m,d,mv,v,ty,crit,con,hb){
 const ab=ABD(d,m),ma=AB(m);
 if(d.hp<=0){
  if(ab=="aftermath"&&con&&m.hp>0&&AB(m)!="damp")await hurt(m,Math.floor(m.mhp/4),d);
  if(ab=="innards-out"&&m.hp>0)await hurt(m,v,d);
  return;
 }
 if(con){
  if(d.item&&d.item.k=="rocky"&&ma!="magic-guard"&&m.hp>0)await hurt(m,Math.floor(m.mhp/6),d);
  if((ab=="rough-skin"||ab=="iron-barbs")&&ma!="magic-guard"&&m.hp>0){await say(`${m.n} was hurt by ${d.n}'s ${cap(ab)}!`);await hurt(m,Math.floor(m.mhp/8),d)}
  if(m.hp>0&&rnd(10)<3){
   const x={static:"par","flame-body":"brn","poison-point":"psn"}[ab];
   if(x)await setSt(m,x,d);
   if(ab=="effect-spore"&&!m.t.includes(4)&&ma!="overcoat")await setSt(m,pick(["par","psn","slp"]),d);
   if(ab=="cute-charm"&&m.g!="N"&&d.g!="N"&&m.g!=d.g&&!m.love&&ma!="oblivious"){m.love=d;await say(`${m.n} fell in love with ${d.n}!`)}
  }
  if((ab=="gooey"||ab=="tangling-hair")&&m.hp>0)await stg(m,5,-1,d);
  if((ab=="mummy"||ab=="lingering-aroma")&&ma!="mummy"&&ma!="lingering-aroma"&&m.hp>0){m.ab=ab;await say(`${m.n}'s ability became ${cap(ab)}!`)}
  if(ab=="wandering-spirit"&&m.hp>0){[m.ab,d.ab]=[d.ab,m.ab];await say(`${m.n} swapped abilities with ${d.n}!`)}
  if(ab=="pickpocket"&&!d.item&&m.item&&m.hp>0){d.item=m.item;m.item=null;await say(`${d.n} pickpocketed ${m.n}'s ${d.item.n}!`)}
  if((ma=="poison-touch"||ma=="toxic-chain")&&rnd(10)<3)await setSt(d,"psn",m);
 }
 if(ma=="magician"&&!m.item&&d.item&&m.hp>0){m.item=d.item;d.item=null;await say(`${m.n} stole ${d.n}'s ${m.item.n}!`)}
 if(ab=="stamina")await stg(d,2,1,d);
 if(ab=="justified"&&ty==15)await stg(d,1,1,d);
 if(ab=="rattled"&&[11,13,15].includes(ty))await stg(d,5,1,d);
 if(ab=="weak-armor"&&mv.cls=="physical"){await stg(d,2,-1,d);await stg(d,5,2,d)}
 if(ab=="anger-point"&&crit){d.sg[1]=6;await say(`${d.n} maxed its Attack!`)}
 if(ab=="steam-engine"&&(ty==1||ty==2))await stg(d,5,6,d);
 if(ab=="water-compaction"&&ty==2)await stg(d,2,2,d);
 if(ab=="thermal-exchange"&&ty==1)await stg(d,1,1,d);
 if(ab=="sand-spit")await setW("sand",d);
 if(ab=="seed-sower")await setT("grass");
 if(ab=="cotton-down")for(const x of[...aliveF(B.me),...aliveF(B.foe)])if(x!=d)await stg(x,5,-1,d);
 if(ab=="color-change"&&!d.t.includes(ty)&&d.tera==null){d.t=[ty];await say(`${d.n} changed its type to ${TY[ty]}!`)}
 if(ab=="toxic-debris"&&mv.cls=="physical"&&(opp(d).sc.ts||0)<2){opp(d).sc.ts=(opp(d).sc.ts||0)+1;await say("Poison spikes were scattered around the foe's feet!")}
 if(hb>d.mhp/2&&d.hp<=d.mhp/2){
  if(ab=="berserk")await stg(d,3,1,d);
  if(ab=="anger-shell"){await stg(d,1,1,d);await stg(d,3,1,d);await stg(d,5,1,d);await stg(d,2,-1,d);await stg(d,4,-1,d)}
 }
 if(d.item&&d.item.k=="wp"&&e_se(mv,ty,d)&&d.hp>0){d.item=null;await stg(d,1,2,d);await stg(d,3,2,d)}
}
const e_se=(mv,ty,d)=>eff(ty,tys(d))>1;

/* end-of-turn ability effects for one Pokémon */
async function abEnd(m){
 const ab=AB(m),w=W();
 if(m.hp<=0||!ab)return;
 if(ab=="speed-boost"&&m.turns>0)await stg(m,5,1,m);
 if(ab=="shed-skin"&&m.st&&rnd(3)==0){m.st=0;await say(`${m.n} shed its status condition!`)}
 if(ab=="hydration"&&w=="rain"&&m.st){m.st=0;await say(`${m.n} was cured by Hydration!`)}
 if(ab=="poison-heal"&&m.st=="psn")await heal(m,m.mhp/8);
 if(ab=="rain-dish"&&w=="rain")await heal(m,m.mhp/16);
 if(ab=="ice-body"&&w=="snow")await heal(m,m.mhp/16);
 if(ab=="dry-skin"){if(w=="rain")await heal(m,m.mhp/8);if(w=="sun")await hurt(m,Math.floor(m.mhp/8))}
 if(ab=="solar-power"&&w=="sun")await hurt(m,Math.floor(m.mhp/8));
 if(ab=="moody"){const up=pick([1,2,3,4,5]);await stg(m,up,2,m);await stg(m,pick([1,2,3,4,5].filter(x=>x!=up)),-1,m)}
 if(ab=="bad-dreams")for(const f of aliveF(opp(m)))if(f.st=="slp"&&AB(f)!="magic-guard")await hurt(f,Math.floor(f.mhp/8),m);
 if(ab=="healer"){const al=ally(m);if(al&&al.st&&rnd(10)<3){al.st=0;await say(`${al.n} was healed by ${m.n}'s Healer!`)}}
 if(ab=="harvest"&&m.item0&&!m.item&&m.item0.k=="berry"&&(w=="sun"||rnd(2))){m.item=m.item0;await say(`${m.n} harvested its berry!`)}
 if(ab=="hunger-switch"&&m.fa&&m.fa.trg=="hunger")setForm(m,!m.fo);
 if(m.ss>0&&--m.ss==0)await say(`${m.n} finally got its act together!`);
}
