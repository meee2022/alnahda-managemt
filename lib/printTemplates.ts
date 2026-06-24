// قوالب طباعة رسمية — طبق الأصل من النماذج الورقية المعتمدة
// التحليل مأخوذ من ملفات القسم الأصلية (docx/xlsx) حرفياً: نفس الجداول والأعمدة والدمج والنصوص الثابتة
import { printHtml } from "./print";
import { PERF_DOMAINS } from "./forms";
import { MINISTRY_LOGO } from "./letterhead";

type Settings = Record<string, string | undefined>;

const MAROON = "#5C1523"; // العنابي الأساسي (هوية موحّدة)
const GOLD = "#C9A96E"; // الذهبي الأساسي

const DEFAULT_VISION = "متعلم ريادي لتنمية مستدامة.";
const DEFAULT_MISSION =
  "نربي بيئة تعليمية شاملة ومبتكرة تعزز القيم والأخلاق وتؤهل المتعلم بمهارات عالية لإعداد جيل واعٍ قادر على بناء مجتمع متقدم واقتصاد مزدهر.";

// ===== الأساس: ورقة رسمية A4 بترويسة الوزارة العنابية والرؤية/الرسالة =====
function officialPage(body: string, opts?: { landscape?: boolean; s?: Settings; footer?: boolean }) {
  const s = opts?.s ?? {};
  const showFooter = opts?.footer !== false;
  const schoolName = s.school ? `روضة ومدرسة ${s.school}` : "روضة ومدرسة النهضة الابتدائية للبنات";
  const header = `
  <div class="letterhead">
    <div class="lh-school">${schoolName}</div>
    <img class="lh-logo" src="${MINISTRY_LOGO}" alt="وزارة التربية والتعليم والتعليم العالي" />
  </div>`;
  const now = new Date();
  const ds = `${now.getDate()}/${now.getMonth() + 1}/${now.getFullYear()}`;
  const verify = encodeURIComponent(`${s.school || "النهضة الابتدائية للبنات"} | ${s.department || "قسم المسار الأدبي"} | اعتماد: ${s.coordinator || "المنسقة"} | ${ds}`);
  const qr = `https://api.qrserver.com/v1/create-qr-code/?size=96x96&margin=0&data=${verify}`;
  const stamp = showFooter ? `
  <div class="estamp">
    <img class="qr" src="${qr}" alt="QR" />
    <div class="estamp-txt">
      <div class="estamp-title">✔ معتمد إلكترونياً</div>
      <div>${esc(s.coordinator) || "منسقة القسم"}${s.coordinator ? " — منسقة القسم" : ""}</div>
      <div class="estamp-sub">منصة قسم المسار الأدبي · امسح الرمز للتحقق</div>
    </div>
  </div>` : "";
  const footer = showFooter ? `
  ${stamp}
  <div class="vmfoot">
    <div><span class="vm-label">الرؤية:</span> ${esc(s.vision) || DEFAULT_VISION}</div>
    <div><span class="vm-label">الرسالة:</span> ${esc(s.mission) || DEFAULT_MISSION}</div>
  </div>` : "";
  return `<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
<meta charset="utf-8" />
<style>
  @page { size: A4 ${opts?.landscape ? "landscape" : "portrait"}; margin: 10mm 9mm; }
  * { box-sizing: border-box; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
  html, body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
  body { font-family: 'Sakkal Majalla', 'Traditional Arabic', 'Segoe UI', 'Tahoma', sans-serif; color: #111; margin: 0; font-size: 14px; line-height: 1.55; }
  .letterhead { display: flex; align-items: center; justify-content: space-between; border-bottom: 2.5px solid ${MAROON}; padding-bottom: 6px; margin-bottom: 10px; gap: 10px; }
  .lh-logo { height: 52px; width: auto; }
  .lh-school { color: ${MAROON}; font-weight: 700; font-size: 14.5px; text-align: right; max-width: 45%; line-height: 1.5; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 8px; }
  th, td { border: 1px solid #6b6b6b; padding: 5px 8px; text-align: right; vertical-align: top; font-size: 13.5px; }
  th, .hd { background: ${MAROON}; color: #fff; font-weight: 700; text-align: center; border-color: ${MAROON}; }
  tr:nth-child(even) td { background: #faf5f7; }
  .c { text-align: center; }
  .b { font-weight: 700; }
  .title { text-align: center; font-weight: 700; font-size: 18px; color: ${MAROON}; margin: 2px 0; }
  .subtitle { text-align: center; font-weight: 700; font-size: 14px; margin-bottom: 8px; }
  .school-line { display: flex; justify-content: space-between; font-size: 13px; margin-bottom: 6px; }
  .dots { border-bottom: 1.2px dotted #000; min-height: 20px; }
  .sigrow { display: flex; justify-content: space-between; margin-top: 16px; font-weight: 700; font-size: 14px; }
  .note { font-size: 12px; }
  .noborder td { border: none; }
  .vmfoot { margin-top: 14px; border-top: 2px solid ${MAROON}; padding-top: 6px; font-size: 11.5px; color: #333; line-height: 1.7; }
  .vm-label { color: ${MAROON}; font-weight: 700; }
  .heart { color: ${MAROON}; }
  .estamp { display: flex; align-items: center; gap: 10px; margin-top: 16px; border: 1.5px solid ${MAROON}; border-radius: 8px; padding: 8px 12px; width: fit-content; background: #faf5f7; }
  .estamp .qr { width: 64px; height: 64px; }
  .estamp-txt { text-align: right; }
  .estamp-title { color: ${MAROON}; font-weight: 700; font-size: 14px; }
  .estamp-sub { font-size: 10.5px; color: #555; margin-top: 2px; }
</style>
</head>
<body>${header}${body}${footer}</body>
</html>`;
}

const esc = (s?: string) => (s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/\n/g, "<br/>");
const dotted = (n = 3) => Array.from({ length: n }, () => `<div class="dots"></div>`).join("");

// ====================================================================
// 1) محضر اجتماع أكاديمي (جماعي) — مطابق لملف "اجتماع 12"
// ====================================================================
export function printGroupMeeting(m: any, s: Settings, sig?: string) {
  const sigImg = sig ? `<img src="${sig}" style="max-height:90px;max-width:70%;object-fit:contain" />` : "";
  const itemsRows = m.items
    .map((it: any) => {
      const heart = /شكر/.test(it.title) ? ' <span class="heart">❤</span>' : "";
      return `<tr><td class="b" style="width:24%">${esc(it.title)}${heart}</td><td>${esc(it.content)}</td></tr>`;
    })
    .join("");
  const body = `
  <div class="title">محضر اجتماع ( ${esc(m.number)} )</div>
  <div class="subtitle">العام الأكاديمي (${esc(s.academicYear)})</div>
  <table>
    <tr><th colspan="4">محضر اجتماع أكاديمي</th></tr>
    <tr><td class="b" style="width:18%">اسم المدرسة</td><td style="width:32%">${esc(s.school)}</td><td class="b" style="width:18%">تاريخ الاجتماع</td><td>${esc(m.date)}</td></tr>
    <tr><td class="b">مكان الاجتماع</td><td>${esc(m.place)}</td><td class="b">الاجتماع بقيادة</td><td>${esc(m.leader)}</td></tr>
    <tr><td class="b">الحضور</td><td>${esc(m.attendees)}</td><td class="b">الغياب</td><td>${esc(m.absentees) || "لا يوجد"}</td></tr>
    <tr><td class="b">وقت الاجتماع</td><td>${esc(m.time)}</td><td class="b">مديرة المدرسة</td><td>${esc(s.principal)}</td></tr>
  </table>
  ${m.followUp ? `<table><tr><th>متابعة التوصيات</th></tr><tr><td>${esc(m.followUp)}</td></tr></table>` : ""}
  <table>
    <tr><th style="width:24%">بنود الاجتماع</th><th>ما تم مناقشته</th></tr>
    ${itemsRows}
  </table>
  ${m.recommendations ? `<table><tr><th>التوصيات</th></tr><tr><td>${esc(m.recommendations)}</td></tr></table>` : ""}
  <table><tr><th>توقيع الحضور والعِلم</th></tr>
    <tr><td style="height:80px;text-align:center">${sigImg}</td></tr>
  </table>`;
  return printHtml(officialPage(body, { s }));
}

// ====================================================================
// 2) محضر اجتماع فردي — مطابق لملف "محضر اجتماع فردي"
// ====================================================================
export function printIndividualMeeting(m: any, s: Settings, sig?: string) {
  const sigImg = sig ? `<img src="${sig}" style="max-height:70px;max-width:80%;object-fit:contain" />` : "";
  const rows = m.items
    .map((it: any) => `<tr><td class="b c" style="width:18%">${esc(it.title)}</td><td>${esc(it.content)}</td></tr>`)
    .join("");
  const body = `
  <table>
    <tr><th colspan="4">محضر اجتماع فردي ${m.number ? `رقم (${esc(m.number)})` : ""} ${esc(s.department)}</th></tr>
    <tr>
      <td class="b" style="width:18%">اسم المدرسة</td><td style="width:32%">${esc(s.school)}</td>
      <td class="b" style="width:18%">تاريخ الاجتماع</td><td>${esc(m.date)}</td>
    </tr>
    <tr>
      <td class="b">اسم المنسق</td><td>${esc(s.coordinator)}</td>
      <td class="b">اسم المعلم</td><td>${esc(m.teacherName)}</td>
    </tr>
    <tr><td class="b">هدف الاجتماع</td><td colspan="3">${esc(m.goal)}</td></tr>
  </table>
  <table>
    <tr><th colspan="2">محاور الاجتماع</th></tr>
    <tr><td class="hd" style="width:18%">المحور</td><td class="hd">ما تم مناقشته / التوصيات</td></tr>
    ${rows}
    ${m.followUp ? `<tr><td class="b c">خطوات قادمة</td><td>${esc(m.followUp)}</td></tr>` : ""}
    <tr><td class="b">توقيع المعلم</td><td style="height:60px;text-align:center">${sigImg}</td></tr>
    <tr><td class="b">توقيع المنسق</td><td></td></tr>
  </table>`;
  return printHtml(officialPage(body, { s }));
}

// ====================================================================
// 3) استمارة التقرير الشهري للمنسق — مطابقة للملف الأصلي (دمج المجال الرئيسي)
// ====================================================================
export function printMonthlyReport(r: any, s: Settings) {
  // دمج خلايا المجال الرئيسي المتكرر تماماً كما في الاستمارة
  const groups: { domain: string; rows: any[] }[] = [];
  for (const sec of r.sections) {
    const last = groups[groups.length - 1];
    if (last && last.domain === sec.domain) last.rows.push(sec);
    else groups.push({ domain: sec.domain, rows: [sec] });
  }
  const rows = groups
    .map((g) =>
      g.rows
        .map(
          (row, i) =>
            `<tr>${i === 0 ? `<td class="b c" rowspan="${g.rows.length}" style="width:18%">${esc(g.domain)}</td>` : ""}` +
            `<td style="width:22%">${esc(row.subDomain)}</td><td style="width:35%">${esc(row.summary)}</td><td>${esc(row.notes)}</td></tr>`
        )
        .join("")
    )
    .join("");
  const body = `
  <div class="title">استمارة التقرير الشهري لمنسق — العام الأكاديمي ${esc(s.academicYear)}</div>
  <div class="subtitle">${esc(s.school)} — ${esc(s.department)} — شهر ${esc(r.month)}</div>
  <table>
    <tr><th style="width:18%">المجالات الرئيسية</th><th style="width:22%">المجال الفرعي</th><th style="width:35%">ملخص ما تم</th><th>الملاحظات</th></tr>
    ${rows}
    <tr><th colspan="4">التغذية الراجعة من النائب الأكاديمي:</th></tr>
    <tr><td colspan="4" style="height:60px">${esc(r.deputyFeedback)}</td></tr>
  </table>
  <table>
    <tr><th style="width:50%">اسم المنسق / التوقيع</th><th>اسم النائب الأكاديمي / التوقيع</th></tr>
    <tr><td style="height:45px">${esc(s.coordinator)}</td><td>${esc(s.academicDeputy)}</td></tr>
  </table>`;
  return printHtml(officialPage(body, { s }));
}

