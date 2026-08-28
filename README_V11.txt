TURNARIO VVF v11.3

Gestione personale reale dall'app amministratore con verifica del PIN amministratore lato Supabase.

NOVITÀ v11.3
- Il pulsante + Aggiungi VVF apre il modulo reale di inserimento.
- Supportati senza limiti più Capi Squadra (anche 3 o più).
- Inserimento/modifica/disattivazione del personale tramite RPC Supabase.
- I turni A/B/C/D vengono creati automaticamente se mancanti per il distaccamento Desio.
- Cache PWA aggiornata per evitare di mostrare una vecchia versione dell'app.

INSTALLAZIONE
1. Eseguire UNA SOLA VOLTA supabase_v11_admin.sql nel SQL Editor Supabase.
2. Sostituire i file della PWA nel repository GitHub con quelli di questo archivio.
3. Non pubblicare service_role/secret key.
4. Il PIN amministratore usato nell'app deve essere lo stesso PIN presente nel profilo AMMINISTRATORE su Supabase.


v11.5: Turnario A-B-C-D reale lato PWA + cache Service Worker aggiornata.
