-- Gap Reader database setup.
--
-- Two products, two schemas, two roles. The org role cannot read the personal
-- schema and the personal role cannot read the org schema. There are no
-- foreign keys, views, or joins across them. Run this once as a superuser:
--
--   psql "$DATABASE_ADMIN_URL" -v org_password="'...'" -v personal_password="'...'" -f db/setup.sql
--
-- To use two separate databases instead, run the org half in one database and
-- the personal half in the other. The application does not care which.

\if :{?org_password}
\else
  \set org_password '''gr_org_dev_password'''
\endif
\if :{?personal_password}
\else
  \set personal_password '''gr_personal_dev_password'''
\endif

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'gr_org') THEN
    CREATE ROLE gr_org LOGIN;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'gr_personal') THEN
    CREATE ROLE gr_personal LOGIN;
  END IF;
END $$;

ALTER ROLE gr_org PASSWORD :org_password;
ALTER ROLE gr_personal PASSWORD :personal_password;

-- Nobody gets anything by default.
REVOKE ALL ON SCHEMA public FROM PUBLIC;

CREATE SCHEMA IF NOT EXISTS org AUTHORIZATION gr_org;
CREATE SCHEMA IF NOT EXISTS personal AUTHORIZATION gr_personal;

REVOKE ALL ON SCHEMA org FROM PUBLIC;
REVOKE ALL ON SCHEMA personal FROM PUBLIC;

-- Belt and braces: each role is explicitly denied the other's schema.
REVOKE ALL ON SCHEMA personal FROM gr_org;
REVOKE ALL ON ALL TABLES IN SCHEMA personal FROM gr_org;
REVOKE ALL ON SCHEMA org FROM gr_personal;
REVOKE ALL ON ALL TABLES IN SCHEMA org FROM gr_personal;

-- Each role's search path is its own schema only.
ALTER ROLE gr_org SET search_path = org;
ALTER ROLE gr_personal SET search_path = personal;