// ====================================================================
// 4) استمارة تقييم أداء المعلم — مطابقة للنموذج الوزاري (7 مجالات + النسب)
// ====================================================================
const ANNUAL_DOMAIN_META: Record<string, { num: string; pct: string }> = {
  "التخطيط لتطوير أداء وتحصيل الطلبة": { num: "1", pct: "15%" },
  "إشراك الطلبة في عملية التعلم وتطويرهم كمتعلمين": { num: "2", pct: "25%" },
  "توفير بيئة تعلم آمنة وداعمة ومثيرة للتحدي": { num: "3", pct: "10%" },
  "تقييم تعلم الطلبة واستخدام بيانات التقييم": { num: "4", pct: "15%" },
  "إظهار ممارسات مهنية عالية الجودة والتطوير المهني": { num: "5", pct: "10%" },
  "الحفاظ على الشراكة الفاعلة مع أولياء الأمور والمجتمع": { num: "6", pct: "10%" },
  "الجوانب الشخصية والمهنية": { num: "7", pct: "15%" },
};

export function printAnnualEvaluation(e: any, s: Settings) {
  const groups: { domain: string; rows: any[] }[] = [];
  for (const ind of e.indicators) {
    const last = groups[groups.length - 1];
    if (last && last.domain === ind.domain) last.rows.push(ind);
    else groups.push({ domain: ind.domain, rows: [ind] });
  }
  const indicatorRows = groups
    .map((g) => {
      const meta = ANNUAL_DOMAIN_META[g.domain] ?? { num: "", pct: "" };
      return g.rows
        .map(
          (r, i) =>
            `<tr>` +
            (i === 0
              ? `<td class="b c" rowspan="${g.rows.length}" style="width:5%">${meta.num}</td>` +
                `<td class="b c" rowspan="${g.rows.length}" style="width:14%">${esc(g.domain)}</td>` +
                `<td class="c" rowspan="${g.rows.length}" style="width:7%">${meta.pct}</td>`
              : "") +
            `<td class="c" style="width:6%">${r.code}</td><td>${esc(r.indicator)}</td>` +
            `<td class="c" style="width:8%">${r.maxScore}</td><td class="c" style="width:8%">${r.score}</td></tr>`
        )
        .join("");
    })
    .join("");

  const penalties = (e.penalties ?? []).length
    ? e.penalties.map((p: any, i: number) => `<tr><td class="c">${i + 1}</td><td>${esc(p.type)}</td><td>${esc(p.reason)}</td><td>${esc(p.date)}</td></tr>`).join("")
    : `<tr><td class="c">1</td><td>لا يوجد</td><td></td><td></td></tr><tr><td class="c">2</td><td></td><td></td><td></td></tr>`;

  const courses = (e.courses ?? []).length
    ? e.courses.map((c: any, i: number) => `<tr><td class="c">${i + 1}</td><td>${esc(c.name)}</td><td>${esc(c.place)}</td><td>${esc(c.duration)}</td><td>${esc(c.date)}</td></tr>`).join("")
    : `<tr><td class="c">1</td><td></td><td></td><td></td><td></td></tr><tr><td class="c">2</td><td></td><td></td><td></td><td></td></tr>`;

  const body = `
  <div class="title">استمارة تقييم أداء المعلم</div>
  <div class="subtitle">العام الأكاديمي (${esc(e.year)})</div>
  <div class="b">اسم المدرسة: ${esc(s.school)}</div>
  <table>
    <tr>
      <td class="b" style="width:22%">اسم الموظف الرباعي</td><td>${esc(e.teacherName)}</td>
      <td class="b" style="width:18%">الرقم الوظيفي</td><td>${esc(e.employeeNumber)}</td>
    </tr>
    <tr>
      <td class="b">تاريخ التعيين</td><td>${esc(e.hireDate)}</td>
      <td class="b">الرقم الشخصي</td><td>${esc(e.nationalId)}</td>
    </tr>
    <tr>
      <td class="b">المسمى الوظيفي</td><td>${esc(e.jobTitle) || "معلمة"}</td>
      <td class="b">الجنسية</td><td>${esc(e.nationality)}</td>
    </tr>
  </table>
  <div class="b">الجزاءات التأديبية التي وقعت على الموظف خلال سنة التقييم:</div>
  <table>
    <tr><th style="width:6%">م</th><th>نوع الجزاء</th><th>سبب الجزاء</th><th style="width:18%">تاريخ الجزاء</th></tr>
    ${penalties}
  </table>
  <div class="b">الدورات التدريبية التي حصل عليها الموظف خلال سنة التقييم:</div>
  <table>
    <tr><th style="width:6%">م</th><th>اسم الدورة</th><th>مكان الانعقاد</th><th style="width:12%">المدة</th><th style="width:14%">التاريخ</th></tr>
    ${courses}
  </table>
  <table>
    <tr><th style="width:5%">م</th><th style="width:14%">المجال الرئيسي</th><th style="width:7%">النسبة المئوية</th><th style="width:6%">م</th><th>مؤشرات الأداء الفرعية</th><th style="width:8%">الدرجة المقررة</th><th style="width:8%">الدرجة المستحقة</th></tr>
    ${indicatorRows}
    <tr><td colspan="5" class="hd">مستوى تقييم الأداء</td><td class="c b">100</td><td class="c b">${e.total}</td></tr>
    <tr><td class="b" colspan="2">ملاحظات</td><td colspan="5">${esc(e.notes)}</td></tr>
  </table>
  <table>
    <tr><th style="width:50%">لا يجوز تقييم أداء الموظفين بمستوى ممتاز أو جيد جداً للفئات التالية:</th><th>لا يجوز تقييم أداء الموظفين بمستوى ممتاز للفئات التالية:</th></tr>
    <tr>
      <td class="note">• الموظف الذي أتيحت له فرصة تدريب وتخلف عنه دون عذر مقبول.<br/>• الموظف الذي وقع عليه جزاء تأديبي بالخصم من راتبه أو الوقف عن العمل لمدة تزيد على عشرة أيام أو وقعت عليه جزاءات تجاوز مجموعها الخصم من الراتب أو الوقف عن العمل خمسة عشر يوماً خلال العام أو أي جزاء آخر أشد.<br/>• الموظف الذي انقطع عن العمل بدون عذر مقبول مدة تزيد على عشرة أيام خلال العام.</td>
      <td class="note">• الموظف الذي أتيحت له فرصة تدريب خلال العام ولم يجتزه بنجاح.<br/>• الموظف الذي وقع عليه جزاء تأديبي بالخصم من راتبه أو الوقف عن العمل لمدة تزيد على خمسة أيام أو وقعت عليه جزاءات تجاوز مجموعها الخصم من الراتب أو الوقف عن العمل لمدة تزيد على عشرة أيام خلال العام أو أي جزاء آخر أشد.<br/>• الموظف الذي انقطع عن العمل بدون عذر مقبول مدة تزيد على خمسة أيام خلال العام.</td>
    </tr>
  </table>
  <table>
    <tr><th>ممتاز</th><th>جيد جداً</th><th>جيد</th><th>مقبول</th><th>ضعيف</th></tr>
    <tr><td class="c">90-100%</td><td class="c">76-89%</td><td class="c">66-75%</td><td class="c">50-65%</td><td class="c">أقل من 50%</td></tr>
    <tr>
      <td class="c b">${e.levelLabel === "ممتاز" ? "✔" : ""}</td><td class="c b">${e.levelLabel === "جيد جداً" ? "✔" : ""}</td>
      <td class="c b">${e.levelLabel === "جيد" ? "✔" : ""}</td><td class="c b">${e.levelLabel === "مقبول" ? "✔" : ""}</td>
      <td class="c b">${e.levelLabel === "ضعيف" ? "✔" : ""}</td>
    </tr>
  </table>
  <p class="note">ملاحظة: يعلن الموظف بنسخة من تقرير تقييم الأداء بمجرد اعتماده ويجوز للموظف أن يتظلم خلال خمسة عشر يوماً من تاريخ علمه، ولا يعتبر التقرير نهائياً إلا بعد انقضاء ميعاد التظلم منه أو البت فيه.</p>
  <table>
    <tr><th>اسم الموظف</th><th>توقيع الموظف</th><th>تاريخ الاستلام<br/><span class="note">(تدوين التاريخ في حالة رفض التوقيع)</span></th></tr>
    <tr><td style="height:40px">${esc(e.teacherName)}</td><td></td><td></td></tr>
  </table>
  <table>
    <tr><th style="width:50%">اسم مدير المدرسة</th><th>توقيع مدير المدرسة</th></tr>
    <tr><td style="height:40px">${esc(s.principal)}</td><td></td></tr>
  </table>`;
  return printHtml(officialPage(body, { s }));
}

// ====================================================================
// 5) التقرير الدوري للمعلمات — مطابق للملف (مجالات × 1/2/3 + مفتاح)
// ====================================================================
export function printPeriodicReport(r: any, s: Settings) {
  const groups: { domain: string; rows: any[] }[] = [];
  for (const sc of r.scores) {
    const last = groups[groups.length - 1];
    if (last && last.domain === sc.domain) last.rows.push(sc);
    else groups.push({ domain: sc.domain, rows: [sc] });
  }
  const tables = groups
    .map(
      (g) => `
  <table>
    <tr><th style="width:14%">المجال</th><th>المجالات والممارسات</th><th style="width:6%">1</th><th style="width:6%">2</th><th style="width:6%">3</th><th style="width:20%">ملاحظات وتوصيات</th></tr>
    ${g.rows
      .map(
        (row, i) =>
          `<tr>${i === 0 ? `<td class="b c" rowspan="${g.rows.length}">${esc(g.domain)}</td>` : ""}` +
          `<td>${esc(row.practice)}</td>` +
          `<td class="c">${row.score === 1 ? "✔" : ""}</td><td class="c">${row.score === 2 ? "✔" : ""}</td><td class="c">${row.score === 3 ? "✔" : ""}</td>` +
          `<td>${esc(row.note)}</td></tr>`
      )
      .join("")}
  </table>`
    )
    .join("");

  const body = `
  <div class="title">التقرير الدوري للمعلمات</div>
  <table>
    <tr>
      <td class="b" style="width:15%">الشهر</td><td style="width:35%">${esc(r.month)}</td>
      <td class="b" style="width:15%">القسم</td><td>${esc(s.department)}</td>
    </tr>
    <tr>
      <td class="b">اسم المعلمة</td><td>${esc(r.teacherName)}</td>
      <td class="b">التاريخ</td><td>${esc(r.date)}</td>
    </tr>
  </table>
  ${tables}
  <table>
    <tr><td class="b" style="width:15%">ملاحظات:</td><td>${esc(r.generalNotes) || dotted(3)}</td></tr>
  </table>
  <table>
    <tr><th style="width:33%">1</th><th style="width:33%">2</th><th>3</th></tr>
    <tr><td class="c">مستكمل الأدلة</td><td class="c">معظم الأدلة متوفرة</td><td class="c">بعض الأدلة متوفرة</td></tr>
  </table>
  <table style="margin-top:18px">
    <tr>
      <th style="width:50%;text-align:center">توقيع المعلمة</th>
      <th style="width:50%;text-align:center">توقيع المنسقة</th>
    </tr>
    <tr>
      <td style="height:50px"></td>
      <td style="height:50px"></td>
    </tr>
  </table>`;
  return printHtml(officialPage(body, { s }));
}

