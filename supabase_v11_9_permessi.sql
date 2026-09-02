-- TURNARIO VVF v11.9 - PERMESSI SPECIALI + TIPI ASSENZA
-- Eseguire una sola volta nel SQL Editor Supabase.

create table if not exists public.vvf_permessi_personale (
  persona_id uuid primary key references public.personale(id) on delete cascade,
  puo_validare_assenze boolean not null default false,
  gestore_caffe boolean not null default false,
  updated_at timestamptz not null default now()
);

alter table public.vvf_permessi_personale enable row level security;
revoke all on public.vvf_permessi_personale from anon, authenticated;

create or replace function public.vvf_admin_list_permessi(p_admin_pin text)
returns table(
  persona_id uuid,
  puo_validare_assenze boolean,
  gestore_caffe boolean
)
language sql security definer
set search_path=public,extensions
as $$
  select vp.persona_id, vp.puo_validare_assenze, vp.gestore_caffe
  from public.vvf_permessi_personale vp
  where exists (
    select 1 from public.personale a
    where a.ruolo='AMMINISTRATORE' and a.attivo=true and a.pin_hash is not null
      and crypt(coalesce(p_admin_pin,''),a.pin_hash)=a.pin_hash
  )
  order by vp.persona_id;
$$;

grant execute on function public.vvf_admin_list_permessi(text) to anon, authenticated;

create or replace function public.vvf_admin_set_permessi(
  p_admin_pin text,
  p_persona_id uuid,
  p_puo_validare_assenze boolean default false,
  p_gestore_caffe boolean default false
)
returns jsonb
language plpgsql security definer
set search_path=public,extensions
as $$
begin
  if not exists (
    select 1 from public.personale a
    where a.ruolo='AMMINISTRATORE' and a.attivo=true and a.pin_hash is not null
      and crypt(coalesce(p_admin_pin,''),a.pin_hash)=a.pin_hash
  ) then
    raise exception 'Accesso amministratore non valido';
  end if;

  if not exists (
    select 1 from public.personale p
    where p.id=p_persona_id and p.attivo=true and p.ruolo<>'AMMINISTRATORE'
  ) then
    raise exception 'Profilo VVF non trovato o non attivo';
  end if;

  insert into public.vvf_permessi_personale(persona_id,puo_validare_assenze,gestore_caffe,updated_at)
  values(p_persona_id,coalesce(p_puo_validare_assenze,false),coalesce(p_gestore_caffe,false),now())
  on conflict(persona_id) do update
  set puo_validare_assenze=excluded.puo_validare_assenze,
      gestore_caffe=excluded.gestore_caffe,
      updated_at=now();

  return jsonb_build_object(
    'persona_id',p_persona_id,
    'puo_validare_assenze',coalesce(p_puo_validare_assenze,false),
    'gestore_caffe',coalesce(p_gestore_caffe,false)
  );
end;
$$;

grant execute on function public.vvf_admin_set_permessi(text,uuid,boolean,boolean) to anon, authenticated;

create or replace function public.vvf_is_validatore_assenze(p_session_token text)
returns boolean
language sql security definer
set search_path=public,extensions
as $$
  select exists (
    select 1
    from public.app_sessions s
    join public.personale p on p.id=s.persona_id
    join public.vvf_permessi_personale vp on vp.persona_id=p.id
    where s.token_hash=encode(digest(coalesce(p_session_token,''),'sha256'),'hex')
      and s.expires_at>now()
      and p.attivo=true
      and vp.puo_validare_assenze=true
  );
$$;

grant execute on function public.vvf_is_validatore_assenze(text) to anon, authenticated;

create or replace function public.vvf_is_gestore_caffe(p_session_token text)
returns boolean
language sql security definer
set search_path=public,extensions
as $$
  select exists (
    select 1
    from public.app_sessions s
    join public.personale p on p.id=s.persona_id
    join public.vvf_permessi_personale vp on vp.persona_id=p.id
    where s.token_hash=encode(digest(coalesce(p_session_token,''),'sha256'),'hex')
      and s.expires_at>now()
      and p.attivo=true
      and vp.gestore_caffe=true
  );
$$;

grant execute on function public.vvf_is_gestore_caffe(text) to anon, authenticated;

create or replace function public.vvf_lista_tipi_assenza(p_session_token text)
returns table(
  id uuid,
  codice text,
  nome text,
  limite_contemporaneo integer,
  richiede_approvazione boolean,
  visibile_a_tutti boolean
)
language sql security definer
set search_path=public,extensions
as $$
  select t.id,t.codice,t.nome,t.limite_contemporaneo,t.richiede_approvazione,t.visibile_a_tutti
  from public.vvf_tipi_assenza t
  where t.attivo=true
    and exists (
      select 1 from public.app_sessions s
      join public.personale p on p.id=s.persona_id
      where s.token_hash=encode(digest(coalesce(p_session_token,''),'sha256'),'hex')
        and s.expires_at>now() and p.attivo=true
    )
  order by t.nome;
$$;

grant execute on function public.vvf_lista_tipi_assenza(text) to anon, authenticated;
