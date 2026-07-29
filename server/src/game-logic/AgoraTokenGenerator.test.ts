import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { generateAgoraToken } from "./AgoraTokenGenerator.js";

describe("generateAgoraToken", () => {
  const prevId = process.env.AGORA_APP_ID;
  const prevCert = process.env.AGORA_APP_CERTIFICATE;

  afterEach(() => {
    if (prevId === undefined) delete process.env.AGORA_APP_ID;
    else process.env.AGORA_APP_ID = prevId;
    if (prevCert === undefined) delete process.env.AGORA_APP_CERTIFICATE;
    else process.env.AGORA_APP_CERTIFICATE = prevCert;
  });

  it("returns placeholder when credentials missing", () => {
    delete process.env.AGORA_APP_ID;
    delete process.env.AGORA_APP_CERTIFICATE;

    const result = generateAgoraToken("ROOM01", 1, "publisher");
    expect(result.token).toContain("placeholder");
    expect(result.token).toContain("publisher");
    expect(result.token).toContain("ROOM01");
  });

  it("returns non-placeholder token when credentials present", () => {
    // 32-char hex-like stubs — agora builder accepts any non-empty strings
    process.env.AGORA_APP_ID = "a".repeat(32);
    process.env.AGORA_APP_CERTIFICATE = "b".repeat(32);

    const pub = generateAgoraToken("ROOM01", 1, "publisher");
    const sub = generateAgoraToken("ROOM01", 2, "subscriber");

    expect(pub.token).not.toContain("placeholder");
    expect(sub.token).not.toContain("placeholder");
    expect(pub.appId).toBe("a".repeat(32));
    expect(pub.token).not.toBe(sub.token);
  });
});
