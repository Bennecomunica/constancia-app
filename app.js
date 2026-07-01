var START="2026-07-01";
var END="2026-12-31";
var XP_PER_HABIT=10;
var XP_PERFECT_BONUS=20;

var HABITS=[
  {id:"neg",icon:"💼",color:"#7c3aed",name:"Negócio: 1 tarefa-chave",desc:"Uma ação que move o negócio hoje"},
  {id:"casa",icon:"🧹",color:"#0ea5a4",name:"Casa: cômodo do dia",desc:"A faxina rotativa da aba Casa"},
  {id:"peso",icon:"🏋️",color:"#16a34a",name:"Peso: treino + registro",desc:"Mexer o corpo e registrar comida/água"},
  {id:"post",icon:"📱",color:"#ec4899",name:"Conteúdo: 1 post ou engajamento",desc:"Alimentar o crescimento até 10k"}
];

var LEVELS=[
  {t:"Iniciante",icon:"🌱"},{t:"Aprendiz",icon:"🌿"},{t:"Consistente",icon:"⭐"},
  {t:"Dedicada",icon:"💪"},{t:"Disciplinada",icon:"🔥"},{t:"Imparável",icon:"🚀"},
  {t:"Mestre da Constância",icon:"👑"},{t:"Lenda",icon:"🏆"}
];
var LVL_XP=[0,120,320,620,1050,1650,2500,3800];

var DEFAULT_REWARDS=[
  {d:3,icon:"☕",txt:"Um café especial / doce favorito"},
  {d:7,icon:"🎬",txt:"Uma noite de filme sem culpa"},
  {d:14,icon:"💅",txt:"Um mimo de autocuidado (unha, skincare...)"},
  {d:21,icon:"📚",txt:"Comprar aquele livro ou curso que quero"},
  {d:30,icon:"🍽️",txt:"Jantar fora no lugar que amo"},
  {d:45,icon:"👗",txt:"Uma peça de roupa nova"},
  {d:60,icon:"💆",txt:"Massagem ou dia de spa"},
  {d:90,icon:"🎡",txt:"Um passeio ou day-use especial"},
  {d:120,icon:"🎧",txt:"Um upgrade que desejo (fone, gadget...)"},
  {d:150,icon:"✈️",txt:"Planejar uma viagem curta / bate-volta"},
  {d:180,icon:"🏆",txt:"GRANDE recompensa: a viagem/presente dos sonhos"}
];

var WD_NAMES=["Domingo","Segunda","Terça","Quarta","Quinta","Sexta","Sábado"];
var WD_SHORT=["Dom","Seg","Ter","Qua","Qui","Sex","Sáb"];
var WEEK_ORDER=[1,2,3,4,5,6,0];

function defaultCasa(){
  function mk(wd,name,tasks){ return {name:name,tasks:tasks.map(function(t,i){return {id:wd+"-"+i,txt:t};})}; }
  return {
    seq:100,
    rooms:{
      1:mk(1,"Cozinha",["Lavar a louça","Limpar bancada e fogão","Tirar o lixo","Passar pano no chão"]),
      2:mk(2,"Banheiros",["Limpar o vaso","Limpar pia e espelho","Trocar as toalhas","Passar pano no chão"]),
      3:mk(3,"Quartos",["Arrumar as camas","Organizar/guardar roupas","Tirar o pó","Aspirar/varrer o chão"]),
      4:mk(4,"Sala",["Organizar objetos soltos","Tirar pó dos móveis e TV","Aspirar o sofá","Varrer/passar pano"]),
      5:mk(5,"Área de serviço",["Lavar e estender a roupa","Organizar produtos","Limpar o tanque","Varrer o chão"]),
      6:mk(6,"Escritório / Home office",["Organizar a mesa","Arquivar papéis","Limpar tela e teclado","Planejar tarefas do negócio"]),
      0:mk(0,"Dia leve + planejamento",["Organização geral rápida","Planejar cardápio da semana","Lista de compras","Preparar a semana"])
    },
    checks:{}
  };
}

var KEY="benne_constancia_v1";
var S=load();
var selDate=todayISO();
var selCasaWd=new Date().getDay();

