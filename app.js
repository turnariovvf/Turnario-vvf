const C=window.TURNARIO_CONFIG||{};
const app=document.getElementById("app");
const state={screen:"pin",pin:"",setup:localStorage.getItem("tvvf_admin_pin")==null,section:"dashboard",people:[],loading:false,peopleLoaded:false};

function esc(s){return String(s??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]));}
async function sbRpc(fn,body={}){
  if(!C.supabaseUrl||!C.supabasePublishableKey) throw new Error("Configurazione Supabase mancante");
  const adminPin=localStorage.getItem("tvvf_admin_pin");
  if(fn.startsWith("vvf_admin_") && adminPin) body={...body,p_admin_pin:adminPin};
  const r=await fetch(`${C.supabaseUrl}/rest/v1/rpc/${fn}`,{method:"POST",headers:{"Content-Type":"application/json","apikey":C.supabasePublishableKey,"Authorization":`Bearer ${C.supabasePublishableKey}`},body:JSON.stringify(body)});
  const text=await r.text();
  let data; try{data=text?JSON.parse(text):null}catch{data=text}
  if(!r.ok) throw new Error(data?.message||data?.hint||data?.details||data?.error||"Errore Supabase");
  return data;
}
function layout(content){return `<div class="shell"><header class="topbar"><div class="brand"><div class="brand-mark">🔥</div><div>Turnario VVF<small>Gestione distaccamento</small></div></div><span class="badge" style="background:#fff;color:#9b111e">AMMINISTRATORE</span></header>${content}<nav class="mobile-nav"><button onclick="go('dashboard')">🏠<br>Dashboard</button><button onclick="go('personale')">👨‍🚒<br>Personale</button><button onclick="go('parametri')">⚙️<br>Parametri</button><button onclick="go('richieste')">📋<br>Richieste</button><button onclick="go('caffe')">☕<br>Caffè</button></nav></div>`}
function pinScreen(){const title=state.setup?"Configura amministratore":"Accesso amministratore";const sub=state.setup?"Imposta il PIN di 4 cifre per il primo accesso.":"Inserisci il PIN amministratore.";return `<main class="login"><section class="card login-card"><div class="eyebrow">Turnario VVF</div><h1 class="title">${title}</h1><p class="muted">${sub}</p><div class="pin-dots">${[0,1,2,3].map(i=>`<i class="dot ${state.pin.length>i?"on":""}"></i>`).join("")}</div><div class="pin-grid">${[1,2,3,4,5,6,7,8,9].map(n=>`<button class="pin-key" onclick="key('${n}')">${n}</button>`).join("")}<button class="pin-key" onclick="key('clear')">⌫</button><button class="pin-key" onclick="key('0')">0</button><button class="pin-key" onclick="key('ok')">✓</button></div><div class="notice">PIN amministratore locale per il collaudo; le operazioni sul personale vengono verificate anche su Supabase. L'accesso VVF resta separato.</div></section></main>`}
function dashboard(){const n=state.people.length?state.people.filter(p=>p.attivo).length:"—";return layout(`<main class="container"><div class="section-head"><div><div class="eyebrow">Panoramica</div><h1 class="title">Dashboard amministratore</h1><div class="muted">Distaccamento configurabile e personale sostituibile senza perdere lo storico.</div></div><button class="btn btn-soft" onclick="logout()">Esci</button></div><div class="grid grid4 section">${stat("👨‍🚒","Personale",n,"attivi da Supabase")} ${stat("🟢","Presenze","—","da collegare al turnario")} ${stat("📋","Richieste","0","da approvare")} ${stat("☕","Caffè","0","periodo corrente")}</div><div class="grid grid2 section">${tile("👨‍🚒","Personale","Inserisci, modifica o disattiva i VVF direttamente nel database.","personale")}${tile("⚙️","Parametri","Numeri minimi, CS, autisti, turni e salti.","parametri")}${tile("📅","Turnario","Vista del calendario A/B/C/D e assegnazioni.","turnario")}${tile("📋","Richieste","Ferie, licenze, 104, malattia e congedi.","richieste")}${tile("☕","Caffè","QR unico, quantità, conteggi, pagamenti e azzeramento.","caffe")}${tile("💾","Storico e backup","Operazioni, richieste e movimenti conservati nello storico.","storico")}</div></main>`)}
function stat(icon,t,n,s){return `<div class="card stat"><div>${icon}</div><div class="n">${esc(n)}</div><div>${t}</div><div class="muted">${s}</div></div>`}
function tile(icon,t,p,target){return `<button class="card tile" style="text-align:left;border:1px solid #e4e6ea;background:#fff;cursor:pointer" onclick="go('${target}')"><div style="font-size:25px">${icon}</div><h3>${t}</h3><p>${p}</p></button>`}
function page(title,desc,body){return layout(`<main class="container"><div class="section-head"><div><div class="eyebrow">Amministrazione</div><h1 class="title">${title}</h1><div class="muted">${desc}</div></div><button class="btn btn-soft" onclick="go('dashboard')">← Dashboard</button></div><section class="card" style="padding:20px">${body}</section></main>`)}
function personnel(){if(state.loading)return page("Personale","Gestione nominativi e ruoli del distaccamento.",`<div class="notice">Caricamento personale da Supabase…</div>`);const rows=state.people.length?state.people.map((p,i)=>`<div class="row"><div class="row-left"><div class="avatar">${i+1}</div><div><b>${esc(p.nome)} ${esc(p.cognome)}</b><div class="muted">${esc(p.ruolo||"VIGILE")} · turno ${esc(p.turno||"—")} · salto ${p.salto??"—"}</div></div></div><div class="actions"><span class="badge ${p.attivo?"":"red"}">${p.attivo?"ATTIVO":"DISATTIVO"}</span><button class="btn btn-soft btn-small" onclick="editPerson('${p.id}')">Modifica</button>${p.attivo?`<button class="btn btn-danger btn-small" onclick="disablePerson('${p.id}')">Disattiva</button>`:""}</div></div>`).join(""): `<div class="notice">Nessun dipendente presente in Supabase. Puoi aggiungerlo qui.</div>`;const cs=state.people.filter(p=>p.ruolo==="CAPO_SQUADRA").length,au=state.people.filter(p=>p.ruolo==="AUTISTA").length,vi=state.people.filter(p=>p.ruolo==="VIGILE").length;return page("Personale","Gestione nominativi e ruoli del distaccamento.",`<div class="section-head"><div><b>${state.people.length} profili</b><div class="muted">${cs} Capi Squadra · ${au} Autisti · ${vi} Vigili</div></div><button class="btn btn-primary" onclick="showPersonForm()">+ Aggiungi VVF</button></div><div class="list">${rows}</div><div id="person-form"></div>`)}
function personForm(p=null){const edit=!!p;return `<div class="form-panel"><div class="section-head"><h3>${edit?"Modifica VVF":"Nuovo VVF"}</h3><button class="btn btn-soft" onclick="document.getElementById('person-form').innerHTML=''">Chiudi</button></div><div class="grid grid2"><div class="field"><label class="label">Nome</label><input id="pf-nome" class="input" value="${esc(p?.nome||"")}" autocomplete="off"></div><div class="field"><label class="label">Cognome</label><input id="pf-cognome" class="input" value="${esc(p?.cognome||"")}" autocomplete="off"></div><div class="field"><label class="label">Ruolo</label><select id="pf-ruolo" class="input">${["VIGILE","AUTISTA","CAPO_SQUADRA"].map(x=>`<option ${p?.ruolo===x?"selected":""}>${x}</option>`).join("")}</select></div><div class="field"><label class="label">Turno</label><select id="pf-turno" class="input">${["A","B","C","D"].map(x=>`<option ${p?.turno===x?"selected":""}>${x}</option>`).join("")}</select></div><div class="field"><label class="label">Salto</label><select id="pf-salto" class="input"><option value="">Seleziona</option>${[1,2,3,4,5,6,7,8].map(x=>`<option value="${x}" ${Number(p?.salto)===x?"selected":""}>${x}</option>`).join("")}</select><div class="muted">Ogni turno ha 8 salti: A1–A8, B1–B8, C1–C8, D1–D8.</div></div><div class="field"><label class="label">PIN VVF ${edit?"(lascia vuoto per non cambiarlo)":""}</label><input id="pf-pin" class="input" type="password" inputmode="numeric" maxlength="4" placeholder="4 cifre" autocomplete="new-password"></div><div class="field check-field"><label><input id="pf-attivo" type="checkbox" ${p?.attivo!==false?"checked":""}> Profilo attivo</label></div></div><button class="btn btn-primary" onclick="savePerson(${edit?`'${p.id}'`:"null"})">${edit?"Salva modifiche":"Crea VVF"}</button><div id="pf-msg"></div></div>`}
async function loadPeople(){if(state.loading)return;state.loading=true;render();try{state.people=await sbRpc("vvf_admin_list_personale",{});if(!Array.isArray(state.people))state.people=[];state.peopleLoaded=true;}catch(e){alert(e.message)}finally{state.loading=false;render()}}
function showPersonForm(){const el=document.getElementById("person-form");if(el)el.innerHTML=personForm()}
function editPerson(id){const p=state.people.find(x=>x.id===id);const el=document.getElementById("person-form");if(el&&p){el.innerHTML=personForm(p);el.scrollIntoView({behavior:"smooth",block:"center"})}}
async function savePerson(id){const nome=document.getElementById("pf-nome").value.trim(),cognome=document.getElementById("pf-cognome").value.trim(),ruolo=document.getElementById("pf-ruolo").value,turno=document.getElementById("pf-turno").value,salto=document.getElementById("pf-salto").value?Number(document.getElementById("pf-salto").value):null,pin=document.getElementById("pf-pin").value.trim(),attivo=document.getElementById("pf-attivo").checked;const msg=document.getElementById("pf-msg");if(!nome||!cognome){msg.innerHTML='<div class="notice">Nome e cognome sono obbligatori.</div>';return}if(pin&&!/^\d{4}$/.test(pin)){msg.innerHTML='<div class="notice">Il PIN deve essere di 4 cifre.</div>';return}try{msg.innerHTML='<div class="notice">Salvataggio…</div>';if(id){await sbRpc("vvf_admin_update_personale",{p_id:id,p_nome:nome,p_cognome:cognome,p_ruolo:ruolo,p_turno:turno,p_pin:pin||null,p_attivo:attivo,p_salto:salto})}else{await sbRpc("vvf_admin_add_personale",{p_nome:nome,p_cognome:cognome,p_ruolo:ruolo,p_turno:turno,p_pin:pin||null,p_attivo:attivo,p_salto:salto})}await loadPeople()}catch(e){msg.innerHTML=`<div class="notice">Errore: ${esc(e.message)}</div>`}}
async function disablePerson(id){if(!confirm("Disattivare questo profilo? Lo storico non verrà cancellato."))return;try{await sbRpc("vvf_admin_update_personale",{p_id:id,p_nome:null,p_cognome:null,p_ruolo:null,p_turno:null,p_pin:null,p_attivo:false});await loadPeople()}catch(e){alert(e.message)}}
function params(){return page("Parametri","Configurazione adattabile a qualsiasi distaccamento.",`<div class="grid grid2"><div class="field"><label class="label">Nome distaccamento</label><input class="input" value="Desio"></div><div class="field"><label class="label">Turno</label><select class="input"><option>A</option><option>B</option><option selected>C</option><option>D</option></select></div><div class="field"><label class="label">Minimo totale</label><input class="input" type="number" value="1"></div><div class="field"><label class="label">Minimo Capi Squadra</label><input class="input" type="number" value="1"></div><div class="field"><label class="label">Minimo autisti</label><input class="input" type="number" value="1"></div><div class="field"><label class="label">Limite assenze</label><input class="input" type="number" value="3"></div></div><button class="btn btn-primary" onclick="alert('Parametri salvati nel collaudo locale')">Salva parametri</button>`)}
function requests(){return page("Richieste","Ferie e licenze possono essere richieste anche molti mesi prima.",`<div class="notice">Nessuna richiesta da approvare nel collaudo.</div><div class="section"><b>Regole previste</b><ul><li>Richieste future anche a 5, 6 o 10 mesi.</li><li>Il VVF può annullare una richiesta non più necessaria.</li><li>Lo storico dell'operazione resta conservato.</li><li>Il sistema segnala i conflitti con i minimi configurati.</li></ul></div>`)}
function coffee(){return page("Caffè","QR unico, quantità modificabile prima della conferma e conteggio individuale.",`<div class="grid grid2"><div class="card tile"><div style="font-size:34px">▦</div><h3>QR unico</h3><p>Scansione rapida dal telefono. Un caffè predefinito, con possibilità di aggiungerne altri prima della conferma.</p><button class="btn btn-primary" style="margin-top:15px" onclick="alert('Scanner QR verrà collegato al modulo nativo/PWA nel collaudo')">Configura QR</button></div><div class="card tile"><div style="font-size:34px">☕</div><h3>Periodo corrente</h3><p>Conteggio individuale automatico e gestione pagamenti.</p><div class="n" style="font-size:28px">0 €</div><button class="btn btn-soft" onclick="alert('Azzeramento disponibile solo all’amministratore')">Azzera periodo</button></div></div>`)}

