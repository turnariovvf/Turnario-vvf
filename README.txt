TURNARIO VVF - PWA COLLAUDO
============================

Questa è la versione grafica definitiva del primo modulo:
- accesso amministratore con PIN a 4 cifre
- Dashboard amministratore
- struttura Personale / Parametri / Turnario / Richieste / Caffè / Storico
- PWA installabile dal browser
- configurazione Supabase già predisposta con URL e publishable key

IMPORTANTE
----------
Il PIN presente in questa prima build è LOCALE al dispositivo ed è destinato al collaudo UI.
Per la versione operativa multi-telefono bisogna completare l'autenticazione server-side e le policy RLS
prima di distribuire il link ai VVF. Non inserire mai service_role/secret key nel browser.

PROSSIMO COLLEGAMENTO TECNICO
-----------------------------
1. Autenticazione PIN server-side su Supabase.
2. Policy RLS per amministratore e singolo VVF.
3. Collegamento CRUD reale di personale, turnario, richieste e caffè.
4. Pubblicazione PWA con URL unico.

La publishable key è già nel file config.js.
