"use client";

import { useState } from "react";
import { createClient } from "@supabase/supabase-js";

const NAVY = "#1f4e79";
const DARK = "#1a1a2e";
const SOFT_BG = "#f4f6f9";
const WHITE = "#ffffff";
const MUTED = "#6b7280";
const BORDER = "#d1d5db";
const TEXT = "#1a1a2e";
const GREEN = "#2f6b3a";

const getSupabase = () =>
  createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

interface DARRecord {
  id: string;
  officer_name: string;
  client_site: string;
  branch: string;
  date: string;
  shift_start: string;
  shift_end: string;
  meal_break_out: string;
  meal_break_in: string;
  rest_break_1_out: string;
  rest_break_1_in: string;
  rest_break_2_out: string;
  rest_break_2_in: string;
  on_duty_meal: boolean;
  received_radio: boolean;
  received_pager: boolean;
  received_keys: boolean;
  received_detex: boolean;
  received_other: string;
  activity_log: { from: string; to: string; activity: string }[];
  missed_rest_break: boolean;
  missed_meal_period: boolean;
  missed_explanation: string;
  signature: string;
  submitted_at: string;
}

export default function DARReport() {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [officerFilter, setOfficerFilter] = useState("");
  const [records, setRecords] = useState<DARRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState("");

  const handleSearch = async () => {
    if (!startDate || !endDate) return;
    setLoading(true);
    setError("");
    setSearched(false);

    const supabase = getSupabase();
    let query = supabase
      .from("dar_submissions")
      .select("*")
      .gte("date", startDate)
      .lte("date", endDate)
      .order("date", { ascending: true })
      .order("officer_name", { ascending: true });

    if (officerFilter.trim()) {
      query = query.ilike("officer_name", `%${officerFilter.trim()}%`);
    }

    const { data, error: dbError } = await query;

    if (dbError) {
      setError("Failed to load records. Please try again.");
      setLoading(false);
      return;
    }

    setRecords(data || []);
    setSearched(true);
    setLoading(false);
  };

  const formatDate = (iso: string) => {
    if (!iso) return "";
    const [y, m, d] = iso.split("-");
    return `${m}/${d}/${y}`;
  };

  const formatDisplayDate = (iso: string) => {
    if (!iso) return "";
    return new Date(iso + "T12:00:00").toLocaleDateString("en-US", {
      weekday: "long", year: "numeric", month: "long", day: "numeric",
    });
  };

  const groupByOfficer = () => {
    const groups: Record<string, DARRecord[]> = {};
    records.forEach((r) => {
      if (!groups[r.officer_name]) groups[r.officer_name] = [];
      groups[r.officer_name].push(r);
    });
    return groups;
  };

  const generatePDF = () => {
    const groups = groupByOfficer();
    const totalSubmissions = records.length;
    const totalOfficers = Object.keys(groups).length;
    const incidents = records.filter((r) => r.activity_log?.some((e) => e.activity?.includes("*"))).length;

    const officerSections = Object.entries(groups).map(([officer, dars]) => {
      const darRows = dars.map((dar) => {
        const items = [];
        if (dar.received_radio) items.push("Radio");
        if (dar.received_pager) items.push("Pager");
        if (dar.received_keys) items.push("Keys");
        if (dar.received_detex) items.push("Detex");
        if (dar.received_other) items.push(dar.received_other);

        const activityRows = (dar.activity_log || []).filter((e) => e.activity?.trim()).map((e) =>
          `<tr><td style="padding:3px 6px;border:1px solid #d1d5db;font-size:8.5pt;white-space:nowrap;">${e.from || ""}</td><td style="padding:3px 6px;border:1px solid #d1d5db;font-size:8.5pt;white-space:nowrap;">${e.to || ""}</td><td style="padding:3px 6px;border:1px solid #d1d5db;font-size:8.5pt;">${e.activity || ""}</td></tr>`
        ).join("");

        return `<div style="margin-bottom:16px;border:1px solid #d1d5db;border-radius:3px;overflow:hidden;">
          <div style="background:#f4f6f9;padding:6px 12px;display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid #d1d5db;">
            <span style="font-size:9pt;font-weight:700;color:#1a1a2e;">${formatDisplayDate(dar.date)}</span>
            <span style="font-size:8pt;color:#6b7280;">${dar.shift_start || ""} – ${dar.shift_end || ""}</span>
          </div>
          <div style="padding:8px 12px;">
            <div style="display:flex;gap:24px;margin-bottom:6px;flex-wrap:wrap;">
              <div style="font-size:8pt;"><span style="font-weight:700;text-transform:uppercase;letter-spacing:0.04em;color:#6b7280;">Received:</span> ${items.length ? items.join(", ") : "—"}</div>
              <div style="font-size:8pt;"><span style="font-weight:700;text-transform:uppercase;letter-spacing:0.04em;color:#6b7280;">Meal Break:</span> ${dar.meal_break_out ? `${dar.meal_break_out} – ${dar.meal_break_in}` : "—"}</div>
              ${dar.missed_rest_break || dar.missed_meal_period ? `<div style="font-size:8pt;color:#b91c1c;font-weight:600;">⚠ ${[dar.missed_rest_break ? "Missed rest break" : "", dar.missed_meal_period ? "Missed meal period" : ""].filter(Boolean).join(", ")}</div>` : ""}
            </div>
            ${activityRows ? `<table style="width:100%;border-collapse:collapse;margin-top:6px;"><thead><tr style="background:#1a1a2e;"><th style="padding:4px 6px;border:1px solid #d1d5db;font-size:7.5pt;color:#fff;text-align:left;white-space:nowrap;">From</th><th style="padding:4px 6px;border:1px solid #d1d5db;font-size:7.5pt;color:#fff;text-align:left;white-space:nowrap;">To</th><th style="padding:4px 6px;border:1px solid #d1d5db;font-size:7.5pt;color:#fff;text-align:left;">Activity / Report</th></tr></thead><tbody>${activityRows}</tbody></table>` : '<p style="font-size:8pt;color:#6b7280;font-style:italic;margin-top:4px;">No activity entries recorded.</p>'}
            <div style="margin-top:6px;font-size:8pt;color:#374151;border-top:1px solid #f0f0f0;padding-top:4px;"><span style="font-weight:700;">Signed:</span> ${dar.signature}</div>
          </div>
        </div>`;
      }).join("");

      return `<div style="margin-bottom:24px;">
        <div style="background:#1f4e79;padding:8px 16px;border-radius:3px 3px 0 0;">
          <span style="color:#fff;font-size:11pt;font-weight:700;">${officer}</span>
          <span style="color:rgba(255,255,255,0.7);font-size:8.5pt;margin-left:12px;">${dars.length} submission${dars.length !== 1 ? "s" : ""}</span>
        </div>
        <div style="border:1px solid #1f4e79;border-top:none;border-radius:0 0 3px 3px;padding:12px;">${darRows}</div>
      </div>`;
    }).join("");

    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"/><title>DAR Report – ${formatDate(startDate)} to ${formatDate(endDate)}</title><style>@page{size:letter;margin:0.5in;}*{box-sizing:border-box;margin:0;padding:0;}body{font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;background:#fff;color:#1a1a2e;font-size:10pt;}</style></head><body>
      <div style="background:#1f4e79;padding:14px 20px;display:flex;justify-content:space-between;align-items:center;margin-bottom:0;">
        <div><div style="color:#fff;font-size:13pt;font-weight:800;letter-spacing:0.06em;text-transform:uppercase;">Allied<span style="font-weight:300;">Universal</span><sup style="font-size:6pt;font-weight:300;">™</sup></div><div style="color:rgba(255,255,255,0.6);font-size:7.5pt;margin-top:1px;">Security Services</div></div>
        <div style="text-align:right;"><div style="color:#fff;font-size:12pt;font-weight:700;">Daily Activity Report — Compiled</div><div style="color:rgba(255,255,255,0.75);font-size:8.5pt;">Washington University · Saint Louis</div></div>
      </div>
      <div style="background:#f4f6f9;border:1px solid #d1d5db;border-top:none;padding:8px 20px;display:flex;gap:32px;margin-bottom:20px;">
        <div style="font-size:8.5pt;"><span style="font-weight:700;text-transform:uppercase;letter-spacing:0.04em;color:#6b7280;">Period:</span> ${formatDate(startDate)} – ${formatDate(endDate)}</div>
        <div style="font-size:8.5pt;"><span style="font-weight:700;text-transform:uppercase;letter-spacing:0.04em;color:#6b7280;">Total Submissions:</span> ${totalSubmissions}</div>
        <div style="font-size:8.5pt;"><span style="font-weight:700;text-transform:uppercase;letter-spacing:0.04em;color:#6b7280;">Officers Reporting:</span> ${totalOfficers}</div>
        <div style="font-size:8.5pt;"><span style="font-weight:700;text-transform:uppercase;letter-spacing:0.04em;color:#6b7280;">Incidents Flagged (*):</span> ${incidents}</div>
      </div>
      ${officerSections}
      <div style="border-top:1px solid #d1d5db;margin-top:24px;padding-top:8px;font-size:7.5pt;color:#6b7280;text-align:center;">Allied Universal Security Services · Washington University · Generated ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })} · Please keep all completed forms on file for audit purposes.</div>
    </body></html>`;

    const win = window.open("", "_blank");
    if (win) { win.document.write(html); win.document.close(); win.onload = () => { win.focus(); win.print(); }; }
  };

  const groups = groupByOfficer();

  return (
    <div style={{ minHeight: "100vh", background: SOFT_BG, fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif", padding: "2rem 1rem" }}>
      <div style={{ maxWidth: 800, margin: "0 auto" }}>

        <div style={{ background: NAVY, padding: "1.25rem 2rem", borderRadius: "4px 4px 0 0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ color: WHITE, fontSize: "1rem", fontWeight: 800, letterSpacing: "0.06em", textTransform: "uppercase" }}>
              Allied<span style={{ fontWeight: 300 }}>Universal</span><sup style={{ fontSize: "0.5rem", fontWeight: 300, marginLeft: 1 }}>™</sup>
            </div>
            <div style={{ color: "rgba(255,255,255,0.6)", fontSize: "0.68rem", marginTop: 2 }}>Security Services</div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "1.25rem" }}>
            <a href="https://supervisor.xing.wtf/dashboard" style={{ color: "rgba(255,255,255,0.7)", fontSize: "0.75rem", textDecoration: "none", display: "flex", alignItems: "center", gap: 4 }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
              Dashboard
            </a>
            <div style={{ textAlign: "right" }}>
              <div style={{ color: WHITE, fontSize: "0.95rem", fontWeight: 700 }}>DAR Report Generator</div>
              <div style={{ color: "rgba(255,255,255,0.7)", fontSize: "0.75rem" }}>Washington University · Saint Louis</div>
            </div>
          </div>
        </div>

        <div style={{ background: WHITE, border: `1px solid ${BORDER}`, borderTop: "none", padding: "1.5rem 2rem", marginBottom: "1.5rem" }}>
          <div style={{ fontSize: "0.72rem", fontWeight: 700, color: "#374151", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "1rem" }}>Search Parameters</div>
          <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", alignItems: "flex-end" }}>
            <div style={{ flex: 1, minWidth: 160 }}>
              <Label>Start Date *</Label>
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} style={inputStyle} />
            </div>
            <div style={{ flex: 1, minWidth: 160 }}>
              <Label>End Date *</Label>
              <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} style={inputStyle} />
            </div>
            <div style={{ flex: 2, minWidth: 200 }}>
              <Label>Officer Name (optional)</Label>
              <input type="text" value={officerFilter} onChange={(e) => setOfficerFilter(e.target.value)} placeholder="Filter by officer name..." style={inputStyle} />
            </div>
            <div>
              <button onClick={handleSearch} disabled={!startDate || !endDate || loading} style={{ ...btnStyle(startDate && endDate && !loading ? NAVY : "#9ca3af"), cursor: startDate && endDate && !loading ? "pointer" : "not-allowed", padding: "0.5rem 1.5rem", width: "auto" }}>
                {loading ? "Loading..." : "Search"}
              </button>
            </div>
          </div>
          {error && <div style={{ marginTop: "0.75rem", background: "#fef2f2", border: "1px solid #fca5a5", borderRadius: 4, padding: "0.6rem 1rem", fontSize: "0.82rem", color: "#b91c1c" }}>{error}</div>}
        </div>

        {searched && (
          <>
            {records.length === 0 ? (
              <div style={{ background: WHITE, border: `1px solid ${BORDER}`, borderRadius: 4, padding: "2rem", textAlign: "center", color: MUTED, fontSize: "0.88rem" }}>
                No DAR submissions found for the selected criteria.
              </div>
            ) : (
              <>
                <div style={{ background: DARK, padding: "0.75rem 2rem", display: "flex", gap: "2rem", flexWrap: "wrap", borderRadius: "4px 4px 0 0" }}>
                  {[["Submissions", records.length], ["Officers", Object.keys(groups).length], ["Incidents (*)", records.filter((r) => r.activity_log?.some((e) => e.activity?.includes("*"))).length]].map(([label, val]) => (
                    <div key={label as string}>
                      <div style={{ color: "rgba(255,255,255,0.6)", fontSize: "0.65rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</div>
                      <div style={{ color: WHITE, fontSize: "1.1rem", fontWeight: 700 }}>{val}</div>
                    </div>
                  ))}
                  <div style={{ marginLeft: "auto" }}>
                    <button onClick={generatePDF} style={{ ...btnStyle(GREEN), padding: "0.45rem 1.25rem", width: "auto", fontSize: "0.78rem" }}>Generate PDF Report</button>
                  </div>
                </div>

                {Object.entries(groups).map(([officer, dars]) => (
                  <div key={officer} style={{ background: WHITE, border: `1px solid ${BORDER}`, borderTop: "none" }}>
                    <div style={{ background: "#eef3f8", padding: "0.6rem 2rem", borderBottom: `1px solid ${BORDER}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontWeight: 700, color: NAVY, fontSize: "0.9rem" }}>{officer}</span>
                      <span style={{ color: MUTED, fontSize: "0.78rem" }}>{dars.length} submission{dars.length !== 1 ? "s" : ""}</span>
                    </div>
                    {dars.map((dar, i) => (
                      <div key={dar.id} style={{ padding: "1rem 2rem", borderBottom: i < dars.length - 1 ? `1px solid ${BORDER}` : "none" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                          <span style={{ fontWeight: 700, fontSize: "0.88rem", color: TEXT }}>{formatDisplayDate(dar.date)}</span>
                          <span style={{ color: MUTED, fontSize: "0.78rem" }}>{dar.shift_start} – {dar.shift_end}</span>
                        </div>
                        {dar.activity_log && dar.activity_log.filter((e) => e.activity?.trim()).length > 0 ? (
                          <div style={{ background: SOFT_BG, borderRadius: 3, padding: "0.5rem 0.75rem", marginBottom: "0.5rem" }}>
                            {dar.activity_log.filter((e) => e.activity?.trim()).map((entry, j) => (
                              <div key={j} style={{ display: "flex", gap: "0.75rem", fontSize: "0.8rem", color: TEXT, marginBottom: j < dar.activity_log.length - 1 ? "0.25rem" : 0 }}>
                                <span style={{ color: MUTED, whiteSpace: "nowrap", minWidth: 80 }}>{entry.from} – {entry.to}</span>
                                <span style={{ color: entry.activity?.includes("*") ? "#b91c1c" : TEXT, fontWeight: entry.activity?.includes("*") ? 600 : 400 }}>{entry.activity}</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div style={{ fontSize: "0.78rem", color: MUTED, fontStyle: "italic", marginBottom: "0.5rem" }}>No activity entries recorded.</div>
                        )}
                        {(dar.missed_rest_break || dar.missed_meal_period) && (
                          <div style={{ fontSize: "0.78rem", color: "#b91c1c", fontWeight: 600 }}>
                            ⚠ {[dar.missed_rest_break ? "Missed rest break" : "", dar.missed_meal_period ? "Missed meal period" : ""].filter(Boolean).join(", ")}
                            {dar.missed_explanation && ` — ${dar.missed_explanation}`}
                          </div>
                        )}
                        <div style={{ fontSize: "0.75rem", color: MUTED, marginTop: "0.35rem" }}>Signed: {dar.signature}</div>
                      </div>
                    ))}
                  </div>
                ))}

                <div style={{ background: WHITE, border: `1px solid ${BORDER}`, borderTop: "none", padding: "1rem 2rem", borderRadius: "0 0 4px 4px" }}>
                  <button onClick={generatePDF} style={{ ...btnStyle(NAVY), width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>Generate PDF Report</button>
                </div>
              </>
            )}
          </>
        )}

        <div style={{ marginTop: "1rem", fontSize: "0.72rem", color: MUTED, textAlign: "center" }}>
          Allied Universal Security Services · Washington University · Please keep all completed forms on file for audit purposes.
        </div>
      </div>
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontSize: "0.72rem", fontWeight: 700, color: "#374151", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>
      {children}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%", boxSizing: "border-box", padding: "0.5rem 0.75rem",
  border: "1px solid #d1d5db", borderRadius: 4, fontSize: "0.88rem",
  color: "#1a1a2e", background: "#fafbfc", outline: "none", fontFamily: "inherit",
};

function btnStyle(bg: string): React.CSSProperties {
  return { background: bg, color: "#ffffff", border: "none", borderRadius: 4, padding: "0.7rem 1.75rem", fontSize: "0.85rem", fontWeight: 700, letterSpacing: "0.04em", cursor: "pointer", fontFamily: "inherit", textTransform: "uppercase", width: "100%" };
}
