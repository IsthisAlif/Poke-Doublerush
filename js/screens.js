/* Title, party roll, party selection, victory and game over screens */
function title(){
 el.innerHTML=`<h1>POKE<br>DOUBLERUSH</h1><div class="box" style="text-align:center"><p>You get six random Pokémon with random movesets and abilities. Each round, pick 4 pokemon out of 6 and win a double battle against your opponent.How far can you go?</p><p>Best score: <b>${best()}</b></p><p><small>${TOUCH?"Tap a Pokémon to see its stats. Hold a move to read its description.":"Hover over Pokémon and moves to see stats and descriptions."}</small></p><button class="go" onclick="newRun()">Start run</button></div>`;
}
async function loadParty(n,mult,seen){
 const ids=new Set();while(ids.size<n){const i=1+rnd(1025);if(!seen.has(i))ids.add(i)}
 const out=await Promise.all([...ids].map(i=>mkMon(i,mult).catch(()=>null)));
 const ok=out.filter(Boolean);ok.forEach(m=>{seen.add(m.id);reset(m)});
 return ok.length<n?ok.concat(await loadParty(n-ok.length,mult,seen)):ok;
}
const loading=t=>el.innerHTML=`<h1>…</h1><div class="box" style="text-align:center">${t}</div>`;
async function newRun(){
 loading("Catching your pokemon...");
 try{G={seen:new Set(),round:1,sel:[]};G.party=await loadParty(6,1,G.seen);}catch(e){return el.innerHTML=`<div class="box">Failed to catch pokemon. Check your connection and <button onclick="newRun()">retry</button></div>`}
 pickScr();
}
function pickScr(){
 G.sel=G.sel.filter(i=>true);
 el.innerHTML=`<div class="top"><h1 style="margin:0;font-size:16px">ROUND ${G.round}</h1><b>Score ${G.round-1}</b><button onclick="quit()">Quit run</button></div><p>Choose 4 of 6 (${G.sel.length}/4)</p><div class="grid">${G.party.map((m,i)=>`<div class="box card ${G.sel.includes(i)?"sel":""}" onclick="tog(${i})"><img src="${m.fr}" onerror="this.src='${m.ar}'"><br><b>${m.n}</b><br>${tpl(m.t)}<small>Ability: ${cap(m.ab)} · Tera ${TY[m.tt]}</small><small>Item: <b>${m.item?m.item.n:"—"}</b>${m.mg?" · Mega-capable":""}${m.gm?" · Gigantamax-capable":""}</small><small>${m.mv.map(x=>x.n).join(" · ")}</small></div>`).join("")}</div><div class="stk"><button class="go" ${G.sel.length==4?"":"disabled"} onclick="startB()">Battle!</button></div>`;
}
function tog(i){const k=G.sel.indexOf(i);k>=0?G.sel.splice(k,1):G.sel.length<4&&G.sel.push(i);pickScr()}

function win(){G.party.forEach(reset);sv(G.round);
 el.innerHTML=`<h1>VICTORY!</h1><div class="box" style="text-align:center"><p>Round ${G.round} cleared. Score: <b>${G.round}</b>. Your party is fully restored.</p><button class="go" onclick="G.round++;G.sel=[];pickScr()">Next round</button></div>`}
function over(){sv(G.round-1);
 el.innerHTML=`<h1>GAME OVER</h1><div class="box" style="text-align:center"><p>Final score: <b>${G.round-1}</b> · Best: <b>${best()}</b></p><button class="go" onclick="title()">New run</button></div>`}
