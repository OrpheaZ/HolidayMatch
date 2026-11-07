Holiday Match is a web application that helps parents find other families with children who are traveling to the same destination during overlapping vacation periods. 

The goal is to help children find playmates of a similar age who speak the same language.

## Supabase MVP

The initial schema is in `supabase/migrations/20261107163745_initial_mvp.sql`.
Profiles, children, trips, trip-child links, contact requests, and roles are private
by default. Destinations are publicly readable. `list_public_trips()` exposes only
the destination, dates, and a separate random trip reference for explicitly public
trips; it does not expose user IDs or child data. Destination and exact dates can
still make a trip identifiable in combination with external information, so obtain
informed consent before publication.

New Supabase Auth users receive the `user` role automatically. Users manage their
own data; an `admin` can manage application data and other users' roles through
RLS. Users cannot change their own roles. A normal user sends a contact request
through `request_contact(trip_reference)`; only the recipient can accept or reject
a pending request. Supabase Auth account administration requires a trusted
server-side admin API, never a browser service-role key.

### Bootstrap the first administrator

After creating your own account, identify its UUID in the Supabase Dashboard under
Authentication. In the SQL Editor for the intended project, run the following
once with that UUID substituted, using an account authorized to administer the
database:

```sql
insert into public.user_roles (user_id, role)
select id, 'admin'::public.app_role
from auth.users
where id = '<USER_UUID>'::uuid
on conflict (user_id, role) do nothing
returning user_id, role;
```

Check the returned UUID. No returned row means the UUID did not match a user or
the role already existed; verify in the Dashboard before retrying. Protect the
Dashboard with MFA and never place credentials or service-role keys in frontend
code. Subsequent role changes should be restricted to authorized administrators
and audited.

### Frontend integration

The family search uses `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`
and calls `search_public_families()`; never expose a service-role key through a
`VITE_` variable. The RPC only returns public trips with explicit per-trip
`trip_search_consent`, their destination, dates, languages, and children's
approximate ages and optional genders. It does not expose names, birth years,
email addresses, or internal user IDs. Results and filters are public, so
combining their fields can make families identifiable. The migration grants
consent only to marked demo accounts; all other trips remain unshared by default.
Real users need an informed, revocable opt-in interface before publishing their
family details. Registration and login use Supabase Auth; a confirmed session
creates the user's profile if needed without overwriting an existing profile.
Configure the site's URL and `/login` confirmation redirect in Supabase Auth's
URL allow list for every deployment. Email confirmation and SMTP depend on the
project's Auth settings; the built-in email service has restricted delivery and
rate limits. The trips page loads and saves only the current user's trips through
RLS. New trips are private; publishing requires explicit confirmation, and
turning visibility off revokes the search consent. Free-text destinations,
per-trip languages, and ages entered in the trip form are stored on the trip;
the ages are not linked to the separate child profiles. Previously entered
prototype trips were only in memory and cannot be recovered after a reload.
Password recovery and the contact workflow remain prototypes. Test RLS and consent with separate accounts before
using real family data.

### Development demo data

`scripts/seed-demo-data.mjs` uses the Supabase Auth Admin API and server-side
REST API; it requires Node.js 20 or newer. It refuses to run if any Auth user or
application row is not part of this unchanged demo set, or if any demo account
has an admin role. It is intended for a dedicated, empty development project.
On a partial run, repeat the same command to continue. Changes to seeded records
cause the script to stop rather than overwrite them. Do not run it concurrently
with other writers. The data is fixed to 2027, and all accounts have random,
unknown passwords and unconfirmed email addresses; they are not intended for login.

Set these variables in a local PowerShell session, then run the script:

```powershell
$env:SUPABASE_URL = 'https://<development-project-ref>.supabase.co'
$env:HOLIDAYBUDDIES_DEV_PROJECT_REF = '<development-project-ref>'
$env:HOLIDAYBUDDIES_CONFIRM_DEV = 'yes'
$env:SUPABASE_SERVICE_ROLE_KEY = '<server-side-service-role-key>'
npm.cmd run seed:dev
```

The npm command loads `.env` from the project root using Node's `--env-file`;
variables already set in the process take precedence over values in the file.
Obtain the key privately from the development project's Supabase Dashboard; never
put it in frontend variables, a committed file, or logs. Remove the environment
variable from the shell afterwards. Run `node --test scripts\seed-demo-data.test.mjs`
to check the deterministic dataset without any database access.

Every Auth account is marked with `app_metadata.demo_seed =
holidaybuddies-demo-v1` and uses a `holidaybuddies-demo-v1-...@example.com`
address. Profiles and destinations also contain `[Demo]`; other seeded rows use
deterministic IDs from the script. To remove the data, first verify that the
project contains no real or subsequently attached data. Remove only the marked
test accounts through the Auth Admin API or Dashboard; foreign-key cascades remove
their profiles, roles, children, trips, links, and requests. Then remove only
the seeded `[Demo]` destinations after checking that no remaining trips reference
them. Do not use blanket deletion or remove accounts based on email alone.