// ====================================================================
// 6) متابعة تصحيح الأعمال الكتابية — مطابق لملف "التربية الإسلامية" (عرضي)
// ====================================================================
export function printWrittenWorkSheet(
  students: any[], records: any[], meta: { grade: string; section: string; subject: string; teacherName?: string; term?: string }, s: Settings
) {
  const recFor = (name: string) => records.find((r) => r.studentName === name);
  const rows = students
    .map((st, i) => {
      const r = recFor(st.name);
      const nb = r?.notebook, hw = r?.homework, qz = r?.quizzes;
      return `<tr>
        <td class="c" style="width:3%">${i + 1}</td><td style="width:16%">${esc(st.name)}</td>
        <td class="c">${esc(nb?.date)}</td><td class="c">${nb ? nb.continuity : ""}</td><td class="c">${nb ? nb.accuracy : ""}</td><td class="c">${nb ? nb.reinforcement : ""}</td><td class="c">${nb ? nb.correction : ""}</td>
        <td class="c">${esc(hw?.date)}</td><td class="c">${hw ? hw.accuracy : ""}</td><td class="c">${hw ? hw.reinforcement : ""}</td><td class="c">${hw ? hw.correction : ""}</td>
        <td class="c">${esc(qz?.date)}</td><td class="c">${qz ? qz.accuracy : ""}</td><td class="c">${qz ? qz.reinforcement : ""}</td>
        <td>${esc(r?.feedback)}</td>
      </tr>`;
    })
    .join("");
  const body = `
  <table>
    <tr><th colspan="15">متابعة تصحيح الأعمال الكتابية لقسم المسار الأدبي لمادة ${esc(meta.subject)}</th></tr>
    <tr>
      <td class="b" style="width:8%">المدرسة</td><td colspan="6">${esc(s.school)}</td>
      <td class="b" colspan="2">مفتاح التقييم</td>
      <td class="c">0<br/>ضعيف</td><td class="c">1<br/>مقبول</td><td class="c">2<br/>جيد</td><td class="c" colspan="3">3<br/>متميز</td>
    </tr>
    <tr>
      <td class="b">المنسق/ـة</td><td colspan="2">${esc(s.coordinator)}</td>
      <td class="b" colspan="2">المعلم/ـة</td><td colspan="2">${esc(meta.teacherName)}</td>
      <td class="b" colspan="2">الفصل الدراسي</td><td colspan="6">${esc(meta.term)} — الصف ${esc(meta.grade)} ${esc(meta.section)}</td>
    </tr>
    <tr>
      <td class="hd" rowspan="2">م</td><td class="hd" rowspan="2">اسم الطالب/ـة</td>
      <td class="hd" colspan="5">المصدر الرئيسي / كراسات الطلبة</td>
      <td class="hd" colspan="4">الواجبات المقيمة</td>
      <td class="hd" colspan="3">التقييمات القصيرة</td>
      <td class="hd" rowspan="2">التغذية الراجعة</td>
    </tr>
    <tr>
      <td class="hd">التاريخ</td><td class="hd">الاستمرارية</td><td class="hd">الدقة</td><td class="hd">التعزيز</td><td class="hd">متابعة تصويب الأخطاء</td>
      <td class="hd">التاريخ</td><td class="hd">الدقة</td><td class="hd">التعزيز</td><td class="hd">متابعة تصويب الأخطاء</td>
      <td class="hd">التاريخ</td><td class="hd">الدقة</td><td class="hd">التعزيز</td>
    </tr>
    ${rows}
  </table>
  <table>
    <tr><th colspan="2">مفاتيح متابعة المعلم لأعمال الطلبة</th></tr>
    <tr><td class="b" style="width:22%">الاستمرارية</td><td>استمرار المعلم بالتصحيح بشكل أسبوعي مع تدوين التاريخ عند التصحيح.</td></tr>
    <tr><td class="b">الدقة</td><td>مراعاة الدقة العلمية في تصحيح أعمال الطلبة.</td></tr>
    <tr><td class="b">التعزيز</td><td>تدوين عبارات تشجيعية ومحفزة مع تقديم تغذية راجعة إيجابية.</td></tr>
    <tr><td class="b">متابعة تصويب الأخطاء</td><td>متابعة تصويب أخطاء الطلبة بشكل أسبوعي.</td></tr>
    <tr><th colspan="2">آلية متابعة المنسق للاستمارة</th></tr>
    <tr><td class="b">عدد الشعب 6 فأقل</td><td>يتم تخصيص استمارة متابعة لكل مادة لجميع أعمال الطلبة قبل كل اختبار (منتصف / نهاية).</td></tr>
    <tr><td class="b">عدد الشعب 7 فأكثر</td><td>يتم تخصيص استمارة متابعة لكل مادة لجميع أعمال الطلبة خلال الفصل الدراسي الواحد.</td></tr>
  </table>
  <div class="sigrow"><span>توقيع المنسق : ...................................</span><span>توقيع المعلم: ...................................</span></div>`;
  return printHtml(officialPage(body, { landscape: true, s }));
}

// ====================================================================
// 7) التقرير الكمي الوصفي لنتائج الاختبارات — مطابق للملف الأصلي
// ====================================================================
export function printExamReport(e: any, s: Settings) {
  const grade = e.grade ?? e.rows?.[0]?.grade ?? "";
  // المادة لكل شعبة (مع التوافق للتقارير القديمة التي تحمل المادة على مستوى التقرير)
  const subjectOf = (r: any) => r.subject ?? e.subject ?? "";
  const subjects = Array.from(new Set(e.rows.map(subjectOf))) as string[];
  const tables = subjects
    .map((subj) => {
      const rows = e.rows.filter((r: any) => subjectOf(r) === subj);
      const hasCounts = rows.some((r: any) => r.highCount != null || r.midCount != null || r.lowCount != null || r.failCount != null);
      const cnt = (v: any) => (v == null ? "" : v);
      const sum = (k: string) => rows.reduce((a: number, r: any) => a + (r[k] ?? 0), 0);
      // متوسط النِسب عبر الشُعب (الجمع لا معنى له مع النسب المئوية)
      const avg = (k: string) => {
        const vals = rows.map((r: any) => r[k]).filter((v: any) => v != null && v !== "");
        if (!vals.length) return "";
        const m = vals.reduce((a: number, b: any) => a + Number(b), 0) / vals.length;
        return (Math.round(m * 10) / 10).toString().replace(/\.0$/, "");
      };
      const head = `الصف ${esc(grade)}${subj ? ` — ${esc(subj)}` : ""}`;
      const countRows = hasCounts ? `
    <tr><td class="b">عدد الطلبة ذوي الأداء المرتفع .</td>${rows.map((r: any) => `<td class="c">${cnt(r.highCount)}</td>`).join("")}<td class="c b">${sum("highCount")}</td></tr>
    <tr><td class="b">عدد الطلبة ذوي الأداء المتوسط .</td>${rows.map((r: any) => `<td class="c">${cnt(r.midCount)}</td>`).join("")}<td class="c b">${sum("midCount")}</td></tr>
    <tr><td class="b">عدد الطلبة ذوي الأداء المتدني .</td>${rows.map((r: any) => `<td class="c">${cnt(r.lowCount)}</td>`).join("")}<td class="c b">${sum("lowCount")}</td></tr>
    <tr><td class="b">عدد الطلبة الراسبين .</td>${rows.map((r: any) => `<td class="c">${cnt(r.failCount)}</td>`).join("")}<td class="c b">${sum("failCount")}</td></tr>` : "";
      // أعلى/أقل نسبة تحصيل لهذه المادة — أسفل جدولها مباشرة
      const max = rows.reduce((a: any, b: any) => (a.achievementRate >= b.achievementRate ? a : b));
      const min = rows.reduce((a: any, b: any) => (a.achievementRate <= b.achievementRate ? a : b));
      const summary = `
  <table>
    <tr><td class="b" style="width:50%">أعلى نسبة تحصيل أكاديمي${subj ? ` (${esc(subj)})` : ""}</td><td class="c">( ${max.achievementRate}% ) الصف ${esc(grade)} ${max.section}</td></tr>
    <tr><td class="b">أقل نسبة تحصيل أكاديمي${subj ? ` (${esc(subj)})` : ""}</td><td class="c">( ${min.achievementRate}% ) الصف ${esc(grade)} ${min.section}</td></tr>
  </table>`;
      return `
  <table>
    <tr><th style="width:30%">${head} بالبنود</th>${rows.map((r: any) => `<th>المرحلة الدراسية<br/>الصف ${esc(grade)} ${r.section}</th>`).join("")}${hasCounts ? '<th>المجموع</th>' : ''}</tr>
    <tr><td class="b">نسبة النجاح في الاختبار .</td>${rows.map((r: any) => `<td class="c">${r.passRate}%</td>`).join("")}${hasCounts ? `<td class="c b">${avg("passRate")}%</td>` : ''}</tr>
    <tr><td class="b">نسبة التحصيل الأكاديمي.</td>${rows.map((r: any) => `<td class="c">${r.achievementRate}%</td>`).join("")}${hasCounts ? `<td class="c b">${avg("achievementRate")}%</td>` : ''}</tr>
    <tr><td class="b">القيمة المضافة للتحصيل الأكاديمي .</td>${rows.map((r: any) => `<td class="c">${r.addedValue}%</td>`).join("")}${hasCounts ? `<td class="c b">${avg("addedValue")}%</td>` : ''}</tr>
    ${countRows}
  </table>${summary}`;
    })
    .join("");

  const gradeLabel = grade ? `الصف ${esc(grade)}` : "";
  const body = `
  <table><tr><th>تقرير كمي وصفي لقراءة نتائج ${esc(e.title)} لقسم المسار الأدبي${gradeLabel ? ` — ${gradeLabel}` : ""}<br/>للعام الأكاديمي ${esc(e.year)}</th></tr></table>
  ${tables}
  <table>
    <tr><td class="b" style="width:25%">أسباب ارتفاع نتائج الطلبة</td><td>${esc(e.riseReasons) || dotted(2)}</td></tr>
    <tr><td class="b">أسباب انخفاض نتائج الطلبة</td><td>${esc(e.declineReasons) || dotted(2)}</td></tr>
  </table>
  <table>
    <tr><th>التقرير الوصفي للنتائج</th></tr>
    <tr><td class="b">تحديد المعايير / المهارات المشتركة غير المحققة وأسباب التدني.</td></tr>
    <tr><td>${esc(e.unmetStandards) || dotted(2)}</td></tr>
    <tr><td class="b">الإجراءات العلاجية المشتركة لجميع الشعب.</td></tr>
    <tr><td>${esc(e.remedialActions) || dotted(2)}</td></tr>
    <tr><td class="b">الإجراءات الإثرائية المشتركة لجميع الشعب.</td></tr>
    <tr><td>${esc(e.enrichmentActions) || dotted(2)}</td></tr>
  </table>
  <div class="b">توصيات المنسق المقترحة للنائبة الأكاديمية :-</div>
  <p>${esc(e.coordinatorRecommendations) || dotted(3)}</p>
  <div class="b">توصيات النائبة الأكاديمية:-</div>
  ${dotted(3)}
  <div class="sigrow"><span>توقيع المنسقة:</span><span>توقيع النائبة الأكاديمية :</span></div>`;
  return printHtml(officialPage(body, { s }));
}

// ====================================================================
// 7b) خطة متابعة توصيات (موجه تربوي) — طبق الأصل من الملف
// ====================================================================
export function printGuidePlan(p: any, s: Settings) {
  const rows = (p.rows ?? []).length
    ? p.rows.map((r: any) => `<tr>
        <td>${esc(r.guideName)}</td>
        <td class="c">${esc(r.visitDate)}</td>
        <td>${esc(r.domain)}</td>
        <td>${esc(r.actions)}</td>
        <td class="c">${esc(r.period)}</td>
        <td class="c">${esc(r.followDate)}</td>
        <td>${esc(r.indicators)}</td>
      </tr>`).join("")
    : Array.from({ length: 4 }, () => `<tr><td style="height:30px"></td><td></td><td></td><td></td><td></td><td></td><td></td></tr>`).join("");
  const body = `
  <table><tr><th colspan="8">خطة متابعة توصيات (موجه تربوي) — ${esc(s.department)}</th></tr>
    <tr>
      <td class="b" style="width:12%">اسم المدرسة</td><td>${esc(s.school)}</td>
      <td class="b" style="width:10%">اسم المنسق</td><td>${esc(s.coordinator)}</td>
      <td class="b" style="width:10%">اسم المعلم</td><td>${esc(p.teacherName)}</td>
      <td class="b" style="width:10%">الصف والشعبة</td><td>${esc(p.grade)} ${esc(p.section)}</td>
    </tr>
  </table>
  <table>
    <tr>
      <th style="width:13%">اسم (الموجه التربوي)</th><th style="width:11%">تاريخ الزيارة / المادة</th>
      <th style="width:14%">المجال / المؤشر</th><th>الإجراءات<br/><span class="note">(حضور صفّي، حلقة نقاشية، اجتماع، جلسات تحضير جماعي...)</span></th>
      <th style="width:10%">الفترة الزمنية</th><th style="width:11%">تاريخ المتابعة من المنسق</th><th style="width:15%">مؤشرات تحقق الأداء</th>
    </tr>
    ${rows}
  </table>
  ${p.notes ? `<table><tr><td class="b" style="width:15%">ملاحظات</td><td>${esc(p.notes)}</td></tr></table>` : ""}
  <table>
    <tr><th style="width:33%">توقيع المعلم</th><th style="width:33%">توقيع المنسق</th><th>توقيع النائب الأكاديمي</th></tr>
    <tr><td style="height:40px"></td><td>${esc(s.coordinator)}</td><td>${esc(s.academicDeputy)}</td></tr>
  </table>
  <table><tr><td class="b" style="width:12%">ملاحظة</td><td class="note">تُستخدم هذه الاستمارة فقط في حال حصول المعلم في استمارات الزيارة الصفية على مؤشرات لم تتوفر لها الأدلة، أو توفرت بشكل محدود، أو توفرت لها بعض الأدلة، كما تُستخدم في حال تكرار التوصيات في أكثر من زيارة صفية.</td></tr></table>`;
  return printHtml(officialPage(body, { landscape: true, s }));
}

