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
function personnel(){if(state.loading)return page("Personale","Gestione nominativi e ruoli del distaccamento.",`<div class="notice">Caricamento personale da Supabase…</div>`);const rows=state.people.length?state.people.map((p,i)=>`<div class="row"><div class="row-left"><div class="avatar">${i+1}</div><div><b>${esc(p.nome)} ${esc(p.cognome)}</b><div class="muted">${esc(p.ruolo||"VIGILE")} · turno ${esc(p.turno||"—")}</div></div></div><div class="actions"><span class="badge ${p.attivo?"":"red"}">${p.attivo?"ATTIVO":"DISATTIVO"}</span><button class="btn btn-soft btn-small" onclick="editPerson('${p.id}')">Modifica</button>${p.attivo?`<button class="btn btn-danger btn-small" onclick="disablePerson('${p.id}')">Disattiva</button>`:""}</div></div>`).join(""): `<div class="notice">Nessun dipendente presente in Supabase. Puoi aggiungerlo qui.</div>`;const cs=state.people.filter(p=>p.ruolo==="CAPO_SQUADRA").length,au=state.people.filter(p=>p.ruolo==="AUTISTA").length,vi=state.people.filter(p=>p.ruolo==="VIGILE").length;return page("Personale","Gestione nominativi e ruoli del distaccamento.",`<div class="section-head"><div><b>${state.people.length} profili</b><div class="muted">${cs} Capi Squadra · ${au} Autisti · ${vi} Vigili</div></div><button class="btn btn-primary" onclick="showPersonForm()">+ Aggiungi VVF</button></div><div class="list">${rows}</div><div id="person-form"></div>`)}
function personForm(p=null){const edit=!!p;return `<div class="form-panel"><div class="section-head"><h3>${edit?"Modifica VVF":"Nuovo VVF"}</h3><button class="btn btn-soft" onclick="document.getElementById('person-form').innerHTML=''">Chiudi</button></div><div class="grid grid2"><div class="field"><label class="label">Nome</label><input id="pf-nome" class="input" value="${esc(p?.nome||"")}" autocomplete="off"></div><div class="field"><label class="label">Cognome</label><input id="pf-cognome" class="input" value="${esc(p?.cognome||"")}" autocomplete="off"></div><div class="field"><label class="label">Ruolo</label><select id="pf-ruolo" class="input">${["VIGILE","AUTISTA","CAPO_SQUADRA"].map(x=>`<option ${p?.ruolo===x?"selected":""}>${x}</option>`).join("")}</select></div><div class="field"><label class="label">Turno</label><select id="pf-turno" class="input">${["A","B","C","D"].map(x=>`<option ${p?.turno===x?"selected":""}>${x}</option>`).join("")}</select></div><div class="field"><label class="label">PIN VVF ${edit?"(lascia vuoto per non cambiarlo)":""}</label><input id="pf-pin" class="input" type="password" inputmode="numeric" maxlength="4" placeholder="4 cifre" autocomplete="new-password"></div><div class="field check-field"><label><input id="pf-attivo" type="checkbox" ${p?.attivo!==false?"checked":""}> Profilo attivo</label></div></div><button class="btn btn-primary" onclick="savePerson(${edit?`'${p.id}'`:"null"})">${edit?"Salva modifiche":"Crea VVF"}</button><div id="pf-msg"></div></div>`}
async function loadPeople(){if(state.loading)return;state.loading=true;render();try{state.people=await sbRpc("vvf_admin_list_personale",{});if(!Array.isArray(state.people))state.people=[];state.peopleLoaded=true;}catch(e){alert(e.message)}finally{state.loading=false;render()}}
function showPersonForm(){const el=document.getElementById("person-form");if(el)el.innerHTML=personForm()}
function editPerson(id){const p=state.people.find(x=>x.id===id);const el=document.getElementById("person-form");if(el&&p){el.innerHTML=personForm(p);el.scrollIntoView({behavior:"smooth",block:"center"})}}
async function savePerson(id){const nome=document.getElementById("pf-nome").value.trim(),cognome=document.getElementById("pf-cognome").value.trim(),ruolo=document.getElementById("pf-ruolo").value,turno=document.getElementById("pf-turno").value,pin=document.getElementById("pf-pin").value.trim(),attivo=document.getElementById("pf-attivo").checked;const msg=document.getElementById("pf-msg");if(!nome||!cognome){msg.innerHTML='<div class="notice">Nome e cognome sono obbligatori.</div>';return}if(pin&&!/^\d{4}$/.test(pin)){msg.innerHTML='<div class="notice">Il PIN deve essere di 4 cifre.</div>';return}try{msg.innerHTML='<div class="notice">Salvataggio…</div>';if(id){await sbRpc("vvf_admin_update_personale",{p_id:id,p_nome:nome,p_cognome:cognome,p_ruolo:ruolo,p_turno:turno,p_pin:pin||null,p_attivo:attivo})}else{await sbRpc("vvf_admin_add_personale",{p_nome:nome,p_cognome:cognome,p_ruolo:ruolo,p_turno:turno,p_pin:pin||null,p_attivo:attivo})}await loadPeople()}catch(e){msg.innerHTML=`<div class="notice">Errore: ${esc(e.message)}</div>`}}
async function disablePerson(id){if(!confirm("Disattivare questo profilo? Lo storico non verrà cancellato."))return;try{await sbRpc("vvf_admin_update_personale",{p_id:id,p_nome:null,p_cognome:null,p_ruolo:null,p_turno:null,p_pin:null,p_attivo:false});await loadPeople()}catch(e){alert(e.message)}}
function params(){return page("Parametri","Configurazione adattabile a qualsiasi distaccamento.",`<div class="grid grid2"><div class="field"><label class="label">Nome distaccamento</label><input class="input" value="Desio"></div><div class="field"><label class="label">Turno</label><select class="input"><option>A</option><option>B</option><option selected>C</option><option>D</option></select></div><div class="field"><label class="label">Minimo totale</label><input class="input" type="number" value="1"></div><div class="field"><label class="label">Minimo Capi Squadra</label><input class="input" type="number" value="1"></div><div class="field"><label class="label">Minimo autisti</label><input class="input" type="number" value="1"></div><div class="field"><label class="label">Limite assenze</label><input class="input" type="number" value="3"></div></div><button class="btn btn-primary" onclick="alert('Parametri salvati nel collaudo locale')">Salva parametri</button>`)}
function requests(){return page("Richieste","Ferie e licenze possono essere richieste anche molti mesi prima.",`<div class="notice">Nessuna richiesta da approvare nel collaudo.</div><div class="section"><b>Regole previste</b><ul><li>Richieste future anche a 5, 6 o 10 mesi.</li><li>Il VVF può annullare una richiesta non più necessaria.</li><li>Lo storico dell'operazione resta conservato.</li><li>Il sistema segnala i conflitti con i minimi configurati.</li></ul></div>`)}
function coffee(){return page("Caffè","QR unico, quantità modificabile prima della conferma e conteggio individuale.",`<div class="grid grid2"><div class="card tile"><div style="font-size:34px">▦</div><h3>QR unico</h3><p>Scansione rapida dal telefono. Un caffè predefinito, con possibilità di aggiungerne altri prima della conferma.</p><button class="btn btn-primary" style="margin-top:15px" onclick="alert('Scanner QR verrà collegato al modulo nativo/PWA nel collaudo')">Configura QR</button></div><div class="card tile"><div style="font-size:34px">☕</div><h3>Periodo corrente</h3><p>Conteggio individuale automatico e gestione pagamenti.</p><div class="n" style="font-size:28px">0 €</div><button class="btn btn-soft" onclick="alert('Azzeramento disponibile solo all’amministratore')">Azzera periodo</button></div></div>`)}

