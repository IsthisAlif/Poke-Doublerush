/* Move rules: name groups, power tables, special-move handlers */
const rx=s=>new RegExp("^("+s+")$");
const PUNCH=rx("mach-punch|bullet-punch|ice-punch|fire-punch|thunder-punch|shadow-punch|drain-punch|dynamic-punch|focus-punch|comet-punch|mega-punch|hammer-arm|meteor-mash|sky-uppercut|power-up-punch|plasma-fists|surging-strikes|wicked-blow|jet-punch|double-iron-bash|rage-fist");
const BITE=rx("bite|crunch|fire-fang|ice-fang|thunder-fang|poison-fang|psychic-fang|hyper-fang|jaw-lock|fishious-rend");
const SOUND=rx("hyper-voice|boomburst|bug-buzz|snarl|sing|screech|growl|roar|supersonic|round|echoed-voice|disarming-voice|uproar|overdrive|relic-song|snore|chatter|clanging-scales|noble-roar|parting-shot|perish-song|sparkling-aria|eerie-spell|torch-song|alluring-voice|psychic-noise|metal-sound|grass-whistle|howl|confide");
const PULSE=rx("aura-sphere|dark-pulse|dragon-pulse|water-pulse|heal-pulse|origin-pulse|terrain-pulse");
const SLICE=rx("slash|night-slash|psycho-cut|leaf-blade|x-scissor|cut|air-slash|aerial-ace|sacred-sword|razor-shell|stone-axe|ceaseless-edge|solar-blade|kowtow-cleave|aqua-cutter|fury-cutter|razor-leaf|cross-poison|air-cutter|bitter-blade|mighty-cleave|tachyon-cutter");
const BALL=rx("shadow-ball|energy-ball|weather-ball|sludge-bomb|bullet-seed|seed-bomb|gyro-ball|focus-blast|acid-spray|egg-bomb|electro-ball|zap-cannon|mist-ball|octazooka|pollen-puff|rock-wrecker|rock-blast|magnet-bomb|barrage|aura-sphere|beak-blast|ice-ball|searing-shot|mud-bomb");
const PWD=rx("spore|sleep-powder|stun-spore|poison-powder|powder|cotton-spore|rage-powder|magic-powder");
const NC=rx("earthquake|rock-slide|rock-blast|stone-edge|rock-tomb|bulldoze|magnitude|fissure|bone-rush|bonemerang|bone-club|icicle-spear|icicle-crash|ice-shard|pin-missile|spike-cannon|poison-sting|bullet-seed|seed-bomb|egg-bomb|barrage|gunk-shot|shell-side-arm|sand-tomb|smack-down|thousand-arrows|thousand-waves|dragon-darts|steel-beam|beak-blast|razor-leaf|leaf-tornado|metal-burst|surf|self-destruct|explosion|rock-wrecker|sacred-sword");
const contact=mv=>mv.cls=="physical"&&!NC.test(mv.id);
const RECK=["brave-bird","double-edge","flare-blitz","head-smash","submission","take-down","volt-tackle","wild-charge","wood-hammer","wave-crash","high-jump-kick","jump-kick","head-charge","light-of-ruin","chloroblast"];
const AEFF={pixilate:17,aerilate:9,refrigerate:5,galvanize:3};
const CRIT100=["frost-breath","storm-throw","wicked-blow","surging-strikes","flower-trick"];
const OHKO=["guillotine","horn-drill","fissure","sheer-cold"];
const TRAP=["bind","wrap","fire-spin","whirlpool","sand-tomb","infestation","magma-storm","clamp","snap-trap","thunder-cage"];
const LOCK=["thrash","outrage","petal-dance","raging-fury"];
const PIV=["u-turn","volt-switch","flip-turn"];
const BAN=["splash","celebrate","hold-hands","happy-hour","transform","mimic","sketch","conversion","conversion-2","camouflage","teatime","fling","natural-gift","present","bide","spit-up","stockpile","swallow","pay-day","trump-card","me-first","assist","future-sight","doom-desire","last-resort","sky-drop","beat-up","hyperspace-fury","dynamax-cannon","struggle","bestow","magic-coat","snatch","imprison","mirror-move","mud-sport","water-sport","gravity","magic-room","wonder-room","after-you","quash","instruct","nature-power","secret-power","triple-kick","triple-axel","rollout","ice-ball","fury-cutter","echoed-voice","round","pursuit","uproar","focus-punch","magnitude","spotlight","court-change","decorate","aromatic-mist","perish-song","nightmare","safeguard-x"];
const wtp=w=>w>=200?120:w>=100?100:w>=50?80:w>=25?60:w>=10?40:20;
const boosts=m=>m.sg.slice(1,6).reduce((s,x)=>s+Math.max(0,x),0);
const fnt=sd=>sd.t.filter(x=>x.hp<=0).length;
const fail=async t=>{await say(t||"But it failed!");return 1};
async function setW(w,m){if(B.w==w)return 0;B.w=w;B.wn=5;await say({sun:"The sunlight turned harsh!",rain:"It started to rain!",sand:"A sandstorm kicked up!",snow:"It started to snow!"}[w]);return 1}
async function setT(t){if(B.ter==t)return 0;B.ter=t;B.tn=5;await say({elec:"An electric current runs across the battlefield!",grass:"Grass grew to cover the battlefield!",psy:"The battlefield got weird!",mist:"Mist swirled around the battlefield!"}[t]);return 1}
const scf=(k,msg,n)=>async c=>{if(c.fr.sc[k])return fail();c.fr.sc[k]=n||5;await say(msg);return 1};
const hzf=(k,max,msg)=>async c=>{if((c.en.sc[k]||0)>=max)return fail();c.en.sc[k]=(c.en.sc[k]||0)+1;await say(msg);return 1};
const healf=(num,den)=>async c=>{if(c.m.hp>=c.m.mhp)return fail();await heal(c.m,c.m.mhp*num/den);return 1};
const wheal=async c=>{const w=W(),id=c.mv.id;let r=id=="shore-up"?(w=="sand"?2/3:.5):(w=="sun"?2/3:w?.25:.5);if(c.m.hp>=c.m.mhp)return fail();await heal(c.m,c.m.mhp*r);return 1};
const teamHeal=cure=>async c=>{for(const x of aliveF(c.fr)){await heal(x,x.mhp/4,null);if(cure)x.st=0}await say("The team's HP was restored!");return 1};

