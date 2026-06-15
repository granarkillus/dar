"use client";

import { useState, useEffect } from "react";
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
  id: number;
  from: string;
  to: string;
  activity: string;
}

export default function DARForm() {
  const today = new Date().toISOString().split("T")[0];

  const [form, setForm] = useState({
    officerName: "",
    clientSite: "Washington University",
    branch: "Saint Louis",
    date: today,
    scheduledShift: "",
    receivedRadio: false,
    receivedPager: false,
    receivedKeys: false,
    receivedDetex: false,
    shiftStart: "",
    shiftEnd: "",
    signature: "",
  });

  const [entries, setEntries] = useState<ActivityEntry[]>([
    { id: 1, from: "", to: "", activity: "" },
    { id: 2, from: "", to: "", activity: "" },
    { id: 3, from: "", to: "", activity: "" },
    { id: 4, from: "", to: "", activity: "" },
  ]);

  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const name = params.get("name");
    if (name) {
      setForm((f) => ({ ...f, officerName: decodeURIComponent(name) }));
    }
  }, []);

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));

  const toggle = (field: string) => () =>
    setForm((f) => ({ ...f, [field]: !f[field as keyof typeof f] }));

  const addEntry = () =>
    setEntries((e) => [...e, { id: Date.now(), from: "", to: "", activity: "" }]);

  const removeEntry = (id: number) =>
    setEntries((e) => e.filter((entry) => entry.id !== id));

  const updateEntry = (id: number, field: string, value: string) =>
    setEntries((e) => e.map((entry) => entry.id === id ? { ...entry, [field]: value } : entry));

  const required = form.officerName && form.date && form.signature;

  const handleSubmit = async () => {
    if (!required) return;
    setSubmitting(true);
    setError("");

    const supabase = getSupabase();
    const { error: dbError } = await supabase.from("dar_submissions").insert([{
      officer_name: form.officerName,
      client_site: form.clientSite,
      branch: form.branch,
      date: form.date,
      scheduled_shift: form.scheduledShift || null,
      shift_start: form.shiftStart || null,
      shift_end: form.shiftEnd || null,
      received_radio: form.receivedRadio,
      received_pager: form.receivedPager,
      received_keys: form.receivedKeys,
      received_detex: form.receivedDetex,
      activity_log: entries.filter((e) => e.activity.trim()),
      signature: form.signature,
    }]);

    if (dbError) {
      setError("Submission failed. Please try again.");
      setSubmitting(false);
      return;
    }

    setSubmitted(true);
    setSubmitting(false);
  };

  const handleReset = () => {
    setForm({
      officerName: "",
      clientSite: "Washington University",
      branch: "Saint Louis",
      date: today,
      scheduledShift: "",
      receivedRadio: false,
      receivedPager: false,
      receivedKeys: false,
      receivedDetex: false,
      shiftStart: "",
      shiftEnd: "",
      signature: "",
    });
    setEntries([
      { id: 1, from: "", to: "", activity: "" },
      { id: 2, from: "", to: "", activity: "" },
      { id: 3, from: "", to: "", activity: "" },
      { id: 4, from: "", to: "", activity: "" },
    ]);
    setSubmitted(false);
    setError("");
  };

  if (submitted) {
    return (
      <div style={{ minHeight: "100vh", background: SOFT_BG, fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif", display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem 1rem" }}>
        <div style={{ maxWidth: 480, width: "100%", background: WHITE, borderRadius: 4, boxShadow: "0 2px 16px rgba(31,78,121,0.10)", overflow: "hidden", textAlign: "center" }}>
          <div style={{ background: NAVY, padding: "1.25rem 2rem" }}>
            <div style={{ color: WHITE, fontSize: "1rem", fontWeight: 800, letterSpacing: "0.06em", textTransform: "uppercase" }}>
              Allied<span style={{ fontWeight: 300 }}>Universal</span><sup style={{ fontSize: "0.5rem", fontWeight: 300 }}>™</sup>
            </div>
            <div style={{ color: "rgba(255,255,255,0.6)", fontSize: "0.68rem", marginTop: 2 }}>There for you.</div>
          </div>
          <div style={{ padding: "2.5rem 2rem" }}>
            <div style={{ width: 56, height: 56, borderRadius: "50%", background: "#e8f5e9", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1rem" }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#2f6b3a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <div style={{ fontSize: "1.1rem", fontWeight: 700, color: TEXT, marginBottom: 8 }}>DAR Submitted</div>
            <div style={{ color: MUTED, fontSize: "0.85rem", marginBottom: "1.5rem", lineHeight: 1.6 }}>
              Your Daily Activity Report for {new Date(form.date + "T12:00:00").toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })} has been recorded.
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
              <button onClick={handleReset} style={btnStyle(NAVY)}>Submit Another DAR</button>
              <a href="https://portal.xing.wtf" style={btnOutlineStyle(NAVY)}>Go to Officer Portal</a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: SOFT_BG, fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif", padding: "2rem 1rem" }}>
      <div style={{ maxWidth: 720, margin: "0 auto", background: WHITE, borderRadius: 4, boxShadow: "0 2px 16px rgba(31,78,121,0.10)", overflow: "hidden" }}>

        <div style={{ background: NAVY, padding: "1.25rem 2rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ color: WHITE, fontSize: "1rem", fontWeight: 800, letterSpacing: "0.06em", textTransform: "uppercase" }}>
              Allied<span style={{ fontWeight: 300 }}>Universal</span><sup style={{ fontSize: "0.5rem", fontWeight: 300, marginLeft: 1 }}>™</sup>
            </div>
            <div style={{ color: "rgba(255,255,255,0.6)", fontSize: "0.68rem", marginTop: 2 }}>Security Services</div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "1.25rem" }}>
            <a href="https://portal.xing.wtf" style={{ color: "rgba(255,255,255,0.7)", fontSize: "0.75rem", textDecoration: "none", display: "flex", alignItems: "center", gap: 4 }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
              Officer Portal
            </a>
            <div style={{ textAlign: "right" }}>
              <div style={{ color: WHITE, fontSize: "0.95rem", fontWeight: 700 }}>Daily Activity Report</div>
              <div style={{ color: "rgba(255,255,255,0.7)", fontSize: "0.75rem" }}>Complete all sections for each day worked</div>
            </div>
          </div>
        </div>

        <div style={{ padding: "0 0 2rem" }}>

          <SectionBar label="Section I: Employee Information" />
          <div style={{ padding: "1.25rem 2rem 0" }}>
            <Field label="Officer on Duty" value={form.officerName} onChange={set("officerName")} required placeholder="Full legal name" />
            <Row>
              <Field label="Client / Site" value={form.clientSite} onChange={set("clientSite")} />
              <Field label="Today's Date" value={form.date} onChange={set("date")} type="date" required />
            </Row>
            <Row>
              <Field label="Branch" value={form.branch} onChange={set("branch")} />
              <Field label="Scheduled Shift / Post" value={form.scheduledShift} onChange={set("scheduledShift")} placeholder="e.g. Greenway Walk, Ackert, North Campus" />
            </Row>
            <Label>Received Items</Label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.6rem 1.5rem", margin: "0.5rem 0 0.5rem" }}>
              {[["receivedRadio", "Radio"], ["receivedPager", "Pager"], ["receivedKeys", "Keys"], ["receivedDetex", "Detex"]].map(([field, label]) => (
                <CheckboxItem key={field} label={label} checked={form[field as keyof typeof form] as boolean} onChange={toggle(field)} />
              ))}
            </div>
          </div>

          <SectionBar label="Section II: Record of Hours Worked" />
          <div style={{ padding: "1.25rem 2rem 0" }}>
            <Row>
              <Field label="Time In (shift start)" value={form.shiftStart} onChange={set("shiftStart")} placeholder="1800" />
              <Field label="Time Out (shift end)" value={form.shiftEnd} onChange={set("shiftEnd")} placeholder="0200" />
            </Row>
          </div>

          <SectionBar label="Section III: Activity Details" />
          <div style={{ padding: "1.25rem 2rem 0" }}>
            <div style={{ fontSize: "0.75rem", color: MUTED, marginBottom: "1rem", lineHeight: 1.5 }}>
              Record all activity below. Mark an asterisk (*) next to any security incident. Attach all Incident Reports and supporting documents.
            </div>

            {entries.map((entry, index) => (
              <div key={entry.id} style={{ background: SOFT_BG, border: `1px solid ${BORDER}`, borderRadius: 4, padding: "0.75rem 1rem", marginBottom: "0.75rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                  <span style={{ fontSize: "0.72rem", fontWeight: 700, color: NAVY, textTransform: "uppercase", letterSpacing: "0.05em" }}>Entry {index + 1}</span>
                  {entries.length > 1 && (
                    <button onClick={() => removeEntry(entry.id)} style={{ background: "none", border: "none", color: MUTED, cursor: "pointer", fontSize: "0.75rem", padding: "2px 6px" }}>
                      Remove
                    </button>
                  )}
                </div>
                <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.5rem" }}>
                  <div style={{ width: 100 }}>
                    <Label>From</Label>
                    <input value={entry.from} onChange={(e) => updateEntry(entry.id, "from", e.target.value)} placeholder={activityTimePlaceholder(index).from} style={inputStyle} />
                  </div>
                  <div style={{ width: 100 }}>
                    <Label>To</Label>
                    <input value={entry.to} onChange={(e) => updateEntry(entry.id, "to", e.target.value)} placeholder={activityTimePlaceholder(index).to} style={inputStyle} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <Label>Activity</Label>
                    <input value={entry.activity} onChange={(e) => updateEntry(entry.id, "activity", e.target.value)} placeholder="Describe activity or incident" style={inputStyle} />
                  </div>
                </div>
              </div>
            ))}

            <button onClick={addEntry} style={{ background: "none", border: `1.5px dashed ${NAVY}`, borderRadius: 4, color: NAVY, padding: "0.6rem 1rem", fontSize: "0.82rem", fontWeight: 700, cursor: "pointer", width: "100%", marginBottom: "0.5rem", fontFamily: "inherit" }}>
              + Add Entry
            </button>
          </div>

          <SectionBar label="Section IV: Employee Signature" />
          <div style={{ padding: "1.25rem 2rem 0" }}>
            <div style={{ fontSize: "0.78rem", color: TEXT, lineHeight: 1.65, marginBottom: "1rem", background: SOFT_BG, border: `1px solid ${BORDER}`, borderLeft: `3px solid ${NAVY}`, borderRadius: 3, padding: "0.75rem 1rem" }}>
              By your signature, you acknowledge that the information on this DAR is a true and accurate record of your time and account activity today.
            </div>
            <Field label="Signature (type full name)" value={form.signature} onChange={set("signature")} placeholder="Full legal name" required />
            {error && (
              <div style={{ background: "#fef2f2", border: "1px solid #fca5a5", borderRadius: 4, padding: "0.75rem 1rem", fontSize: "0.82rem", color: "#b91c1c", marginBottom: "1rem" }}>
                {error}
              </div>
            )}
            <div style={{ marginTop: "1.5rem", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              <button
                onClick={handleSubmit}
                disabled={!required || submitting}
                style={{ ...btnStyle(required && !submitting ? GREEN : "#9ca3af"), cursor: required && !submitting ? "pointer" : "not-allowed", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
              >
                {submitting ? "Submitting..." : "Submit DAR"}
              </button>
              {!required && <div style={{ fontSize: "0.75rem", color: MUTED, textAlign: "center" }}>Officer name, date, and signature are required</div>}
            </div>
          </div>

          <div style={{ borderTop: `1px solid ${BORDER}`, marginTop: "2rem", padding: "0.85rem 2rem 0", fontSize: "0.72rem", color: MUTED, textAlign: "center" }}>
            Allied Universal Security Services &nbsp;·&nbsp; Washington University &nbsp;·&nbsp; Please keep all completed forms on file for audit purposes.
          </div>
        </div>
      </div>
    </div>
  );
}

function SectionBar({ label }: { label: string }) {
  return (
    <div style={{ background: DARK, padding: "0.55rem 2rem", color: WHITE, fontSize: "0.75rem", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", marginTop: "1.5rem" }}>
      {label}
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

// Generates "1800 to 2000, then 2000 to 2200, then 2200 to 2400, then 0000 to
// 0200, ..." so each activity row's placeholder shows the next two-hour
// block of the shift, modeling the expected flow of entries.
function activityTimePlaceholder(index: number): { from: string; to: string } {
  const startHour = (18 + index * 2) % 24;
  const endHour = startHour + 2;
  const fmt = (h: number) => String(h % 24).padStart(2, "0") + "00";
  return {
    from: fmt(startHour),
    to: endHour === 24 ? "2400" : fmt(endHour),
  };
}

function Field({ label, value, onChange, placeholder, type = "text", required: req }: {
  label: string; value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string; type?: string; required?: boolean;
}) {
  return (
    <div style={{ marginBottom: "1rem" }}>
      <Label>{label}{req && <span style={{ color: "#b3261e", marginLeft: 2 }}>*</span>}</Label>
      <input type={type} value={value} onChange={onChange} placeholder={placeholder} style={inputStyle} />
    </div>
  );
}

function Row({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", gap: "1rem" }}>
      {Array.isArray(children)
        ? children.map((child, i) => <div key={i} style={{ flex: 1 }}>{child}</div>)
        : <div style={{ flex: 1 }}>{children}</div>}
    </div>
  );
}

function CheckboxItem({ label, checked, onChange }: { label: string; checked: boolean; onChange: () => void }) {
  return (
    <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: "0.85rem", color: TEXT, fontWeight: checked ? 600 : 400, userSelect: "none", marginBottom: "0.5rem" }}>
      <div onClick={onChange} style={{ width: 16, height: 16, border: `2px solid ${checked ? NAVY : BORDER}`, borderRadius: 2, background: checked ? NAVY : WHITE, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, cursor: "pointer", transition: "all 0.15s" }}>
        {checked && (
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
            <polyline points="1.5,5 4,7.5 8.5,2.5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </div>
      <span onClick={onChange}>{label}</span>
    </label>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%", boxSizing: "border-box", padding: "0.5rem 0.75rem",
  border: `1px solid #d1d5db`, borderRadius: 4, fontSize: "0.88rem",
  color: TEXT, background: "#fafbfc", outline: "none", fontFamily: "inherit",
};

function btnStyle(bg: string): React.CSSProperties {
  return {
    background: bg, color: WHITE, border: "none", borderRadius: 4,
    padding: "0.7rem 1.75rem", fontSize: "0.85rem", fontWeight: 700,
    letterSpacing: "0.04em", cursor: "pointer", fontFamily: "inherit",
    textTransform: "uppercase", width: "100%",
  };
}

function btnOutlineStyle(color: string): React.CSSProperties {
  return {
    background: "none", color: color, border: `1.5px solid ${color}`, borderRadius: 4,
    padding: "0.7rem 1.75rem", fontSize: "0.85rem", fontWeight: 700,
    letterSpacing: "0.04em", cursor: "pointer", fontFamily: "inherit",
    textTransform: "uppercase", width: "100%", textAlign: "center" as const,
    textDecoration: "none", display: "block", boxSizing: "border-box",
  };
}
