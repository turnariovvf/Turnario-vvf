-- TURNARIO VVF v10 - AUTENTICAZIONE PIN SERVER-SIDE
-- Eseguire una sola volta nel SQL Editor Supabase.
create extension if not exists pgcrypto;

create table if not exists public.app_sessions (
  token_hash text primary key,
  persona_id uuid not null references public.personale(id) on delete cascade,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);
alter table public.app_sessions enable row level security;

revoke all on public.app_sessions from anon, authenticated;

create or replace function public.vvf_hash_pin(p_pin text)
returns text language sql immutable security definer
set search_path=public,extensions
as $$ select crypt(p_pin, gen_salt('bf', 10)); $$;

create or replace function public.vvf_login(p_persona_id uuid, p_pin text)
returns jsonb
language plpgsql security definer
set search_path=public,extensions
as $$
declare
  p public.personale;
  raw text;
begin
  if length(coalesce(p_pin,'')) <> 4 or p_pin !~ '^[0-9]{4}$' then
    raise exception 'PIN non valido';
  end if;
  select * into p from public.personale where id=p_persona_id and attivo=true;
  if not found then raise exception 'Profilo non disponibile'; end if;
  if p.pin_hash is null or p.pin_hash = '' or crypt(p_pin,p.pin_hash) <> p.pin_hash then
    raise exception 'PIN non corretto';
  end if;
  raw := encode(gen_random_bytes(32),'hex');
  insert into public.app_sessions(token_hash,persona_id,expires_at)
  values (encode(digest(raw,'sha256'),'hex'),p.id,now()+interval '30 days');
  return jsonb_build_object('token',raw,'persona_id',p.id,'ruolo',p.ruolo,'nome',p.nome,'cognome',p.cognome);
end $$;

create or replace function public.vvf_bootstrap_admin(p_nome text,p_cognome text,p_pin text,p_distaccamento text,p_turno char(1))
returns jsonb
language plpgsql security definer
set search_path=public,extensions
as $$
declare d uuid; p uuid; raw text;
begin
  if exists(select 1 from public.personale where ruolo='AMMINISTRATORE' and attivo=true) then
    raise exception 'Amministratore già configurato';
  end if;
  if p_turno not in ('A','B','C','D') then raise exception 'Turno non valido'; end if;
  if length(p_pin)<>4 or p_pin !~ '^[0-9]{4}$' then raise exception 'PIN non valido'; end if;
  insert into public.distaccamenti(nome,turno) values(p_distaccamento,p_turno) returning id into d;
  insert into public.personale(distaccamento_id,nome,cognome,pin_hash,ruolo)
  values(d,p_nome,p_cognome,vvf_hash_pin(p_pin),'AMMINISTRATORE') returning id into p;
  raw:=encode(gen_random_bytes(32),'hex');
  insert into public.app_sessions(token_hash,persona_id,expires_at)
  values(encode(digest(raw,'sha256'),'hex'),p,now()+interval '30 days');
  return jsonb_build_object('token',raw,'persona_id',p,'ruolo','AMMINISTRATORE');
end $$;

-- Il bootstrap è eseguibile solo per la prima configurazione.
grant execute on function public.vvf_bootstrap_admin(text,text,text,text,char) to anon, authenticated;
grant execute on function public.vvf_login(uuid,text) to anon, authenticated;
