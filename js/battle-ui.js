/* Battle screen: start, scene drawing, command menus */
async function startB(){
 loading(`Round ${G.round}: a challenger appears…`);
 const foes=G.foes;
 G.party.forEach(reset);G.foes.forEach(reset);
 const me=G.sel.map(i=>G.party[i]),ft=[...foes].sort(()=>Math.random()-.5).slice(0,4),r=G.round;
 B={me:{t:me,f:[me[0],me[1]],bn:[me[2],me[3]],g:{mega:1,z:1,dyn:1,tera:1},used:0,sc:{}},foe:{t:ft,f:[ft[0],ft[1]],bn:[ft[2],ft[3]],g:{tera:r>=1,dyn:r>=3,z:r>=5,mega:r>=7},used:0,sc:{}},w:null,wn:0,ter:null,tn:0,tr:0,msg:"",ui:null,ch:[],logs:[],turn:0};
 el.innerHTML=`<div class="top"><b class="px" style="font-size:11px">ROUND ${r}</b><b>Score ${r-1}</b><button onclick="quit()">Quit run</button></div><div id="sc"></div><div id="tb"></div><div id="cm"></div><div class="box" style="margin-top:16px"><b>Battle log</b><div id="lg"></div></div>`;
 [...me.slice(0,2),...ft.slice(0,2)].forEach(m=>m.fx="inn");
 await say(`Opponent sent out ${ft[0].n} and ${ft[1].n}!`);
 [...B.me.f,...B.foe.f].forEach(m=>m.fx="");
 await enter(B.foe.f[0],"foe");await enter(B.foe.f[1],"foe");
 await say(`Go! ${me[0].n} and ${me[1].n}!`);
 await enter(B.me.f[0],"me");await enter(B.me.f[1],"me");
 [...B.me.f,...B.foe.f].forEach(m=>m.fx="");
 nextCmd(0);
}
const say=async t=>{B.msg=t;B.logs.push(t);draw();await nap(650+t.length*20)};
function ib(m,pos,mine){return`<div class="ib ${mine?"me":"fo"}${(mine?B.me:B.foe).f.indexOf(m)}" data-t="p:${mine?"me":"foe"}:${(mine?B.me:B.foe).f.indexOf(m)}" style="${pos}"><b>${m.n}</b>${gs(m)} ${m.sub?"🧸":""}${m.love?"💘":""}${m.dyn?"⬆":""}${m.mega?"M":""}${m.tera!=null?" ◆"+TY[m.tera]:""} <small>Lv50</small> ${tpl(tys(m))}<small> ${m.st?`<b style="color:#c33">${m.st.toUpperCase()}</b>`:""}${m.conf?" CNF":""}</small><div class="hp"><i data-w="${100*m.hp/m.mhp}" style="width:${m.dw??100*m.hp/m.mhp}%;background:${m.hp/m.mhp<.25?"#e33":m.hp/m.mhp<.5?"#eb3":"#3cc75a"}"></i></div>${mine?`<small>${m.hp}/${m.mhp}<span class="ex"> · ${cap(m.ab)}<br>${m.item?m.item.n:"No item"}</span></small>`:""}</div>`}
const doll=(m,cls,i,pos)=>m.sub>0?`<div class="sp doll ${cls=="fo"?"fo"+i:cls+i} ${m.sf||""}" data-t="p:${cls=="fo"?"foe":"me"}:${i}" style="${pos}">🧸</div>`:"";
function draw(){
 if(!$("sc"))return;
 const fp=["left:50%;top:6%","left:72%;top:18%"],mp=["left:6%;bottom:26%","left:30%;bottom:8%"];
 let h="";
 B.foe.f.forEach((m,i)=>{if(m&&(m.hp>0||m.fx=="faint"))h+=`<img class="sp fo${i} ${m.fx||""} ${fm(m)}" data-t="p:foe:${i}" style="${fp[i]}" src="${cur(m).fr}" onerror="this.src='${cur(m).ar}'">`+ib(m,`left:2%;top:${2+i*68}px`)+doll(m,"fo",i,fp[i])});
 B.me.f.forEach((m,i)=>{if(m&&(m.hp>0||m.fx=="faint"))h+=`<img class="sp b me${i} ${cur(m).flip?"flip":""} ${m.fx||""} ${fm(m)}" data-t="p:me:${i}" style="${mp[i]}" src="${cur(m).bk}" onerror="this.src='${cur(m).ar}'">`+ib(m,`right:2%;bottom:${8+i*86}px`,1)+doll(m,"b me",i,mp[i])});
 $("sc").innerHTML=h+(B.w?`<div class="wxo ${B.w}"></div><div class="ib wx" style="left:40%;top:2px;width:auto;border-radius:10px">${{rain:"🌧 Rain",sun:"☀ Sun",sand:"🏜 Sandstorm",snow:"❄ Snow"}[B.w]} (${B.wn})</div>`:"")+(B.ter?`<div class="ib wx" style="left:2%;bottom:2px;top:auto;width:auto;border-radius:10px">${{elec:"⚡ Electric Terrain",grass:"🌿 Grassy Terrain",psy:"🔮 Psychic Terrain",mist:"🌫 Misty Terrain"}[B.ter]}</div>`:"")+(B.tr>0?`<div class="ib wx" style="left:40%;bottom:2px;top:auto;width:auto;border-radius:10px">⏪ Trick Room</div>`:"");
 $("sc").className=B.w||"";
 [...B.foe.f,...B.me.f].forEach(m=>m&&(m.dw=100*m.hp/m.mhp));
 requestAnimationFrame(()=>requestAnimationFrame(()=>document.querySelectorAll("#sc .hp i").forEach(e=>e.style.width=e.dataset.w+"%")));
 $("tb").textContent=B.msg;
 $("cm").innerHTML=B.ui?cmd():"";
 $("lg").innerHTML=B.logs.map(x=>`<div class="${x[0]=="—"?"th":""}">${x}</div>`).join("");$("lg").scrollTop=$("lg").scrollHeight;
 if(tipK&&!document.querySelector(`[data-t="${tipK}"]`))tipK=null;showTip();
}
const bench=()=>B.me.bn.filter(m=>m.hp>0);
const aliveF=s=>s.f.filter(m=>m&&m.hp>0);
function nextCmd(i){
 for(;i<2;i++){const m=B.me.f[i];if(!m||m.hp<=0)continue;if(m.rc){B.ch[i]={mv:m.mv[0],tg:0};continue}if(m.ch){B.ch[i]={mv:m.ch.mv,tg:m.ch.tg};continue}if(m.lk){B.ch[i]={mv:m.lk.mv,tg:m.lk.tg};continue}break}
 if(i>=2)return turn();
 B.msg=`What will ${B.me.f[i].n} do?`;B.ui={st:"main",i,gm:""};draw();
}
function cmd(){
 const u=B.ui,m=B.me.f[u.i],g=B.me.g,sel=B.ch.filter(c=>c&&c.sw).map(c=>c.sw);
 if(u.st=="main")return`<button class="go" onclick="B.ui.st='mv';draw()">Fight</button><button onclick="B.ui.st='sw';draw()" ${bench().filter(x=>!sel.includes(x)).length&&!trapped(m)?"":"disabled"}>${trapped(m)?"Trapped!":"Pokémon"}</button>${u.i?`<button onclick="B.ch=[];nextCmd(0)">Back</button>`:""}`;
 if(u.st=="mv")return m.mv.map((x,j)=>`<span data-t="m:${j}"><button class="mvb" style="background:${TC[x.ty]}" ${u.gm=="z"&&!zok(m,x)?"disabled":""} onclick="pm(${j})">${x.n}<br><small>${x.pw?x.pw+" pw":x.cls}</small></button></span>`).join("")+`<div>`+[["mega","Mega"],["z","Z"],["dyn","Dynamax"],["tera","Tera"]].map(([k,n])=>`<button ${can(m,k,B.me)?"":"disabled"} style="${u.gm==k?"background:var(--ye)":""}" onclick="B.ui.gm=B.ui.gm=='${k}'?'':'${k}';draw()">${n}</button>`).join(" ")+` <button onclick="B.ui.st='main';draw()">Back</button> ${B.me.used?"<small>Gimmick already used this battle</small>":""}${TOUCH?" <small>Hold a move for details</small>":""}</div>`;
 if(u.st=="tg")return`<b>Target:</b>`+B.foe.f.map((f,i)=>f&&f.hp>0?`<button onclick="pt(${i})">${f.n}</button>`:"").join("")+`<button onclick="B.ui.st='mv';draw()">Back</button>`;
 if(u.st=="sw"||u.st=="forced")return bench().filter(x=>!sel.includes(x)).map(x=>`<button onclick="ps(${B.me.bn.indexOf(x)})">${x.n} (${x.hp}/${x.mhp})</button>`).join("")+(u.st=="sw"?`<button onclick="B.ui.st='main';draw()">Back</button>`:"");
}
function pm(j){const m=B.me.f[B.ui.i],mv=m.mv[j],k=/all-opponents|all-other|user|ally|allies|field|all-pokemon|random|specific|fainting/.test(mv.tg);
 B.ui.mv=j;if(!k&&aliveF(B.foe).length>1)B.ui.st="tg",draw();else pt(B.foe.f.findIndex(x=>x&&x.hp>0))}
function pt(t){const i=B.ui.i,gm=B.ui.gm;B.ch[i]={mv:B.me.f[i].mv[B.ui.mv],tg:t,gm};nextCmd(i+1)}
function ps(k){const i=B.ui.i;if(B.ui.st=="forced"){B.ui.res(k);return}B.ch[i]={sw:B.me.bn[k]};nextCmd(i+1)}