/* Battle engine: turn order, status, damage, move execution, switching, end of turn */
const side=m=>B.me.t.includes(m)?B.me:B.foe,opp=m=>side(m)==B.me?B.foe:B.me,sname=m=>side(m)==B.me?"me":"foe";
const onf=m=>side(m).f.includes(m),ally=m=>side(m).f.find(x=>x&&x!=m&&x.hp>0);
const done=()=>(!aliveF(B.me).length&&!bench().length)||(!aliveF(B.foe).length&&!B.foe.bn.some(x=>x.hp>0));

/* ---------- AI ---------- */
function ai(i){
 const m=B.foe.f[i];
 if(m.rc)return{s:"foe",i,m,mv:m.mv[0],tg:0,gm:""};
 if(m.ch)return{s:"foe",i,m,mv:m.ch.mv,tg:m.ch.tg,gm:""};
 if(m.lk)return{s:"foe",i,m,mv:m.lk.mv,tg:m.lk.tg,gm:""};
 const al=aliveF(B.me),t=rnd(2),tm=B.me.f[t]&&B.me.f[t].hp>0?B.me.f[t]:al[0];
 const sc=x=>{
  if(x.cls=="status"){
   if(PROT.includes(x.id))return m.lp?0:15;
   if(x.id=="substitute")return m.sub||m.hp<m.mhp*.5?0:40;
   if(m.taunt>0)return 0;
   return Math.random()<.45?45:0;
  }
  let P=(x.pw||50)*eff(x.ty,tys(tm))*(m.t.includes(x.ty)?1.5:1);
  if((x.id=="fake-out"||x.id=="first-impression")&&m.turns>0)P=0;
  if(x.id=="sucker-punch")P*=.6;
  return P;
 };
 const ok=m.mv.filter(x=>!(m.dis&&m.dis.id==x.id)&&!(m.taunt>0&&x.cls=="status"));
 const pool=ok.length?ok:m.mv;
 let mv=Math.random()<.75?pool.reduce((a,x)=>sc(x)>sc(a)?x:a):pick(pool),gm="";
 if(Math.random()<.3){const o=["mega","z","dyn","tera"].filter(k=>can(m,k,B.foe));if(o.length){gm=pick(o);if(gm=="z")mv=m.mv.find(x=>zok(m,x))}}
 return{s:"foe",i,m,mv,tg:B.me.f.indexOf(tm),gm};
}
async function gimmick(a){
 const g=a.gm,m=a.m,sd=B[a.s];
 if(!g||!can(m,g,sd)||g=="z"&&!zok(m,a.mv))return;
 sd.used=1;
 if(g=="mega"){const mg=m.mg;await say(`${m.n}'s ${m.item.n} is reacting!`);m.mega=1;m.s=[m.s[0],...calc(mg.b,m.mult).slice(1)];m.t=mg.t;m.ab=mg.ab;await fxFlash("#b06cffaa");await say(`${m.n} Mega Evolved!`);await abEnter(m)}
 if(g=="tera"){m.tera=m.tt;await fxFlash(TC[m.tt]+"99");await say(`${m.n} Terastallized into ${TY[m.tt]} type!`)}
 if(g=="dyn"){m.dyn=3;m.hp=Math.floor(m.hp*1.5);m.mhp=Math.floor(m.mhp*1.5);await fxFlash("#ff2d55aa");await say(`${m.n} ${m.gm?"Gigantamaxed":"Dynamaxed"}!`)}
 if(g=="z"){a.z=1;await say(`${m.n} surrounds itself with Z-Power!`)}
}
function prio(a){
 const mv=a.mv,ab=AB(a.m);let p=mv.pri;
 if(ab=="prankster"&&mv.cls=="status")p++;
 if(ab=="gale-wings"&&mv.ty==9&&a.m.hp==a.m.mhp)p++;
 if(ab=="triage"&&(mv.mt.healing>0||mv.mt.drain>0))p+=3;
 if(mv.id=="grassy-glide"&&B.ter=="grass")p++;
 return p;
}
async function turn(){
 B.ui=null;B.turn++;B.logs.push("— Turn "+B.turn+" —");
 [...B.me.f,...B.foe.f].forEach(x=>{if(x){x.moved=0;x.hd=0;x.lh=0;x.cm=null}});
 const acts=B.ch.map((c,i)=>c&&{s:"me",i,m:B.me.f[i],...c}).filter(Boolean);
 B.foe.f.forEach((m,i)=>{if(m&&m.hp>0)acts.push(ai(i))});B.ch=[];
 acts.forEach(a=>{if(a.mv)a.m.cm=a.mv});
 for(const a of acts)await gimmick(a);
 const tr=B.tr>0;
 acts.forEach(a=>{a.k=(a.sw?8:prio(a))*1e4+(tr?-1:1)*S(a.m,5)+(!a.sw&&AB(a.m)=="stall"?-500:0)+Math.random()});
 acts.sort((x,y)=>y.k-x.k);
 acts.forEach((a,i)=>a.last=i==acts.length-1);
 for(const a of acts){await act(a);if(done())break}
 await endTurn();
}

