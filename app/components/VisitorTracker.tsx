"use client";

import { useEffect } from "react";

export default function VisitorTracker() {
  useEffect(() => {
    const ref = document.referrer ? ` (depuis ${document.referrer})` : "";
    fetch("https://ntfy.sh/prism-visite-maxence2026", {
      method: "POST",
      body: `Visite sur Prism${ref}`,
      headers: { Title: "Prism — nouveau visiteur" },
    }).catch(() => {});
  }, []);

  return null;
}
