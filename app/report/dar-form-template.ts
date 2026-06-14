// app/report/dar-form-template.ts
//
// Builds print-ready HTML that replicates the official Allied Universal
// "Daily Activity Report" paper form, filled in with data from
// dar_submissions. Each DARRecord becomes one (or more, if the activity
// log overflows 18 rows) physical pages, matching the layout/field
// positions of the printed form so supervisors can print directly from
// the website instead of using the paper version.

export interface ActivityEntry {
  from: string;
  to: string;
  activity: string;
}

export interface DARRecord {
  id: string;
  officer_name: string;
  client_site: string;
  branch: string;
  date: string;
  scheduled_shift: string;
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
  activity_log: ActivityEntry[];
  missed_rest_break: boolean;
  missed_meal_period: boolean;
  missed_explanation: string;
  signature: string;
  submitted_at: string;
}

const ROWS_PER_PAGE = 18;

// ---------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------

function esc(value: unknown): string {
  if (value === null || value === undefined) return "";
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function formatDate(iso: string): string {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  if (!y || !m || !d) return iso;
  return `${m}/${d}/${y}`;
}

// Accepts "HH:MM" (24hr, from <input type="time">), "H:MM AM/PM",
// or an already-formatted string. Returns the time portion (12hr where
// possible) and an AM/PM flag for the circle.
function splitTime12(raw?: string): { time: string; ampm: "AM" | "PM" | "" } {
  if (!raw) return { time: "", ampm: "" };
  const trimmed = raw.trim();
  if (!trimmed || trimmed === "\u2014") return { time: "", ampm: "" };

  const ampmMatch = trimmed.match(/\b(am|pm)\b/i);
  if (ampmMatch) {
    const ampm = ampmMatch[0].toUpperCase() as "AM" | "PM";
    const time = trimmed.replace(/\s*\b(am|pm)\b/i, "").trim();
    return { time, ampm };
  }

  const m = trimmed.match(/^(\d{1,2}):(\d{2})$/);
  if (m) {
    let h = parseInt(m[1], 10);
    const min = m[2];
    const ampm: "AM" | "PM" = h >= 12 ? "PM" : "AM";
    h = h % 12;
    if (h === 0) h = 12;
    return { time: `${h}:${min}`, ampm };
  }

  return { time: trimmed, ampm: "" };
}

function ampmField(raw?: string): string {
  const { time, ampm } = splitTime12(raw);
  const amCls = ampm === "AM" ? "sel" : "";
  const pmCls = ampm === "PM" ? "sel" : "";
  return (
    `<span class="line w55">${esc(time)}</span>` +
    `<span class="ampm"><span class="${amCls}">AM</span> / <span class="${pmCls}">PM</span></span>`
  );
}

function checkbox(checked: boolean): string {
  return `<span class="checkbox${checked ? " checked" : ""}"></span>`;
}

function mark(checked: boolean): string {
  return checked ? "X" : "";
}

const LOGO_SVG = `
<svg class="logo-icon" viewBox="0 0 100 68" xmlns="http://www.w3.org/2000/svg">
  <path d="M95 6 C 60 2, 30 8, 14 28 C 4 40, 2 50, 6 62 L 18 58 C 14 48, 16 40, 24 32 C 38 18, 62 14, 92 18 Z" fill="#161616"/>
  <circle cx="92" cy="16" r="5" fill="#161616"/>
</svg>`;

// ---------------------------------------------------------------------
// CSS (page layout matches the printed Allied Universal DAR form)
// ---------------------------------------------------------------------

const FORM_CSS = `
@page { size: letter; margin: 0; }
* { box-sizing: border-box; }
html, body { margin: 0; padding: 0; }
body {
  font-family: 'Helvetica Neue', Arial, sans-serif;
  color: #000;
  font-size: 8.3pt;
}
.page {
  width: 8.5in;
  height: 11in;
  padding: 0.32in 0.42in 0.28in 0.42in;
  page-break-after: always;
  position: relative;
}
.page:last-child { page-break-after: auto; }

/* header */
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 3px solid #161616;
  padding-bottom: 5px;
  margin-bottom: 5px;
}
.logo-block { display: flex; align-items: center; gap: 9px; }
.logo-icon { width: 44px; height: 30px; flex: none; }
.logo-text .brand {
  font-family: Georgia, 'Times New Roman', serif;
  font-weight: 700;
  font-size: 17pt;
  letter-spacing: 0.5px;
  line-height: 1;
  white-space: nowrap;
}
.logo-text .brand sup { font-size: 7pt; position: relative; top: -0.9em; }
.logo-text .tag {
  font-size: 8pt;
  font-weight: 700;
  letter-spacing: 3px;
  margin-top: 1px;
  white-space: nowrap;
}
.title {
  font-family: Georgia, 'Times New Roman', serif;
  font-weight: 700;
  font-size: 20pt;
  letter-spacing: 1px;
  white-space: nowrap;
}

/* instructions */
.instructions {
  font-size: 6.8pt;
  line-height: 1.28;
  margin: 0 0 5px 0;
  text-align: left;
}

/* section bars */
.section-bar {
  background: #161616;
  color: #fff;
  font-weight: 700;
  font-size: 11.5pt;
  padding: 3px 9px;
  letter-spacing: 0.5px;
  margin-top: 5px;
}

/* section I */
.sec1 { padding: 5px 4px 6px 4px; font-size: 9.5pt; }
.row { display: flex; align-items: baseline; gap: 7px; margin-top: 6px; }
.lbl { font-weight: 700; white-space: nowrap; }
.line {
  border-bottom: 1px solid #000;
  min-height: 12px;
  padding: 0 4px 1px 4px;
  font-weight: 400;
  font-size: 9pt;
  white-space: nowrap;
  overflow: hidden;
}
.line.fill { flex: 1; }
.line.w90 { flex: 0 0 90px; }
.line.w70 { flex: 0 0 70px; }
.line.w55 { flex: 0 0 55px; }
.line.w45 { flex: 0 0 45px; }
.line.w40 { flex: 0 0 40px; }
.line.w35 { flex: 0 0 35px; }

/* section II */
.sec2 { padding: 6px 4px 7px 4px; font-size: 9.5pt; display: flex; }
.sec2-col { flex: 1; }
.sec2-col.right { padding-left: 26px; }
.sec2 .row { margin-top: 7px; }
.ampm { font-weight: 700; white-space: nowrap; }
.ampm .sel { text-decoration: underline; }

/* section III table */
.activity-table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 0;
  table-layout: fixed;
}
.activity-table th {
  border: 1px solid #000;
  font-size: 9pt;
  font-weight: 700;
  padding: 1px 4px;
  text-align: center;
  background: #fff;
}
.activity-table td {
  border: 1px solid #000;
  font-size: 8.3pt;
  padding: 1px 5px;
  vertical-align: top;
  height: 21.6px;
  overflow: hidden;
  white-space: nowrap;
}
.col-from, .col-to { width: 9%; text-align: center; }
.col-report { width: 82%; }
.daily-report-head { font-weight: 700; font-size: 10pt; }
.daily-report-sub { font-weight: 700; font-size: 8.6pt; }

/* section IV */
.sec4-text {
  font-size: 7.3pt;
  font-style: italic;
  font-weight: 700;
  line-height: 1.3;
  margin: 4px 0 3px 0;
}
.sec4-checks {
  display: flex;
  align-items: baseline;
  gap: 10px;
  font-size: 8pt;
  font-weight: 700;
  font-style: italic;
  margin-bottom: 6px;
}
.checkbox {
  display: inline-block;
  width: 9px; height: 9px;
  border: 1px solid #000;
  margin-right: 3px;
  vertical-align: middle;
  position: relative;
  top: -1px;
}
.checkbox.checked::after {
  content: "X";
  position: absolute;
  left: 0.5px; top: -3px;
  font-size: 8px;
  font-weight: 700;
}
.sec4-checks .blank-init { display: inline-block; border-bottom: 1px solid #000; width: 20px; }
.sec4-checks .explain-line { flex: 1; border-bottom: 1px solid #000; min-height: 11px; }

.sig-row { display: flex; align-items: baseline; gap: 10px; margin-top: 4px; }
.sig-row .lbl { font-weight: 700; font-size: 9pt; }
.sig-line { border-bottom: 1px solid #000; min-height: 13px; padding: 0 6px 1px 6px; font-size: 9pt; }
.sig-line.officer { flex: 0 0 47%; font-family: Georgia, 'Times New Roman', serif; font-style: italic; }
.sig-line.sup { flex: 1; }
`;

// ---------------------------------------------------------------------
// Page builder
// ---------------------------------------------------------------------

function buildTableRows(rows: ActivityEntry[]): string {
  const out: string[] = [];
  for (let i = 0; i < ROWS_PER_PAGE; i++) {
    const entry = rows[i];
    const from = entry?.from || "";
    const to = entry?.to || "";
    const activity = entry?.activity || "";
    out.push(
      `<tr><td class="col-from">${esc(from)}</td><td class="col-to">${esc(to)}</td>` +
        `<td class="col-report">${esc(activity)}</td></tr>`
    );
  }
  return out.join("\n");
}

function buildPage(dar: DARRecord, rows: ActivityEntry[], pageNum: number, pageTotal: number): string {
  const radio = mark(dar.received_radio);
  const pager = mark(dar.received_pager);
  const keys = mark(dar.received_keys);
  const detex = mark(dar.received_detex);
  const other = dar.received_other || "";
  const onDutyMeal = mark(dar.on_duty_meal);

  return `
<div class="page">
  <div class="header">
    <div class="logo-block">
      ${LOGO_SVG}
      <div class="logo-text">
        <div class="brand">ALLIEDUNIVERSAL<sup>&trade;</sup></div>
        <div class="tag">SECURITY SERVICES</div>
      </div>
    </div>
    <div class="title">DAILY ACTIVITY REPORT</div>
  </div>

  <div class="instructions">
    <b>INSTRUCTIONS:</b> Security Professional must complete Sections 1-4 for each day worked. Use additional pages if necessary (section 2 only needs to be completed on Page 1). Section 3
    &ndash; Activity Details is for time activity only. Activity is to be logged at least hourly <u>or</u> as incidents occur, must be <i>printed in ink</i> and must be <i>neat and legible.</i> Any security or &ldquo;significant&rdquo;
    incidents must also be written separately on an &ldquo;Incident Report&rdquo; form and attached to this log. Place an asterisk * in the margin of Section 3 by the line where the incident has been
    recorded to draw immediate attention to it. Also list any relevant &ldquo;passdown&rdquo; information for the person working this post after your shift to advise them of any situations.
  </div>

  <div class="section-bar">SECTION I: EMPLOYEE INFORMATION</div>
  <div class="sec1">
    <div class="row">
      <span class="lbl">OFFICER ON DUTY:</span><span class="line fill">${esc(dar.officer_name)}</span>
      <span class="lbl">TODAY&rsquo;S DATE</span><span class="line w90">${esc(formatDate(dar.date))}</span>
    </div>
    <div class="row">
      <span class="lbl">CLIENT/SITE:</span><span class="line fill">${esc(dar.client_site)}</span>
      <span class="lbl">BRANCH:</span><span class="line w90">${esc(dar.branch)}</span>
    </div>
    <div class="row">
      <span class="lbl">SCHEDULED SHIFT:</span><span class="line fill">${esc(dar.scheduled_shift)}</span>
      <span class="lbl">PAGE:</span><span class="line w35" style="text-align:center;">${pageNum}</span>
      <span class="lbl">OF</span><span class="line w35" style="text-align:center;">${pageTotal}</span>
    </div>
    <div class="row">
      <span class="lbl">RECEIVED ITEMS:</span><span class="line w45"></span>
      <span class="lbl">RADIO:</span><span class="line w35" style="text-align:center;">${radio}</span>
      <span class="lbl">PAGER:</span><span class="line w35" style="text-align:center;">${pager}</span>
      <span class="lbl">#OF KEYS:</span><span class="line w35" style="text-align:center;">${keys}</span>
      <span class="lbl">DETEX:</span><span class="line w35" style="text-align:center;">${detex}</span>
      <span class="lbl">OTHERR:</span><span class="line fill">${esc(other)}</span>
    </div>
  </div>

  <div class="section-bar">SECTION II: RECORD OF HOURS WORKED AND BREAKS</div>
  <div class="sec2">
    <div class="sec2-col">
      <div class="row">
        <span class="lbl">Time In (shift start):</span>
        ${ampmField(dar.shift_start)}
      </div>
      <div class="row">
        <span class="lbl">Time Out (shift end):</span>
        ${ampmField(dar.shift_end)}
      </div>
      <div class="row">
        <span class="lbl">Rest Break Out:</span><span class="line w70">${esc(dar.rest_break_1_out)}</span>
        <span class="lbl">In</span><span class="line w70">${esc(dar.rest_break_1_in)}</span>
      </div>
      <div class="row">
        <span class="lbl">Rest Break Out:</span><span class="line w70">${esc(dar.rest_break_2_out)}</span>
        <span class="lbl">In</span><span class="line w70">${esc(dar.rest_break_2_in)}</span>
      </div>
    </div>
    <div class="sec2-col right">
      <div class="row">
        <span class="lbl">Time Out (meal break*):</span>
        ${ampmField(dar.meal_break_out)}
      </div>
      <div class="row">
        <span class="lbl">Time In (meal break*):</span>
        ${ampmField(dar.meal_break_in)}
      </div>
      <div class="row" style="margin-top:14px;">
        <span class="lbl" style="font-weight:700;">* Check here if your post has an &ldquo;On-Duty&rdquo; paid meal period:</span>
        <span class="line w45" style="text-align:center;">${onDutyMeal}</span>
      </div>
    </div>
  </div>

  <div class="section-bar">SECTION III: ACTIVITY DETAILS</div>
  <table class="activity-table">
    <colgroup>
      <col class="col-from"><col class="col-to"><col class="col-report">
    </colgroup>
    <thead>
      <tr>
        <th colspan="2" style="border-bottom:none;">TIME</th>
        <th rowspan="2" class="daily-report-head">DAILY REPORT<br>
          <span class="daily-report-sub">Record all activity below. Attach all Incident Reports and supporting documents.</span>
        </th>
      </tr>
      <tr>
        <th style="border-top:none;">From</th>
        <th style="border-top:none;">To</th>
      </tr>
    </thead>
    <tbody>
      ${buildTableRows(rows)}
    </tbody>
  </table>

  <div class="section-bar">SECTION IV: EMPLOYEE SIGNATURE</div>
  <div class="sec4-text">
    By your signature, you acknowledge that the information on this DAR is a true and accurate record of your time and account activity today. If you did not receive a meal period or rest break
    today, you must indicate such on this DAR, along with an explanation of the reason(s), otherwise the Company will assume that you received all meal periods and rest periods as required by law.
  </div>
  <div class="sec4-checks">
    <span class="blank-init"></span>
    <span>I did not receive my</span>
    <span>${checkbox(dar.missed_rest_break)} Rest break</span>
    <span>${checkbox(dar.missed_meal_period)} Meal period today. Explain:</span>
    <span class="explain-line">${esc(dar.missed_explanation)}</span>
  </div>
  <div class="sig-row">
    <span class="lbl">SIGNATURE:</span><span class="sig-line officer">${esc(dar.signature)}</span>
    <span class="lbl">SUPERVISOR:</span><span class="sig-line sup"></span>
  </div>
</div>`;
}

// ---------------------------------------------------------------------
// Public entry point
// ---------------------------------------------------------------------

/**
 * Builds a full print-ready HTML document. Each DARRecord becomes one
 * page (or several, if its activity log has more than 18 entries).
 */
export function buildDarFormDocument(dars: DARRecord[]): string {
  const pages: string[] = [];

  dars.forEach((dar) => {
    const rows = (dar.activity_log || []).filter(
      (e) => (e.activity && e.activity.trim()) || e.from || e.to
    );
    const chunks: ActivityEntry[][] = [];
    for (let i = 0; i < rows.length; i += ROWS_PER_PAGE) {
      chunks.push(rows.slice(i, i + ROWS_PER_PAGE));
    }
    if (chunks.length === 0) chunks.push([]);

    chunks.forEach((chunk, idx) => {
      pages.push(buildPage(dar, chunk, idx + 1, chunks.length));
    });
  });

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8"/>
<title>Daily Activity Report</title>
<style>${FORM_CSS}</style>
</head>
<body>${pages.join("\n")}</body>
</html>`;
}
