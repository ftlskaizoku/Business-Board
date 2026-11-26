-- Business Board — security hardening. Run ONCE in the Supabase SQL editor,
-- after schema.sql. Safe to re-run.
--
-- Why: with the public anon key anyone can talk to the database API directly,
-- so the app's screens are not a security boundary — these rules are.

-- 1. A user must NOT be able to edit their own is_allowed / email / phone.
--    The old "self-updatable" policy allowed any column, so a blocked user
--    could un-block themselves with one API call.
drop policy if exists "profiles are self-insertable" on profiles;
drop policy if exists "admin updates all profiles" on profiles; -- admin now writes via the service role

revoke insert, update, delete on profiles from anon, authenticated;
grant update (full_name, tutorial_seen) on profiles to authenticated;

-- Make sure every existing account has a profile row (the app only UPDATEs it now).
insert into profiles (id, email, phone)
select u.id, u.email, u.phone from auth.users u
where not exists (select 1 from profiles p where p.id = u.id);

-- 2. Admin = the confirmed owner of the admin address (an unconfirmed sign-up
--    using that address no longer counts). Keep the address in sync with
--    ADMIN_EMAIL in src/lib/admin.ts.
create or replace function public.is_admin()
returns boolean as $$
  select exists (
    select 1 from auth.users u
    where u.id = auth.uid()
      and lower(u.email) = 'khalifadylla@gmail.com'
      and u.email_confirmed_at is not null
  );
$$ language sql stable security definer set search_path = '';

-- 3. Pin search_path on every SECURITY DEFINER function (prevents a malicious
--    object in another schema from shadowing a table the function relies on).
alter function public.handle_new_user() set search_path = '';
alter function public.owns_business(uuid) set search_path = public;

-- 4. Sanity limits enforced by the database itself. NOT VALID = checked for
--    every new/changed row without failing on old rows; run
--    "alter table … validate constraint …" later once old data is cleaned.
alter table expenses     add constraint expenses_amount_ck   check (amount > 0 and amount <= 1e12) not valid;
alter table expenses     add constraint expenses_text_ck     check (char_length(category) <= 60 and char_length(coalesce(note,'')) <= 300) not valid;
alter table sales        add constraint sales_total_ck       check (total >= 0 and total <= 1e12) not valid;
alter table sale_items   add constraint sale_items_ck        check (qty between 1 and 100000 and price >= 0 and price <= 1e12) not valid;
alter table products     add constraint products_ck          check (price >= 0 and price <= 1e12 and stock >= 0 and char_length(name) <= 120) not valid;
alter table services     add constraint services_ck          check (price >= 0 and price <= 1e12 and char_length(name) <= 120) not valid;
alter table businesses   add constraint businesses_name_ck   check (char_length(name) between 1 and 80) not valid;
alter table customers    add constraint customers_ck         check (char_length(name) <= 80 and char_length(coalesce(phone,'')) <= 30) not valid;