// ====================================================================
// 7c) خطة تطوير المعلمة حسب فئتها (تطوير ذاتي / دعم...) — بنود الفئة الرسمية
// ====================================================================
export function printDevPlan(p: any, s: Settings) {
  const rows = (p.rows ?? []).length
    ? p.rows.map((r: any, i: number) => `<tr>
        <td class="c">${i + 1}</td>
        <td>${esc(r.action)}</td>
        <td>${esc(r.mechanism)}</td>
        <td class="c">${esc(r.period)}</td>
        <td>${esc(r.indicator)}</td>
      </tr>`).join("")
    : Array.from({ length: 4 }, (_, i) => `<tr><td class="c">${i + 1}</td><td style="height:30px"></td><td></td><td></td><td></td></tr>`).join("");
  const body = `
  <table><tr><th colspan="4">خطة تطوير المعلمة — ${esc(s.department)}</th></tr>
    <tr>
      <td class="b" style="width:13%">اسم المدرسة</td><td>${esc(s.school)}</td>
      <td class="b" style="width:13%">العام الأكاديمي</td><td>${esc(s.academicYear)}</td>
    </tr>
    <tr>
      <td class="b">اسم المعلمة</td><td>${esc(p.teacherName)}</td>
      <td class="b">الصف / الشعبة</td><td>${esc(p.grade)} ${esc(p.section)}</td>
    </tr>
    <tr>
      <td class="b">فئة الأداء</td><td>${esc(p.category)}</td>
      <td class="b">تاريخ الخطة</td><td>${esc(p.date)}</td>
    </tr>
  </table>
  ${p.criteria ? `<table><tr><td class="b" style="width:13%">معايير الفئة</td><td>${esc(p.criteria)}</td></tr></table>` : ""}
  <table>
    <tr>
      <th style="width:5%">م</th><th style="width:34%">الإجراء / البند</th>
      <th style="width:26%">آلية التنفيذ</th><th style="width:13%">الفترة الزمنية</th><th>مؤشر الأداء / الأثر</th>
    </tr>
    ${rows}
  </table>
  ${p.notes ? `<table><tr><td class="b" style="width:13%">ملاحظات</td><td>${esc(p.notes)}</td></tr></table>` : ""}
  <table>
    <tr><th style="width:33%">توقيع المعلمة</th><th style="width:33%">توقيع المنسقة</th><th>توقيع النائبة الأكاديمية</th></tr>
    <tr><td style="height:40px"></td><td>${esc(s.coordinator)}</td><td>${esc(s.academicDeputy)}</td></tr>
  </table>`;
  return printHtml(officialPage(body, { s }));
}

// ====================================================================
// 8) الجدول الشهري لزيارات المنسق — مطابق لملف "مايو"
// ====================================================================
export function printVisitsSchedule(visits: any[], month: string, s: Settings) {
  const rows = visits
    .map(
      (x, i) => `<tr>
      <td class="c">${i + 1}</td><td>${esc(x.teacherName)}</td><td class="c">${esc(x.grade)} /${esc(x.section)}</td>
      <td class="c">${esc(x.date)}</td><td>${esc(x.subject)}</td><td>${esc(x.lesson)}</td>
      <td class="c">${esc(x.attendanceType)}</td>
      <td>${esc(x.purpose)}</td>
    </tr>`
    )
    .join("");
  const empty = Array.from({ length: Math.max(0, 8 - visits.length) }, () =>
    `<tr><td style="height:26px"></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td></tr>`).join("");
  const body = `
  <table>
    <tr><th colspan="8">الجدول الشهري لزيارات المنسق لقسم ${esc(s.department)}</th></tr>
    <tr>
      <td class="b" style="width:12%">اسم المدرسة</td><td colspan="5">${esc(s.school)}</td>
      <td class="b" style="width:8%">الشهر</td><td>${esc(month)}</td>
    </tr>
    <tr>
      <th style="width:4%">م</th><th style="width:17%">اسم المعلم</th><th style="width:8%">الصف</th><th style="width:9%">التاريخ</th>
      <th style="width:13%">المادة</th><th style="width:16%">عنوان الدرس</th><th style="width:8%">النوع<br/><span class="note">(كلي/جزئي)</span></th>
      <th>هدف الزيارة<br/><span class="note">(زيارة تشخيصية – قياس أثر – متابعة توصيات – متابعة أداء الطلبة ....)</span></th>
    </tr>
    ${rows}${empty}
  </table>`;
  return printHtml(officialPage(body, { landscape: true, s }));
}

// ====================================================================
// 15) استمارة زيارة المنسق الصفية لمعلم — طبق الأصل (22 مؤشراً)
// ====================================================================
const CV_DOMAINS = [
  { domain: "1. التخطيط", inds: [
    ["1.1", "خطة الدرس متوفرة وبنودها مستكملة وذات جودة."],
    ["1.2", "أهداف التعلم ذكية (شاملة ومتدرجة، دقيقة الصياغة، ومتنوعة، قابلة للقياس)."],
    ["1.3", "أنشطة الدرس الرئيسية واضحة ومتدرجة ومرتبطة بالأهداف وتراعي الفروق الفردية."],
  ]},
  { domain: "2. تنفيذ الدرس", inds: [
    ["2.1", "أهداف التعلم معروضة ويتم مناقشتها."],
    ["2.2", "أنشطة التمهيد مفعلة بشكل مناسب."],
    ["2.3", "محتوى الدرس واضح والعرض منظم ومترابط."],
    ["2.4", "طرائق التدريس واستراتيجيات متنوعة وتتمحور حول الطالب."],
    ["2.5", "مصادر التعلم الرئيسة والمساندة موظفة بصورة واضحة وسليمة."],
    ["2.6", "الوسائل التعليمية والتكنولوجيا موظفة بصورة مناسبة."],
    ["2.7", "المادة العلمية دقيقة ومناسبة ومطروحة بلغة سليمة."],
    ["2.8", "الكفايات الأساسية متضمنة في السياق المعرفي للدرس."],
    ["2.9", "التكامل مع المواد الأخرى والربط بالبيئة بشكل مناسب، وتفعيل القيم الأساسية في السياق المعرفي للدرس."],
    ["2.10", "الأسئلة الصفية ذات صياغة سليمة ومتدرجة ومثيرة لمهارات التفكير العليا."],
    ["2.11", "الفروق الفردية بين الطلبة يتم مراعاتها."],
    ["2.12", "غلق الدرس يتم بشكل مناسب."],
  ]},
  { domain: "3. التقويم", inds: [
    ["3.1", "أساليب التقويم (القبلي والبنائي والختامي) مناسبة ومتنوعة."],
    ["3.2", "التغذية الراجعة متنوعة ومستمرة."],
    ["3.3", "أعمال الطلبة متابعة، ومصححة بدقة، ورقيًا وإلكترونيًا."],
  ]},
  { domain: "4. الإدارة الصفية وبيئة التعلم", inds: [
    ["4.1", "البيئة الصفية إيجابية وآمنة وداعمة للتعلم."],
    ["4.2", "إدارة أنشطة التعلم والمشاركات الصفية تتم بصورة منظمة."],
    ["4.3", "قوانين إدارة الصف وإدارة السلوك مفعلة."],
    ["4.4", "الاستثمار الأمثل لزمن الحصة."],
  ]},
];

export function printClassVisit(v: any, s: Settings) {
  const scoreMap: Record<string, { score: number; recommendation?: string }> = {};
  (v.scores ?? []).forEach((x: any) => { scoreMap[x.code] = x; });
  const scoreCell = (code: string) => {
    const sc = scoreMap[code]?.score;
    return sc === undefined || sc < 0 ? "—" : String(sc);
  };

  const domainBlocks = CV_DOMAINS.map((d) =>
    `<tr><td class="hd" colspan="3">${d.domain}</td></tr>` +
    d.inds.map(([code, text]) =>
      `<tr><td style="width:42%">${code} ${esc(text)}</td><td class="c" style="width:8%">${scoreCell(code)}</td><td>${esc(scoreMap[code]?.recommendation)}</td></tr>`
    ).join("")
  ).join("");

  const followupRows = (v.followup ?? []).length
    ? (v.followup as string[]).map((f) => `<tr><td colspan="3">✔ ${esc(f)}</td></tr>`).join("")
    : `<tr><td colspan="3" style="height:24px"></td></tr>`;

  const body = `
  <table><tr><th>استمارة زيارة المنسق الصفية لمعلم — المرحلة التأسيسية – للعام الأكاديمي ${esc(s.academicYear)}</th></tr></table>
  <table>
    <tr><th colspan="4">المعلومـــــــات الأساسيّــــــة</th></tr>
    <tr><td class="b" style="width:18%">المــدرســــة</td><td style="width:32%">${esc(s.school)}</td><td class="b" style="width:18%">اليوم / التاريخ</td><td>${esc(v.date)}</td></tr>
    <tr><td class="b">المادّة الدراسية</td><td>${esc(v.subject)}</td><td class="b">الصّــــــــــف</td><td>${esc(v.grade)} ${esc(v.section)}</td></tr>
    <tr><td class="b">موضوع الدرس</td><td>${esc(v.lessonTopic)}</td><td class="b">الزائر</td><td>${esc(v.visitor) || esc(s.coordinator)}</td></tr>
    <tr><td class="b">اسم المعلم</td><td>${esc(v.teacherName)}</td><td class="b">نــوع الــزيــارة</td><td>${v.visitType === "كلية" ? "<b>☑ كليّة</b> &nbsp; ☐ جزئيّة" : "☐ كليّة &nbsp; <b>☑ جزئيّة</b>"}</td></tr>
  </table>
  <table>
    <tr><td class="c b" style="width:20%">معايير الأداء</td><td class="c b" colspan="2">3 = الأدلة مستكملة وفاعلة &nbsp;•&nbsp; 2 = تتوفر معظم الأدلة &nbsp;•&nbsp; 1 = تتوفر بعض الأدلة &nbsp;•&nbsp; 0 = الأدلة غير متوفرة أو محدودة &nbsp;•&nbsp; (—) لم يتم قياسه</td></tr>
  </table>
  <table>
    <tr><th colspan="3">مجالات تقييم الأداء</th></tr>
    <tr><th style="width:42%">المؤشرات</th><th style="width:8%">التقييم</th><th>التوصيات</th></tr>
    ${domainBlocks}
    <tr><th colspan="3">متابعة المنسقة</th></tr>
    ${followupRows}
    <tr><th colspan="3">ملاحظات وتوصيات عامّة</th></tr>
    <tr><td colspan="3" style="height:60px">${esc(v.recommendations)}</td></tr>
  </table>
  <div class="sigrow"><span>توقيع المنسق : ...................................</span><span>توقيع المعلم : ...................................</span></div>`;
  return printHtml(officialPage(body, { s }));
}

