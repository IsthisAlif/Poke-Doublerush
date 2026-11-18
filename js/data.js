/* Constants, type chart, name lists, helpers and local storage */
const API="https://pokeapi.co/api/v2/",C={};
const J=u=>C[u]||(C[u]=fetch(u).then(r=>{if(!r.ok)throw 0;return r.json()}));
const sleep=ms=>new Promise(r=>setTimeout(r,ms)),rnd=n=>Math.floor(Math.random()*n),pick=a=>a[rnd(a.length)];
const cap=s=>s.split("-").map(w=>w[0].toUpperCase()+w.slice(1)).join(" ");
const TY="normal fire water electric grass ice fighting poison ground flying psychic bug rock ghost dragon dark steel fairy".split(" ");
const TC=["#a8a878","#f08030","#6890f0","#d8b000","#78c850","#74c4c4","#c03028","#a040a0","#c0a040","#8f78e0","#f85888","#a8b820","#b8a038","#705898","#7038f8","#705848","#9a9ab8","#ee99ac"];
const CH=["|12,16|13","4,5,11,16|1,2,12,14|","1,8,12|2,4,14|","2,9|3,4,14|8","2,8,12|1,4,7,9,11,14,16|","4,8,9,14|1,2,5,16|","0,5,12,15,16|7,9,10,11,17|13","4,17|7,8,12,13|16","1,3,7,12,16|4,11|9","4,6,11|3,12,16|","6,7|10,16|15","4,10,15|1,6,7,9,13,16,17|","1,5,9,11|6,8,16|","10,13|15|0","14|16|17","10,13|6,15,17|","5,12,17|1,2,3,16|","6,14,15|1,7,16|"].map(s=>s.split("|").map(x=>x?x.split(",").map(Number):[]));
const eff=(a,d)=>d.reduce((e,t)=>CH[a][2].includes(t)?0:CH[a][0].includes(t)?e*2:CH[a][1].includes(t)?e*.5:e,1);
const ZN="Breakneck Blitz,Inferno Overdrive,Hydro Vortex,Gigavolt Havoc,Bloom Doom,Subzero Slammer,All-Out Pummeling,Acid Downpour,Tectonic Rage,Supersonic Skystrike,Shattered Psyche,Savage Spin-Out,Continental Crush,Never-Ending Nightmare,Devastating Drake,Black Hole Eclipse,Corkscrew Crash,Twinkle Tackle".split(","),MXN="Max Strike,Max Flare,Max Geyser,Max Lightning,Max Overgrowth,Max Hailstorm,Max Knuckle,Max Ooze,Max Quake,Max Airstream,Max Mindstorm,Max Flutterby,Max Rockfall,Max Phantasm,Max Wyrmwind,Max Darkness,Max Steelspike,Max Starfall".split(","),ZC="Normalium Z,Firium Z,Waterium Z,Electrium Z,Grassium Z,Icium Z,Fightinium Z,Poisonium Z,Groundium Z,Flyinium Z,Psychium Z,Buginium Z,Rockium Z,Ghostium Z,Dragonium Z,Darkinium Z,Steelium Z,Fairium Z".split(","),PL=[["leftovers","Leftovers"],["orb","Life Orb"],["berry","Sitrus Berry"],["belt","Expert Belt"],["sash","Focus Sash"]];
const spr=p=>{const sp=p.sprites,an=sp.versions["generation-v"]["black-white"].animated,art=sp.other["official-artwork"].front_default||sp.front_default;return{fr:an.front_default||art,bk:an.back_default||sp.front_default||art,ar:art,flip:!an.back_default}};
const cur=m=>m.mega&&m.mg?m.mg:m.dyn&&m.gm?m.gm:m,fm=m=>(m.dyn?"dmax":m.mega?"mega":"")+(m.inv?" inv":"");
const calc=(b,mu)=>b.map((v,i)=>Math.floor((i?Math.floor((2*v+31)/2)+5:Math.floor((2*v+31)/2)+60)*mu));
const zok=(m,x)=>!!(m.item&&m.item.k=="z"&&x.cls!="status"&&x.ty==m.item.zt);
const can=(m,k,sd)=>!sd.used&&sd.g[k]&&(k=="mega"?!!(m.mg&&m.item&&m.item.k=="mega"):k=="z"?m.mv.some(x=>zok(m,x)):true);
const RCH=["hyper-beam","giga-impact","blast-burn","frenzy-plant","hydro-cannon","rock-wrecker","roar-of-time","prismatic-laser","eternabeam","meteor-assault"],TW=["solar-beam","solar-blade","sky-attack","skull-bash","razor-wind","freeze-shock","ice-burn","geomancy","meteor-beam","electro-shot","fly","dig","dive","bounce","phantom-force","shadow-force","sky-drop"],INV=["fly","dig","dive","bounce","phantom-force","shadow-force","sky-drop"];
const SK={attack:1,defense:2,"special-attack":3,"special-defense":4,speed:5};
const PROT=["protect","detect","spiky-shield","baneful-bunker","king-s-shield","obstruct","silk-trap","burning-bulwark"];
const WX={"rain-dance":"rain","sunny-day":"sun","sandstorm":"sand","hail":"snow","snowscape":"snow","chilly-reception":"snow"};
const IMM={"water-absorb":[2,1],"dry-skin":[2,1],"storm-drain":[2,0],"volt-absorb":[3,1],"lightning-rod":[3,0],"motor-drive":[3,0],"flash-fire":[1,0],"sap-sipper":[4,0],"levitate":[8,0]};
const AIL={paralysis:"par",burn:"brn",poison:"psn",sleep:"slp",freeze:"frz",confusion:"conf"};
const TOUCH=matchMedia("(hover:none)").matches,$=id=>document.getElementById(id),el=$("app");
let G,B;
const best=()=>{try{return+localStorage.getItem("pdr")||0}catch(e){return 0}};
const sv=n=>{try{localStorage.setItem("pdr",Math.max(n,best()))}catch(e){}};

