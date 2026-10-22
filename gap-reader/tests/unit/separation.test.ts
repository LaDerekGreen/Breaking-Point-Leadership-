/**
 * The first rule of the system: the two products never share data.
 * These checks run without a database. The integration test proves the
 * same thing against Postgres.
 */
import { describe, expect, it } from "vitest";
import * as fs from "node:fs";
import * as path from "node:path";

const root = path.resolve(__dirname, "../..");
const read = (p: string) => fs.readFileSync(path.join(root, p), "utf8");

function files(dir: string): string[] {
  const abs = path.join(root, dir);
  if (!fs.existsSync(abs)) return [];
  const out: string[] = [];
  for (const e of fs.readdirSync(abs, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...files(p));
    else if (/\.(ts|tsx)$/.test(e.name)) out.push(p);
  }
  return out;
}

const ORG = [...files("lib/org"), ...files("app/org"), ...files("app/api/org"), ...files("app/api/auth/org"), "components/NoticeFooter.tsx", "components/OrgNav.tsx"];
const PERSONAL = [...files("lib/personal"), ...files("app/personal"), ...files("app/api/personal"), ...files("app/api/auth/personal"), ...files("components/personal")];

describe("schema separation", () => {
  it("two schemas, two connection strings, two generated clients", () => {
    const org = read("prisma/org/schema.prisma");
    const personal = read("prisma/personal/schema.prisma");
    expect(org).toMatch(/env\("ORG_DATABASE_URL"\)/);
    expect(org).not.toMatch(/PERSONAL_DATABASE_URL/);
    expect(personal).toMatch(/env\("PERSONAL_DATABASE_URL"\)/);
    expect(personal).not.toMatch(/ORG_DATABASE_URL/);
    expect(org).toMatch(/output\s*=\s*"\.\.\/\.\.\/generated\/org"/);
    expect(personal).toMatch(/output\s*=\s*"\.\.\/\.\.\/generated\/personal"/);
    // No multi-schema tricks that could join across.
    for (const s of [org, personal]) expect(s).not.toMatch(/multiSchema|schemas\s*=|@@schema/);
  });

  it("the org schema has no personal model, and the personal schema has no org model", () => {
    const models = (s: string) => [...s.matchAll(/^model\s+(\w+)/gm)].map((m) => m[1]);
    const org = models(read("prisma/org/schema.prisma"));
    const personal = models(read("prisma/personal/schema.prisma"));
    for (const m of ["Vault", "Record"]) expect(org).not.toContain(m);
    for (const m of ["Finding", "SurveyResponse", "Person", "Notice", "AuditLog", "Complaint"]) expect(personal).not.toContain(m);
  });

  it("no org code imports personal code or the personal client", () => {
    for (const f of ORG) expect(read(f), f).not.toMatch(/from\s+["'](@\/lib\/personal|@\/components\/personal|@\/generated\/personal|[./]+.*personal)/);
  });

  it("no personal code imports org code or the org client", () => {
    for (const f of PERSONAL) expect(read(f), f).not.toMatch(/from\s+["'](@\/lib\/org|@\/components\/(NoticeFooter|OrgNav)|@\/generated\/org|[./]+.*\/org\/)/);
  });

  it("the personal server routes store ciphertext only", () => {
    const routes = files("app/api/personal").map(read).join("\n");
    expect(routes).not.toMatch(/decrypt|deriveKey|passphrase\s*:/);
    const schema = read("prisma/personal/schema.prisma");
    const recordModel = schema.slice(schema.indexOf("model Record"));
    expect(recordModel).toMatch(/ciphertext\s+String/);
    expect(recordModel).not.toMatch(/\b(text|content|body|plaintext)\s+String/);
  });

  it("there is no analytics pipeline that could read personal data", () => {
    const pkg = JSON.parse(read("package.json"));
    const deps = Object.keys({ ...pkg.dependencies, ...pkg.devDependencies });
    for (const d of deps) expect(d).not.toMatch(/analytics|segment|mixpanel|posthog|amplitude|sentry|datadog|hotjar|fullstory/i);
  });

  it("the survey response table holds no link to a person and no timestamp", () => {
    const s = read("prisma/org/schema.prisma");
    const model = s.slice(s.indexOf("model SurveyResponse"), s.indexOf("}", s.indexOf("model SurveyResponse")));
    expect(model).not.toMatch(/userId|personId|email|createdAt|updatedAt|DateTime/);
  });

  it("the availability flag stores no reason, mood, health or state", () => {
    const s = read("prisma/org/schema.prisma");
    const model = s.slice(s.indexOf("model AvailabilityFlag"), s.indexOf("}", s.indexOf("model AvailabilityFlag")));
    const fields = [...model.matchAll(/^\s+(\w+)\s+\w/gm)].map((m) => m[1]);
    expect(fields.sort()).toEqual(["createdAt", "id", "leaderPersonId", "userId", "waitUntil"]);
  });

  it("no monitoring integrations are present", () => {
    const all = [...files("lib"), ...files("app")].map(read).join("\n");
    expect(all).not.toMatch(/sentiment\(|geolocation\.|navigator\.mediaDevices|googleapis\.com\/calendar|graph\.microsoft\.com|slack\.com\/api|gmail\.googleapis/i);
  });
});