// ====================================================================
// 16) تصنيف أداء المعلمين — طبق الأصل
// ====================================================================
const TC_CATS = [
  { key: "مستجد", label: "فئة المستجد", criteria: "معلم مستجد للعام الدراسي ويظل في فئة المستجد حتى نهاية العام الدراسي.",
    actions: ["إعداد وتطبيق خطة تهيئة المعلم الجديد بالشراكة مع نائب المدير للشؤون الأكاديمية.", "القيام بعدد زيارات صفية كلية لا تقل عن زيارتين شهريًا."] },
  { key: "دعم مكثف", label: "فئة الدعم المكثف", criteria: "معلم جديد (سنتان فأقل في تدريس المناهج الوطنية). تدنٍ واضح في معظم جوانب الأداء استنادًا إلى استمارات الملاحظة الصفية وتقييمات الأعوام السابقة.",
    actions: ["تطبيق خطة تحسين الأداء تُعد من قبل المنسق ويطّلع عليها المعلم.", "توعية المعلم بمعايير التقدم للرخصة المهنية.", "القيام بعدد زيارات صفية كلية لا تقل عن زيارتين شهريًا."] },
  { key: "دعم عام", label: "فئة الدعم العام", criteria: "خبرة سنتان فأكثر في تدريس المناهج الوطنية. تدنٍ في بعض جوانب الأداء استنادًا إلى استمارات الملاحظة الصفية.",
    actions: ["متابعة الأداء بناءً على تحديد الجوانب التي يحتاج فيها المعلم إلى الدعم والتطوير.", "تهيئة المعلم للتقدم للرخص المهنية.", "القيام بزيارة صفية كلية مرة واحدة وزيارة جزئية موجهة مرة واحدة شهريًا."] },
  { key: "تطوير ذاتي", label: "فئة التطوير الذاتي", criteria: "الخبرة 5 سنوات فأكثر في تدريس المناهج الوطنية. لديه كفاءة عالية في معظم جوانب الأداء بما ينعكس على تحسين تعلم الطلبة؛ وذلك استنادًا إلى استمارات الملاحظة الصفية.",
    actions: ["تطبيق خطة تطوير ذاتي يعدها المعلم ويعتمدها ويتابع تنفيذها المنسق مع استمرارية متابعة المعلم وقياس أثرها على أدائه.", "تهيئة المعلمة للتقدم للرخص المهنية في المستوى الأعلى أو تجديد الرخصة السابقة.", "القيام بعدد زيارات صفية كلية لا تقل عن زيارة واحدة كل شهرين."] },
];

// ====================================================================
// 17) استمارة متابعة أداء معلم/ة — المرحلة التأسيسية (طبق الأصل من نموذج الوزارة)
// ====================================================================
export function printPerformanceVisit(p: any, s: Settings) {
  const recMap: Record<string, { score: number; recommendation?: string }> = {};
  (p.indicators ?? []).forEach((x: any) => { recMap[x.code] = x; });
  const cell = (code: string) => {
    const it = recMap[code];
    if (!it || it.score < 0) return { score: "—", rec: it?.recommendation ?? "" };
    return { score: String(it.score), rec: it.recommendation ?? "" };
  };

  const indicatorRows = PERF_DOMAINS.map((d) =>
    `<tr><td class="hd" colspan="3">${d.domain}</td></tr>` +
    d.indicators.map((ind) => {
      const c = cell(ind.code);
      return `<tr>
        <td style="width:30%">${ind.code} ${esc(ind.text)}</td>
        <td class="c b" style="width:7%">${c.score}</td>
        <td>${esc(c.rec)}</td>
      </tr>`;
    }).join("")
  ).join("");

  const ftSection = (title: string, val?: string) =>
    `<tr><td class="hd" style="width:18%">${title}</td><td>${esc(val) || "&nbsp;"}</td></tr>`;

  const body = `
  <table><tr><th>استمارة متابعة أداء معلم/ة — المرحلة التأسيسية للعام الأكاديمي ${esc(s.academicYear)}م</th></tr></table>
  <table>
    <tr><th colspan="6">المعلومات الأساسية</th></tr>
    <tr>
      <td class="b" style="width:12%">المدرسة</td><td>${esc(s.school)}</td>
      <td class="b" style="width:12%">العام الدراسي</td><td>${esc(s.academicYear)}</td>
      <td class="b" style="width:10%">التاريخ</td><td>${esc(p.date)}</td>
    </tr>
    <tr>
      <td class="b">اليوم</td><td>${esc(p.day)}</td>
      <td class="b">المادّة</td><td>${esc(p.subject)}</td>
      <td class="b">الوحدة</td><td>${esc(p.unit)}</td>
    </tr>
    <tr>
      <td class="b">عنوان الدرس</td><td>${esc(p.lessonTitle)}</td>
      <td class="b">نوع الزيارة</td><td>${esc(p.visitType)}</td>
      <td class="b">رقم الزيارة</td><td>${esc(p.visitNumber)}</td>
    </tr>
    <tr>
      <td class="b">وقت البدء</td><td>${esc(p.startTime)}</td>
      <td class="b">وقت الانتهاء</td><td>${esc(p.endTime)}</td>
      <td class="b">نمط المتابعة</td><td>${esc(p.followMode)}</td>
    </tr>
  </table>
  <table>
    <tr><th colspan="4">بيانات خاصة بالمعلم</th></tr>
    <tr><td class="b" style="width:16%">الاسم الرباعي</td><td>${esc(p.teacherName)}</td><td class="b" style="width:16%">الرقم الوظيفي</td><td>${esc(p.employeeNo)}</td></tr>
    <tr><td class="b">المسمى الوظيفي</td><td>${esc(p.jobTitle)}</td><td class="b">الجنسية</td><td>${esc(p.nationality)}</td></tr>
    <tr><td class="b">التخصص</td><td>${esc(p.specialization)}</td><td class="b">الصف / الشعبة</td><td>${esc(p.grade)} / ${esc(p.section)}</td></tr>
    <tr><td class="b">سنوات الخبرة كمعلم مسار</td><td>${esc(p.yearsTrack)}</td><td class="b">سنوات الخبرة بشكل عام</td><td>${esc(p.yearsTotal)}</td></tr>
  </table>
  <table>
    <tr><th colspan="4">بيانات خاصة بالنائب الأكاديمي</th></tr>
    <tr><td class="b" style="width:16%">اسم النائب الرباعي</td><td>${esc(p.deputyName)}</td><td class="b" style="width:18%">حضور التغذية الراجعة</td><td>${esc(p.feedbackAttendance)}</td></tr>
    <tr><td class="b">ملاحظات</td><td colspan="3">${esc(p.deputyNotes)}</td></tr>
  </table>
  <table>
    <tr><td class="c b">مفاتيح التقييم</td><td class="c">3 = الأدلة مستكملة وفاعلة &nbsp;•&nbsp; 2 = تتوفر معظم الأدلة &nbsp;•&nbsp; 1 = تتوفر بعض الأدلة &nbsp;•&nbsp; 0 = الأدلة غير متوفرة أو محدودة &nbsp;•&nbsp; (—) لم يتم قياسه</td></tr>
  </table>
  <table>
    <tr><th colspan="3">مجالات المتابعة</th></tr>
    <tr><th style="width:30%">المؤشرات</th><th style="width:7%">التقييم</th><th>التوصيات</th></tr>
    ${indicatorRows}
  </table>
  <table>
    ${ftSection("التوصيات العامة", p.generalRecommendations)}
    ${ftSection("الخطوات القادمة", p.nextSteps)}
    ${ftSection("الاحتياجات التدريبية", p.trainingNeeds)}
    ${ftSection("ملاحظات إضافية", p.additionalNotes)}
  </table>
  <table>
    <tr><td class="b" style="width:25%">اسم المعلمة</td><td>${esc(p.teacherName)}</td><td class="b" style="width:25%">اسم المنسق/ة</td><td>${esc(p.coordinatorName) || esc(s.coordinator)}</td></tr>
    <tr><td class="b">وقت المناقشة</td><td>${esc(p.discussionTime)}</td><td class="b">حضر/ت المعلم/ة المناقشة</td><td>${esc(p.teacherAttended)}</td></tr>
    <tr><td class="b">تاريخ إرسال الاستمارة</td><td>${esc(p.sendDate)}</td><td class="b">توقيع الموجّه التربوي</td><td></td></tr>
  </table>`;
  return printHtml(officialPage(body, { s }));
}

// ====================================================================
// 18) الخطة السنوية للقسم — طبق الأصل (من التشغيلية)
// ====================================================================
export function printAnnualPlan(rows: any[], s: Settings) {
  const body = `
  <div class="title">الخطة السنوية للقسم — العام الأكاديمي ${esc(s.academicYear)}</div>
  <div class="school-line"><span>${esc(s.school)}</span><span>منسقة المسار الأدبي<br/>${esc(s.coordinator)}</span></div>
  <table>
    <tr>
      <th style="width:12%">المجال</th><th>الإجراءات والأنشطة الإشرافية والبرامج</th>
      <th style="width:10%">المنفّذ</th><th style="width:10%">موعد الانتهاء</th>
      <th style="width:14%">أدلة التنفيذ</th><th style="width:10%">المتابعة</th><th style="width:9%">تاريخ المتابعة</th>
    </tr>
    ${rows.map((r) => `<tr>
      <td class="b">${esc(r.domain)}</td><td>${esc(r.actions)}</td>
      <td class="c">${esc(r.executor)}</td><td class="c">${esc(r.deadline)}</td>
      <td>${esc(r.evidence)}</td><td>${esc(r.followup)}</td><td class="c">${esc(r.followupDate)}</td>
    </tr>`).join("")}
  </table>`;
  return printHtml(officialPage(body, { landscape: true, s }));
}

// ====================================================================
// 19) خطة التحصيل الأكاديمي — طبق الأصل (3 مراحل)
// ====================================================================
const ACH_STAGES = ["المرحلة الأولى: مرحلة التخطيط وجمع البيانات", "المرحلة الثانية: التطبيق", "المرحلة الثالثة: التقييم والتقويم من أجل تحسين وتطوير الأداء"];

export function printAchievementPlan(rows: any[], s: Settings) {
  const stageBlocks = ACH_STAGES.map((stage) => {
    const stageRows = rows.filter((r) => r.stage === stage);
    if (!stageRows.length) return "";
    return `
  <table>
    <tr><th colspan="6">${stage}</th></tr>
    <tr>
      <th style="width:14%">الأهداف</th><th>الإجراءات</th><th style="width:10%">مسؤول التنفيذ</th>
      <th style="width:10%">الإطار الزمني</th><th style="width:16%">المؤشرات والأدلة</th><th style="width:8%">التنفيذ</th>
    </tr>
    ${stageRows.map((r) => `<tr>
      <td class="b">${esc(r.goal)}</td><td>${esc(r.actions)}</td><td class="c">${esc(r.responsible)}</td>
      <td class="c">${esc(r.timeframe)}</td><td>${esc(r.indicators)}</td><td class="c">${esc(r.execution)}</td>
    </tr>`).join("")}
  </table>`;
  }).join("");

  const body = `
  <div class="title">خطة التحصيل الأكاديمي لقسم المسار الأدبي — العام الأكاديمي ${esc(s.academicYear)}</div>
  <div class="b">هدف خطة التحصيل الأكاديمي: -</div>
  <p>"تزويد إدارة المدرسة بإجراءات واقعية تمكّن من متابعة وتطوير الأداء الأكاديمي بما يسهم في رفع التحصيل الأكاديمي للطلبة"</p>
  <div class="b">مبادئ الخطة: -</div>
  <p>الإيجاز: تركز الخطة على الإجراءات العامة مما يجعلها مناسبة لجميع المدارس الحكومية.<br/>
  الشمول: شمول الخطة على إجراءات تخص عناصر العملية التعليمية مثل (المعلم، الطالب، البيئة المدرسية).<br/>
  الوضوح: وضوح إجراءات الخطة حسب مراحل الإعداد والتطبيق والتقويم.<br/>
  الواقعية: مناسبة الخطة لإمكانيات المدارس ومراعاة تخفيف الضغط على المعلمين.</p>
  ${stageBlocks}
  <div class="sigrow">
    <span>منسقة القسم: ${esc(s.coordinator)}<br/>التوقيع:</span>
    <span>النائبة الأكاديمية:<br/>أ. ${esc(s.academicDeputy)}</span>
    <span>النائبة الإدارية:<br/>أ. ${esc(s.adminDeputy)}</span>
    <span>مديرة المدرسة:<br/>أ. ${esc(s.principal)}</span>
  </div>`;
  return printHtml(officialPage(body, { landscape: true, s }));
}

