TURNARIO VVF v10
================
Questa build è la base per il passaggio da PIN locale a PIN verificato lato server.

PRIMA DI PUBBLICARLA AI COLLEGHI:
1) Eseguire supabase_v10_auth.sql nel progetto Supabase.
2) La PWA deve usare le RPC vvf_bootstrap_admin e vvf_login.
3) Le operazioni applicative devono verificare il token di sessione lato server/RPC.
4) Non pubblicare mai service_role, secret key o password database.

Nota: la build precedente rimane utilizzabile per la verifica grafica, ma non va considerata autenticazione multiutente definitiva.
