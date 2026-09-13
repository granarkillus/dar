"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@supabase/supabase-js";

const getSupabase = () =>
  createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

const NAVY = "#1f4e79";
const DARK = "#1a1a2e";
const SOFT_BG = "#f4f6f9";
const WHITE = "#ffffff";
const MUTED = "#6b7280";
const BORDER = "#d1d5db";
const TEXT = "#1a1a2e";
const GREEN = "#2f6b3a";

interface ActivityEntry {
  from: string;
  to: string;
  activity: string;
}

interface DARRow {
  id: string;
  officer_name: string;
  date: string;
  scheduled_shift: string | null;
  shift_start: string | null;
  shift_end: string | null;
  activity_log: ActivityEntry[] | null;
  submitted_at: string;
}

export default function MyDARsPage() {
  const [name, setName] = useState("");
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [records, setRecords] = useState<DARRow[]>([]);
  const [error, setError] = useState("");

  // Formats the stored submitted_at into a plain readable stamp.
  const formatSubmitted = (iso: string) => {
    if (!iso) return "";
    const d = new Date(iso);
    if (isNaN(d.getTime())) return "";
    return d.toLocaleString("en-US", {
      month: "numeric", day: "numeric", year: "numeric",
      hour: "numeric", minute: "2-digit", hour12: true,
    });
  };

  const runSearch = useCallback(async (lookupName: string) => {
    const trimmed = lookupName.trim();
    if (!trimmed) return;

    setLoading(true);
    setError("");
    setSearched(true);

    const supabase = getSupabase();
    const { data, error: dbError } = await supabase
      .from("dar_submissions")
      .select("id, officer_name, date, scheduled_shift, shift_start, shift_end, activity_log, submitted_at")
      .ilike("officer_name", trimmed)
      .order("submitted_at", { ascending: false })
      .limit(10);

    if (dbError) {
      setError("Couldn't load your reports. Please try again.");
      setRecords([]);
      setLoading(false);
      return;
    }

    setRecords(data || []);
    setLoading(false);
  }, []);

  // If we arrived straight from a submission, the name comes in on the URL
  // so the officer immediately sees their own list without typing anything.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const n = params.get("name");
    if (n) {
      const decoded = decodeURIComponent(n);
      setName(decoded);
      runSearch(decoded);
    }
  }, [runSearch]);

  return (
    <div style={{ minHeight: "100vh", background: SOFT_BG, fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif", padding: "2rem 1rem" }}>
      <div style={{ maxWidth: 720, margin: "0 auto", background: WHITE, borderRadius: 4, boxShadow: "0 2px 16px rgba(31,78,121,0.10)", overflow: "hidden" }}>

        <div style={{ background: NAVY, padding: "1.25rem 2rem", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.75rem" }}>
          <div>
            <div style={{ color: WHITE, fontSize: "1rem", fontWeight: 800, letterSpacing: "0.06em", textTransform: "uppercase" }}>
              Allied<span style={{ fontWeight: 300 }}>Universal</span><sup style={{ fontSize: "0.5rem", fontWeight: 300, marginLeft: 1 }}>™</sup>
            </div>
            <div style={{ color: "rgba(255,255,255,0.6)", fontSize: "0.68rem", marginTop: 2 }}>Security Services</div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "1.25rem" }}>
            <a href="/" style={{ color: "rgba(255,255,255,0.7)", fontSize: "0.75rem", textDecoration: "none" }}>← Submit a DAR</a>
            <div style={{ textAlign: "right" }}>
              <div style={{ color: WHITE, fontSize: "0.95rem", fontWeight: 700 }}>My Recent DARs</div>
              <div style={{ color: "rgba(255,255,255,0.7)", fontSize: "0.75rem" }}>Check what you've submitted</div>
            </div>
          </div>
        </div>

        <div style={{ padding: "1.5rem 2rem" }}>

          <div style={{ fontSize: "0.85rem", color: MUTED, lineHeight: 1.5, marginBottom: "1rem" }}>
            Enter your name exactly as you write it on your DAR to see your last 10 submissions.
          </div>

          <div style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap", marginBottom: "1.25rem" }}>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") runSearch(name); }}
              placeholder="Your full name"
              style={{ flex: 1, minWidth: 200, boxSizing: "border-box", padding: "0.55rem 0.75rem", border: `1px solid ${BORDER}`, borderRadius: 4, fontSize: "0.92rem", color: TEXT, background: "#fafbfc", outline: "none", fontFamily: "inherit" }}
            />
            <button
              onClick={() => runSearch(name)}
              disabled={!name.trim() || loading}
              style={{ background: name.trim() && !loading ? NAVY : "#9ca3af", color: WHITE, border: "none", borderRadius: 4, padding: "0.55rem 1.5rem", fontSize: "0.85rem", fontWeight: 700, letterSpacing: "0.04em", cursor: name.trim() && !loading ? "pointer" : "not-allowed", fontFamily: "inherit", textTransform: "uppercase" }}
            >
              {loading ? "Looking..." : "Look Up"}
            </button>
          </div>

          {error && (
            <div style={{ background: "#fef2f2", border: "1px solid #fca5a5", borderRadius: 4, padding: "0.75rem 1rem", fontSize: "0.85rem", color: "#b91c1c", marginBottom: "1rem" }}>
              {error}
            </div>
          )}

          {searched && !loading && !error && records.length === 0 && (
            <div style={{ background: SOFT_BG, border: `1px solid ${BORDER}`, borderRadius: 4, padding: "1.5rem", textAlign: "center" }}>
              <div style={{ fontSize: "0.92rem", fontWeight: 700, color: TEXT, marginBottom: 6 }}>No reports found for that name</div>
              <div style={{ fontSize: "0.82rem", color: MUTED, lineHeight: 1.5 }}>
                Double-check the spelling — it has to match how you typed it on the DAR.
                If you still don't see it, let your supervisor know.
              </div>
            </div>
          )}

          {records.length > 0 && (
            <>
              <div style={{ fontSize: "0.75rem", fontWeight: 700, color: MUTED, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.6rem" }}>
                {records.length} most recent {records.length === 1 ? "report" : "reports"}
              </div>

              {records.map((r) => {
                const entries = (r.activity_log || []).filter((e) => e.activity && e.activity.trim());
                return (
                  <div key={r.id} style={{ border: `1px solid ${BORDER}`, borderLeft: `4px solid ${GREEN}`, borderRadius: 4, padding: "0.85rem 1.1rem", marginBottom: "0.7rem", background: WHITE }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap", gap: "0.5rem" }}>
                      <div style={{ fontSize: "0.95rem", fontWeight: 700, color: TEXT }}>{r.date}</div>
                      <div style={{ fontSize: "0.72rem", color: GREEN, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                        ✓ Received
                      </div>
                    </div>

                    <div style={{ fontSize: "0.78rem", color: MUTED, marginTop: 3 }}>
                      {[r.scheduled_shift, (r.shift_start || r.shift_end) ? `${r.shift_start || ""}${r.shift_end ? " – " + r.shift_end : ""}` : ""]
                        .filter(Boolean).join(" · ")}
                    </div>

                    <div style={{ fontSize: "0.75rem", color: MUTED, marginTop: 4 }}>
                      Submitted {formatSubmitted(r.submitted_at)}
                    </div>

                    {entries.length > 0 && (
                      <div style={{ fontSize: "0.78rem", color: MUTED, marginTop: 6, paddingTop: 6, borderTop: `1px solid ${BORDER}` }}>
                        {entries.length} activity {entries.length === 1 ? "entry" : "entries"}
                      </div>
                    )}
                  </div>
                );
              })}
            </>
          )}

          <div style={{ borderTop: `1px solid ${BORDER}`, marginTop: "1.5rem", paddingTop: "1rem", fontSize: "0.75rem", color: MUTED, textAlign: "center", lineHeight: 1.5 }}>
            This shows your last 10 submissions. If something looks wrong or missing, tell your supervisor.
          </div>

        </div>
      </div>
    </div>
  );
}
