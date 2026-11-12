const LOOPBACK = new Set(["localhost", "127.0.0.1", "[::1]"]);

/**
 * True only for requests addressed to this machine by a loopback name, and (when the
 * browser names an origin) coming from that same host. Blocks DNS-rebinding pages.
 */
export function isLocalRequest(request: Request): boolean {
  const host = request.headers.get("host") ?? "";
  if (!LOOPBACK.has(host.replace(/:\d+$/, ""))) return false;
  const origin = request.headers.get("origin");
  return !origin || URL.parse(origin)?.host === host;
}