/* base-power overrides */
const BP={
 "low-kick":(a,d)=>wtp(d.wt),"grass-knot":(a,d)=>wtp(d.wt),
 "heavy-slam":(a,d)=>{const r=a.wt/d.wt;return r>=5?120:r>=4?100:r>=3?80:r>=2?60:40},
 "heat-crash":(a,d)=>BP["heavy-slam"](a,d),
 "gyro-ball":(a,d)=>Math.min(150,1+Math.floor(25*S(d,5)/S(a,5))),
 "electro-ball":(a,d)=>{const r=S(a,5)/S(d,5);return r>=4?150:r>=3?120:r>=2?80:r>=1?60:40},
 "return":()=>102,"frustration":()=>102,
 "reversal":a=>{const r=48*a.hp/a.mhp;return r<2?200:r<5?150:r<10?100:r<17?80:r<33?40:20},
 "flail":a=>BP.reversal(a),
 "eruption":a=>Math.max(1,150*a.hp/a.mhp),"water-spout":a=>Math.max(1,150*a.hp/a.mhp),"dragon-energy":a=>Math.max(1,150*a.hp/a.mhp),
 "wring-out":(a,d)=>Math.max(1,120*d.hp/d.mhp),"crush-grip":(a,d)=>Math.max(1,120*d.hp/d.mhp),
 "hex":(a,d,mv,P)=>d.st?P*2:P,"venoshock":(a,d,mv,P)=>d.st=="psn"?P*2:P,"brine":(a,d,mv,P)=>d.hp<=d.mhp/2?P*2:P,
 "facade":(a,d,mv,P)=>a.st?P*2:P,"acrobatics":(a,d,mv,P)=>a.item?P:P*2,
 "stored-power":a=>20+20*boosts(a),"power-trip":a=>20+20*boosts(a),"punishment":(a,d)=>Math.min(200,60+20*boosts(d)),
 "avalanche":(a,d,mv,P)=>a.hd?P*2:P,"revenge":(a,d,mv,P)=>a.hd?P*2:P,
 "payback":(a,d,mv,P)=>d.moved?P*2:P,"assurance":(a,d,mv,P)=>d.hd?P*2:P,
 "bolt-beak":(a,d,mv,P)=>d.moved?P:P*2,"fishious-rend":(a,d,mv,P)=>d.moved?P:P*2,
 "last-respects":a=>50+50*fnt(side(a)),"rage-fist":a=>Math.min(350,50+50*(a.rf||0)),
 "knock-off":(a,d,mv,P)=>d.item?P*1.5:P,
 "weather-ball":(a,d,mv,P)=>W()?P*2:P,"terrain-pulse":(a,d,mv,P)=>B.ter?P*2:P,
 "rising-voltage":(a,d,mv,P)=>B.ter=="elec"&&grounded(d)?P*2:P,"expanding-force":(a,d,mv,P)=>B.ter=="psy"&&grounded(a)?P*1.5:P,
 "solar-beam":(a,d,mv,P)=>["rain","sand","snow"].includes(W())?P/2:P,"solar-blade":(a,d,mv,P)=>["rain","sand","snow"].includes(W())?P/2:P,
 "smelling-salts":(a,d,mv,P)=>d.st=="par"?P*2:P,"wake-up-slap":(a,d,mv,P)=>d.st=="slp"?P*2:P,
 "dream-eater":(a,d,mv,P)=>P,
};
/* fixed-damage moves */
const FIX={
 "seismic-toss":()=>50,"night-shade":()=>50,"dragon-rage":()=>40,"sonic-boom":()=>20,"psywave":()=>Math.floor(50*(rnd(11)+5)/10),
 "super-fang":(a,d)=>Math.max(1,Math.floor(d.hp/2)),"nature-s-madness":(a,d)=>Math.max(1,Math.floor(d.hp/2)),"ruination":(a,d)=>Math.max(1,Math.floor(d.hp/2)),
 "endeavor":(a,d)=>Math.max(0,d.hp-a.hp),"final-gambit":a=>a.hp,
 "counter":a=>a.lh&&a.lh.ph?a.lh.v*2:0,"mirror-coat":a=>a.lh&&!a.lh.ph?a.lh.v*2:0,"metal-burst":a=>a.lh?Math.floor(a.lh.v*1.5):0,
};
/* moves that fail before doing anything: return true to fail */
const PRE={
 "fake-out":c=>c.m.turns>0,"first-impression":c=>c.m.turns>0,"mat-block":c=>c.m.turns>0,
 "dream-eater":(c,d)=>d.st!="slp","sucker-punch":(c,d)=>d.moved||!d.cm||d.cm.cls=="status",
 "counter":c=>!c.m.lh,"mirror-coat":c=>!c.m.lh,"metal-burst":c=>!c.m.lh,
 "explosion":c=>[...B.me.f,...B.foe.f].some(x=>x&&x.hp>0&&AB(x)=="damp"),"self-destruct":c=>[...B.me.f,...B.foe.f].some(x=>x&&x.hp>0&&AB(x)=="damp"),
};
/* one-time (user/field) effects. Return 1 when the move is fully handled. */
const ONCE={
 substitute:async c=>{const m=c.m,x=Math.floor(m.mhp/4);if(m.sub)return fail(`${m.n} already has a substitute!`);if(m.hp<=x)return fail("It was too weak to make a substitute!");m.hp-=x;m.sub=x;await fxSub(m,"in");await say(`${m.n} made a substitute!`);return 1},
 "shed-tail":async c=>{const m=c.m,x=Math.floor(m.mhp/2);if(m.hp<=x||!bnAlive(m))return fail();m.hp-=x;c.baton={sg:m.sg.slice(),sub:Math.floor(m.mhp/4)};c.pv=1;await say(`${m.n} left a substitute behind!`);return 1},
 "baton-pass":async c=>{if(!bnAlive(c.m))return fail();c.baton={sg:c.m.sg.slice(),sub:c.m.sub};c.pv=1;return 1},
 teleport:async c=>{if(!bnAlive(c.m))return fail();c.pv=1;return 1},
 "chilly-reception":async c=>{await say("Chilly reception…");await setW("snow",c.m);if(bnAlive(c.m))c.pv=1;return 1},
 "wide-guard":scf("wg","Wide Guard protected the team!",1),"quick-guard":scf("qg","Quick Guard protected the team!",1),
 reflect:scf("rf","Reflect raised the team's Defense!",5),"light-screen":scf("ls","Light Screen raised the team's Sp. Def!",5),
 "aurora-veil":async c=>W()!="snow"?fail():scf("av","Aurora Veil made the team stronger!",5)(c),
 safeguard:scf("sg","The team became cloaked in a mystical veil!",5),tailwind:scf("tw","A tailwind blew from behind the team!",4),
 spikes:hzf("sp",3,"Spikes were scattered around the foe's feet!"),"stealth-rock":hzf("rk",1,"Pointed stones float in the air around the foe!"),
 "toxic-spikes":hzf("ts",2,"Poison spikes were scattered around the foe's feet!"),"sticky-web":hzf("web",1,"A sticky web spreads out around the foe!"),
 defog:async c=>{for(const s of[B.me,B.foe])for(const k of["sp","rk","ts","web"])s[k]=0;for(const k of["sp","rk","ts","web"]){c.fr.sc[k]=0;c.en.sc[k]=0}for(const k of["rf","ls","av","sg"])c.en.sc[k]=0;B.ter=null;await say("The hazards and screens were blown away!");for(const x of aliveF(c.en))await stg(x,7,-1,c.m);return 1},
 "electric-terrain":async()=>{if(!await setT("elec"))await fail();return 1},"grassy-terrain":async()=>{if(!await setT("grass"))await fail();return 1},
 "psychic-terrain":async()=>{if(!await setT("psy"))await fail();return 1},"misty-terrain":async()=>{if(!await setT("mist"))await fail();return 1},
 "trick-room":async()=>{if(B.tr>0){B.tr=0;await say("The twisted dimensions returned to normal!")}else{B.tr=5;await say("The dimensions were twisted!")}return 1},
 haze:async()=>{for(const x of[...aliveF(B.me),...aliveF(B.foe)])x.sg=newSg();await say("All stat changes were eliminated!");return 1},
 "heal-bell":teamHeal(1),aromatherapy:teamHeal(1),"jungle-healing":teamHeal(1),"life-dew":teamHeal(0),"lunar-blessing":teamHeal(1),
 wish:async c=>{c.fr.sc.wish={n:2,v:Math.floor(c.m.mhp/2),i:c.fr.f.indexOf(c.m)};await say(`${c.m.n} made a wish!`);return 1},
 "destiny-bond":async c=>{c.m.db=1;await say(`${c.m.n} is trying to take its foe down with it!`);return 1},
 endure:async c=>{if(c.m.lp&&rnd(3)){c.m.lp=0;return fail()}c.m.endure=1;c.m.lp=1;await say(`${c.m.n} braced itself!`);return 1},
 "belly-drum":async c=>{const m=c.m;if(m.hp<=m.mhp/2||m.sg[1]>=6)return fail();m.hp-=Math.floor(m.mhp/2);m.sg[1]=6;fxStat(m,1);await say(`${m.n} cut its own HP and maximized its Attack!`);return 1},
 rest:async c=>{const m=c.m;if(m.hp>=m.mhp||m.st=="slp")return fail();m.st="slp";m.sl=3;m.hp=m.mhp;fxHeal(m);await say(`${m.n} slept and became healthy!`);return 1},
 "sleep-talk":async c=>{const m=c.m;if(m.st!="slp")return fail();const o=m.mv.filter(x=>!["sleep-talk","snore"].includes(x.id));if(!o.length)return fail();await exec(c.a,m,pick(o),{free:1});return 1},
 metronome:async c=>{try{const d=await J(API+"move/"+(1+rnd(919))),mv=normMove(d);if(BAN.includes(mv.id)||!okMv(mv))return fail();await exec(c.a,c.m,mv,{free:1})}catch(e){return fail()}return 1},
 copycat:async c=>{if(!B.last||B.last.id=="copycat")return fail();await exec(c.a,c.m,B.last,{free:1});return 1},
 "ally-switch":async c=>{const f=c.fr.f;if(!f[0]||!f[1]||f[0].hp<=0||f[1].hp<=0)return fail();[f[0],f[1]]=[f[1],f[0]];await say(`${c.m.n} swapped places with its ally!`);return 1},
 "follow-me":async c=>{c.fr.sc.fm=c.m;await say(`${c.m.n} became the center of attention!`);return 1},"rage-powder":async c=>{c.fr.sc.fm=c.m;await say(`${c.m.n} became the center of attention!`);return 1},
 "helping-hand":async c=>{const al=ally(c.m);if(!al)return fail();al.hh=1;await say(`${c.m.n} is ready to help ${al.n}!`);return 1},
 "focus-energy":async c=>{c.m.fe=1;await say(`${c.m.n} is getting pumped!`);return 1},
 ingrain:async c=>{c.m.ing=1;await say(`${c.m.n} planted its roots!`);return 1},"aqua-ring":async c=>{c.m.aq=1;await say(`${c.m.n} surrounded itself with a veil of water!`);return 1},
 synthesis:wheal,moonlight:wheal,"morning-sun":wheal,"shore-up":wheal,
 "healing-wish":async c=>{if(!bnAlive(c.m))return fail();c.fr.sc.hw=1;c.m.hp=0;await faint(c.m);return 1},"lunar-dance":async c=>{if(!bnAlive(c.m))return fail();c.fr.sc.hw=1;c.m.hp=0;await faint(c.m);return 1},
 coaching:async c=>{const al=ally(c.m);if(!al)return fail();await stg(al,1,1,c.m);await stg(al,2,1,c.m);return 1},
 acupressure:async c=>{await stg(c.m,pick([1,2,3,4,5]),2,c.m);return 1},
 curse:async c=>{const m=c.m;if(m.t.includes(13)){const d=aliveF(c.en)[0];if(m.hp<=m.mhp/2||!d)return fail();m.hp-=Math.floor(m.mhp/2);d.curse=1;await say(`${m.n} cut its own HP and laid a curse on ${d.n}!`)}else{await stg(m,5,-1,m);await stg(m,1,1,m);await stg(m,2,1,m)}return 1},
};
/* per-target effects for status moves. Return 1 when fully handled; falsy continues with generic ailment/stat code. */
const PERT={
 attract:async(c,d)=>{const m=c.m;if(m.g=="N"||d.g=="N"||m.g==d.g||d.love||["oblivious","aroma-veil"].includes(ABD(d,m)))return fail();d.love=m;fxPop(d,"💘");await say(`${d.n} fell in love with ${m.n}!`);return 1},
 captivate:async(c,d)=>{const m=c.m;if(m.g=="N"||d.g=="N"||m.g==d.g||["oblivious","aroma-veil"].includes(ABD(d,m)))return fail();return 0},
 taunt:async(c,d)=>{if(d.taunt)return fail();d.taunt=3;await say(`${d.n} fell for the taunt!`);return 1},
 torment:async(c,d)=>{if(d.tor)return fail();d.tor=1;await say(`${d.n} was subjected to torment!`);return 1},
 encore:async(c,d)=>{if(!d.lmv||d.enc)return fail();d.enc={mv:d.lmv,n:3};await say(`${d.n} received an encore!`);return 1},
 disable:async(c,d)=>{if(!d.lm||d.dis)return fail();d.dis={id:d.lm,n:4};await say(`${d.n}'s move was disabled!`);return 1},
 "leech-seed":async(c,d)=>{if(d.seed||d.t.includes(4))return fail();d.seed=1;await say(`${d.n} was seeded!`);return 1},
 yawn:async(c,d)=>{if(d.yawn||d.st)return fail();d.yawn=2;await say(`${d.n} grew drowsy!`);return 1},
 "pain-split":async(c,d)=>{const x=Math.floor((c.m.hp+d.hp)/2);c.m.hp=Math.min(c.m.mhp,x);d.hp=Math.min(d.mhp,x);await say("The battlers shared their pain!");return 1},
 "role-play":async(c,d)=>{if(d.ab==c.m.ab)return fail();c.m.ab=d.ab;await say(`${c.m.n} copied ${d.n}'s ${cap(d.ab)}!`);await abEnter(c.m);return 1},
 "skill-swap":async(c,d)=>{[c.m.ab,d.ab]=[d.ab,c.m.ab];await say(`${c.m.n} swapped abilities with ${d.n}!`);return 1},
 entrainment:async(c,d)=>{d.ab=c.m.ab;await say(`${d.n} acquired ${cap(d.ab)}!`);return 1},
 "worry-seed":async(c,d)=>{d.ab="insomnia";d.st=d.st=="slp"?0:d.st;await say(`${d.n} acquired Insomnia!`);return 1},
 "simple-beam":async(c,d)=>{d.ab="simple";await say(`${d.n} acquired Simple!`);return 1},
 "gastro-acid":async(c,d)=>{d.gas=1;await say(`${d.n}'s ability was suppressed!`);return 1},
 doodle:async(c,d)=>{for(const x of[c.m,ally(c.m)])if(x){x.ab=d.ab}await say("The user and its ally copied the ability!");return 1},
 soak:async(c,d)=>{if(d.tera!=null)return fail();d.t=[2];await say(`${d.n} transformed into the Water type!`);return 1},
 "reflect-type":async(c,d)=>{c.m.t=d.t.slice();await say(`${c.m.n}'s type changed to match ${d.n}'s!`);return 1},
 "psych-up":async(c,d)=>{c.m.sg=d.sg.slice();await say(`${c.m.n} copied ${d.n}'s stat changes!`);return 1},
 "heart-swap":async(c,d)=>{[c.m.sg,d.sg]=[d.sg,c.m.sg];await say("The battlers swapped stat changes!");return 1},
 trick:async(c,d)=>PERT.switcheroo(c,d),
 switcheroo:async(c,d)=>{if(d.sub||(!c.m.item&&!d.item))return fail();[c.m.item,d.item]=[d.item,c.m.item];await say(`${c.m.n} switched items with ${d.n}!`);return 1},
 "mean-look":async(c,d)=>{if(d.t.includes(13)||d.trap)return fail();d.trap=1;await say(`${d.n} can no longer escape!`);return 1},
 block:async(c,d)=>PERT["mean-look"](c,d),"spider-web":async(c,d)=>PERT["mean-look"](c,d),
 roar:async(c,d)=>{if(!await forceOut(d))await fail();return 1},whirlwind:async(c,d)=>{if(!await forceOut(d))await fail();return 1},
 "lock-on":async(c,d)=>{c.m.nm=d;await say(`${c.m.n} took aim at ${d.n}!`);return 1},"mind-reader":async(c,d)=>PERT["lock-on"](c,d),
 "strength-sap":async(c,d)=>{if(d.sg[1]<=-6)return fail();await heal(c.m,S(d,1));await stg(d,1,-1,c.m);return 1},
 memento:async(c,d)=>{await stg(d,1,-2,c.m);await stg(d,3,-2,c.m);c.m.hp=0;await faint(c.m);return 1},
 "parting-shot":async(c,d)=>{await stg(d,1,-1,c.m);await stg(d,3,-1,c.m);if(bnAlive(c.m))c.pv=1;return 1},
};
/* effects after a damaging move connected: (c, target, damage dealt) */
const AFTER={
 "knock-off":async(c,d)=>{if(d.item&&d.hp>0&&!(d.item.k=="mega"||d.item.k=="z")){await say(`${c.m.n} knocked off ${d.n}'s ${d.item.n}!`);d.item=null;if(AB(d)=="unburden")d.unb=1}else if(d.item&&d.hp>0){await say(`${d.n}'s ${d.item.n} can't be knocked off!`)}},
 thief:async(c,d)=>{if(c.m.item||!d.item||d.hp<=0)return;await say(`${c.m.n} stole ${d.n}'s ${d.item.n}!`);c.m.item=d.item;d.item=null},
 covet:async(c,d)=>AFTER.thief(c,d),
 "rapid-spin":async c=>{for(const k of["sp","rk","ts","web"])c.fr.sc[k]=0;c.m.seed=0;c.m.bind=0;await stg(c.m,5,1,c.m)},
 "mortal-spin":async c=>{for(const k of["sp","rk","ts","web"])c.fr.sc[k]=0;c.m.seed=0;c.m.bind=0},
 "dragon-tail":async(c,d)=>{if(d.hp>0)await forceOut(d)},"circle-throw":async(c,d)=>{if(d.hp>0)await forceOut(d)},
 "u-turn":async c=>{c.pv=1},"volt-switch":async c=>{c.pv=1},"flip-turn":async c=>{c.pv=1},
 explosion:async c=>{c.m.hp=0;await faint(c.m)},"self-destruct":async c=>{c.m.hp=0;await faint(c.m)},"misty-explosion":async c=>{c.m.hp=0;await faint(c.m)},"final-gambit":async c=>{c.m.hp=0;await faint(c.m)},
 "burn-up":async c=>{c.m.t=c.m.t.filter(t=>t!=1);await say(`${c.m.n} burned itself out!`)},
 "core-enforcer":async(c,d)=>{if(d.moved&&d.hp>0)d.gas=1},
 "smelling-salts":async(c,d)=>{if(d.st=="par")d.st=0},"wake-up-slap":async(c,d)=>{if(d.st=="slp")d.st=0},
 "sparkling-aria":async(c,d)=>{if(d.st=="brn")d.st=0},
 "spirit-shackle":async(c,d)=>{if(!d.trap&&!d.t.includes(13))d.trap=1},"anchor-shot":async(c,d)=>{if(!d.trap&&!d.t.includes(13))d.trap=1},
 "salt-cure":async(c,d)=>{d.salt=1;await say(`${d.n} is being salt cured!`)},
};
const bnAlive=m=>side(m).bn.some(x=>x.hp>0);
const trapped=m=>!m.t.includes(13)&&(m.trap||m.bind>0||m.ing||opp(m).f.some(x=>x&&x.hp>0&&((AB(x)=="shadow-tag"&&AB(m)!="shadow-tag")||(AB(x)=="arena-trap"&&grounded(m))||(AB(x)=="magnet-pull"&&m.t.includes(16)))));
/* Max move side effects by move type: [kind, arg1, arg2, who] */
const MXF=[["s",5,-1,"o"],["w","sun"],["w","rain"],["t","elec"],["t","grass"],["w","snow"],["s",1,1,"t"],["s",3,1,"t"],["s",4,1,"t"],["s",5,1,"t"],["t","psy"],["s",3,-1,"o"],["w","sand"],["s",2,-1,"o"],["s",1,-1,"o"],["s",4,-1,"o"],["s",2,1,"t"],["t","mist"]];