function load(){
  var r=null;
  try{ r=JSON.parse(localStorage.getItem(KEY)); }catch(e){}
  if(!r) r={};
  if(!r.days) r.days={};
  if(r.followers===undefined) r.followers=null;
  if(r.wStart===undefined) r.wStart=null;
  if(r.wNow===undefined) r.wNow=null;
  if(r.wGoal===undefined) r.wGoal=null;
  if(!r.rewards) r.rewards=DEFAULT_REWARDS.map(function(x){var o={};for(var k in x)o[k]=x[k];o.claimed=false;return o;});
  if(!r.casa) r.casa=defaultCasa();
  return r;
}
function save(){ try{ localStorage.setItem(KEY,JSON.stringify(S)); }catch(e){} }

function todayISO(){ return iso(new Date()); }
function iso(d){ return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0"); }
function parse(s){ var p=s.split("-").map(Number); return new Date(p[0],p[1]-1,p[2]); }
function addDays(s,n){ var d=parse(s); d.setDate(d.getDate()+n); return iso(d); }
function daysBetween(a,b){ return Math.round((parse(b)-parse(a))/86400000); }
function fmtBR(s){ var p=s.split("-"); return p[2]+"/"+p[1]+"/"+p[0]; }

function dayHabits(date){ return S.days[date]||{}; }
function countDone(date){ var h=dayHabits(date); return HABITS.reduce(function(n,x){return n+(h[x.id]?1:0);},0); }
function isFulfilled(date){ return countDone(date)>=1; }
function isPerfect(date){ return countDone(date)===HABITS.length; }
function totalXP(){ var xp=0; for(var d in S.days){ var c=countDone(d); xp+=c*XP_PER_HABIT; if(c===HABITS.length) xp+=XP_PERFECT_BONUS; } return xp; }
function levelFor(xp){ var lvl=1; for(var i=0;i<LVL_XP.length;i++){ if(xp>=LVL_XP[i]) lvl=i+1; } return Math.min(lvl,LEVELS.length); }
function countFulfilled(){ var n=0; for(var d in S.days) if(isFulfilled(d)) n++; return n; }
function countPerfect(){ var n=0; for(var d in S.days) if(isPerfect(d)) n++; return n; }
function currentStreak(){ var n=0,cur=todayISO(); if(!isFulfilled(cur)) cur=addDays(cur,-1); while(isFulfilled(cur)){ n++; cur=addDays(cur,-1); if(daysBetween(START,cur)<0) break; } return n; }
function bestStreak(){ var best=0,run=0,cur=START,end=todayISO(); if(daysBetween(cur,end)<0) return 0; while(daysBetween(cur,end)>=0){ if(isFulfilled(cur)){ run++; best=Math.max(best,run);} else run=0; cur=addDays(cur,1);} return best; }

function switchTab(name){
  var inicio=name==="inicio";
  document.getElementById("tabInicio").hidden=!inicio;
  document.getElementById("tabCasa").hidden=inicio;
  document.getElementById("tabBtnInicio").classList.toggle("active",inicio);
  document.getElementById("tabBtnCasa").classList.toggle("active",!inicio);
  window.scrollTo({top:0,behavior:"smooth"});
}

function render(){
  var xp=totalXP(),lvl=levelFor(xp),L=LEVELS[lvl-1];
  document.getElementById("lvlIcon").textContent=L.icon;
  document.getElementById("lvlTitle").textContent="Nível "+lvl+" · "+L.t;
  document.getElementById("lvlLine").textContent=xp+" XP acumulados";
  var base=LVL_XP[lvl-1]||0,next=LVL_XP[lvl]||null;
  if(next){
    var pct=Math.max(0,Math.min(100,(xp-base)/(next-base)*100));
    document.getElementById("xpFill").style.width=pct+"%";
    document.getElementById("xpNow").textContent="Nível "+lvl;
    document.getElementById("xpNext").textContent="faltam "+(next-xp)+" XP p/ nível "+(lvl+1);
  } else {
    document.getElementById("xpFill").style.width="100%";
    document.getElementById("xpNow").textContent="Nível máximo!";
    document.getElementById("xpNext").textContent="🏆 Lenda da Constância";
  }
  document.getElementById("streakNum").textContent=currentStreak();

  var isToday=selDate===todayISO();
  document.getElementById("selDateLabel").textContent=isToday?("Hoje · "+fmtBR(selDate)):fmtBR(selDate);
  var dnum=daysBetween(START,selDate)+1;
  document.getElementById("dayOfChallenge").textContent=(dnum>=1&&daysBetween(selDate,END)>=0)?("Dia "+dnum+" de "+(daysBetween(START,END)+1)):"";

  var h=dayHabits(selDate),cont=document.getElementById("habits");cont.innerHTML="";
  HABITS.forEach(function(x){
    var done=!!h[x.id];
    var el=document.createElement("div");
    el.className="habit"+(done?" done":"");
    el.onclick=function(){toggle(x.id);};
    el.innerHTML='<div class="hicon" style="background:'+x.color+'22;color:'+x.color+'">'+x.icon+'</div>'+
      '<div class="txt"><b>'+x.name+'</b><span>'+x.desc+'</span></div>'+
      '<div class="check">'+(done?"✓":"")+'</div>';
    cont.appendChild(el);
  });
  var c=countDone(selDate),pm=document.getElementById("perfectMsg");
  if(c===HABITS.length) pm.textContent="🎉 Dia perfeito! +"+(HABITS.length*XP_PER_HABIT+XP_PERFECT_BONUS)+" XP";
  else if(c>0) pm.textContent=c+" de "+HABITS.length+" feitos · +"+(c*XP_PER_HABIT)+" XP";
  else pm.textContent="";

  document.getElementById("stDays").textContent=countFulfilled();
  var elapsed=Math.min(daysBetween(START,todayISO())+1,daysBetween(START,END)+1);
  document.getElementById("stRate").textContent=(elapsed>0?Math.round(countFulfilled()/elapsed*100):0)+"%";
  document.getElementById("stBest").textContent=bestStreak();
  document.getElementById("stPerfect").textContent=countPerfect();

  renderGoals(); renderRewards(); renderHeat(); renderCasa(); save();
}

function renderGoals(){
  var fn=document.getElementById("folNow");
  if(document.activeElement!==fn) fn.value=(S.followers==null?"":S.followers);
  var f=S.followers||0;
  document.getElementById("folBar").style.width=Math.min(100,f/10000*100)+"%";
  document.getElementById("folMini").textContent=f?(f.toLocaleString('pt-BR')+" de 10.000 · faltam "+Math.max(0,10000-f).toLocaleString('pt-BR')):"Atualize seu número atual de seguidores";

  var ws=document.getElementById("wStart"),wn=document.getElementById("wNow"),wg=document.getElementById("wGoal");
  if(document.activeElement!==ws) ws.value=(S.wStart==null?"":S.wStart);
  if(document.activeElement!==wn) wn.value=(S.wNow==null?"":S.wNow);
  if(document.activeElement!==wg) wg.value=(S.wGoal==null?"":S.wGoal);
  if(S.wStart!=null&&S.wNow!=null&&S.wGoal!=null&&S.wStart!==S.wGoal){
    var lost=S.wStart-S.wNow,total=S.wStart-S.wGoal;
    document.getElementById("wBar").style.width=Math.max(0,Math.min(100,lost/total*100))+"%";
    document.getElementById("wMini").textContent=(lost>=0?"−"+lost.toFixed(1):"+"+Math.abs(lost).toFixed(1))+" kg · faltam "+Math.max(0,(S.wNow-S.wGoal)).toFixed(1)+" kg p/ meta";
  } else { document.getElementById("wBar").style.width="0%"; document.getElementById("wMini").textContent="Preencha peso inicial, atual e meta (-10 kg)"; }

  var totalD=daysBetween(START,END)+1,done=countFulfilled();
  document.getElementById("challNums").textContent=done+" / "+totalD+" dias";
  document.getElementById("challBar").style.width=Math.min(100,done/totalD*100)+"%";
  document.getElementById("challMini").textContent="Faltam "+Math.max(0,daysBetween(todayISO(),END))+" dias até 31/12 · mantenha a chama acesa 🔥";
}

function renderRewards(){
  var best=bestStreak(),cont=document.getElementById("rewards");cont.innerHTML="";
  S.rewards.forEach(function(r,i){
    var on=best>=r.d;
    var el=document.createElement("div");el.className="reward"+(on?" on":"");
    var safe=(r.txt||"").replace(/"/g,"&quot;");
    el.innerHTML='<div class="rico">'+(on?r.icon:"🔒")+'</div>'+
      '<div class="rtx"><b>'+r.d+' dias seguidos</b>'+
      '<input value="'+safe+'" data-i="'+i+'" placeholder="minha recompensa..."></div>';
    if(on){
      var b=document.createElement("button");
      b.className="claimbtn"+(r.claimed?" claimed":"");
      b.textContent=r.claimed?"resgatada ✓":"resgatar";
      b.onclick=function(){ S.rewards[i].claimed=!S.rewards[i].claimed; render(); if(S.rewards[i].claimed) toast("🎁 Recompensa resgatada. Você merece!"); };
      el.appendChild(b);
    } else { var sp=document.createElement("div");sp.className="lock";sp.textContent="faltam "+(r.d-best)+"d";el.appendChild(sp); }
    cont.appendChild(el);
  });
  var inputs=cont.querySelectorAll("input");
  inputs.forEach(function(inp){ inp.onchange=function(e){ S.rewards[+e.target.dataset.i].txt=e.target.value; save(); }; });
}

function renderHeat(){
  var cont=document.getElementById("heat");cont.innerHTML="";
  var totalD=daysBetween(START,END)+1,t=todayISO();
  var shades=["#e5e7eb","#fde68a","#fcd34d","#fbbf24","#16a34a"];
  for(var i=0;i<totalD;i++){
    var d=addDays(START,i),c=countDone(d);
    var cell=document.createElement("div");
    cell.className="cell"+(d===t?" today":"")+(d===selDate?" sel":"");
    cell.style.background=shades[c];
    cell.title=fmtBR(d)+" · "+c+"/"+HABITS.length+" feitos";
    (function(dd){ cell.onclick=function(){ selDate=dd; render(); window.scrollTo({top:0,behavior:"smooth"}); }; })(d);
    cont.appendChild(cell);
  }
}

function casaTasksDoneToday(){
  var wd=new Date().getDay(),room=S.casa.rooms[wd],t=todayISO();
  var chk=S.casa.checks[t]||{};
  var done=0; room.tasks.forEach(function(tk){ if(chk[tk.id]) done++; });
  return {done:done,total:room.tasks.length};
}
function renderCasa(){
  var wdToday=new Date().getDay(),roomToday=S.casa.rooms[wdToday],t=todayISO();
  document.getElementById("casaToday").textContent="Hoje é "+WD_NAMES[wdToday]+" · foco: "+roomToday.name;
  document.getElementById("casaSub").textContent="Faça só o cômodo de hoje. Amanhã é outro. Assim a casa fica sempre em ordem.";

  var chk=S.casa.checks[t]||{};
  var cont=document.getElementById("casaTasks");cont.innerHTML="";
  roomToday.tasks.forEach(function(tk){
    var done=!!chk[tk.id];
    var el=document.createElement("div");el.className="tk"+(done?" done":"");
    var box=document.createElement("div");box.className="box";box.textContent=done?"✓":"";
    box.onclick=function(){toggleCasaTask(tk.id);};
    var lbl=document.createElement("div");lbl.className="lbl";lbl.textContent=tk.txt;
    lbl.onclick=function(){toggleCasaTask(tk.id);};
    el.appendChild(box);el.appendChild(lbl);cont.appendChild(el);
  });
  if(roomToday.tasks.length===0) cont.innerHTML='<div class="hint">Sem tarefas para hoje. Adicione no Plano da semana abaixo.</div>';

  var p=casaTasksDoneToday();
  document.getElementById("casaProg").textContent=p.done+"/"+p.total+" feitas";
  var btn=document.getElementById("casaDoneBtn");
  var habitDone=!!(S.days[t]&&S.days[t].casa);
  if(habitDone){ btn.textContent="Casa em dia hoje ✓"; btn.classList.add("ok"); }
  else { btn.textContent="Concluir faxina de hoje ✓"; btn.classList.remove("ok"); }

  var wk=document.getElementById("week");wk.innerHTML="";
  WEEK_ORDER.forEach(function(wd){
    var room=S.casa.rooms[wd];
    var rowsel=(wd===selCasaWd);
    var rowEl=document.createElement("div");
    rowEl.className="wrow"+(wd===wdToday?" today":"")+(rowsel?" sel":"");
    rowEl.onclick=function(e){ if(e.target.classList.contains("rn")) return; selCasaWd=(selCasaWd===wd?-1:wd); renderCasa(); };
    var wdl=document.createElement("div");wdl.className="wd";wdl.textContent=WD_SHORT[wd];
    var rn=document.createElement("input");rn.className="rn";rn.value=room.name;
    rn.onclick=function(e){e.stopPropagation();};
    (function(w){ rn.onchange=function(e){ S.casa.rooms[w].name=e.target.value; save(); renderCasa(); }; })(wd);
    var tag=document.createElement("div");tag.className="wtag";tag.textContent=room.tasks.length+" tarefas";
    rowEl.appendChild(wdl);rowEl.appendChild(rn);rowEl.appendChild(tag);
    wk.appendChild(rowEl);
  });

  var ed=document.getElementById("casaEditor");
  if(selCasaWd>=0){
    ed.hidden=false;
    var room2=S.casa.rooms[selCasaWd];
    ed.innerHTML='<div class="section-h" style="color:var(--teal)">✏️ '+WD_NAMES[selCasaWd]+' · '+room2.name+'</div>';
    room2.tasks.forEach(function(tk){
      var el=document.createElement("div");el.className="tk";
      var lbl=document.createElement("input");lbl.className="lbl";lbl.value=tk.txt;
      lbl.style.cssText="border:none;background:transparent;font-size:14px;flex:1";
      lbl.onchange=function(e){ tk.txt=e.target.value; save(); };
      var del=document.createElement("button");del.className="del";del.textContent="✕";
      del.onclick=function(){ room2.tasks=room2.tasks.filter(function(x){return x.id!==tk.id;}); save(); renderCasa(); };
      el.appendChild(lbl);el.appendChild(del);ed.appendChild(el);
    });
    var add=document.createElement("div");add.className="addbar";
    var inp=document.createElement("input");inp.placeholder="nova tarefa...";
    inp.onkeydown=function(e){ if(e.key==="Enter") addTask(selCasaWd,inp); };
    var b=document.createElement("button");b.textContent="Adicionar";b.onclick=function(){addTask(selCasaWd,inp);};
    add.appendChild(inp);add.appendChild(b);ed.appendChild(add);
  } else { ed.hidden=true; ed.innerHTML=""; }
}
function addTask(wd,inp){
  var v=inp.value.trim(); if(!v) return;
  S.casa.seq++; S.casa.rooms[wd].tasks.push({id:"c"+S.casa.seq,txt:v});
  inp.value=""; save(); renderCasa();
}
function toggleCasaTask(id){
  var t=todayISO();
  if(!S.casa.checks[t]) S.casa.checks[t]={};
  if(S.casa.checks[t][id]) delete S.casa.checks[t][id]; else S.casa.checks[t][id]=true;
  var p=casaTasksDoneToday();
  if(p.total>0&&p.done===p.total){
    if(!S.days[t]) S.days[t]={};
    if(!S.days[t].casa){ S.days[t].casa=true; toast("🏠 Casa em dia! Hábito marcado ✓"); }
  }
  render();
}
function finishRoom(){
  var t=todayISO();
  if(!S.days[t]) S.days[t]={};
  var was=!!S.days[t].casa;
  S.days[t].casa=!was;
  if(!S.days[t].casa) delete S.days[t].casa;
  render();
  toast((S.days[t]&&S.days[t].casa)?"🏠 Faxina de hoje concluída! +10 XP":"Hábito Casa desmarcado.");
}

function toggle(id){
  if(!S.days[selDate]) S.days[selDate]={};
  var wasPerfect=isPerfect(selDate);
  S.days[selDate][id]=!S.days[selDate][id];
  if(!S.days[selDate][id]) delete S.days[selDate][id];
  var nowPerfect=isPerfect(selDate);
  render();
  if(nowPerfect&&!wasPerfect) toast("🎉 Dia perfeito! Todos os 4 hábitos concluídos.");
  else if(S.days[selDate]&&S.days[selDate][id]){ var st=currentStreak(); if(st>0&&selDate===todayISO()) toast("✅ Feito! Sequência: "+st+" dia"+(st>1?"s":"")+" 🔥"); }
}
function goToday(){ selDate=todayISO(); render(); }
function setFollowers(){ var v=parseInt(document.getElementById("folNow").value,10); S.followers=isNaN(v)?null:v; render(); }
function setWeight(){
  function g(id){ var v=parseFloat(document.getElementById(id).value); return isNaN(v)?null:v; }
  S.wStart=g("wStart"); S.wNow=g("wNow"); S.wGoal=g("wGoal"); render();
}
function resetAll(){ if(confirm("Tem certeza? Isso apaga todo o progresso salvo neste dispositivo.")){ localStorage.removeItem(KEY); S=load(); selDate=todayISO(); selCasaWd=new Date().getDay(); render(); toast("Dados reiniciados."); } }
var toastT;
function toast(msg){ var el=document.getElementById("toast"); el.textContent=msg; el.classList.add("show"); clearTimeout(toastT); toastT=setTimeout(function(){el.classList.remove("show");},2600); }

render();