// ====================================================================
// 20) جدول أعمال منسقة القسم — طبق الأصل
// ====================================================================
export function printAgenda(entries: any[], term: string, s: Settings) {
  const blocks = entries.map((e) => `
  <table>
    <tr>
      <th style="width:20%">الاجتماعات + التطوير + الحضور الصفي</th><th style="width:12%">الفترة الزمنية</th>
      <th style="width:17%">الزيارات</th><th style="width:17%">التقارير</th>
      <th style="width:17%">فعاليات المدرسة</th><th>الملاحظات</th>
    </tr>
    <tr>
      <td>${esc(e.meetings)}</td><td class="c b">${esc(e.period)}</td>
      <td>${esc(e.visitsCol)}</td><td>${esc(e.reportsCol)}</td>
      <td>${esc(e.events)}</td><td>${esc(e.notes)}</td>
    </tr>
  </table>`).join("");
  const body = `
  <div class="title">جدول أعمال منسقة قسم مسار أدبي ${esc(s.academicYear)}</div>
  <div class="subtitle">${esc(s.school)} — ${esc(term)}</div>
  ${blocks || "<p>لا توجد فترات مسجلة.</p>"}`;
  return printHtml(officialPage(body, { landscape: true, s }));
}

export function printTeacherClassification(assignments: Record<string, string[]>, term: string, s: Settings) {
  const rows = TC_CATS.map((c) => {
    const names = assignments[c.key] ?? [];
    return `<tr>
      <td class="b c" style="width:14%">${c.label}</td>
      <td style="width:22%">${names.length ? names.map(esc).join("<br/>") : ""}</td>
      <td style="width:30%">${esc(c.criteria)}</td>
      <td><ul style="margin:0;padding-right:16px">${c.actions.map((a) => `<li>${esc(a)}</li>`).join("")}</ul></td>
    </tr>`;
  }).join("");
  const body = `
  <div class="title">تصنيف أداء المعلمين للعام الأكاديمي ${esc(s.academicYear)}م</div>
  <table>
    <tr><td class="b" style="width:18%">الفصل الدراسي</td><td>${esc(term)}</td><td class="b" style="width:18%">المادة / القسم</td><td>${esc(s.department)}</td></tr>
    <tr><td class="b">منسق المادة</td><td>${esc(s.coordinator)}</td><td class="b">النائب الأكاديمي</td><td>${esc(s.academicDeputy)}</td></tr>
  </table>
  <table>
    <tr><th style="width:14%">الفئات</th><th style="width:22%">اسم المعلم</th><th style="width:30%">المعايير</th><th>الإجراءات</th></tr>
    ${rows}
  </table>`;
  return printHtml(officialPage(body, { landscape: true, s }));
}

// ====================================================================
// 9) متابعة تنفيذ الخطة الفصلية — مطابقة للملف (عربي + إسلامية جنباً إلى جنب)
// ====================================================================
export function printCurriculumPlan(weeks: any[], grade: string, term: string, s: Settings) {
  const rows = weeks
    .map(
      (w) => `<tr>
      <td class="c">${esc(w.unit)}</td><td class="c b">الأسبوع ${w.weekNumber}</td>
      <td>${esc(w.arabicLessons)}</td>
      <td class="c">${w.arabicDone ? "✔" : ""}</td><td class="c">${w.arabicDone === false && w.arabicLessons ? "" : ""}</td>
      <td>${esc(w.arabicNotes)}</td>
      <td>${esc(w.islamicLessons)}</td>
      <td class="c">${w.islamicDone ? "✔" : ""}</td><td class="c"></td>
      <td>${esc(w.islamicNotes)}</td>
    </tr>`
    )
    .join("");
  const body = `
  <div class="title">متابعة تنفيذ الخطة الفصلية ${esc(term)} - للصف ${esc(grade)} ( اللغة العربية – التربية الإسلامية )</div>
  <div class="subtitle">${esc(s.school)} — العام الأكاديمي ${esc(s.academicYear)}</div>
  <table>
    <tr>
      <th rowspan="2" style="width:8%">الوحدة</th><th rowspan="2" style="width:7%">الأسبوع</th>
      <th colspan="2">اللغة العربية — الدروس وتنفيذها</th><th rowspan="2" style="width:10%">ملاحظات</th>
      <th colspan="2">التربية الإسلامية — الدروس وتنفيذها</th><th rowspan="2" style="width:10%">ملاحظات</th>
    </tr>
    <tr>
      <th style="width:22%">الدروس</th><th style="width:5%">نفذ</th>
      <th style="width:22%">الدروس</th><th style="width:5%">نفذ</th>
    </tr>
    ${weeks
      .map(
        (w) => `<tr>
        <td class="c">${esc(w.unit)}</td><td class="c b">الأسبوع ${w.weekNumber}</td>
        <td>${esc(w.arabicLessons)}</td><td class="c">${w.arabicDone ? "✔ تم" : ""}</td><td>${esc(w.arabicNotes)}</td>
        <td>${esc(w.islamicLessons)}</td><td class="c">${w.islamicDone ? "✔ تم" : ""}</td><td>${esc(w.islamicNotes)}</td>
      </tr>`
      )
      .join("")}
  </table>`;
  return printHtml(officialPage(body, { landscape: true, s }));
}

// ====================================================================
// 10) نموذج حصر التطوير — مطابق للملف (مجمّع بالأشهر + المسابقات)
// ====================================================================
const DEV_MONTHS = ["أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر", "يناير", "فبراير", "مارس", "إبريل", "مايو"];

export function printTrainingSheet(teacherName: string, rows: any[], s: Settings) {
  let counter = 0;
  const monthBlocks = DEV_MONTHS.map((m) => {
    const monthRows = rows.filter((r) => r.month === m && r.category !== "مسابقة");
    if (!monthRows.length) return "";
    return (
      `<tr><td class="hd" colspan="5">شهر ${m}</td></tr>` +
      monthRows
        .map((r) => {
          counter++;
          return `<tr><td class="c" style="width:5%">${counter}</td><td>${esc(r.programName)}</td><td class="c">${esc(r.date)}</td><td class="c">${esc(r.hours)}</td><td class="c">${esc(r.type)}</td></tr>`;
        })
        .join("")
    );
  }).join("");
  const comps = rows.filter((r) => r.category === "مسابقة");
  const body = `
  <div class="title">نموذج حصر التطوير المهني — العام الأكاديمي ${esc(s.academicYear)}</div>
  <table>
    <tr><td class="b" style="width:25%">اســــــــــم الموظفة :</td><td>${esc(teacherName)}</td></tr>
    <tr><td class="b">المسمى الوظيفي :</td><td>معلم مسار أدبي</td></tr>
  </table>
  <table>
    <tr><th style="width:5%">م</th><th>اسم البرنامج التدريبي</th><th style="width:15%">تاريخ البرنامج</th><th style="width:12%">عدد الساعات</th><th style="width:12%">خارجي / داخلي</th></tr>
    ${monthBlocks || `<tr><td class="c">1</td><td></td><td></td><td></td><td></td></tr>`}
    <tr><td class="hd" colspan="5">المسابقات والأنشطة الداخلية والخارجية</td></tr>
    ${
      comps.length
        ? comps.map((r, i) => `<tr><td class="c">${i + 1}</td><td>${esc(r.programName)}</td><td class="c">${esc(r.date)}</td><td class="c">${esc(r.hours)}</td><td class="c">${esc(r.type)}</td></tr>`).join("")
        : `<tr><td class="c">1</td><td></td><td></td><td></td><td></td></tr><tr><td class="c">2</td><td></td><td></td><td></td><td></td></tr>`
    }
  </table>
  <p class="note"><b>ملاحظة :</b> يدرج التالي فقط : الورش ، البرامج التدريبية ، دروس المشاهدة ، أيام التنمية المهنية ، المؤتمرات و الزيارات الميدانية للمدارس ، المشاركة المجتمعية ، البحث العلمي ( مشرفة أو مساعدة ) ، بحث إجرائي ، المشاركة في مسابقات داخل المدرسة أو خارجها.</p>
  <div class="sigrow"><span>توقيع المعلمة :</span><span></span></div>`;
  return printHtml(officialPage(body, { s }));
}

// ====================================================================
// 11) القراءة المهنية — مطابقة لملف "نوفمبر"
// ====================================================================
export function printReading(r: any, s: Settings) {
  const body = `
  <table>
    <tr><th colspan="2">قراءة مهنية ${esc(s.academicYear)}م</th></tr>
    <tr><td class="b" style="width:25%">القسم</td><td>${esc(s.department)}</td></tr>
  </table>
  <table>
    <tr><td class="b" style="width:25%">اسم الموظفة</td><td>${esc(r.teacherName)}</td></tr>
    <tr><td class="b">التاريخ</td><td>${esc(r.date)}</td></tr>
    <tr><td class="b">عنوان الكتاب</td><td>${esc(r.bookTitle)}</td></tr>
    <tr><th colspan="2">ماذا استفدت من الكتاب:</th></tr>
    <tr><td colspan="2" style="min-height:300px">${esc(r.summary)}</td></tr>
  </table>`;
  return printHtml(officialPage(body, { s }));
}

// ====================================================================
// 12) نموذج إنجاز قسم — مطابق للملف (أكاديمية/إدارية مرقمة + أخرى + مجتمع)
// ====================================================================
export function printAchievementsSheet(items: any[], month: string, s: Settings) {
  const acad = items.filter((x) => x.category === "أكاديمية");
  const admin = items.filter((x) => x.category === "إدارية");
  const inside = items.filter((x) => x.category === "داخل القسم");
  const community = items.filter((x) => x.category === "للمدرسة والمجتمع");
  const maxRows = Math.max(acad.length, admin.length, 6);
  const numbered = Array.from({ length: maxRows }, (_, i) => {
    return `<tr>
      <td class="c" style="width:4%">${i + 1}</td><td style="width:46%">${esc(acad[i]?.description)}</td>
      <td class="c" style="width:4%">${i + 1 + maxRows}</td><td>${esc(admin[i]?.description)}</td>
    </tr>`;
  }).join("");
  const body = `
  <div class="title">إنجازات القسم خلال شهر ( ${esc(month)} )</div>
  <div class="subtitle">العام الأكاديمي ${esc(s.academicYear)} م — القسم الدراسي: ${esc(s.department)}</div>
  <table>
    <tr><td colspan="4" class="c">لك جزيل الشكر عزيزتي الموظفة على عطائك المميز خلال العام الدراسي، نخص هذا النموذج لذكر الإنجازات التي قامت بها المنسقة خلال العام الدراسي</td></tr>
    <tr>
      <td class="b" style="width:12%">الاسم</td><td>${esc(s.coordinator)}</td>
      <td class="b" style="width:16%">المسمى الوظيفي</td><td>منسقة القسم</td>
    </tr>
    <tr><td class="b">المسؤول المباشر</td><td colspan="3">النائبة الأكاديمية / ${esc(s.academicDeputy)}</td></tr>
    <tr><th colspan="4">أهم الإنجازات</th></tr>
    <tr><td class="hd" colspan="2">الإنجازات الأكاديمية</td><td class="hd" colspan="2">الإنجازات الإدارية</td></tr>
    ${numbered}
    <tr><th colspan="4">إنجازات أخرى داخل القسم</th></tr>
    ${(inside.length ? inside : [{ description: "" }, { description: "" }]).map((x) => `<tr><td colspan="4">${esc(x.description)}</td></tr>`).join("")}
    <tr><th colspan="4">إنجازات الموظف للمدرسة والمجتمع</th></tr>
    ${(community.length ? community : [{ description: "" }, { description: "" }]).map((x) => `<tr><td colspan="4">${esc(x.description)}</td></tr>`).join("")}
  </table>`;
  return printHtml(officialPage(body, { s }));
}

