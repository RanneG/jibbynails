import { NextResponse } from "next/server";

const BIND_ANY = "0.0.0.0";
const LOOPBACK = "127.0.0.1";

function firstHeader(request: Request, name: string) {
  const raw = request.headers.get(name);
  if (!raw) return "";
  return raw.split(",")[0]?.trim() ?? "";
}

function clientHost(request: Request) {
  const forwarded = firstHeader(request, "x-forwarded-host");
  const host = forwarded || request.headers.get("host") || "";
  if (host) {
    return host.replace(/^0\.0\.0\.0(?=:|$)/, LOOPBACK);
  }
  const fallback = new URL(request.url);
  if (fallback.hostname === BIND_ANY) {
    fallback.hostname = LOOPBACK;
  }
  return fallback.host;
}

function clientOrigin(request: Request) {
  const proto =
    firstHeader(request, "x-forwarded-proto") ||
    new URL(request.url).protocol.replace(/:$/, "") ||
    "http";
  return `${proto}://${clientHost(request)}`;
}

/** Browser redirect that never uses the 0.0.0.0 bind address from request.url. */
export function redirectTo(request: Request, path: string, status = 303) {
  return NextResponse.redirect(new URL(path, clientOrigin(request)), status);
}