function turnario(){
  const now=new Date();
  const ym=`${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`;
  const key=state.turnDate||`${ym}-01`;
  const d=new Date(key+'T12:00:00');
  const y=d.getFullYear(),m=d.getMonth();
  const first=new Date(y,m,1).getDay()||7;
  const days=new Date(y,m+1,0).getDate();
  const shift=state.turnShift||'A';
  const active=state.people.filter(p=>p.attivo);
  const byShift=active.filter(p=>(p.turno||'')===shift);
  const cs=byShift.filter(p=>p.ruolo==='CAPO_SQUADRA');
  const au=byShift.filter(p=>p.ruolo==='AUTISTA');
  const vi=byShift.filter(p=>p.ruolo==='VIGILE');
  const cells=[];
  for(let i=1;i<first;i++) cells.push('<div class="cal-cell empty"></div>');
  for(let day=1;day<=days;day++){
    const ds=`${y}-${String(m+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
    const selected=ds===key?' selected':'';
    cells.push(`<button class="cal-cell${selected}" onclick="selectTurnDate('${ds}')"><b>${day}</b><span>${esc(shift)}</span></button>`);
  }
  return page('Turnario','Consultazione e gestione dei turni A/B/C/D.',`
    <div class="turn-head">
      <div><b>${d.toLocaleDateString('it-IT',{month:'long',year:'numeric'})}</b><div class="muted">Seleziona un giorno per vedere la squadra assegnata al turno scelto.</div></div>
      <div class="turn-tabs">${['A','B','C','D'].map(x=>`<button class="btn ${shift===x?'btn-primary':'btn-soft'} btn-small" onclick="selectTurnShift('${x}')">Turno ${x}</button>`).join('')}</div>
    </div>
    <div class="calendar-wrap">
      <div class="cal-week">${['Lun','Mar','Mer','Gio','Ven','Sab','Dom'].map(x=>`<div>${x}</div>`).join('')}</div>
      <div class="cal-grid">${cells.join('')}</div>
    </div>
    <div class="section"><div class="section-head"><div><h3 style="margin:0">Turno ${shift}</h3><div class="muted">${d.toLocaleDateString('it-IT',{weekday:'long',day:'2-digit',month:'long',year:'numeric'})}</div></div><span class="badge">${byShift.length} presenti nel turno</span></div>
      <div class="grid grid3">
        ${turnGroup('👨‍🚒','Capi Squadra',cs)}
        ${turnGroup('🚒','Autisti',au)}
        ${turnGroup('🧑‍🚒','Vigili',vi)}
      </div>
    </div>
    <div class="notice">Per ora il calendario usa il turno assegnato a ciascun profilo e serve al collaudo. Il prossimo collegamento potrà salvare nel database le assegnazioni giornaliere e la rotazione A/B/C/D.</div>
  `)
}
function turnGroup(icon,title,list){return `<div class="card tile"><div style="font-size:25px">${icon}</div><h3>${title}</h3>${list.length?list.map(p=>`<div class="mini-row"><span>${esc(p.nome)} ${esc(p.cognome)}</span><span class="muted">${esc(p.ruolo)}</span></div>`).join(''):'<div class="muted">Nessun profilo assegnato</div>'}</div>`}
function selectTurnDate(ds){state.turnDate=ds;render()}
function selectTurnShift(x){state.turnShift=x;render()}

function simple(t,d){return page(t,d,`<div class="notice">Modulo predisposto per il collegamento al database Supabase.</div>`)}
function render(){if(state.screen==="pin"){app.innerHTML=pinScreen();return}let s=state.section;app.innerHTML=s==="dashboard"?dashboard():s==="personale"?personnel():s==="parametri"?params():s==="richieste"?requests():s==="caffe"?coffee():s==="turnario"?turnario():simple("Storico e backup","Consultazione e gestione");if((s==="personale"||s==="turnario")&&!state.loading&&!state.peopleLoaded)loadPeople()}
function key(k){if(k==="clear")state.pin=state.pin.slice(0,-1);else if(k==="ok"){if(state.pin.length!==4)return;if(state.setup){localStorage.setItem("tvvf_admin_pin",state.pin);state.setup=false;state.pin="";state.screen="app"}else{if(state.pin===localStorage.getItem("tvvf_admin_pin")){state.pin="";state.screen="app"}else{alert("PIN non corretto");state.pin=""}}}else if(state.pin.length<4)state.pin+=k;render()}
function go(s){state.screen="app";state.section=s;render();if(s==="personale")loadPeople()}
function logout(){state.screen="pin";state.pin="";render()}
if("serviceWorker" in navigator)navigator.serviceWorker.register("sw.js",{updateViaCache:"none"}).then(r=>r.update()).catch(()=>{});
render();
