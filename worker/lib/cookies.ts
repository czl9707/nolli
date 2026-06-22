import { parse, serialize } from "cookie"

type SameSite = "Lax" | "Strict" | "None"

type CookieOpts = {
  maxAge: number
  httpOnly?: boolean
  secure?: boolean
  sameSite?: SameSite
  path?: string
}

export function getCookie(request: Request, name: string): string | undefined {
  const header = request.headers.get("cookie") ?? ""
  // parse() decodes values via decodeURIComponent (wrapped in try/catch),
  // falling back to the raw value on decode failure.
  return parse(header)[name]
}

export function setCookie(
  name: string,
  value: string,
  opts: CookieOpts
): string {
  return serialize(name, value, {
    maxAge: opts.maxAge,
    path: opts.path ?? "/",
    httpOnly: opts.httpOnly ?? true,
    secure: opts.secure ?? true,
    sameSite: (opts.sameSite ?? "Lax").toLowerCase() as
      | "lax"
      | "strict"
      | "none",
  })
}

export function clearCookie(name: string): string {
  return serialize(name, "", {
    maxAge: 0,
    path: "/",
    httpOnly: true,
    secure: true,
    sameSite: "lax",
  })
}

// Append multiple Set-Cookie values onto a Response's headers.
export function appendSetCookie(headers: Headers, cookie: string): void {
  headers.append("set-cookie", cookie)
}