/* ---------- switching ---------- */
async function leave(m){
 const ab=AB(m);
 if(ab=="natural-cure")m.st=0;
 if(ab=="regenerator")m.hp=Math.min(m.mhp,m.hp+Math.floor(m.mhp/3));
 if(m.dyn){m.dyn=0;m.mhp=Math.ceil(m.mhp/1.5);m.hp=Math.min(m.hp,m.mhp)}
 if(ab=="zero-to-hero"&&m.fa&&m.fa.trg=="out"&&!m.fo){setForm(m,1);await say(`${m.n} underwent a heroic transformation!`)}
 if(m.fa&&["stance","school","zen"].includes(m.fa.trg))setForm(m,0);
 clearVol(m);
}
async function enter(m,s){
 const sd=B[s];m.turns=0;
 if(sd.sc.hw){sd.sc.hw=0;m.hp=m.mhp;m.st=0;await say(`${m.n}'s HP was restored!`)}
 const safe=m.item&&m.item.k=="boots",mg=AB(m)=="magic-guard";
 if(!safe){
  if(sd.sc.rk&&!mg){await say(`Pointed stones dug into ${m.n}!`);await hurt(m,Math.floor(m.mhp*eff(12,tys(m))/8));if(m.hp<=0)return}
  if(grounded(m)){
   if(sd.sc.sp&&!mg){await say(`${m.n} was hurt by the spikes!`);await hurt(m,Math.floor(m.mhp/[0,8,6,4][sd.sc.sp]));if(m.hp<=0)return}
   if(sd.sc.ts){if(m.t.includes(7)){sd.sc.ts=0;await say(`${m.n} absorbed the poison spikes!`)}else if(!m.t.includes(16))await setSt(m,"psn",null)}
   if(sd.sc.web)await stg(m,5,-1,null);
  }
 }
 await abEnter(m);
}
async function swapIn(s,i,to,opt){
 opt=opt||{};const sd=B[s],out=sd.f[i],k=sd.bn.indexOf(to);
 if(k<0)return;
 if(out&&out.hp>0){await say(`${out.n}, come back!`);await leave(out)}
 sd.bn.splice(k,1);if(out)sd.bn.push(out);sd.f[i]=to;
 if(opt.baton){to.sg=opt.baton.sg.slice();if(opt.baton.sub)to.sub=opt.baton.sub}
 to.fx="inn";await say(`${s=="me"?"Go!":"Opponent sent out"} ${to.n}!`);to.fx="";
 await enter(to,s);
}
async function pivot(m,baton){
 const sd=side(m),i=sd.f.indexOf(m),nb=sd.bn.filter(x=>x.hp>0);
 if(i<0||!nb.length||m.hp<=0)return;
 let to;
 if(sd==B.me){B.msg="Choose a Pokémon to send out!";const k=await new Promise(r=>{B.ui={st:"forced",i,res:r};draw()});B.ui=null;to=B.me.bn[k]}
 else to=nb[0];
 await swapIn(sname(m),i,to,{baton});
}
async function forceOut(d){
 const sd=side(d),i=sd.f.indexOf(d),nb=sd.bn.filter(x=>x.hp>0);
 if(i<0||!nb.length||d.dyn||AB(d)=="suction-cups"||d.ing)return 0;
 await say(`${d.n} was dragged out!`);await swapIn(sname(d),i,pick(nb));return 1;
}

