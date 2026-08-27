const C=window.TURNARIO_CONFIG||{};
const app=document.getElementById("app");
const state={screen:"pin",pin:"",setup:localStorage.getItem("tvvf_admin_pin")==null,section:"dashboard"};

function esc(s){return String(s).replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]));}
function layout(content){
 return `<div class="shell"><header class="topbar"><div class="brand"><div class="brand-mark">🔥</div><div>Turnario VVF<small>Gestione distaccamento</small></div></div><span class="badge" style="background:#fff;color:#9b111e">AMMINISTRATORE</span></header>${content}<nav class="mobile-nav"><button onclick="go('dashboard')">🏠<br>Dashboard</button><button onclick="go('personale')">👨‍🚒<br>Personale</button><button onclick="go('parametri')">⚙️<br>Parametri</button><button onclick="go('richieste')">📋<br>Richieste</button><button onclick="go('caffe')">☕<br>Caffè</button></nav></div>`;
}
function pinScreen(){
 const title=state.setup?"Configura amministratore":"Accesso amministratore";
 const sub=state.setup?"Imposta il PIN di 4 cifre per il primo accesso.":"Inserisci il PIN amministratore.";
 return `<main class="login"><section class="card login-card">
 <div class="eyebrow">Turnario VVF</div><h1 class="title">${title}</h1><p class="muted">${sub}</p>
 <div class="pin-dots">${[0,1,2,3].map(i=>`<i class="dot ${state.pin.length>i?"on":""}"></i>`).join("")}</div>
 <div class="pin-grid">${[1,2,3,4,5,6,7,8,9].map(n=>`<button class="pin-key" onclick="key('${n}')">${n}</button>`).join("")}
 <button class="pin-key" onclick="key('clear')">⌫</button><button class="pin-key" onclick="key('0')">0</button><button class="pin-key" onclick="key('ok')">✓</button></div>
 <div class="notice">PIN a 4 cifre. Per il collaudo iniziale il PIN resta sul dispositivo; l'autenticazione server verrà attivata nel passaggio di sicurezza.</div>
 </section></main>`;
}
function dashboard(){
 return layout(`<main class="container">
 <div class="section-head"><div><div class="eyebrow">Panoramica</div><h1 class="title">Dashboard amministratore</h1><div class="muted">Distaccamento configurabile e personale sostituibile senza perdere lo storico.</div></div><button class="btn btn-soft" onclick="logout()">Esci</button></div>
 <div class="grid grid4 section">
 ${stat("👨‍🚒","Personale","10","attivi")} ${stat("🟢","Presenze","—","da collegare al turnario")} ${stat("📋","Richieste","0","da approvare")} ${stat("☕","Caffè","0","periodo corrente")}
 </div>
 <div class="grid grid2 section">
  ${tile("👨‍🚒","Personale","Inserisci, sostituisci o disattiva i VVF e assegna i ruoli.","personale")}
  ${tile("⚙️","Parametri","Numeri minimi, CS, autisti, turni e salti.","parametri")}
  ${tile("📅","Turnario","Vista del calendario A/B/C/D e assegnazioni.","turnario")}
  ${tile("📋","Richieste","Ferie, licenze, 104, malattia e congedi.","richieste")}
  ${tile("☕","Caffè","QR unico, quantità, conteggi, pagamenti e azzeramento.","caffe")}
  ${tile("💾","Storico e backup","Operazioni, richieste e movimenti conservati nello storico.","storico")}
 </div>
 </main>`);
}
function stat(icon,t,n,s){return `<div class="card stat"><div>${icon}</div><div class="n">${n}</div><div>${t}</div><div class="muted">${s}</div></div>`}
function tile(icon,t,p,target){return `<button class="card tile" style="text-align:left;border:1px solid #e4e6ea;background:#fff;cursor:pointer" onclick="go('${target}')"><div style="font-size:25px">${icon}</div><h3>${t}</h3><p>${p}</p></button>`}
function page(title,desc,body){return layout(`<main class="container"><div class="section-head"><div><div class="eyebrow">Amministrazione</div><h1 class="title">${title}</h1><div class="muted">${desc}</div></div><button class="btn btn-soft" onclick="go('dashboard')">← Dashboard</button></div><section class="card" style="padding:20px">${body}</section></main>`)}
function personnel(){return page("Personale","Gestione nominativi e ruoli del distaccamento.",`<div class="section-head"><b>Personale attivo</b><button class="btn btn-primary" onclick="alert('Modulo inserimento pronto nel prossimo collegamento database')">+ Aggiungi VVF</button></div><div class="list">${["VVF 01","VVF 02","VVF 03","VVF 04","VVF 05","VVF 06","VVF 07","VVF 08","VVF 09","VVF 10"].map((x,i)=>`<div class="row"><div class="row-left"><div class="avatar">${i+1}</div><div><b>${x}</b><div class="muted">${i===0?"CAPO_SQUADRA":i<3?"AUTISTA":"VIGILE"}</div></div></div><span class="badge">ATTIVO</span></div>`).join("")}</div>`)}
function params(){return page("Parametri","Configurazione adattabile a qualsiasi distaccamento.",`<div class="grid grid2"><div class="field"><label class="label">Nome distaccamento</label><input class="input" value="Distaccamento VVF"></div><div class="field"><label class="label">Turno</label><select class="input"><option>A</option><option>B</option><option>C</option><option>D</option></select></div><div class="field"><label class="label">Minimo totale</label><input class="input" type="number" value="1"></div><div class="field"><label class="label">Minimo Capi Squadra</label><input class="input" type="number" value="1"></div><div class="field"><label class="label">Minimo autisti</label><input class="input" type="number" value="1"></div><div class="field"><label class="label">Limite assenze</label><input class="input" type="number" value="3"></div></div><button class="btn btn-primary" onclick="alert('Parametri salvati nel collaudo locale')">Salva parametri</button>`)}
function requests(){return page("Richieste","Ferie e licenze possono essere richieste anche molti mesi prima.",`<div class="notice">Nessuna richiesta da approvare nel collaudo.</div><div class="section"><b>Regole previste</b><ul><li>Richieste future anche a 5, 6 o 10 mesi.</li><li>Il VVF può annullare una richiesta non più necessaria.</li><li>Lo storico dell'operazione resta conservato.</li><li>Il sistema segnala i conflitti con i minimi configurati.</li></ul></div>`)}
function coffee(){return page("Caffè","QR unico, quantità modificabile prima della conferma e conteggio individuale.",`<div class="grid grid2"><div class="card tile"><div style="font-size:34px">▦</div><h3>QR unico</h3><p>Scansione rapida dal telefono. Un caffè predefinito, con possibilità di aggiungerne altri prima della conferma.</p><button class="btn btn-primary" style="margin-top:15px" onclick="alert('Scanner QR verrà collegato al modulo nativo/PWA nel collaudo')">Configura QR</button></div><div class="card tile"><div style="font-size:34px">☕</div><h3>Periodo corrente</h3><p>Conteggio individuale automatico e gestione pagamenti.</p><div class="n" style="font-size:28px">0 €</div><button class="btn btn-soft" onclick="alert('Azzeramento disponibile solo all’amministratore')">Azzera periodo</button></div></div>`)}
function simple(t,d){return page(t,d,`<div class="notice">Modulo predisposto per il collegamento al database Supabase.</div>`)}
function render(){if(state.screen==="pin"){app.innerHTML=pinScreen();return}let s=state.section;app.innerHTML=s==="dashboard"?dashboard():s==="personale"?personnel():s==="parametri"?params():s==="richieste"?requests():s==="caffe"?coffee():simple(s==="turnario"?"Turnario":"Storico e backup","Consultazione e gestione");}
function key(k){if(k==="clear"){state.pin=state.pin.slice(0,-1)}else if(k==="ok"){if(state.pin.length!==4)return; if(state.setup){localStorage.setItem("tvvf_admin_pin",state.pin);state.setup=false;state.pin="";state.screen="app"}else{if(state.pin===localStorage.getItem("tvvf_admin_pin")){state.pin="";state.screen="app"}else{alert("PIN non corretto");state.pin=""}}}else if(state.pin.length<4){state.pin+=k}render()}
function go(s){state.screen="app";state.section=s;render()}
function logout(){state.screen="pin";state.pin="";render()}
if("serviceWorker" in navigator) navigator.serviceWorker.register("sw.js").catch(()=>{});
render();