// ====================================================================
// 13) كشف قياس مستوى مهارة القراءة والكتابة — مطابق لملف "أول.xlsx"
// ====================================================================
export function printStudentsSkillSheet(students: any[], grade: string, section: string, s: Settings) {
  const READ = ["ممتاز\nيقرأ جمل بسيطة", "جيد جداً\nيقرأ الكلمات", "جيد\nيقرأ حروف ومقاطع", "ضعيف\nلا يميز الحروف"];
  const READ_KEYS = ["ممتاز", "جيد جداً", "جيد", "ضعيف"];
  const WRITE = ["ممتاز\nيكتب جمل بسيطة تامة", "جيد جداً\nيكتب كلمات", "ضعيف\nلا يجيد"];
  const WRITE_KEYS = ["ممتاز", "جيد جداً", "ضعيف"];
  const rows = students
    .map(
      (st, i) => `<tr>
      <td class="c" style="width:3%">${i + 1}</td><td style="width:20%">${esc(st.name)}</td>
      ${READ_KEYS.map((k) => `<td class="c">${st.readingLevel === k ? "✔" : ""}</td>`).join("")}
      ${WRITE_KEYS.map((k) => `<td class="c">${st.writingLevel === k ? "✔" : ""}</td>`).join("")}
      <td class="c">${esc(st.behavior)}</td><td>${esc(st.notes)}</td>
    </tr>`
    )
    .join("");
  const body = `
  <div class="title">قياس مستوى مهارة القراءة والكتابة</div>
  <table>
    <tr><td class="b" style="width:10%">الصف</td><td colspan="10">${esc(grade)} / ${esc(section)}</td></tr>
    <tr>
      <td class="hd" rowspan="2">#</td><td class="hd" rowspan="2">اسم الطالبة</td>
      <td class="hd" colspan="4">قياس مستوى مهارة القراءة</td>
      <td class="hd" colspan="3">قياس مهارة الكتابة</td>
      <td class="hd" rowspan="2">السلوك</td><td class="hd" rowspan="2">ملاحظات</td>
    </tr>
    <tr>
      ${READ.map((h) => `<td class="hd" style="font-size:11px">${h.replace("\n", "<br/>")}</td>`).join("")}
      ${WRITE.map((h) => `<td class="hd" style="font-size:11px">${h.replace("\n", "<br/>")}</td>`).join("")}
    </tr>
    ${rows}
  </table>`;
  return printHtml(officialPage(body, { landscape: true, s }));
}

// ====================================================================
// متابعة التوصيات — جدول رسمي لكل التوصيات وحالتها
// ====================================================================
export function printRecommendations(items: any[], s: Settings) {
  const rows = (items ?? []).map((x: any, i: number) => `
    <tr>
      <td class="c">${i + 1}</td>
      <td>${esc(x.source)}</td>
      <td>${esc(x.text)}</td>
      <td class="c">${esc(x.assignee)}</td>
      <td class="c">${esc(x.dueDate)}${x.dueTime ? ` — ${esc(x.dueTime)}` : ""}</td>
      <td class="c">${esc(x.status)}</td>
    </tr>`).join("");
  const empty = (items ?? []).length === 0 ? `<tr><td colspan="6" class="c">لا توجد توصيات</td></tr>` : "";
  const body = `
  <div class="title">متابعة التوصيات — ${esc(s.department) || "قسم المسار الأدبي"}</div>
  <div class="subtitle">${esc(s.school)} — العام الأكاديمي ${esc(s.academicYear)}</div>
  <table>
    <tr>
      <th style="width:4%">م</th><th style="width:16%">المصدر</th><th>نص التوصية</th>
      <th style="width:16%">المكلّفة بالتنفيذ</th><th style="width:16%">تاريخ الاستحقاق</th><th style="width:10%">الحالة</th>
    </tr>
    ${rows}${empty}
  </table>
  <div class="sigrow"><span>منسقة القسم: ${esc(s.coordinator)}</span><span>التوقيع:</span></div>`;
  return printHtml(officialPage(body, { landscape: true, s }));
}

// ====================================================================
// 14) كشف بيانات المعلمات (قاعدة بيانات القسم — من خطة التحصيل)
// ====================================================================
export function printTeachersSheet(teachers: any[], s: Settings) {
  const body = `
  <div class="title">كشف بيانات معلمات ${esc(s.department)}</div>
  <div class="subtitle">${esc(s.school)} — العام الأكاديمي ${esc(s.academicYear)}</div>
  <table>
    <tr>
      <th style="width:3%">م</th><th style="width:14%">اسم الموظفة</th>
      <th style="width:8%">الرقم الوظيفي</th><th style="width:11%">المسمى الوظيفي</th>
      <th style="width:6%">الصف</th><th style="width:6%">الشعبة</th>
      <th style="width:11%">التخصص</th><th style="width:7%">الجنسية</th>
      <th style="width:9%">الرقم الشخصي</th><th style="width:9%">الهاتف</th><th>الإيميل الرسمي</th>
    </tr>
    ${teachers.map((t, i) => `<tr>
      <td class="c">${i + 1}</td><td>${esc(t.name)}</td>
      <td class="c">${esc(t.employeeNumber)}</td><td class="c">${esc(t.jobTitle) || "معلمة"}</td>
      <td class="c">${esc(t.grade)}</td><td class="c">${esc(t.section)}</td>
      <td class="c">${esc(t.specialization)}</td><td class="c">${esc(t.nationality)}</td>
      <td class="c">${esc(t.nationalId)}</td><td class="c">${esc(t.phone)}</td><td class="c">${esc(t.email)}</td>
    </tr>`).join("")}
  </table>
  <div class="sigrow"><span>منسقة القسم: ${esc(s.coordinator)}</span><span>التوقيع:</span></div>`;
  return printHtml(officialPage(body, { landscape: true, s }));
}

// ====================================================================
// 15) سجل الاستئذان الأكاديمي (طبق الأصل من ملف "سجل الاستئذان")
// ====================================================================
export function printLeaveRegister(r: any, s: Settings) {
  const rows = (r.entries ?? []).map((e: any, i: number) => `
    <tr>
      <td class="c">${i + 1}</td>
      <td>${esc(e.teacherName)}</td>
      <td>${esc(e.reason)}</td>
      <td class="c">من ( ${esc(e.fromTime) || "&nbsp;&nbsp;:&nbsp;&nbsp;"} ) إلى ( ${esc(e.toTime) || "&nbsp;&nbsp;:&nbsp;&nbsp;"} )</td>
      <td>${esc(e.deputyOpinion)}</td>
    </tr>`).join("");
  // أكمل لـ 6 صفوف فارغة على الأقل كالنموذج الورقي
  const filler = Math.max(0, 6 - (r.entries?.length ?? 0));
  const empties = Array.from({ length: filler }, (_, k) => `
    <tr><td class="c">${(r.entries?.length ?? 0) + k + 1}</td><td></td><td></td>
    <td class="c">من ( &nbsp;&nbsp;:&nbsp;&nbsp; ) إلى ( &nbsp;&nbsp;:&nbsp;&nbsp; )</td><td></td></tr>`).join("");
  const body = `
  <div class="title">سجل الاستئذان الأكاديمي ( ${esc(s.academicYear) || "2025-2026م"} )</div>
  <div class="subtitle">${esc(s.department) || "قسم المسار الأدبي"} — ${esc(s.school)}</div>
  <div class="school-line">
    <span class="b">اليوم: ${esc(r.day) || "................"}</span>
    <span class="b">التاريخ: ${esc(r.date) || ".......... / .......... / 20.....م"}</span>
  </div>
  <table>
    <tr>
      <th style="width:6%">م</th><th style="width:26%">اسم المعلمة</th><th>السبب</th>
      <th style="width:24%">الزمن</th><th style="width:22%">رأي النائبة الأكاديمية</th>
    </tr>
    ${rows}${empties}
  </table>
  <div class="sigrow"><span>توقيع المنسقة: ${esc(s.coordinator)}</span><span>إدارة المدرسة:</span></div>`;
  return printHtml(officialPage(body, { landscape: true, s }));
}

// ====================================================================
// 16) سجل الاحتياط الأكاديمي (طبق الأصل من ملف "سجل الاحتياط")
// ====================================================================
export function printCoverRegister(r: any, s: Settings) {
  // طبق الأصل من «سجل الاحتياط العام الأكاديمي»: خيارات راديو داخل الخلايا
  const rd = (on: boolean, label: string) => `${on ? "●" : "○"} ${label}`;
  const PLAN = ["مراجعة", "درس", "متابعة واجبات", "إشرافية فقط"];
  const NOTIFY = ["تم إبلاغي قبل الحصة بوقت كافٍ", "تم إبلاغي قبل الحصة مباشرة", "تم الرفض"];
  const nameCell = (e: any) =>
    `<div>${esc(e?.teacherName) || "................................"}</div>` +
    `<div style="font-size:12px;margin-top:4px">${rd(e?.reason === "تبديل", "تبديل")} &nbsp;&nbsp; ${rd(e?.reason === "غياب", "غياب")}</div>`;
  const planCell = (e: any) =>
    `<div style="font-size:12px;text-align:right">${PLAN.map((p) => rd(e?.planType === p, p)).join("<br/>")}</div>`;
  const notesCell = (e: any) =>
    `<div style="font-size:12px;text-align:right">${NOTIFY.map((n) => rd(e?.notify === n, n)).join("<br/>")}</div>` +
    (e?.notes ? `<div style="font-size:11.5px;margin-top:3px">${esc(e.notes)}</div>` : "");

  const total = Math.max(4, r.entries?.length ?? 0);
  const rows = Array.from({ length: total }, (_, i) => {
    const e = (r.entries ?? [])[i];
    return `
    <tr>
      <td class="c">${i + 1}</td>
      <td>${nameCell(e)}</td>
      <td class="c">${esc(e?.reason && e.reason !== "تبديل" && e.reason !== "غياب" ? e.reason : "")}</td>
      <td class="c">${esc(e?.grade)} ${esc(e?.section)}</td>
      <td class="c">${esc(e?.period)}</td>
      <td>${esc(e?.coverTeacher)}</td>
      <td>${planCell(e)}</td>
      <td></td>
      <td>${notesCell(e)}</td>
    </tr>`;
  }).join("");

  const body = `
  <div class="title">سجل الاحتياط العام الأكاديمي ( ${esc(s.academicYear) || "2025-2026م"} )</div>
  <div class="school-line">
    <span class="b">اليوم: ${esc(r.day) || "................"}</span>
    <span class="b">التاريخ: ${esc(r.date) || ".......... / .......... / 20.....م"}</span>
    <span class="b">القسم: ${esc(s.department) || "قسم المسار الأدبي"}</span>
  </div>
  <table>
    <tr>
      <th style="width:4%">م</th><th style="width:16%">اسم المعلمة</th><th style="width:10%">السبب</th>
      <th style="width:8%">الصف</th><th style="width:6%">الحصة</th><th style="width:14%">معلمة الاحتياط</th>
      <th style="width:15%">طبيعة الخطة المنفذة</th><th style="width:8%">التوقيع</th><th>الملاحظات</th>
    </tr>
    ${rows}
  </table>
  <div class="note" style="margin-top:6px;">ملاحظة: في حال رفضت المعلمة تنفيذ الاحتياط يتم التسجيل ويوضع بديل.</div>
  <div class="sigrow"><span>توقيع المنسقة/ ${esc(s.coordinator)}</span><span>إدارة المدرسة/</span></div>`;
  return printHtml(officialPage(body, { landscape: true, s }));
}

// ====================================================================
// 17) سياسة الاستئذان + جدول التوقيع بالعلم (طبق الأصل)
// ====================================================================
const ackTable = (teachers: any[]) => {
  const rows = (teachers ?? []).map((t, i) => `<tr><td class="c">${i + 1}</td><td>${esc(t.name)}</td><td class="c">${esc(t.jobTitle) || "معلمة"}</td><td></td></tr>`).join("");
  const empties = Array.from({ length: Math.max(0, 12 - (teachers?.length ?? 0)) }, (_, k) => `<tr><td class="c">${(teachers?.length ?? 0) + k + 1}</td><td></td><td></td><td></td></tr>`).join("");
  return `
  <div class="subtitle" style="margin-top:10px;">توقيع المعلمات بالعلم</div>
  <table>
    <tr><th style="width:6%">م</th><th>اسم المعلمة</th><th style="width:28%">المسمى الوظيفي</th><th style="width:22%">التوقيع</th></tr>
    ${rows}${empties}
  </table>`;
};