/* ---------- stat stages, status, healing, damage ---------- */
async function stg(m,i,n,src,quiet){
 if(!m||m.hp<=0)return 0;
 let ab=AB(m);
 if(n<0&&src&&src!=m){
  const bp=MBK.includes(AB(src));
  if(!bp&&ab=="mirror-armor"){await say(`${m.n}'s Mirror Armor reflected the effect!`);return stg(src,i,n,m)}
  if(!bp&&(["clear-body","white-smoke","full-metal-body"].includes(ab)||(ab=="hyper-cutter"&&i==1)||(ab=="big-pecks"&&i==2)||(ab=="keen-eye"&&i==6)||(ab=="mind-s-eye"&&i==6))){await say(`${m.n}'s ${cap(ab)} prevents stat loss!`);return 0}
  if(m.sub||side(m).sc.mist)return 0;
 }
 if(ab=="contrary")n=-n;else if(ab=="simple")n*=2;
 const o=m.sg[i];m.sg[i]=Math.max(-6,Math.min(6,o+n));
 if(m.sg[i]==o){if(!quiet)await say(`${m.n}'s ${SNM[i]} won't go any ${n>0?"higher":"lower"}!`);return 0}
 fxStat(m,n>0);
 await say(`${m.n}'s ${SNM[i]} ${Math.abs(n)>1?(n>0?"sharply rose":"harshly fell"):(n>0?"rose":"fell")}!`);
 if(n<0&&src&&src!=m&&side(src)!=side(m)){
  if(ab=="defiant")await stg(m,1,2,m);
  if(ab=="competitive")await stg(m,3,2,m);
 }
 return 1;
}
async function setSt(d,al,src,mv){
 if(!d||d.hp<=0)return 0;
 if(d.sub&&src&&src!=d)return 0;
 const tt=tys(d),ab=ABD(d,src),sd=side(d),gr=grounded(d);
 if(sd.sc.sg&&src&&src!=d)return 0;
 if(B.ter=="mist"&&gr)return 0;
 if(al=="conf"){
  if(d.conf||ab=="own-tempo")return 0;
  d.conf=2+rnd(4);fxPop(d,"💫");await say(`${d.n} became confused!`);return 1;
 }
 if(d.st)return 0;
 if(al=="brn"&&tt.includes(1)||al=="par"&&tt.includes(3)||al=="frz"&&(tt.includes(5)||W()=="sun")||al=="psn"&&(tt.includes(7)||tt.includes(16))&&!(src&&AB(src)=="corrosion"))return 0;
 if((SIMM[al]||[]).includes(ab)||(al=="slp"&&B.ter=="elec"&&gr))return 0;
 if(ab=="leaf-guard"&&W()=="sun")return 0;
 if(ab=="shields-down"||ab=="comatose")return 0;
 d.st=al;if(al=="slp")d.sl=1+rnd(3);
 fxPop(d,{par:"⚡",brn:"🔥",psn:"☠️",slp:"💤",frz:"🧊"}[al]);
 await say(`${d.n} ${{par:"is paralyzed! It may be unable to move!",brn:"was burned!",psn:"was poisoned!",slp:"fell asleep!",frz:"was frozen solid!"}[al]}`);
 if(ab=="synchronize"&&src&&src!=d&&["par","brn","psn"].includes(al))await setSt(src,al,d);
 return 1;
}
async function heal(m,v,msg){
 if(!m||m.hp<=0||m.hp>=m.mhp)return 0;
 const b=m.hp;m.hp=Math.min(m.mhp,m.hp+Math.max(1,Math.floor(v)));fxHeal(m);draw();
 if(msg!==null)await say(msg||`${m.n} restored its HP!`);
 return m.hp-b;
}
async function hurt(d,v,src,mv){
 v=Math.floor(v);if(v<=0||d.hp<=0)return;
 const mb=src&&MBK.includes(AB(src));
 if(d.endure&&v>=d.hp){v=d.hp-1;await say(`${d.n} endured the hit!`)}
 if(AB(d)=="sturdy"&&!mb&&d.hp==d.mhp&&v>=d.hp){v=d.hp-1;await say(`${d.n} endured the hit with Sturdy!`)}
 if(d.item&&d.item.k=="sash"&&d.hp==d.mhp&&v>=d.hp){v=d.hp-1;d.item=null;await say(`${d.n} hung on using its Focus Sash!`)}
 if(v<=0&&d.hp>0)return;
 d.hp=Math.max(0,d.hp-v);
 if(src&&src!=d){d.hd=1;d.lh={v,ph:mv?mv.cls=="physical":1,src};d.rf=(d.rf||0)+1}
 d.fx=d.hp<=0?"faint":"hit";draw();await nap(750);d.fx="";
 if(d.hp<=0){await faint(d,src);return}
 if(d.item&&d.item.k=="berry"&&d.hp<=d.mhp/2){d.item=null;await heal(d,d.mhp/4,`${d.n} ate its Sitrus Berry!`)}
 formCheck(d);
}
async function faint(d,src){
 if(d.fd)return;d.fd=1;d.hp=0;
 await say(`${d.n} fainted!`);
 if(d.db&&src&&src!=d&&src.hp>0){src.hp=0;await say(`${src.n} took its attacker down with it!`);await faint(src,d)}
 if(src&&src!=d&&src.hp>0&&side(src)!=side(d)){
  const a=AB(src);
  if(a=="moxie"||a=="chilling-neigh"||a=="as-one-glastrier")await stg(src,1,1,src);
  if(a=="grim-neigh"||a=="as-one-spectrier")await stg(src,3,1,src);
  if(a=="beast-boost"){const hi=[1,2,3,4,5].reduce((x,y)=>src.s[y]>src.s[x]?y:x);await stg(src,hi,1,src)}
 }
 for(const x of[...aliveF(B.me),...aliveF(B.foe)])if(AB(x)=="soul-heart")await stg(x,3,1,x);
}

