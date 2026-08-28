-- TURNARIO VVF v11.2 - gestione personale dall'app amministratore
-- Eseguire UNA SOLA VOLTA nel SQL Editor Supabase.
-- Le funzioni usano il PIN amministratore server-side e non espongono pin_hash.

create or replace function public.vvf_admin_list_personale(p_admin_pin text)
returns table(
  id uuid, distaccamento_id uuid, nome text, cognome text, ruolo text, attivo boolean, turno char(1), created_at timestamptz
)
language plpgsql security definer set search_path=public,extensions
as $$
begin
  if not exists (select 1 from public.personale where ruolo='AMMINISTRATORE' and attivo=true and pin_hash is not null and crypt(coalesce(p_admin_pin,''),pin_hash)=pin_hash) then raise exception 'Accesso amministratore non valido'; end if;
  return query select p.id,p.distaccamento_id,p.nome,p.cognome,p.ruolo,p.attivo,d.turno,p.created_at
  from public.personale p join public.distaccamenti d on d.id=p.distaccamento_id
  where p.ruolo <> 'AMMINISTRATORE' order by p.cognome,p.nome;
end $$;

create or replace function public.vvf_admin_add_personale(
  p_admin_pin text, p_nome text, p_cognome text, p_ruolo text, p_turno char(1), p_pin text default null, p_attivo boolean default true
) returns jsonb language plpgsql security definer set search_path=public,extensions as $$
declare d uuid; r public.personale;
begin
  if not exists (select 1 from public.personale where ruolo='AMMINISTRATORE' and attivo=true and pin_hash is not null and crypt(coalesce(p_admin_pin,''),pin_hash)=pin_hash) then raise exception 'Accesso amministratore non valido'; end if;
  if trim(coalesce(p_nome,''))='' or trim(coalesce(p_cognome,''))='' then raise exception 'Nome e cognome obbligatori'; end if;
  if upper(trim(coalesce(p_ruolo,'')))='AMMINISTRATORE' then raise exception 'Il profilo amministratore resta separato'; end if;
  if p_turno not in ('A','B','C','D') then raise exception 'Turno non valido'; end if;
  if p_pin is not null and p_pin<>'' and (length(p_pin)<>4 or p_pin !~ '^[0-9]{4}$') then raise exception 'PIN non valido'; end if;
  select id into d from public.distaccamenti where nome='Desio' and turno=p_turno limit 1;
  if d is null then raise exception 'Distaccamento non trovato per il turno indicato'; end if;
  insert into public.personale(distaccamento_id,nome,cognome,pin_hash,ruolo,attivo)
  values(d,trim(p_nome),trim(p_cognome),case when coalesce(p_pin,'')='' then null else crypt(p_pin,gen_salt('bf',10)) end,upper(trim(p_ruolo)),coalesce(p_attivo,true))
  returning * into r;
  return jsonb_build_object('id',r.id,'distaccamento_id',r.distaccamento_id,'nome',r.nome,'cognome',r.cognome,'ruolo',r.ruolo,'attivo',r.attivo);
end $$;

create or replace function public.vvf_admin_update_personale(
  p_admin_pin text, p_id uuid, p_nome text default null, p_cognome text default null, p_ruolo text default null, p_turno char(1) default null, p_pin text default null, p_attivo boolean default null
) returns jsonb language plpgsql security definer set search_path=public,extensions as $$
declare r public.personale; d uuid;
begin
  if not exists (select 1 from public.personale where ruolo='AMMINISTRATORE' and attivo=true and pin_hash is not null and crypt(coalesce(p_admin_pin,''),pin_hash)=pin_hash) then raise exception 'Accesso amministratore non valido'; end if;
  if upper(trim(coalesce(p_ruolo,'')))='AMMINISTRATORE' then raise exception 'Il profilo amministratore resta separato'; end if;
  if p_turno is not null and p_turno not in ('A','B','C','D') then raise exception 'Turno non valido'; end if;
  if p_pin is not null and p_pin<>'' and (length(p_pin)<>4 or p_pin !~ '^[0-9]{4}$') then raise exception 'PIN non valido'; end if;
  if p_turno is not null then select id into d from public.distaccamenti where nome='Desio' and turno=p_turno limit 1; if d is null then raise exception 'Distaccamento non trovato per il turno indicato'; end if; end if;
  update public.personale set nome=coalesce(nullif(trim(p_nome),''),nome), cognome=coalesce(nullif(trim(p_cognome),''),cognome), ruolo=coalesce(nullif(upper(trim(p_ruolo)),''),ruolo), distaccamento_id=coalesce(d,distaccamento_id), pin_hash=case when p_pin is null or p_pin='' then pin_hash else crypt(p_pin,gen_salt('bf',10)) end, attivo=coalesce(p_attivo,attivo) where id=p_id and ruolo<>'AMMINISTRATORE' returning * into r;
  if not found then raise exception 'Profilo non trovato'; end if;
  return jsonb_build_object('id',r.id,'distaccamento_id',r.distaccamento_id,'nome',r.nome,'cognome',r.cognome,'ruolo',r.ruolo,'attivo',r.attivo);
end $$;

grant execute on function public.vvf_admin_list_personale(text) to anon, authenticated;
grant execute on function public.vvf_admin_add_personale(text,text,text,text,char,text,boolean) to anon, authenticated;
grant execute on function public.vvf_admin_update_personale(text,uuid,text,text,text,char,text,boolean) to anon, authenticated;
