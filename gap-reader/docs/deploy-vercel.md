# Deploying Gap Reader to Vercel with a managed Postgres

This guide puts Gap Reader on Vercel, with both products' data in one managed Postgres database (Neon is used in the examples; Supabase works the same way). It takes about thirty minutes. You need:

* a Vercel account with access to the GitHub repository
* a Neon (or Supabase) account
* an email provider that offers SMTP (Resend, Postmark, Amazon SES or similar) and a domain you can send from
* `psql` on your own computer (to run `db/setup.sql` once)

Nothing here runs the sample seed. A production deployment starts empty.

## 1. Create the database

1. In Neon, create a project in the region closest to where Vercel will run the app (for example `us-east-1` with Vercel's `iad1`). Keep the database name `neondb` or choose your own.
2. From the Neon dashboard, copy the **direct** (unpooled) connection string for the owner role. It looks like `postgresql://neondb_owner:...@ep-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require`.

You can also install Neon from the Vercel Marketplace (Storage tab of your Vercel project). It creates the same thing and adds the owner's connection strings to the project; you will still create the two Gap Reader roles below and use their URLs, not the owner's.

## 2. Create the two schemas and two roles

Choose two strong passwords (`openssl rand -base64 24` twice), then run, from the `gap-reader` folder:

```sh
psql "<owner direct connection string>" \
  -v org_password="'<first password>'" \
  -v personal_password="'<second password>'" \
  -f db/setup.sql
```

This creates the `org` schema owned by the `gr_org` role and the `personal` schema owned by the `gr_personal` role, each refused the other's schema. The application never uses the owner role.

If you prefer two separate databases, create two Neon projects and run the org half of `db/setup.sql` in one and the personal half in the other.

## 3. Build the four connection strings

Each product needs a **pooled** URL (used by the running app) and a **direct** URL (used only for migrations). In Neon the pooled host has `-pooler` after the endpoint ID.

| Variable | Value |
| --- | --- |
| `ORG_DATABASE_URL` | `postgresql://gr_org:<first password>@ep-xxx-pooler.<region>.aws.neon.tech/neondb?sslmode=require&schema=org&pgbouncer=true` |
| `ORG_DIRECT_DATABASE_URL` | `postgresql://gr_org:<first password>@ep-xxx.<region>.aws.neon.tech/neondb?sslmode=require&schema=org` |
| `PERSONAL_DATABASE_URL` | `postgresql://gr_personal:<second password>@ep-xxx-pooler.<region>.aws.neon.tech/neondb?sslmode=require&schema=personal&pgbouncer=true` |
| `PERSONAL_DIRECT_DATABASE_URL` | `postgresql://gr_personal:<second password>@ep-xxx.<region>.aws.neon.tech/neondb?sslmode=require&schema=personal` |

URL-encode any special characters in the passwords (or generate passwords with letters and digits only).

On Supabase, the pooled URL uses port `6543` with `pgbouncer=true` and the direct URL uses port `5432`.

## 4. Set up email

Magic link sign-in needs SMTP in production; the build refuses to deploy to production without it.

1. In your email provider, verify the domain you will send from and create SMTP credentials.
2. Build `SMTP_URL` as `smtps://<user>:<password>@<host>:465`. For example, Resend: `smtps://resend:<api key>@smtp.resend.com:465`.
3. Set `EMAIL_FROM` to an address on the verified domain, for example `Gap Reader <no-reply@yourdomain.org>`.

## 5. Create the Vercel project

1. In Vercel, choose **Add New → Project** and import the `Breaking-Point-Leadership-` repository.
2. Set **Root Directory** to `gap-reader`. Vercel detects Next.js. Leave the build and install commands alone: `gap-reader/vercel.json` sets them.
3. Before the first deploy, open **Environment Variables** and add the following for the **Production** environment:

| Variable | Value |
| --- | --- |
| `ORG_DATABASE_URL`, `ORG_DIRECT_DATABASE_URL`, `PERSONAL_DATABASE_URL`, `PERSONAL_DIRECT_DATABASE_URL` | From step 3 |
| `AUTH_SECRET` | `openssl rand -base64 33` |
| `APP_ENCRYPTION_KEY` | `openssl rand -base64 32` (exactly 32 bytes; keep a copy, since losing it means re-entering the organization's AI key) |
| `APP_URL` | The production URL, for example `https://gapreader.yourdomain.org` (or the `*.vercel.app` URL until you add a domain) |
| `SMTP_URL`, `EMAIL_FROM` | From step 4 |
| `BOOTSTRAP_PROGRAM_LEAD_EMAIL` | The work email of the first program lead |
| `IMPORT_API_TOKEN` | `openssl rand -hex 32`, only if you will use the import API |
| `OIDC_ISSUER`, `OIDC_CLIENT_ID`, `OIDC_CLIENT_SECRET`, `OIDC_NAME` | Optional single sign-on for the Organizational Gap Reader. Register the callback URL `<APP_URL>/api/auth/org/callback/oidc` with your identity provider. |

4. Deploy. The build (`scripts/vercel-build.sh`) checks the variables, applies both migrations on production builds, and builds the app.

If you add a custom domain later, update `APP_URL` to match and redeploy, so sign-in links and secure cookies use the right address.

## 6. Preview deployments

Preview builds never run migrations against your production database. Choose one:

* **Give previews their own database (recommended).** Create a Neon branch (or a second project), run `db/setup.sql` in it, set the four database variables plus `AUTH_SECRET`, `APP_ENCRYPTION_KEY` and `APP_URL` in the **Preview** environment, and set `MIGRATE_ON_BUILD=1` there. Without `SMTP_URL`, preview sign-in links are written to the Vercel function logs.
* **Or turn previews off** for this project in Vercel (Settings → Git → ignored build step), and test locally instead.

If previews have no database variables, their builds stop with a list of what is missing. That is intended.

## 7. First run

1. Open `<APP_URL>/org/signin` and sign in with `BOOTSTRAP_PROGRAM_LEAD_EMAIL`. That address becomes the first program lead.
2. In the program lead console: publish the Notice, set the reporting channels and (optionally) the organization's AI key in Settings, then import the directory so other people can sign in.
3. Open `<APP_URL>/personal/signin` with a personal email to check the Personal Gap Reader. It needs `https`, which Vercel provides.

## Checks after each deploy

* `<APP_URL>/notice` loads and shows the published Notice (or "not yet published").
* A sign-in email arrives within a minute.
* In Neon's SQL editor, as the owner: `SELECT has_schema_privilege('gr_org', 'personal', 'USAGE');` returns `false`.

## Where the data lives

| What | Where |
| --- | --- |
| Org records, findings, audit log | `org` schema, readable only by `gr_org` (and the database owner) |
| Personal records | `personal` schema, ciphertext only; no one, including the owner, can read the contents |
| Organization's AI key | `org` schema, encrypted with `APP_ENCRYPTION_KEY` |
| Personal AI keys and conversations | Encrypted in the user's browser; conversations go from the browser to the user's AI provider and never reach Vercel |

Restrict who holds the database owner credentials. Anyone with them can read the `org` schema directly (though not personal records).