/* ---------- damage ---------- */
function mty(a,mv){
 let ty=mv.ty,conv=0,id=mv.id,w=W();
 if(id=="weather-ball")ty=w=="sun"?1:w=="rain"?2:w=="sand"?12:w=="snow"?5:ty;
 if(id=="terrain-pulse"&&B.ter)ty={elec:3,grass:4,psy:10,mist:17}[B.ter];
 if(id=="tera-blast"&&a.tera!=null)ty=a.tera;
 const ab=AB(a);
 if(ab=="normalize"){ty=0;conv=1}else if(ty==0&&AEFF[ab]!=null){ty=AEFF[ab];conv=1}
 if(ab=="liquid-voice"&&SOUND.test(id))ty=2;
 return{ty,conv};
}
function effv(a,mv,ty,d){
 let e=1;const aa=AB(a),id=mv.id;
 for(const t of tys(d)){
  let x=eff(ty,[t]);
  if(x==0&&(((aa=="scrappy"||aa=="minds-eye")&&t==13&&(ty==0||ty==6))||(id=="thousand-arrows"&&t==9)||(d.item&&d.item.k=="ironball")))x=1;
  if(id=="freeze-dry"&&t==2)x=2;
  e*=x;
 }
 if(id=="flying-press")e*=eff(9,tys(d));
 if(ty==8&&mv.cls!="status"&&id!="thousand-arrows"&&!grounded(d))e=0;
 return e;
}
function hits(a,mv,d){
 if(!mv.acc)return true;
 if(a.nm===d||AB(a)=="no-guard"||AB(d)=="no-guard")return true;
 let acc=mv.acc;const w=W(),id=mv.id;
 if(id=="thunder"||id=="hurricane")acc=w=="rain"?101:w=="sun"?50:acc;
 if(id=="blizzard"&&w=="snow")acc=101;
 if(id=="toxic"&&a.t.includes(7))acc=101;
 if(acc>100)return true;
 const st=Math.max(-6,Math.min(6,(AB(d)=="unaware"?0:(a.sg[6]||0))-(AB(a)=="unaware"?0:(d.sg[7]||0))));
 let mu=st>=0?(3+st)/3:3/(3-st);
 const aa=AB(a),da=ABD(d,a);
 if(aa=="compound-eyes")mu*=1.3;
 if(aa=="hustle"&&mv.cls=="physical")mu*=.8;
 if(aa=="victory-star")mu*=1.1;
 if(w=="sand"&&da=="sand-veil")mu*=.8;
 if(w=="snow"&&da=="snow-cloak")mu*=.8;
 if(da=="tangled-feet"&&d.conf)mu*=.5;
 return Math.random()*100<acc*mu;
}
function dmg(a,mv,d,o){
 const id=mv.id,ty=o.ty,aa=AB(a),da=ABD(d,a),ph=mv.cls=="physical",hp=a.hp/a.mhp,w=W();
 const e=effv(a,mv,ty,d);
 if(FIX[id]){const keep=id=="final-gambit"||id=="endeavor",z=e==0&&!keep;return{v:z?0:Math.max(0,Math.floor(FIX[id](a,d))),e:z?0:1,crit:0}}
 if(OHKO.includes(id))return{v:e==0||(id=="sheer-cold"&&tys(d).includes(5))?0:d.hp,e:e==0?0:1,crit:0};
 if(da=="wonder-guard"&&e<=1)return{v:0,e:0,crit:0};
 let P=o.pw||(BP[id]?BP[id](a,d,mv,mv.pw||0):mv.pw)||50;
 const usesDef=["psyshock","psystrike","secret-sword"].includes(id);
 let A=id=="foul-play"?S(d,1,aa=="unaware"):id=="body-press"?S(a,2,da=="unaware"):S(a,ph?1:3,da=="unaware");
 const D=S(d,(ph||usesDef)?2:4,aa=="unaware");
 if(id=="facade"&&a.st=="brn")A*=2;
 const cs=(a.fe?2:0)+(mv.mt.crit_rate||0)+(aa=="super-luck"?1:0)+(a.item&&a.item.k=="lens"?1:0);
 let crit=CRIT100.includes(id)||Math.random()<[1/24,1/8,1/2,1][Math.min(3,cs)];
 if(["battle-armor","shell-armor"].includes(da))crit=false;
 const own=a.t.includes(ty),tr=a.tera==ty;
 let stab=tr&&own?2:own||tr?1.5:1;
 if(aa=="adaptability"&&stab>=1.5)stab=stab==2?2.25:2;
 let m=1;
 if(aa=="technician"&&P<=60)m*=1.5;
 if(aa=="iron-fist"&&PUNCH.test(id))m*=1.2;
 if(aa=="strong-jaw"&&BITE.test(id))m*=1.5;
 if(aa=="mega-launcher"&&PULSE.test(id))m*=1.5;
 if(aa=="sharpness"&&SLICE.test(id))m*=1.5;
 if(aa=="punk-rock"&&SOUND.test(id))m*=1.3;
 if(aa=="tough-claws"&&contact(mv))m*=1.3;
 if(aa=="reckless"&&(mv.mt.drain<0||RECK.includes(id)))m*=1.2;
 if(aa=="sand-force"&&w=="sand"&&[8,12,16].includes(ty))m*=1.3;
 if(aa=="analytic"&&o.last)m*=1.3;
 if(aa=="rivalry"&&a.g!="N"&&d.g!="N")m*=a.g==d.g?1.25:.75;
 if(aa=="tinted-lens"&&e<1)m*=2;
 if(aa=="neuroforce"&&e>1)m*=1.25;
 if(aa=="sniper"&&crit)m*=1.5;
 if(aa=="sheer-force"&&(mv.mt.ailment_chance>0||mv.mt.flinch_chance>0||mv.mt.stat_chance>0))m*=1.3;
 if(aa=="stakeout"&&d.turns==0)m*=2;
 if(aa=="supreme-overlord")m*=1+.1*Math.min(5,fnt(side(a)));
 if(aa=="flash-fire"&&a.ff&&ty==1)m*=1.5;
 if(aa=="toxic-boost"&&a.st=="psn"&&ph)m*=1.5;
 if(aa=="flare-boost"&&a.st=="brn"&&!ph)m*=1.5;
 if({blaze:1,torrent:2,overgrow:4,swarm:11}[aa]===ty&&hp<=1/3)m*=1.5;
 const tb={steelworker:16,"dragons-maw":14,transistor:3,"steely-spirit":16,"water-bubble":2}[aa];if(tb===ty)m*=aa=="transistor"?1.3:aa=="water-bubble"?2:1.5;
 if(o.conv)m*=1.2;
 if(o.pb)m*=.25;
 if(a.hh)m*=1.5;
 if((da=="multiscale"||da=="shadow-shield")&&d.hp==d.mhp)m*=.5;
 if(da=="thick-fat"&&(ty==1||ty==5))m*=.5;
 if((da=="heatproof"||da=="water-bubble")&&ty==1)m*=.5;
 if(da=="dry-skin"&&ty==1)m*=1.25;
 if(da=="fluffy"){if(contact(mv))m*=.5;if(ty==1)m*=2}
 if(da=="ice-scales"&&!ph)m*=.5;
 if((da=="filter"||da=="solid-rock"||da=="prism-armor")&&e>1)m*=.75;
 if(da=="punk-rock"&&SOUND.test(id))m*=.5;
 if(da=="purifying-salt"&&ty==13)m*=.5;
 if(a.item&&a.item.k=="orb")m*=1.3;
 if(a.item&&a.item.k=="belt"&&e>1)m*=1.2;
 const sc=side(d).sc;
 if(!crit){if(sc.av)m*=2/3;else if(ph&&sc.rf||!ph&&sc.ls)m*=2/3}
 const wx=w=="sun"?(ty==1?1.5:ty==2?.5:1):w=="rain"?(ty==2?1.5:ty==1?.5:1):1;
 let tm=1;
 if(grounded(a)){if(B.ter=="elec"&&ty==3||B.ter=="grass"&&ty==4||B.ter=="psy"&&ty==10)tm=1.3}
 if(grounded(d)){if(B.ter=="mist"&&ty==14)tm*=.5;if(B.ter=="grass"&&["earthquake","bulldoze","magnitude"].includes(id))tm*=.5}
 const v=((22*P*A/D)/50+2)*stab*e*wx*tm*m*(crit?1.5:1)*(.85+Math.random()*.15)*(o.sp?.75:1);
 return{v:e==0?0:Math.max(1,Math.floor(v)),e,crit};
}

