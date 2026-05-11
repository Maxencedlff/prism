import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { referrer } = await req.json().catch(() => ({ referrer: "" }));

  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    req.headers.get("x-real-ip") ||
    "IP inconnue";

  const ua = req.headers.get("user-agent") || "";

  const browser = ua.includes("Edg/")
    ? "Edge"
    : ua.includes("Chrome/")
    ? "Chrome"
    : ua.includes("Firefox/")
    ? "Firefox"
    : ua.includes("Safari/")
    ? "Safari"
    : ua.slice(0, 30);

  const os = ua.includes("Windows")
    ? "Windows"
    : ua.includes("Mac")
    ? "Mac"
    : ua.includes("iPhone") || ua.includes("iPad")
    ? "iOS"
    : ua.includes("Android")
    ? "Android"
    : "Autre";

  return NextResponse.json({
    ok: true,
    ip,
    browser,
    os,
    referrer: referrer || "direct",
  });
}
