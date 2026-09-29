"use client";

import { useEffect } from "react";

// This site moved into portal.xing.wtf/dar. Before redirecting, copy the
// phone's "My DARs" list into a cookie the new site can read, so officers
// keep seeing the DARs they already sent.
export default function MovedToPortal() {
  useEffect(() => {
    try {
      const ids = localStorage.getItem("my-dar-ids");
      if (ids) {
        document.cookie = `my-dar-ids=${encodeURIComponent(ids)}; path=/; max-age=31536000; samesite=lax; domain=.xing.wtf; secure`;
      }
    } catch { /* ignore */ }
    const path = window.location.pathname === "/" ? "" : window.location.pathname;
    window.location.replace(`https://portal.xing.wtf/dar${path}${window.location.search}`);
  }, []);

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "system-ui, sans-serif", color: "#5b6474", padding: "2rem", textAlign: "center" }}>
      <div>
        <div style={{ fontWeight: 700, color: "#0f172a", marginBottom: 6 }}>The DAR form has moved</div>
        <a href="https://portal.xing.wtf/dar" style={{ color: "#1a4480", fontWeight: 600 }}>Continue to portal.xing.wtf/dar</a>
      </div>
    </div>
  );
}
