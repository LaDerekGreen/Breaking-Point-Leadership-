import { describe, expect, it } from "vitest";
import { checkVerifier, decryptJSON, deriveKey, encryptJSON, makeVerifier, randomSalt, recordAad } from "@/lib/personal/crypto";
import { indicatesCrisis } from "@/lib/personal/crisis";
import { likelyNames, nameWarning, stripEmails } from "@/lib/personal/sanitize";

describe("personal encryption", () => {
  it("round-trips under the passphrase key and fails under any other", async () => {
    const salt = randomSalt();
    const key = await deriveKey("a long personal passphrase", salt, 1000);
    const sealed = await encryptJSON(key, { decision: "Moved the night shift review" }, recordAad("r1", "log"));
    expect(sealed.ciphertext).not.toContain("night");
    expect(await decryptJSON(key, sealed, recordAad("r1", "log"))).toEqual({ decision: "Moved the night shift review" });
    const other = await deriveKey("a different passphrase!", salt, 1000);
    await expect(decryptJSON(other, sealed, recordAad("r1", "log"))).rejects.toThrow();
  });

  it("binds a record to its ID and kind", async () => {
    const key = await deriveKey("a long personal passphrase", randomSalt(), 1000);
    const sealed = await encryptJSON(key, { x: 1 }, recordAad("r1", "log"));
    await expect(decryptJSON(key, sealed, recordAad("r2", "log"))).rejects.toThrow();
    await expect(decryptJSON(key, sealed, recordAad("r1", "plan"))).rejects.toThrow();
  });

  it("the key cannot be exported", async () => {
    const key = await deriveKey("a long personal passphrase", randomSalt(), 1000);
    expect(key.extractable).toBe(false);
    await expect(crypto.subtle.exportKey("raw", key)).rejects.toThrow();
  });

  it("the verifier checks a passphrase", async () => {
    const salt = randomSalt();
    const key = await deriveKey("a long personal passphrase", salt, 1000);
    const v = await makeVerifier(key);
    expect(await checkVerifier(key, v)).toBe(true);
    expect(await checkVerifier(await deriveKey("wrong passphrase here", salt, 1000), v)).toBe(false);
  });
});

describe("crisis check", () => {
  it.each(["I want to die", "sometimes I think about killing myself", "I have been self-harming", "I can't go on like this", "I'm not safe at home"])("flags: %s", (t) => {
    expect(indicatesCrisis(t)).toBe(true);
  });
  it("does not flag ordinary reflection", () => {
    expect(indicatesCrisis("My first boss shouted when the numbers were late, and I froze.")).toBe(false);
  });
});

describe("input hygiene", () => {
  it("strips email addresses", () => {
    expect(stripEmails("Told jordan.k@corp.example about it")).toBe("Told [email removed] about it");
  });
  it("warns on likely names but not on roles", () => {
    expect(likelyNames("I moved Priya off the account. My boss agreed.")).toEqual(["Priya"]);
    expect(likelyNames("I asked Dr. Okafor for advice")).toContain("Dr. Okafor");
    expect(nameWarning("I moved my newest analyst off the account on Monday.")).toBeNull();
  });
});
