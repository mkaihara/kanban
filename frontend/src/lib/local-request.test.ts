import { describe, expect, it } from "vitest";
import { isLocalRequest } from "./local-request";

function request(headers: Record<string, string>) {
  return new Request("http://localhost/api/workspace", { headers });
}

describe("isLocalRequest", () => {
  it.each(["localhost:3210", "127.0.0.1:3210", "[::1]:3210", "localhost"])("accepts host %s", (host) => {
    expect(isLocalRequest(request({ host }))).toBe(true);
  });

  it("accepts a same-origin browser request", () => {
    expect(isLocalRequest(request({ host: "localhost:3210", origin: "http://localhost:3210" }))).toBe(true);
  });

  it("rejects a DNS-rebinding host", () => {
    expect(isLocalRequest(request({ host: "evil.example:3210" }))).toBe(false);
  });

  it("rejects a cross-origin request", () => {
    expect(isLocalRequest(request({ host: "localhost:3210", origin: "https://evil.example" }))).toBe(false);
  });

  it("rejects a null origin", () => {
    expect(isLocalRequest(request({ host: "localhost:3210", origin: "null" }))).toBe(false);
  });
});