export function printLeavePolicy(teachers: any[], s: Settings) {
  const body = `
  <div class="title">سياسة الاستئذان</div>
  <div class="subtitle">${esc(s.department) || "قسم المسار الأدبي"} — ${esc(s.school)} — العام الأكاديمي ${esc(s.academicYear) || "2025-2026م"}</div>
  <p>حرصًا على انتظام العملية التعليمية وضمان سير العمل المدرسي بكفاءة، تُعتمد سياسة الاستئذان لمعلمات المدرسة وفق الضوابط التالية:</p>
  <p class="b">أولًا: السياسة:</p>
  <ul>
    <li>يكون الاستئذان للضرورة فقط، ويُفضل تأجيل أي التزامات شخصية خارج أوقات الدوام.</li>
    <li>لا يُسمح بالاستئذان خلال الحصص الدراسية إلا في الحالات الطارئة.</li>
    <li>لا يُسمح بالاستئذان خلال أوقات الاختبارات، أو الفعاليات المدرسية الرسمية، إلا بموافقة خاصة من إدارة المدرسة.</li>
    <li>يلتزم بعدم تأثير الاستئذان على مصلحة الطالبات أو سير الخطة الدراسية.</li>
    <li>يحق للمنسقة رفض طلب الاستئذان في حال وجود تقصير من قبل المعلمة أو تأخير في تسليم المهام الموكلة إليها، بما يحقق مصلحة العمل وسير العملية التعليمية.</li>
    <li>يُمنع استئذان المعلمة في حال غيابها في اليوم الذي يسبق يوم الاستئذان، ويُستثنى من ذلك حالات الضرورة فقط بعد أخذ الموافقة الرسمية من إدارة المدرسة.</li>
  </ul>
  <p class="b">ثانيًا: مدة وعدد مرات الاستئذان:</p>
  <ul>
    <li>أن لا تتجاوز مدة الاستئذان ثلاث (3) ساعات في اليوم الواحد، وأن لا تكون في بداية اليوم لضرورة حضور المعلمة قبل الساعة 9 صباحًا.</li>
    <li>في حال وجود (تخفيف / رضاعة) للمعلمة، يُسمح بإضافة ساعة واحدة فقط، على ألا يتجاوز مجموع ساعات الاستئذان و(التخفيف / الرضاعة) ثلاث ساعات في اليوم الواحد.</li>
    <li>لا يُسمح للمعلمة بالاستئذان يوم الخميس إذا سبق لها الاستئذان يوم الخميس من الأسبوع السابق، ويُستثنى من ذلك الحالات الطارئة فقط بعد الحصول على الموافقة الرسمية من إدارة المدرسة.</li>
    <li>في حال وجود موعد طبي من المستشفى، تلتزم المعلمة بطباعة الموعد وتسليمه لإدارة المدرسة لاعتماده ضمن مبررات الاستئذان.</li>
  </ul>
  ${ackTable(teachers)}`;
  return printHtml(officialPage(body, { s }));
}

// ====================================================================
// 18) سياسة الاحتياط + جدول التوقيع بالعلم (طبق الأصل)
// ====================================================================
export function printCoverPolicy(teachers: any[], s: Settings) {
  const body = `
  <div class="title">سياسة الاحتياط</div>
  <div class="subtitle">${esc(s.department) || "قسم المسار الأدبي"} — ${esc(s.school)} — العام الأكاديمي ${esc(s.academicYear) || "2025-2026م"}</div>
  <p>تُعد حصص الاحتياط جزءًا من الالتزام الوظيفي المنصوص عليه ضمن مهام الهيئة التدريسية، ونتوقع من جميع المنسقات والمعلمات الالتزام بالتوجيهات الإدارية لضمان سير العملية التعليمية:</p>
  <p class="b">أولًا: السياسة</p>
  <p class="b">• الالتزام بالجدول اليومي والطارئ للاحتياط:</p>
  <ul><li>يجب على المعلمة الالتزام بتنفيذ الحصة الاحتياطية في حال غياب أي معلمة أخرى وذلك وفقًا للجدول المعد مسبقًا من قبل الإدارة المدرسية.</li></ul>
  <p class="b">• تنفيذ الحصة الاحتياطية:</p>
  <ul>
    <li>عند دخول المعلمة للحصة الاحتياطية يجب الالتزام بالجدية والانضباط، وعدم تحويل الحصة إلى وقت فراغ للطالبات.</li>
    <li>يُمنع استغلال وقت الحصة الاحتياطية في إنجاز أعمال خاصة بالمعلمة.</li>
  </ul>
  <p class="b">ثانيًا: في حال رفض المنسقة أو المعلمة لحصة الاحتياط دون عذر مقبول، وأيضًا في حال عدم تنفيذ الحصة بالشكل الصحيح، يتم التعامل من قبل إدارة المدرسة كالتالي:</p>
  <ul>
    <li>المخالفة الأولى: تنبيه شفهي خطي من قبل الإدارة المدرسية.</li>
    <li>المخالفة الثانية: تنبيه كتابي رسمي من قبل الإدارة المدرسية.</li>
    <li>المخالفة الثالثة: توجيه إنذار رسمي ورفع الموضوع لإدارة التعليم لاتخاذ الإجراء المناسب.</li>
  </ul>
  <p class="b">ثالثًا: الاستثناءات:</p>
  <p>تُعفى من الحصة الاحتياطية المعلمة التي لديها عذر رسمي أو ظرف طارئ معتمد من الإدارة مثل:</p>
  <ul>
    <li>مهمة أو ورشة عاجلة مسندة من الإدارة.</li>
    <li>ظرف صحي طارئ موثق من قبل ممرضة المدرسة.</li>
    <li>ظرف طارئ يُقدم للإدارة، وبعد تقييم الظرف يتم إسناد الحصة لمعلمة بديلة وفق ما تراه الإدارة مناسبًا.</li>
  </ul>
  ${ackTable(teachers)}`;
  return printHtml(officialPage(body, { s }));
}

// ====================================================================
// 19) تقرير إحصائي شامل للمعلمات (استئذان/احتياط/زيارات/تقييم)
// ====================================================================
export function printTeacherStats(rows: any[], totals: any, s: Settings) {
  const body = `
  <div class="title">التقرير الإحصائي لأداء ومتابعة المعلمات</div>
  <div class="subtitle">${esc(s.department) || "قسم المسار الأدبي"} — ${esc(s.school)} — العام الأكاديمي ${esc(s.academicYear) || "2025-2026م"}</div>
  <table>
    <tr>
      <th style="width:5%">م</th><th>اسم المعلمة</th><th style="width:8%">الصف</th>
      <th style="width:9%">الاستئذان</th><th style="width:9%">الاحتياط المنفّذ</th><th style="width:8%">الغياب</th>
      <th style="width:9%">الزيارات الصفية</th><th style="width:9%">متابعة الأداء</th><th style="width:9%">التقرير الدوري</th><th style="width:10%">آخر تقييم سنوي</th>
    </tr>
    ${rows.map((r, i) => `<tr>
      <td class="c">${i + 1}</td>
      <td>${esc(r.name)}</td>
      <td class="c">${esc(r.grade) || ""}${r.section ? " " + esc(r.section) : ""}</td>
      <td class="c">${r.leaveCount}</td>
      <td class="c">${r.coversDone}</td>
      <td class="c">${r.absences}</td>
      <td class="c">${r.classVisitCount}</td>
      <td class="c">${r.perfCount}</td>
      <td class="c">${r.periodicCount}</td>
      <td class="c">${r.lastAnnualScore != null ? r.lastAnnualScore + "% " + (esc(r.lastAnnualLevel) || "") : "—"}</td>
    </tr>`).join("")}
  </table>
  <p style="margin-top:10px;font-size:12px;color:#555;">إجمالي القسم: ${totals.teachers} معلمة · ${totals.leaves} استئذان · ${totals.covers} حصة احتياط · ${totals.classVisits} زيارة صفية · ${totals.perfVisits} متابعة أداء · ${totals.periodic} تقرير دوري.</p>`;
  return printHtml(officialPage(body, { s, landscape: true }));
}

// ====================================================================
// 20) ملف المعلمة الكامل (تقرير فردي للطباعة)
// ====================================================================
export function printTeacherDossier(d: any, s: Settings) {
  const t = d.teacher ?? {};
  const sect = (title: string, rows: string[], headers: string[]) => `
    <div class="subtitle" style="margin-top:12px;">${title} <span style="color:${MAROON}">(${rows.length})</span></div>
    ${rows.length ? `<table><tr>${headers.map((h) => `<th>${h}</th>`).join("")}</tr>${rows.join("")}</table>` : `<p style="color:#888;font-size:12px;">لا يوجد.</p>`}`;

  const leaveRows = (d.leaves ?? []).map((x: any) => `<tr><td class="c">${esc(x.date)}</td><td class="c">${esc(x.day) || ""}</td><td>${esc(x.reason)}</td><td class="c">${esc(x.fromTime) || ""} - ${esc(x.toTime) || ""}</td></tr>`);
  const coverRows = (d.coversDone ?? []).map((x: any) => `<tr><td class="c">${esc(x.date)}</td><td>${esc(x.absent)}</td><td class="c">${esc(x.grade) || ""} ${esc(x.section) || ""}</td><td class="c">${esc(x.period) || ""}</td><td>${esc(x.planType) || ""}</td></tr>`);
  const absRows = (d.absences ?? []).map((x: any) => `<tr><td class="c">${esc(x.date)}</td><td>${esc(x.reason)}</td><td>${esc(x.coverTeacher)}</td><td class="c">${esc(x.period) || ""}</td></tr>`);
  const visitRows = (d.visits ?? []).map((x: any) => `<tr><td class="c">${esc(x.date)}</td><td>${esc(x.subject) || ""}</td><td class="c">${esc(x.grade) || ""} ${esc(x.section) || ""}</td><td class="c">${esc(x.type) || ""}</td></tr>`);
  const perfRows = (d.perf ?? []).map((x: any) => `<tr><td class="c">${esc(x.date)}</td><td>${esc(x.subject) || ""}</td><td>${esc(x.unit) || ""}</td><td class="c">${esc(x.type) || ""}</td></tr>`);
  const annualRows = (d.annualEvals ?? []).map((x: any) => `<tr><td class="c">${esc(x.year)}</td><td class="c">${x.total}%</td><td class="c">${esc(x.level) || ""}</td></tr>`);

  const body = `
  <div class="title">الملف الفردي للمعلمة</div>
  <div class="subtitle">${esc(s.department) || "قسم المسار الأدبي"} — ${esc(s.school)} — العام الأكاديمي ${esc(s.academicYear) || "2025-2026م"}</div>
  <table>
    <tr><th style="width:25%">الاسم الرباعي</th><td>${esc(t.name)}</td><th style="width:18%">الرقم الوظيفي</th><td>${esc(t.employeeNumber) || ""}</td></tr>
    <tr><th>الجنسية</th><td>${esc(t.nationality) || ""}</td><th>التخصص</th><td>${esc(t.specialization) || ""}</td></tr>
    <tr><th>المادة</th><td>${esc(t.subject) || ""}</td><th>الصف / الشعبة</th><td>${esc(t.grade) || ""} ${esc(t.section) || ""}</td></tr>
    <tr><th>سنوات الخبرة (مسار / عام)</th><td>${esc(t.yearsTrack) || "-"} / ${esc(t.yearsTotal) || "-"}</td><th>نمط المتابعة</th><td>${esc(t.followMode) || ""}</td></tr>
  </table>
  ${sect("الاستئذانات", leaveRows, ["التاريخ", "اليوم", "السبب", "الوقت"])}
  ${sect("الغيابات", absRows, ["التاريخ", "السبب", "معلمة الاحتياط", "الحصة"])}
  ${sect("حصص الاحتياط التي نفّذتها", coverRows, ["التاريخ", "عن المعلمة", "الصف", "الحصة", "نوع الخطة"])}
  ${sect("الزيارات الصفية", visitRows, ["التاريخ", "المادة", "الصف", "نوع الزيارة"])}
  ${sect("متابعات الأداء", perfRows, ["التاريخ", "المادة", "الوحدة", "نوع الزيارة"])}
  ${sect("التقييمات السنوية", annualRows, ["العام", "النسبة", "التقدير"])}
  <p style="margin-top:14px;font-size:12px;color:#555;">عدد التقارير الدورية: ${(d.periodicReports ?? []).length}</p>`;
  return printHtml(officialPage(body, { s }));
}