/* ---------- acting ---------- */
async function canMove(m,mv){
 const ab=AB(m);
 if(m.st=="slp"&&!["sleep-talk","snore"].includes(mv.id)){
  m.sl-=ab=="early-bird"?2:1;
  if(m.sl<=0){m.st=0;await say(`${m.n} woke up!`)}else{await say(`${m.n} is fast asleep.`);return 0}
 }
 if(m.st=="frz"){
  if(Math.random()<.2||/^(flame-wheel|sacred-fire|flare-blitz|fusion-flare|scald|steam-eruption|burn-up|pyro-ball|scorching-sands)$/.test(mv.id)){m.st=0;await say(`${m.n} thawed out!`)}
  else{await say(`${m.n} is frozen solid!`);return 0}
 }
 if(m.fl){m.fl=0;if(ab!="inner-focus"){await say(`${m.n} flinched!`);if(ab=="steadfast")await stg(m,5,1,m);return 0}}
 if(ab=="truant"){if(m.loaf){m.loaf=0;await say(`${m.n} is loafing around!`);return 0}m.loaf=1}
 if(m.taunt>0&&mv.cls=="status"){await say(`${m.n} can't use ${mv.n} after the taunt!`);return 0}
 if(m.dis&&m.dis.id==mv.id){await say(`${m.n}'s ${mv.n} is disabled!`);return 0}
 if(m.tor&&m.lm==mv.id){await say(`${m.n} can't use the same move twice in a row!`);return 0}
 if(m.love&&m.love.hp>0&&onf(m.love)){
  await say(`${m.n} is in love with ${m.love.n}!`);
  if(rnd(2)==0){await say(`${m.n} is immobilized by love!`);return 0}
 }
 if(m.st=="par"&&Math.random()<.25){await say(`${m.n} is fully paralyzed!`);return 0}
 if(m.conf){
  if(--m.conf<=0)await say(`${m.n} snapped out of its confusion!`);
  else{await say(`${m.n} is confused!`);if(rnd(3)==0){await say("It hurt itself in its confusion!");await hurt(m,Math.max(1,Math.floor(((22*40*S(m,1)/S(m,2))/50+2)*.925)));return 0}}
 }
 return 1;
}
async function act(a){
 const m=a.m;if(m.hp<=0)return;
 if(a.sw)return swapIn(a.s,a.i,a.sw);
 if(m.rc){m.rc=0;return say(`${m.n} must recharge!`)}
 let mv=a.mv;
 if(m.enc&&!m.ch&&!m.lk)mv=m.enc.mv;
 if(!(await canMove(m,mv)))return;
 const wasLk=!!m.lk;
 await exec(a,m,mv);
 if(wasLk&&m.lk){if(--m.lk.n<0){m.lk=null;await say(`${m.n} became confused due to fatigue!`);await setSt(m,"conf",null)}}
}
async function exec(a,m,mv,o){
 o=o||{};
 const fr=side(m),en=opp(m),id=mv.id,z=!!a.z&&!o.free,mx=!!m.dyn&&mv.cls!="status"&&!o.free;
 B.last=mv;
 if(!o.free&&!z&&!mx&&TW.includes(id)){
  if(!m.ch&&!(["solar-beam","solar-blade"].includes(id)&&W()=="sun")&&!(id=="electro-shot"&&W()=="rain")){
   m.ch={mv,tg:a.tg};m.inv=INV.includes(id);
   await say(`${m.n} ${m.inv?"vanished from view":"is charging up"} for ${mv.n}!`);return;
  }
  m.ch=null;m.inv=0;
 }
 const isProt=PROT.includes(id)||(m.dyn&&mv.cls=="status"&&!o.free);
 m.lm=id;m.lmv=mv;m.moved=1;
 const{ty,conv}=mty(m,mv);
 await say(`${m.n} used ${z?ZN[ty]:mx?MXN[ty]:mv.n}!`);
 if(m.fa&&m.fa.trg=="stance"&&AB(m)=="stance-change"){if(id=="king-s-shield")setForm(m,0);else if(mv.cls!="status")setForm(m,1)}
 if((AB(m)=="protean"||AB(m)=="libero")&&!m.pro&&mv.cls!="status"&&m.tera==null){m.pro=1;m.t=[ty];await say(`${m.n} became the ${TY[ty]} type!`)}
 if(isProt){
  if(m.lp&&rnd(3)){m.lp=0;await fail();return}
  m.prot=m.dyn?"protect":id;m.lp=1;fxShield(m);await say(`${m.n} protected itself!`);return;
 }
 const c={a,m,mv,fr,en,ty,o};
 if(ONCE[id]){await fxAura(m,ty);await ONCE[id](c);if(c.pv&&m.hp>0)await pivot(m,c.baton);return}
 if(WX[id]){await fxAura(m,ty);if(!await setW(WX[id],m))await fail();return}
 const k=mv.tg,selfk=/^(user|users-field|user-and-allies|all-allies|user-or-ally|ally)$/.test(k),spr=/^(all-opponents|all-other-pokemon)$/.test(k),fld=/field|all-pokemon|specific|fainting/.test(k);
 let tl;
 if(["counter","mirror-coat","metal-burst"].includes(id))tl=m.lh&&m.lh.src&&m.lh.src.hp>0?[m.lh.src]:[];
 else if(selfk)tl=[m];
 else if(spr)tl=aliveF(en);
 else if(fld)tl=[];
 else{
  let t=k=="random-opponent"?pick(aliveF(en)):(en.f[a.tg]&&en.f[a.tg].hp>0?en.f[a.tg]:aliveF(en)[0]);
  const fm=en.sc.fm;
  if(fm&&fm.hp>0&&onf(fm)&&t!=fm&&AB(m)!="stalwart")t=fm;
  const lr=aliveF(en).find(x=>x!=t&&((AB(x)=="lightning-rod"&&ty==3)||(AB(x)=="storm-drain"&&ty==2)));
  if(lr&&!MBK.includes(AB(m)))t=lr;
  tl=[t];
 }
 if(k=="all-other-pokemon")tl=tl.concat(aliveF(fr).filter(x=>x!=m));
 tl=tl.filter(Boolean);
 if(!tl.length&&!fld){await fail();return}
 if(fld&&mv.cls=="status"){await fail("But nothing happened!");return}
 await Promise.all([(async()=>{m.fx=mv.cls=="status"?"hop":"lunge";draw();await nap(520);m.fx=""})(),fxMove(m,tl,mv,ty,z||mx)]);
 let hitAny=0,total=0;const sf=AB(m)=="sheer-force";
 for(const d of tl){
  if(d.hp<=0)continue;
  const self=d==m,foe=side(d)!=fr,da=ABD(d,m);let subd=0;c.d=d;
  if(!self){
   if(d.inv){await say(`${d.n} avoided the attack!`);continue}
   if(d.prot&&!z&&!(d.prot=="king-s-shield"&&mv.cls=="status")){
    await say(`${d.n} protected itself!`);fxShield(d);
    if(contact(mv)&&m.hp>0){const p=d.prot;
     if(p=="spiky-shield")await hurt(m,Math.floor(m.mhp/8),d);
     if(p=="king-s-shield")await stg(m,1,-1,d);
     if(p=="baneful-bunker")await setSt(m,"psn",d);
     if(p=="obstruct")await stg(m,2,-2,d);
     if(p=="silk-trap")await stg(m,5,-1,d);
     if(p=="burning-bulwark")await setSt(m,"brn",d);}
    continue;
   }
   if(spr&&side(d).sc.wg&&mv.cls!="status"){await say(`Wide Guard protected ${d.n}!`);continue}
   if(mv.pri>0&&foe&&(side(d).sc.qg||["queenly-majesty","dazzling","armor-tail"].includes(da))){await say(`${d.n} protected itself from the priority move!`);continue}
   if(PRE[id]&&PRE[id](c,d)){await fail();continue}
   if(mv.cls=="status"&&foe&&d.sub&&!SOUND.test(id)){await fail();continue}
   if(mv.cls=="status"&&foe&&da=="good-as-gold"){await say(`${d.n}'s Good as Gold blocked the move!`);continue}
   if((da=="soundproof"&&SOUND.test(id))||(da=="bulletproof"&&BALL.test(id))||((da=="overcoat"||(d.t.includes(4)&&foe))&&PWD.test(id))){await say(`It doesn't affect ${d.n}…`);continue}
   if(da=="magic-bounce"&&mv.cls=="status"&&foe){await say(`${d.n} bounced the move back!`);fxPop(d,"🔁");continue}
   if(!z&&!mx&&!hits(m,mv,d)){await say(`${m.n}'s attack missed!`);continue}
   const ab=ABS[da];
   if(ab&&ty==ab[0]&&!(da=="levitate"&&id=="thousand-arrows")&&!(da=="levitate"&&mv.cls=="status")){
    if(ab[1]===0)await say(`${d.n} avoids the attack with Levitate!`);
    else{await say(`${d.n}'s ${cap(da)} absorbed the move!`);
     if(ab[1]=="h")await heal(d,d.mhp/4);else if(ab[1]=="f"){d.ff=1;await say(`${d.n}'s Fire power was boosted!`)}
     else if(Array.isArray(ab[1]))await stg(d,ab[1][0],ab[1][1],d);else await stg(d,ab[1],1,d)}
    continue;
   }
  }
  if(mv.cls=="status"&&PERT[id]){if(await PERT[id](c,d))continue}
  if(mv.cls!="status"){
   let n=1;
   if(mv.mt.max_hits){const mn=mv.mt.min_hits||1,mxh=mv.mt.max_hits;n=AB(m)=="skill-link"?mxh:mn==mxh?mn:(mn==2&&mxh==5)?[2,2,2,3,3,3,4,5][rnd(8)]:mn+rnd(mxh-mn+1)}
   else if(AB(m)=="parental-bond"&&!spr&&!OHKO.includes(id)&&!z&&!mx)n=2;
   for(let h=0;h<n&&d.hp>0&&m.hp>0;h++){
    const pw=z?160:mx?[90,100,130][Math.min(2,Math.floor((mv.pw||60)/50))]:0;
    const r=dmg(m,mv,d,{ty,conv,pw,sp:tl.length>1,last:a.last,pb:AB(m)=="parental-bond"&&h==1&&!mv.mt.max_hits});
    if(r.e==0){await say(`It doesn't affect ${d.n}…`);break}
    if(r.v==0){await say(`${d.n}'s Wonder Guard protected it!`);break}
    if(d.dg&&!MBK.includes(AB(m))&&(da=="disguise"||(da=="ice-face"&&mv.cls=="physical"))){
     d.dg=0;await say(`${d.n}'s ${cap(da)} protected it!`);setForm(d,1);if(da=="disguise")await hurt(d,Math.floor(d.mhp/8),m);break;
    }
    if(d.sub>0&&!SOUND.test(id)&&AB(m)!="infiltrator"&&d!=m){
     const x=Math.min(d.sub,r.v);d.sub-=x;total+=x;hitAny=1;subd=1;
     await fxSub(d,"hit");await say(`The substitute took damage for ${d.n}!`);
     if(d.sub<=0){d.sub=0;await fxSub(d,"break");await say(`${d.n}'s substitute faded!`)}
     continue;
    }
    const hb=d.hp;hitAny=1;
    await hurt(d,r.v,m,mv);
    const dealt=hb-d.hp;total+=dealt;
    await say(`${r.crit?"Critical hit! ":""}${r.e>1?"It's super effective!":r.e<1?"It's not very effective…":`${d.n} lost ${dealt} HP.`}`);
    await onHit(m,d,mv,dealt,ty,r.crit,contact(mv),hb);
   }
   if(d.hp>0&&!subd&&!sf&&da!="shield-dust"&&mv.mt.flinch_chance&&!d.moved&&rnd(100)<mv.mt.flinch_chance*(AB(m)=="serene-grace"?2:1))d.fl=1;
   if(AFTER[id]&&hitAny&&(m.hp>0||["explosion","self-destruct","misty-explosion","final-gambit"].includes(id)))await AFTER[id](c,d,total);
   if(TRAP.includes(id)&&d.hp>0&&!subd&&!d.bind)d.bind=4+rnd(2);
  }
  if(d.hp<=0&&mv.cls!="status")continue;
  const canSec=mv.cls=="status"||(!subd&&!sf&&da!="shield-dust"&&d.hp>0);
  const ch=mv.cls=="status"?100:(mv.mt.ailment_chance||0)*(AB(m)=="serene-grace"?2:1),aln=mv.mt.ailment&&AIL[mv.mt.ailment.name];
  if(aln&&canSec&&rnd(100)<ch){const ok=await setSt(d,aln,m,mv);if(!ok&&mv.cls=="status")await fail()}
  if(mv.sc.length){
   const toSelf=selfk||/raise/.test((mv.mt.category||{}).name||""),tgt=toSelf?m:d,sch=mv.cls=="status"?100:(mv.mt.stat_chance||100);
   if((toSelf?(hitAny||mv.cls=="status")&&!c.sdone:canSec&&tgt.hp>0)&&rnd(100)<sch){
    if(toSelf)c.sdone=1;
    for(const x of mv.sc){const i=SK[x.stat.name];if(i)await stg(tgt,i,x.change,m)}
   }
  }
  const hm=mv.mt.healing;
  if(hm>0&&mv.cls=="status"&&!c.hdone){c.hdone=1;const t=selfk?m:d;if(t.hp>=t.mhp)await fail();else await heal(t,t.mhp*hm/100)}
  if(AFTER[id]&&mv.cls=="status")await AFTER[id](c,d,0);
 }
 if(hitAny&&mv.cls!="status"){
  const d0=tl[0];
  if(mv.mt.drain<0&&total>0&&!["rock-head","magic-guard"].includes(AB(m))&&m.hp>0){await say(`${m.n} was damaged by the recoil!`);await hurt(m,Math.max(1,Math.floor(total*Math.abs(mv.mt.drain)/100)))}
  if(mv.mt.drain>0&&total>0&&m.hp>0){const x=Math.floor(total*mv.mt.drain/100);if(ABD(d0,m)=="liquid-ooze"){await say(`${m.n} sucked up liquid ooze!`);await hurt(m,x)}else await heal(m,x,`${m.n} drained energy!`)}
  if(m.item&&m.item.k=="orb"&&m.hp>0&&AB(m)!="magic-guard"&&!sf&&total>0){await say(`${m.n} lost some HP to its Life Orb!`);await hurt(m,Math.floor(m.mhp/10))}
  if(mx&&m.hp>0){const f=MXF[ty];if(f[0]=="w")await setW(f[1],m);else if(f[0]=="t")await setT(f[1]);else for(const x of f[3]=="t"?aliveF(fr):aliveF(en))await stg(x,f[1],f[2],m)}
  if(RCH.includes(id)&&!z&&!mx&&m.hp>0)m.rc=1;
  if(LOCK.includes(id)&&!z&&!mx&&!m.lk&&m.hp>0)m.lk={mv,tg:a.tg,n:1+rnd(2)};
 }
 if(!hitAny&&m.lk&&LOCK.includes(id))m.lk=null;
 if(c.pv&&m.hp>0)await pivot(m,c.baton);
 if(m.hp>0)formCheck(m);
}

