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

function turnario(){
  const now=new Date(), y=now.getFullYear(), m=now.getMonth();
  const monthNames=["Gennaio","Febbraio","Marzo","Aprile","Maggio","Giugno","Luglio","Agosto","Settembre","Ottobre","Novembre","Dicembre"];
  const cells=[];
  const first=new Date(y,m,1), last=new Date(y,m+1,0);
  const start=(first.getDay()+6)%7;
  for(let i=0;i<start;i++)cells.push("");
  for(let d=1;d<=last.getDate();d++)cells.push(d);
  while(cells.length%7)cells.push("");
  return page("Turnario","Turno + salto personale. Il calendario operativo verrà calcolato sulla sequenza reale del distaccamento.",`
    <div class="grid grid2">
      <div class="card" style="padding:18px">
        <div class="eyebrow">Struttura</div>
        <h2 style="margin:5px 0">A1–A8 · B1–B8 · C1–C8 · D1–D8</h2>
        <div class="muted">Ogni VVF avrà il proprio turno e il proprio salto.</div>
      </div>
      <div class="card" style="padding:18px">
        <div class="eyebrow">Mese</div>
        <h2 style="margin:5px 0">${monthNames[m]} ${y}</h2>
        <div class="muted">Non inventiamo la sequenza di diurno/notturno/smontante/riposo: verrà inserita secondo il vostro turnario reale.</div>
      </div>
    </div>
    <div class="notice" style="margin-top:18px">
      <b>Passaggio attuale completato:</b> l'anagrafica può memorizzare il salto 1–8 per ogni VVF. 
      Il prossimo motore userà quel dato per mostrare esclusivamente il calendario personale.
    </div>
    <div class="section">
      <h3>${monthNames[m]} ${y}</h3>
      <div style="display:grid;grid-template-columns:repeat(7,1fr);gap:8px">${["Lun","Mar","Mer","Gio","Ven","Sab","Dom"].map(x=>`<div style="text-align:center;font-weight:700;color:#666">${x}</div>`).join("")}</div>
      <div style="display:grid;grid-template-columns:repeat(7,1fr);gap:8px;margin-top:8px">${cells.map(d=>d?`<div class="card" style="min-height:72px"><b>${d}</b><div class="muted" style="margin-top:8px">Salto personale</div></div>`:'<div></div>').join("")}</div>
    </div>
  `);
}
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
function render(){if(state.screen==="pin"){app.innerHTML=pinScreen();return}let s=state.section;app.innerHTML=s==="dashboard"?dashboard():s==="personale"?personnel():s==="parametri"?params():s==="richieste"?requests():s==="caffe"?coffee():s==="turnario"?turnario():simple("Storico e backup","Consultazione e gestione");if(s==="personale"&&!state.loading&&!state.peopleLoaded)loadPeople()}
function key(k){if(k==="clear")state.pin=state.pin.slice(0,-1);else if(k==="ok"){if(state.pin.length!==4)return;if(state.setup){localStorage.setItem("tvvf_admin_pin",state.pin);state.setup=false;state.pin="";state.screen="app"}else{if(state.pin===localStorage.getItem("tvvf_admin_pin")){state.pin="";state.screen="app"}else{alert("PIN non corretto");state.pin=""}}}else if(state.pin.length<4)state.pin+=k;render()}
function go(s){state.screen="app";state.section=s;render();if(s==="personale")loadPeople()}
function logout(){state.screen="pin";state.pin="";render()}
if("serviceWorker" in navigator)navigator.serviceWorker.register("sw.js",{updateViaCache:"none"}).then(r=>r.update()).catch(()=>{});
render();
