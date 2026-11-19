/* Pacing helper, quit button and game start */
const nap=async ms=>{await sleep(ms);if(B&&B.dead)throw 0};
window.addEventListener("unhandledrejection",e=>e.preventDefault());
function quit(){
 if(!confirm("Quit this run and return to the main menu? Your current run will be lost."))return;
 if(B)B.dead=true;
 tipK=null;showTip();
 if(G)sv(G.round-1);
 showTitle();
}
showTitle();