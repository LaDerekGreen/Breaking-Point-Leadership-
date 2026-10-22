/**
 * Creates a fresh gapreader_test database with the same two schemas and two
 * roles as db/setup.sql, applies both migrations, and points the app's
 * connection strings at it.
 */
import { execSync } from "node:child_process";
import { PrismaClient } from "@/generated/org";

const ADMIN = process.env.DATABASE_ADMIN_URL ?? "postgresql://postgres@localhost:5432/postgres";
const DB = "gapreader_test";
const ORG_PW = process.env.GR_ORG_PASSWORD ?? "gr_org_dev_password";
const PERSONAL_PW = process.env.GR_PERSONAL_PASSWORD ?? "gr_personal_dev_password";

function withDb(url: string, db: string): string {
  const u = new URL(url);
  u.pathname = `/${db}`;
  return u.toString();
}

function asRole(role: string, pw: string, schema: string): string {
  const u = new URL(withDb(ADMIN, DB));
  u.username = role;
  u.password = pw;
  u.searchParams.set("schema", schema);
  return u.toString();
}

export const urls = {
  admin: withDb(ADMIN, DB),
  org: asRole("gr_org", ORG_PW, "org"),
  personal: asRole("gr_personal", PERSONAL_PW, "personal"),
  orgRoleOnPersonalSchema: asRole("gr_org", ORG_PW, "personal"),
};

export async function prepareTestDb(): Promise<void> {
  const server = new PrismaClient({ datasourceUrl: withDb(ADMIN, "postgres") });
  await server.$executeRawUnsafe(`DROP DATABASE IF EXISTS ${DB} WITH (FORCE)`);
  await server.$executeRawUnsafe(`CREATE DATABASE ${DB}`);
  await server.$disconnect();

  const admin = new PrismaClient({ datasourceUrl: urls.admin });
  const sql = [
    `DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'gr_org') THEN CREATE ROLE gr_org LOGIN; END IF; IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'gr_personal') THEN CREATE ROLE gr_personal LOGIN; END IF; END $$`,
    `ALTER ROLE gr_org PASSWORD '${ORG_PW}'`,
    `ALTER ROLE gr_personal PASSWORD '${PERSONAL_PW}'`,
    `REVOKE ALL ON SCHEMA public FROM PUBLIC`,
    `CREATE SCHEMA org AUTHORIZATION gr_org`,
    `CREATE SCHEMA personal AUTHORIZATION gr_personal`,
    `REVOKE ALL ON SCHEMA org FROM PUBLIC`,
    `REVOKE ALL ON SCHEMA personal FROM PUBLIC`,
  ];
  for (const s of sql) await admin.$executeRawUnsafe(s);
  await admin.$disconnect();

  for (const [schema, url, prefix] of [["org", urls.org, "ORG"], ["personal", urls.personal, "PERSONAL"]] as const) {
    execSync(`npx prisma migrate deploy --schema prisma/${schema}/schema.prisma`, {
      env: { ...process.env, [`${prefix}_DATABASE_URL`]: url, [`${prefix}_DIRECT_DATABASE_URL`]: url },
      stdio: "pipe",
    });
  }
  process.env.ORG_DATABASE_URL = urls.org;
  process.env.PERSONAL_DATABASE_URL = urls.personal;
  process.env.APP_ENCRYPTION_KEY ??= Buffer.alloc(32, 7).toString("base64");
}
