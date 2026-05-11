import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { referrer } = await req.json().catch(() => ({ referrer: "" }));

  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    req.headers.get("x-real-ip") ||
    "IP inconnue";

  const ua = req.headers.get("user-agent") || "UA inconnu";

  const browser = ua.match(/Chrome\/|Firefox\/|Safari\/|Edge\//)
    ? ua.match(/(Chrome|Firefox|Safari|Edge)\/[\d.]+/)?.[0] ?? ua.slice(0, 40)
    : ua.slice(0, 40);

  const os = ua.includes("Windows")
    ? "Windows"
    : ua.includes("Mac")
    ? "Mac"
    : ua.includes("iPhone") || ua.includes("iPad")
    ? "iOS"
    : ua.includes("Android")
    ? "Android"
    : "Autre";

  const lines = [
    referrer ? `Référent : ${referrer}` : "Référent : direct / copié-collé",
    `IP : ${ip}`,
    `Navigateur : ${browser} · ${os}`,
  ];

  await fetch("https://ntfy.sh/prism-visite-maxence2026", {
    method: "POST",
    body: lines.join("\n"),
    headers: { Title: "Prism — nouveau visiteur" },
  });

  return NextResponse.json({ ok: true });
}