/* ---------- end of turn ---------- */
async function endTurn(){
 const act=()=>[...B.me.f,...B.foe.f].filter(x=>x&&x.hp>0);
 for(const m of act()){
  if(m.hp<=0)continue;
  const w=W(),ab=AB(m),mg=ab=="magic-guard";
  if(w=="sand"&&!mg&&!tys(m).some(t=>[8,12,16].includes(t))&&!["sand-veil","sand-force","sand-rush","overcoat"].includes(ab)){await say(`${m.n} is buffeted by the sandstorm!`);await hurt(m,Math.floor(m.mhp/16))}
  if(B.ter=="grass"&&grounded(m))await heal(m,m.mhp/16,null);
  if(m.item&&m.item.k=="leftovers")await heal(m,m.mhp/16,`${m.n} restored a little HP with its Leftovers!`);
  if(m.seed&&!mg&&m.hp>0){const o=aliveF(opp(m))[0];if(o){await say(`${m.n}'s health is sapped by Leech Seed!`);const x=Math.floor(m.mhp/8);await hurt(m,x);await heal(o,x,null)}}
  if(m.hp>0&&(m.st=="brn"||(m.st=="psn"&&ab!="poison-heal"))&&!mg){await say(`${m.n} is hurt by its ${m.st=="brn"?"burn":"poison"}!`);await hurt(m,Math.floor(m.mhp/(m.st=="brn"&&ab=="heatproof"?16:8)))}
  if(m.hp>0&&m.bind>0&&!mg){await say(`${m.n} is hurt by the trapping move!`);await hurt(m,Math.floor(m.mhp/8));m.bind--}
  if(m.hp>0&&m.curse&&!mg){await say(`${m.n} is afflicted by the curse!`);await hurt(m,Math.floor(m.mhp/4))}
  if(m.hp>0&&m.salt&&!mg){await hurt(m,Math.floor(m.mhp/(tys(m).some(t=>t==2||t==16)?4:8)))}
  if(m.hp>0&&m.ing)await heal(m,m.mhp/16,null);
  if(m.hp>0&&m.aq)await heal(m,m.mhp/16,null);
  if(m.hp>0&&m.yawn&&--m.yawn==0){if(!m.st)await setSt(m,"slp",null)}
  if(m.hp>0)await abEnd(m);
 }
 for(const sd of[B.me,B.foe]){
  const w=sd.sc.wish;
  if(w&&--w.n<=0){const x=sd.f[w.i];if(x&&x.hp>0)await heal(x,w.v,`${x.n}'s wish came true!`);sd.sc.wish=0}
  for(const k of["rf","ls","av","sg","tw"])if(sd.sc[k]&&--sd.sc[k]<=0){sd.sc[k]=0;await say("A team effect wore off.")}
  sd.sc.wg=0;sd.sc.qg=0;sd.sc.fm=null;
 }
 for(const m of act()){
  if(m.taunt>0)m.taunt--;
  if(m.enc&&--m.enc.n<=0)m.enc=null;
  if(m.dis&&--m.dis.n<=0)m.dis=null;
  m.turns++;m.hh=0;
  if(!m.prot&&!m.endure)m.lp=0;
  m.prot=0;m.endure=0;m.fl=0;
  formCheck(m);
 }
 if(B.tr>0&&--B.tr==0)await say("The twisted dimensions returned to normal!");
 if(B.ter&&--B.tn<=0){await say("The terrain returned to normal.");B.ter=null}
 if(B.w&&--B.wn<=0){await say("The weather returned to normal.");B.w=null}
 if(!aliveF(B.me).length&&!bench().length)return over();
 if(!aliveF(B.foe).length&&!B.foe.bn.some(x=>x.hp>0))return win();
 for(const s of["foe","me"])for(let i=0;i<2;i++){
  const sd=B[s];
  if(sd.f[i]&&sd.f[i].hp>0)continue;
  const nb=sd.bn.filter(x=>x.hp>0);
  if(!nb.length){sd.f[i]=null;continue}
  if(s=="foe")await swapIn("foe",i,nb[0]);
  else{B.msg="Choose a Pokémon to send out!";const k=await new Promise(r=>{B.ui={st:"forced",i,res:r};draw()});B.ui=null;await swapIn("me",i,B.me.bn[k])}
 }
 nextCmd(0);
}
