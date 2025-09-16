// middleware.ts
import { NextResponse, type NextRequest } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase/server"

const PUBLIC = new Set([
  "/",
  "/login",
  "/auth/callback",
  "/auth/update-password",
  "/api/auth/login",
  "/api/auth/logout",
  "/api/auth/me",
  "/favicon.ico",
])

function isPublic(pathname: string) {
  if (PUBLIC.has(pathname)) return true
  if (pathname.startsWith("/_next/")) return true
  if (pathname.startsWith("/assets/")) return true
  if (pathname.match(/\.(?:png|jpg|jpeg|gif|svg|ico|webp|css|js|txt|map)$/)) return true
  return false
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  if (isPublic(pathname)) return NextResponse.next()

  const res = NextResponse.next()
  const supabase = createSupabaseServerClient(req, res)
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    const url = new URL("/login", req.url)
    url.searchParams.set("redirectedFrom", pathname)
    return NextResponse.redirect(url)
  }
  return res
}

export const config = { matcher: ["/((?!_next|.*\..*).*)"] }
