// طباعة جداول المعلمات بنفس تخطيط الجدول الرسمي (aSc Timetables) حرفياً:
// سطر الرؤية أعلى الصفحة، ثم «المعلم <الاسم>»، ثم اسم المدرسة، ثم شبكة
// الحصص ١–٧ بأوقاتها والأيام صفوفاً، وفي الأسفل تاريخ الإنشاء و aSc Timetables.
import { Platform } from "react-native";
import type { Slot } from "./scheduleRules";
import { DAYS, FIXED_CELLS } from "./scheduleRules";

const TIMES = [
  "7:10 - 7:55", "7:55 - 8:40", "8:40 - 9:25", "9:45 - 10:30",
  "10:30 - 11:10", "11:10 - 11:50", "12:05 - 12:45",
];
const VISION = "الرؤية: الريادة في توفير فرص تعلم دائمة ومبتكرة وذات جودة عالية للمجتمع القطري";
const SCHOOL = "Al Nahda Primary School for Girls, Doha";

const esc = (s: string) =>
  String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const CSS = `
@import url("https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&display=swap");
*{box-sizing:border-box}
body{margin:0;background:#e9e9e9;font-family:Cairo,Arial,sans-serif;direction:rtl}
.page{width:1056px;height:816px;background:#fff;margin:0 auto 18px;padding:14px 18px;display:flex;flex-direction:column}
.vision{text-align:center;font-size:12px;color:#222}
.tname{text-align:center;font-size:17px;font-weight:700;margin-top:2px}
.school{font-size:11px;color:#333;margin-top:6px;direction:ltr;text-align:left}
table.tt{width:100%;border-collapse:collapse;table-layout:fixed;margin-top:6px;flex:1}
.tt td,.tt th{border:1px solid #000;text-align:center;vertical-align:middle;padding:2px}
.corner{width:86px}
.dh{width:86px;font-size:13px;font-weight:700}
.ph{height:42px}
.pn{font-size:14px;font-weight:700}
.pt{font-size:9.5px;color:#333;direction:ltr}
.cc{font-size:11px;font-weight:700}
.sb{font-size:11.5px;line-height:1.25;margin:1px 0}
.fx{font-size:11.5px}
.foot{display:flex;justify-content:space-between;font-size:10px;color:#333;margin-top:6px}
@media print{body{background:#fff}.page{margin:0;page-break-after:always;width:auto;height:auto}}
@page{size:A4 landscape;margin:8mm}
`;

function pageFor(teacher: string, rows: Slot[], dateStr: string) {
  const m: Record<string, Slot> = {};
  for (const r of rows) if (r.teacher === teacher) m[r.day + "|" + r.period] = r;

  let g = `<table class="tt"><tr><td class="corner"></td>`;
  for (let p = 1; p <= 7; p++)
    g += `<th class="ph"><div class="pn">${p}</div><div class="pt">${TIMES[p - 1]}</div></th>`;
  g += `</tr>`;
  for (const d of DAYS) {
    g += `<tr><th class="dh">${esc(d)}</th>`;
    for (let p = 1; p <= 7; p++) {
      const c = m[d + "|" + p];
      if (!c) { g += `<td></td>`; continue; }
      if (c.fixed || FIXED_CELLS.has(c.className)) {
        g += `<td class="fx">${esc(c.className)}</td>`;
        continue;
      }
      g += `<td><div class="cc">${esc(c.classCode)}</div><div class="sb">${esc(c.subject)}</div><div class="cc">${esc(c.classCode)}</div></td>`;
    }
    g += `</tr>`;
  }
  g += `</table>`;

  return `<div class="page">
    <div class="vision">${VISION}</div>
    <div class="tname">المعلم ${esc(teacher)}</div>
    <div class="school">${SCHOOL}</div>
    ${g}
    <div class="foot"><span>تم إنشاء الجدول: ${esc(dateStr)}</span><span>aSc Timetables</span></div>
  </div>`;
}

/** يبني صفحة HTML كاملة: صفحة لكل معلمة بالشكل الرسمي */
export function buildTimetableHtml(rows: Slot[], teachers?: string[], dateStr?: string) {
  const list = teachers && teachers.length
    ? teachers
    : Array.from(new Set(rows.map((r) => r.teacher))).sort((a, b) => a.localeCompare(b, "ar"));
  const d = dateStr || new Date().toLocaleDateString("en-GB").replace(/\//g, "/");
  const body = list.map((t) => pageFor(t, rows, d)).join("\n");
  return `<!doctype html><html dir="rtl" lang="ar"><head><meta charset="utf-8">
<title>جداول المعلمات</title><style>${CSS}</style></head><body>${body}</body></html>`;
}

/** يفتح نافذة الطباعة بالشكل الرسمي (ويب) */
export function printTimetable(rows: Slot[], teachers?: string[], dateStr?: string) {
  const html = buildTimetableHtml(rows, teachers, dateStr);
  if (Platform.OS !== "web" || typeof window === "undefined") return;
  const w = window.open("", "_blank");
  if (!w) return;
  w.document.write(html);
  w.document.close();
  w.focus();
  setTimeout(() => { try { w.print(); } catch {} }, 700);
}

/** ينزّل الجدول كملف HTML مستقل — جاهز للإرسال بالبريد أو واتساب */
export function downloadTimetableHtml(rows: Slot[], teachers?: string[], dateStr?: string, fileName?: string) {
  if (Platform.OS !== "web" || typeof document === "undefined") return;
  const html = buildTimetableHtml(rows, teachers, dateStr);
  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName || "الجدول-المقترح.html";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}
