/**
 * Integration test: a personal record cannot be queried from an org context.
 * Runs against a real Postgres (see README, "Running the tests").
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient as OrgClient } from "@/generated/org";
import { PrismaClient as PersonalClient } from "@/generated/personal";
import { deriveKey, encryptJSON, makeVerifier, randomSalt, recordAad } from "@/lib/personal/crypto";
import { prepareTestDb, urls } from "./testDb";

let org: OrgClient;
let personal: PersonalClient;
let admin: OrgClient;
const SECRET = "I moved the newest analyst off the account because I was afraid of my boss";

beforeAll(async () => {
  await prepareTestDb();
  org = new OrgClient({ datasourceUrl: urls.org });
  personal = new PersonalClient({ datasourceUrl: urls.personal });
  admin = new OrgClient({ datasourceUrl: urls.admin });

  const user = await personal.user.create({ data: { email: "same.person@example.org" } });
  const key = await deriveKey("a long personal passphrase", randomSalt(), 1000);
  await personal.vault.create({ data: { userId: user.id, salt: randomSalt(), iterations: 600000, ...(await makeVerifier(key).then((v) => ({ verifierIv: v.iv, verifierCiphertext: v.ciphertext }))) } });
  const sealed = await encryptJSON(key, { decision: SECRET }, recordAad("rec-0001-test", "log"));
  await personal.record.create({ data: { id: "rec-0001-test", userId: user.id, kind: "log", ...sealed } });
});

afterAll(async () => {
  await Promise.all([org?.$disconnect(), personal?.$disconnect(), admin?.$disconnect()]);
});

describe("a personal record cannot be queried from an org context", () => {
  it("the org client has no personal models at all", () => {
    const o = org as unknown as Record<string, unknown>;
    expect(o.record).toBeUndefined();
    expect(o.vault).toBeUndefined();
  });

  it("the org role is refused the personal schema, by qualified name", async () => {
    await expect(org.$queryRawUnsafe(`SELECT * FROM personal."Record"`)).rejects.toThrow(/permission denied/i);
    await expect(org.$queryRawUnsafe(`SELECT * FROM personal."User"`)).rejects.toThrow(/permission denied/i);
    await expect(org.$queryRawUnsafe(`SELECT * FROM personal."Vault"`)).rejects.toThrow(/permission denied/i);
  });

  it("the org role is refused the personal schema, through the search path", async () => {
    await expect(
      org.$transaction(async (tx) => {
        await tx.$executeRawUnsafe(`SET LOCAL search_path TO personal`);
        return tx.$queryRawUnsafe(`SELECT * FROM "Record"`);
      }),
    ).rejects.toThrow(/permission denied|does not exist/i);
  });

  it("the org credentials pointed at the personal schema cannot read it", async () => {
    const misdirected = new OrgClient({ datasourceUrl: urls.orgRoleOnPersonalSchema });
    await expect(misdirected.user.findMany()).rejects.toThrow();
    await expect(misdirected.$queryRawUnsafe(`SELECT ciphertext FROM "Record"`)).rejects.toThrow(/permission denied|does not exist/i);
    await misdirected.$disconnect();
  });

  it("the org role cannot discover personal tables in the catalog with data access", async () => {
    const rows = await org.$queryRawUnsafe<{ has: boolean }[]>(`SELECT has_schema_privilege('gr_org', 'personal', 'USAGE') AS has`);
    expect(rows[0].has).toBe(false);
  });

  it("the personal role is refused the org schema", async () => {
    await expect(personal.$queryRawUnsafe(`SELECT * FROM org."Finding"`)).rejects.toThrow(/permission denied/i);
    await expect(personal.$queryRawUnsafe(`SELECT * FROM org."User"`)).rejects.toThrow(/permission denied/i);
  });

  it("an org session token means nothing to the personal product", async () => {
    const u = await org.user.create({ data: { email: "same.person@example.org", roles: ["program_lead"] } });
    const s = await org.session.create({ data: { sessionToken: "org-token-abc", userId: u.id, expires: new Date(Date.now() + 3600_000) } });
    expect(await personal.session.findUnique({ where: { sessionToken: s.sessionToken } })).toBeNull();
    const pu = await personal.user.findUniqueOrThrow({ where: { email: "same.person@example.org" } });
    expect(pu.id).not.toBe(u.id); // same email, unrelated identities, no shared user ID
  });

  it("even a superuser reading the table sees only ciphertext", async () => {
    const rows = await admin.$queryRawUnsafe<{ ciphertext: string; iv: string }[]>(`SELECT ciphertext, iv FROM personal."Record"`);
    expect(rows).toHaveLength(1);
    const decoded = Buffer.from(rows[0].ciphertext, "base64").toString("latin1");
    expect(decoded).not.toContain("analyst");
    expect(rows[0].ciphertext).not.toContain("analyst");
  });

  it("there are no foreign keys or views across the two schemas", async () => {
    const fks = await admin.$queryRawUnsafe<{ n: bigint }[]>(`
      SELECT count(*) AS n FROM information_schema.referential_constraints rc
      JOIN information_schema.table_constraints a ON a.constraint_name = rc.constraint_name AND a.constraint_schema = rc.constraint_schema
      JOIN information_schema.table_constraints b ON b.constraint_name = rc.unique_constraint_name AND b.constraint_schema = rc.unique_constraint_schema
      WHERE a.table_schema <> b.table_schema`);
    expect(Number(fks[0].n)).toBe(0);
    const views = await admin.$queryRawUnsafe<{ n: bigint }[]>(`SELECT count(*) AS n FROM pg_views WHERE schemaname IN ('org','personal')`);
    expect(Number(views[0].n)).toBe(0);
  });
});