function dayDiff(a,b){return Math.round((new Date(b+'T12:00:00')-new Date(a+'T12:00:00'))/86400000)}
const TURN_LETTERS=['A','B','C','D'];
function mod32(n,m){return ((n%m)+m)%m}
function turnCodeFromIndex(index){const i=mod32(index,32);return {letter:TURN_LETTERS[i%4],cycle:Math.floor(i/4)+1,label:`${TURN_LETTERS[i%4]}${Math.floor(i/4)+1}`}}
const TURN_CALENDAR_ANCHOR='2026-01-01';
const TURN_ANCHOR_DAY_INDEX=21; // 01/01/2026 = B6 diurno, A6 notturno
function realCycleInfo(date,team){
  const dayIndex=TURN_ANCHOR_DAY_INDEX+dayDiff(TURN_CALENDAR_ANCHOR,date);
  const dayCode=turnCodeFromIndex(dayIndex), nightCode=turnCodeFromIndex(dayIndex-1);
  let phase='Riposo',code=null;
  if(dayCode.letter===team){phase='Diurno';code=dayCode}
  else if(nightCode.letter===team){phase='Notturno';code=nightCode}
  else {const teamPos=TURN_LETTERS.indexOf(team),dayPos=TURN_LETTERS.indexOf(dayCode.letter),rel=mod32(dayPos-teamPos,4);phase=rel===2?'Smontante':'Riposo'}
  return {phase,code,dayCode,nightCode,label:code?.label||''}
}
function monthGridDays(y,m){const first=new Date(y,m,1),last=new Date(y,m+1,0),offset=(first.getDay()+6)%7,cells=[];for(let i=0;i<offset;i++)cells.push(null);for(let d=1;d<=last.getDate();d++)cells.push(d);while(cells.length%7)cells.push(null);return cells}
function peopleForCode(code){if(!code)return [];const selected=window.__turnSkip;return state.people.filter(p=>p.attivo!==false&&p.turno===code.letter&&Number(p.salto)===Number(code.cycle)&&(!selected||Number(p.salto)===Number(selected)))}
function turnario(){
  const saved=window.__turnView||{year:new Date().getFullYear(),month:new Date().getMonth(),team:'A'};
  window.__turnView=saved;
  const monthNames=['Gennaio','Febbraio','Marzo','Aprile','Maggio','Giugno','Luglio','Agosto','Settembre','Ottobre','Novembre','Dicembre'];
  const cells=monthGridDays(saved.year,saved.month), today=new Date(), todayIso=`${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;
  const active=state.people.filter(p=>p.attivo!==false);
  const teamPeople=active.filter(p=>p.turno===saved.team).sort((a,b)=>Number(a.salto||99)-Number(b.salto||99)||a.cognome.localeCompare(b.cognome));
  const cellHtml=cells.map(day=>{
    if(!day)return '<div class="turn-cell empty"></div>';
    const d=new Date(saved.year,saved.month,day),ds=`${saved.year}-${String(saved.month+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`,info=realCycleInfo(ds,saved.team);
    let service='';
    if(info.phase==='Diurno') service=`<div class="turn-shift day"><b>${info.label}</b><br>DIURNO</div>`;
    else if(info.phase==='Notturno') service=`<div class="turn-shift night"><b>${info.label}</b><br>NOTTURNO</div>`;
    else if(info.phase==='Smontante') service='<div class="turn-shift rest">SMONTANTE</div>';
    else service='<div class="turn-shift rest">RIPOSO</div>';
    const names=info.code?peopleForCode(info.code):[];
    const namesHtml=names.length?`<div class="turn-names">${names.slice(0,2).map(p=>`${esc(p.nome)} ${esc(p.cognome)}`).join('<br>')}${names.length>2?`<br><span>+${names.length-2}</span>`:''}</div>`:'';
    return `<button class="turn-cell ${ds===todayIso?'today':''}" onclick="selectTurnDate('${ds}')"><span class="turn-day-number">${day}</span>${service}${namesHtml}</button>`;
  }).join('');
  const roster=teamPeople.length?teamPeople.map(p=>`<div class="turn-person"><span><b>${esc(p.nome)} ${esc(p.cognome)}</b><small>${esc(p.ruolo||'VIGILE')} · ${esc(p.turno)}${p.salto?`${p.turno}${p.salto}`:''}</small></span><span class="badge">${p.turno}${p.salto||'—'}</span></div>`).join(''):'<div class="notice">Nessun VVF attivo assegnato al turno selezionato.</div>';
  return page('Turnario','Calendario reale A/B/C/D con sequenza perpetua e salto personale.',`
    <div class="turn-toolbar">
      <button class="btn btn-soft" onclick="turnMonth(-1)">‹</button>
      <div class="turn-month-title">${monthNames[saved.month]} ${saved.year}</div>
      <button class="btn btn-soft" onclick="turnMonth(1)">›</button>
    </div>
    <div class="turn-controls">
      <div><label class="label">Turno da visualizzare</label><select id="turn-team" class="input" onchange="setTurnTeam(this.value)">${TURN_LETTERS.map(x=>`<option ${saved.team===x?'selected':''}>${x}</option>`).join('')}</select></div>
      <div><label class="label">Salto personale</label><select class="input" onchange="setTurnSkip(this.value)"><option value="">Tutti</option>${[1,2,3,4,5,6,7,8].map(x=>`<option value="${x}" ${window.__turnSkip==x?'selected':''}>${x}</option>`).join('')}</select></div>
    </div>
    <div class="notice"><b>Sequenza ufficiale:</b> A1 → B1 → C1 → D1 → … → A8 → B8 → C8 → D8. <b>Riferimento:</b> 01/01/2026 = B6 diurno / A6 notturno.</div>
    <div class="turn-calendar-wrap"><div class="turn-weekdays">${['Lun','Mar','Mer','Gio','Ven','Sab','Dom'].map(x=>`<div>${x}</div>`).join('')}</div><div class="turn-calendar">${cellHtml}</div></div>
    <div id="turn-date-detail"></div>
    <div class="section"><h3>Personale turno ${saved.team}</h3>${roster}</div>
  `);
}
function turnMonth(delta){const v=window.__turnView||{year:new Date().getFullYear(),month:new Date().getMonth(),team:'A'};v.month+=delta;if(v.month<0){v.month=11;v.year--}if(v.month>11){v.month=0;v.year++}window.__turnView=v;render()}
function setTurnTeam(team){window.__turnView={...(window.__turnView||{}),team};window.__turnSkip='';render()}
function setTurnSkip(skip){window.__turnSkip=skip?Number(skip):'';render()}
function selectTurnDate(ds){const v=window.__turnView||{team:'A'},info=realCycleInfo(ds,v.team),names=info.code?peopleForCode(info.code):[];const el=document.getElementById('turn-date-detail');if(!el)return;el.innerHTML=`<section class="card turn-detail"><div class="section-head"><div><div class="eyebrow">${new Date(ds+'T12:00:00').toLocaleDateString('it-IT',{weekday:'long',day:'numeric',month:'long',year:'numeric'})}</div><h3>${info.label?`${info.label} · ${info.phase}`:info.phase}</h3></div><button class="btn btn-soft btn-small" onclick="this.closest('.turn-detail').remove()">Chiudi</button></div>${names.length?names.map(p=>`<div class="turn-person"><span><b>${esc(p.nome)} ${esc(p.cognome)}</b><small>${esc(p.ruolo||'VIGILE')} · salto ${p.salto??'—'}</small></span><span class="badge">${esc(p.turno)}${p.salto||''}</span></div>`).join(''):'<div class="muted">Nessun VVF associato a questo servizio.</div>'}</section>`;el.scrollIntoView({behavior:'smooth',block:'nearest'})}

function selectDay(y,m,d,turno){
  const active=state.people.filter(p=>p.attivo!==false);
  const cs=active.filter(p=>p.ruolo==="CAPO_SQUADRA"&&(!p.turno||p.turno===turno));
  const au=active.filter(p=>p.ruolo==="AUTISTA"&&(!p.turno||p.turno===turno));
  const vi=active.filter(p=>p.ruolo==="VIGILE"&&(!p.turno||p.turno===turno));
  const list=(arr,empty)=>arr.length?arr.map(p=>`<div class="row"><div><b>${esc(p.nome)} ${esc(p.cognome)}</b><div class="muted">${esc(p.ruolo)} · turno ${esc(p.turno||turno)}</div></div><span class="badge">ATTIVO</span></div>`).join(""):`<div class="notice">${empty}</div>`;
  const el=document.getElementById("day-detail");
  if(el)el.innerHTML=`<section class="card" style="padding:20px;margin-top:18px">
    <div class="section-head"><div><div class="eyebrow">Giorno ${String(d).padStart(2,"0")}/${String(m+1).padStart(2,"0")}/${y}</div><h2 style="margin:4px 0">Turno ${turno}</h2></div><span class="badge">A-B-C-D</span></div>
    <div class="grid grid3">
      <div><h3>Capi Squadra (${cs.length})</h3>${list(cs,"Nessun Capo Squadra assegnato a questo turno.")}</div>
      <div><h3>Autisti (${au.length})</h3>${list(au,"Nessun Autista assegnato a questo turno.")}</div>
      <div><h3>Vigili (${vi.length})</h3>${list(vi,"Nessun Vigile assegnato a questo turno.")}</div>
    </div>
  </section>`;
}

function simple(t,d){return page(t,d,`<div class="notice">Modulo predisposto per il collegamento al database Supabase.</div>`)}
function render(){if(state.screen==="pin"){app.innerHTML=pinScreen();return}let s=state.section;app.innerHTML=s==="dashboard"?dashboard():s==="personale"?personnel():s==="parametri"?params():s==="richieste"?requests():s==="caffe"?coffee():s==="turnario"?turnario():simple("Storico e backup","Consultazione e gestione");if((s==="personale"||s==="turnario")&&!state.loading&&!state.peopleLoaded)loadPeople()}
function key(k){if(k==="clear")state.pin=state.pin.slice(0,-1);else if(k==="ok"){if(state.pin.length!==4)return;if(state.setup){localStorage.setItem("tvvf_admin_pin",state.pin);state.setup=false;state.pin="";state.screen="app"}else{if(state.pin===localStorage.getItem("tvvf_admin_pin")){state.pin="";state.screen="app"}else{alert("PIN non corretto");state.pin=""}}}else if(state.pin.length<4)state.pin+=k;render()}
function go(s){state.screen="app";state.section=s;render();if((s==="personale"||s==="turnario")&&!state.loading&&!state.peopleLoaded)loadPeople()}
function logout(){state.screen="pin";state.pin="";render()}
if("serviceWorker" in navigator)navigator.serviceWorker.register("sw.js",{updateViaCache:"none"}).then(r=>r.update()).catch(()=>{});
render();
