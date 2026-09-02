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


v11.6: struttura Turno + Salto personale (1-8) per A/B/C/D. Il motore della sequenza reale non viene inventato: richiede la tabella/sequenza del turnario del distaccamento.


v11.7: calendario perpetuo navigabile per mesi/anni e filtro personale per turno+salto.


v11.9: motore turnario reale integrato. Sequenza A1-D8, riferimento 01/01/2026 = B6 diurno / A6 notturno, calendario mensile navigabile, visualizzazione Diurno/Notturno/Smontante/Riposo, associazione automatica dei VVF al turno+salto.


## v11.9 – Accesso VVF e permessi delegati
- Accesso VVF con elenco personale e PIN individuale.
- Area personale con turnario, richieste e validazione per i Capi Squadra.
- Gestore Caffè indipendente dal ruolo.
- Collegamento alle RPC Supabase per richieste e ferie condivise.
- Motore Turnario A/B/C/D + salto 1–8 mantenuto invariato.


TURNARIO VVF v11.9.1 – PERMESSI E RICHIESTE
- In Personale > Modifica VVF: permessi speciali “Può validare ferie/assenze” e “Gestore Caffè”, indipendenti dal ruolo.
- I permessi sono memorizzati in vvf_permessi_personale.
- Il catalogo dei tipi di assenza viene letto tramite RPC autenticata, evitando l’accesso REST diretto alla tabella.
- Eseguire una volta supabase_v11_9_permessi.sql prima di usare i nuovi permessi e le richieste.
