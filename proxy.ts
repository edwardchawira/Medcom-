import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

function isPublicPath(pathname: string) {
  if (pathname === "/welcome") return true;
  if (pathname === "/course-detail") return true;
  if (pathname === "/courses") return true;
  if (pathname === "/courses/") return true;
  if (pathname.startsWith("/courses/") && pathname.endsWith("/overview")) return true;
  if (pathname.startsWith("/courses/") && pathname.includes("/learn/")) return true;
  if (pathname.startsWith("/courses/community/") && pathname.includes("/learn/")) return true;
  if (pathname.startsWith("/api/auth/")) return true;
  // Never redirect API routes (return proper HTTP status codes instead).
  if (pathname.startsWith("/api/")) return true;
  if (pathname.startsWith("/_next/")) return true;
  if (pathname === "/favicon.ico") return true;
  if (pathname.startsWith("/docs/")) return true;
  if (pathname.startsWith("/images/")) return true;
  return false;
}

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (isPublicPath(pathname)) return NextResponse.next({ request: { headers: req.headers } });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    const to = req.nextUrl.clone();
    to.pathname = "/welcome";
    return NextResponse.redirect(to);
  }

  let res = NextResponse.next({
    request: { headers: req.headers },
  });

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll: () => req.cookies.getAll(),
      setAll: (cookiesToSet) => {
        // In proxy, write cookies on the *response* only.
        // Mutating req.cookies can break session persistence across refreshes.
        res = NextResponse.next({ request: { headers: req.headers } });
        cookiesToSet.forEach(({ name, value, options }) => res.cookies.set(name, value, options));
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) return res;

  const to = req.nextUrl.clone();
  to.pathname = "/welcome";
  return NextResponse.redirect(to);
}

export const config = {
  matcher: ["/((?!.*\\..*).*)"],
};
