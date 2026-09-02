-- Turnario VVF v11.9.5
-- Correzione stati richieste ferie/assenze.
-- Mantiene gli stati usati dal flusso del Turnario e consente IN_ATTESA.

alter table public.vvf_richieste
drop constraint if exists vvf_richieste_stato_check;

alter table public.vvf_richieste
add constraint vvf_richieste_stato_check
check (stato in ('IN_ATTESA', 'APPROVATA', 'RIFIUTATA', 'ANNULLATA'));
