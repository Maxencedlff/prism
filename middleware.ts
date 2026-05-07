import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  if (request.nextUrl.pathname === "/") {
    const ref = request.headers.get("referer") ?? "";
    fetch("https://ntfy.sh/prism-visite-maxence2026", {
      method: "POST",
      body: "Visite sur Prism" + (ref ? ` (depuis ${ref})` : ""),
      headers: { Title: "Prism — nouveau visiteur" },
    }).catch(() => {});
  }
  return NextResponse.next();
}

export const config = {
  matcher: "/",
};
