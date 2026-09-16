// استمارات 2026-2027 — قوالب الطباعة مطابقة للملفات الرسمية حرفياً.
// النصوص والبنود منقولة كما وردت في ملفات المنسق الرسمية دون تأليف.
import { printHtml } from "./print";
import { officialPage, esc, dotted, type Settings } from "./printTemplates";

/** التقرير الكمي/الوصفي للمعلم لقراءة نتائج اختبار */
export function printTeacherExamReport(e: any, s: Settings) {
  const rows = e.rows ?? [];
  const cnt = (v: any) => (v == null ? "" : v);
  const th = rows.length
    ? rows.map((r: any) => `<th>${esc(r.section)}${r.subject ? `<br/>${esc(r.subject)}` : ""}</th>`).join("")
    : `<th>النتائج</th>`;
  const line = (label: string, get: (r: any) => any) =>
    `<tr><td class="b">${label}</td>${rows.length
      ? rows.map((r: any) => `<td class="c">${get(r)}</td>`).join("")
      : `<td></td>`}</tr>`;

  const body = `
  <table><tr><th>تقرير كمي / وصفي للمعلم لقراءة نتائج اختبار ${esc(e.examTitle)} لقسم ${esc(s.department || "المسار الأدبي")}<br/>للعام الأكاديمي ${esc(e.year)}</th></tr></table>
  <div class="b">المنسق الفاضل،</div>
  <p>بعد قراءة نتائج الطلبة للصفوف التي أقوم بتدريسها، في اختبار ${esc(e.examTitle)} نقدم لكم تقريرًا كميًا ووصفيًا يوضح نسب النجاح والتحصيل الأكاديمي ومستويات الطلبة المختلفة، ومبررات ارتفاع وانخفاض نتائج الطلبة والإجراءات العلاجية اللاحقة.</p>
  <table>
    <tr><td class="b" style="width:18%">اسم المعلم</td><td style="width:32%">${esc(e.teacherName)}</td><td class="b" style="width:18%">اسم المنسق</td><td>${esc(s.coordinator)}</td></tr>
    <tr><td class="b">التاريخ</td><td>${esc(e.date)}</td><td class="b">الصف / الشعب</td><td>${esc(rows.map((r: any) => r.section).join("، "))}</td></tr>
  </table>
  <div class="b">التقرير الكمي للنتائج:</div>
  <table>
    <tr><th style="width:40%">المادة / الشعبة</th>${th}</tr>
    <tr><td class="b">بنود التقرير</td>${rows.length ? rows.map(() => `<td class="c b">النتائج</td>`).join("") : `<td class="c b">النتائج</td>`}</tr>
    ${line("نسبة النجاح في الاختبار.", (r) => `${r.passRate}%`)}
    ${line("نسبة التحصيل الأكاديمي.", (r) => `${r.achievementRate}%`)}
    ${line("عدد الطلبة ذوي الأداء المرتفع.", (r) => cnt(r.highCount))}
    ${line("عدد الطلبة ذوي الأداء المتوسط.", (r) => cnt(r.midCount))}
    ${line("عدد الطلبة ذوي الأداء المتدني.", (r) => cnt(r.lowCount))}
    ${line("عدد الطلبة الراسبين.", (r) => cnt(r.failCount))}
    ${line("القيمة المضافة في التحصيل الأكاديمي بين الاختبارات.", (r) => `${r.addedValue}%`)}
  </table>
  <div class="b">التقرير الوصفي للنتائج:</div>
  <table>
    <tr><td class="b" style="width:34%">تفسير النتائج<br/>تحديد المعايير / المهارات غير المحققة.<br/>(أسماء الطلبة وأسباب التدني).</td><td>${esc(e.unmetStandards) || dotted(3)}</td></tr>
    <tr><td class="b">الإجراءات العلاجية.</td><td>${esc(e.remedialActions) || dotted(2)}</td></tr>
    <tr><td class="b">الإجراءات الإثرائية.</td><td>${esc(e.enrichmentActions) || dotted(2)}</td></tr>
  </table>
  <table>
    <tr><th>تعليق المنسق</th></tr>
    <tr><td>${esc(e.coordinatorComment) || dotted(3)}</td></tr>
  </table>
  <div class="sigrow"><span>توقيع المعلم:</span><span>توقيع المنسق:</span></div>`;
  return printHtml(officialPage(body, { s }));
}

/** تقرير القسم — 41 بنداً في 9 مجالات */
export function printDepartmentReport(r: any, s: Settings) {
  const entries = r.entries ?? [];
  const seen: Record<string, boolean> = {};
  const rows = entries.map((e: any) => {
    const first = !seen[e.domain];
    seen[e.domain] = true;
    const span = entries.filter((x: any) => x.domain === e.domain).length;
    return `<tr>${first ? `<td class="b c" rowspan="${span}" style="width:14%">${esc(e.domain)}</td>` : ""}` +
      `<td style="width:26%">${esc(e.item)}</td>` +
      `<td>${esc(e.done)}</td>` +
      `<td style="width:22%">${esc(e.notes)}</td></tr>`;
  }).join("");

  const body = `
  <table>
    <tr><th colspan="4">تقرير القسم للعام الأكاديمي ${esc(r.year)}</th></tr>
    <tr><td class="b" style="width:16%">المدرسة</td><td style="width:34%">${esc(s.school)}</td><td class="b" style="width:18%">اسم المنسق/ـة</td><td>${esc(s.coordinator)}</td></tr>
    <tr><td class="b">القسم</td><td>${esc(s.department)}</td><td class="b">اسم النائب الأكاديمي</td><td>${esc(s.academicDeputy)}</td></tr>
    <tr><td class="b">رقم التقرير</td><td>${esc(r.reportNumber)}</td><td class="b">تاريخ تقديم التقرير</td><td>${esc(r.date)}</td></tr>
  </table>
  <table>
    <tr><th style="width:14%">المجال</th><th style="width:26%">البند</th><th>ما تم إنجازه</th><th style="width:22%">ملاحظات / تحديات</th></tr>
    ${rows}
  </table>
  <table>
    <tr><th>التغذية الراجعة من النائب الأكاديمي</th></tr>
    <tr><td>${esc(r.deputyFeedback) || dotted(3)}</td></tr>
  </table>
  <div class="sigrow"><span>توقيع المنسق:</span><span>توقيع النائب الأكاديمي:</span></div>`;
  return printHtml(officialPage(body, { s }));
}

/** استمارة زيارة المنسق الصفية لمساعد معلم — 11 مؤشراً بمقياس 0..3 */
export function printAssistantVisit(v: any, s: Settings) {
  const scoreLabel = (n: any) => (n == null || n < 0 ? "-" : String(n));
  const rows = (v.scores ?? []).map((x: any) =>
    `<tr><td style="width:62%">${esc(x.indicator)}</td><td class="c" style="width:8%">${scoreLabel(x.score)}</td><td>${esc(x.recommendation)}</td></tr>`
  ).join("");

  const body = `
  <table><tr><th>استمارة زيارة المنسق الصفية لمساعد معلم</th></tr></table>
  <table>
    <tr><th colspan="4">المعلومات الأساسية</th></tr>
    <tr><td class="b" style="width:18%">اليوم/التاريخ</td><td style="width:32%">${esc(v.day)} ${esc(v.date)}</td><td class="b" style="width:16%">المدرسة</td><td>${esc(s.school)}</td></tr>
    <tr><td class="b">الصف/الشعبة</td><td>${esc(v.grade)} ${esc(v.section)}</td><td class="b">الحصة</td><td>${esc(v.period)}</td></tr>
    <tr><td class="b">الموجّه/ـة التربوي/ـة</td><td>${esc(v.guide)}</td><td class="b">المادة</td><td>${esc(v.subject)}</td></tr>
  </table>
  <table>
    <tr><th colspan="4">بيانات خاصة بمساعد المعلم/ـة</th></tr>
    <tr><td class="b" style="width:18%">الرقم الوظيفي</td><td style="width:32%">${esc(v.jobNumber)}</td><td class="b" style="width:16%">الاسم الرباعي</td><td>${esc(v.assistantName)}</td></tr>
  </table>
  <table>
    <tr><th colspan="4">مفاتيح التقييم</th></tr>
    <tr><td class="c b" style="width:8%">3</td><td style="width:42%">الأدلة مستكملة وفاعلة</td><td class="c b" style="width:8%">1</td><td>تتوفر بعض الأدلة</td></tr>
    <tr><td class="c b">2</td><td>تتوفر معظم الأدلة</td><td class="c b">0</td><td>الأدلة غير متوفرة أو محدودة</td></tr>
    <tr><td class="c b">-</td><td colspan="3">لم يتم قياسه</td></tr>
  </table>
  <table>
    <tr><th style="width:62%">المؤشرات</th><th style="width:8%">ت</th><th>التوصيات</th></tr>
    ${rows}
    <tr><td class="b">تقييم المجال</td><td class="c b">${v.domainScore ?? ""}</td><td></td></tr>
  </table>
  <table>
    <tr><th>ملاحظات</th></tr>
    <tr><td>${esc(v.notes) || dotted(2)}</td></tr>
  </table>
  <div class="sigrow"><span>توقيع مساعد المعلم:</span><span>توقيع المنسق:</span></div>`;
  return printHtml(officialPage(body, { s }));
}

/** نموذج جلسة التحضير الجماعي — 8 بنود + تكليفات + تأمل */
export function printPrepSession(p: any, s: Settings) {
  const items = (p.items ?? []).map((x: any) =>
    `<tr><td style="width:60%">${esc(x.item)}</td>` +
    `<td class="c" style="width:8%">${x.status === "تم" ? "✓" : ""}</td>` +
    `<td class="c" style="width:10%">${x.status === "لم يتم" ? "✓" : ""}</td>` +
    `<td>${esc(x.notes)}</td></tr>`
  ).join("");
  const asg = (p.assignments ?? []).length
    ? p.assignments.map((a: any) => `<tr><td>${esc(a.lessons)}</td><td>${esc(a.teacher)}</td><td class="c">${esc(a.dueDate)}</td></tr>`).join("")
    : Array.from({ length: 4 }, () => `<tr><td></td><td></td><td></td></tr>`).join("");

  const body = `
  <table>
    <tr><th colspan="4">نموذج جلسة التحضير الجماعي للعام الأكاديمي ${esc(s.academicYear || "")}</th></tr>
    <tr><td class="b" style="width:18%">القسم</td><td style="width:32%">${esc(s.department)}</td><td class="b" style="width:16%">المادة</td><td>${esc(p.subject)}</td></tr>
    <tr><td class="b">تاريخ الجلسة</td><td>${esc(p.date)}</td><td class="b">الوقت</td><td>${esc(p.time)}</td></tr>
    <tr><td class="b">المشرف على الجلسة</td><td>${esc(p.supervisor)}</td><td class="b">أسماء الحضور</td><td>${esc(p.attendees)}</td></tr>
    <tr><td class="b">تاريخ المحضر له من</td><td>${esc(p.coversFrom)}</td><td class="b">إلى</td><td>${esc(p.coversTo)}</td></tr>
  </table>
  <table>
    <tr><th style="width:60%">البند</th><th style="width:8%">تم</th><th style="width:10%">لم يتم</th><th>ملاحظات</th></tr>
    ${items}
  </table>
  <table>
    <tr><th colspan="3">التكليف</th></tr>
    <tr><th>أسماء الدروس</th><th>المعلم المسؤول</th><th style="width:20%">تاريخ التسليم</th></tr>
    ${asg}
  </table>
  <table>
    <tr><th>التعديلات وتأمل المنسق</th></tr>
    <tr><td class="b">التعديلات والإضافات والمقترحات التي أثرت الجلسة.</td></tr>
    <tr><td>${esc(p.improvements) || dotted(2)}</td></tr>
    <tr><td class="b">تأمل المنسقة (التحديات / مقترحات للتحسين).</td></tr>
    <tr><td>${esc(p.reflection) || dotted(2)}</td></tr>
  </table>
  <div class="sigrow"><span>توقيع المشرف على الجلسة:</span><span>توقيع المنسق:</span></div>`;
  return printHtml(officialPage(body, { s }));
}

/** خطة تهيئة معلم مستجد — 7 جوانب × 4 أعمدة */
export function printInductionPlan(p: any, s: Settings) {
  const rows = (p.rows ?? []).map((r: any) =>
    `<tr><td class="b" style="width:22%">${esc(r.aspect)}</td>` +
    `<td>${esc(r.actions)}</td>` +
    `<td style="width:14%">${esc(r.owner)}</td>` +
    `<td style="width:14%">${esc(r.timeframe)}</td>` +
    `<td style="width:18%">${esc(r.evidence)}</td></tr>`
  ).join("");

  const body = `
  <table>
    <tr><th colspan="4">خطة تهيئة معلم مستجد للعام الأكاديمي ${esc(p.year)}</th></tr>
    <tr><td class="b" style="width:16%">اسم المدرسة</td><td style="width:34%">${esc(s.school)}</td><td class="b" style="width:16%">اسم المعلم</td><td>${esc(p.teacherName)}</td></tr>
    <tr><td class="b">المادة / القسم</td><td>${esc(p.subjectDept || s.department)}</td><td class="b">اسم المنسق</td><td>${esc(s.coordinator)}</td></tr>
    <tr><td class="b">التاريخ</td><td>${esc(p.date)}</td><td class="b">اسم النائب الأكاديمي</td><td>${esc(s.academicDeputy)}</td></tr>
  </table>
  <table>
    <tr><th style="width:22%">الجانب</th><th>الإجراءات</th><th style="width:14%">المسؤول عن التنفيذ</th><th style="width:14%">الإطار الزمني</th><th style="width:18%">مؤشرات التنفيذ (الأدلة)</th></tr>
    ${rows}
  </table>
  <table>
    <tr><th>ملاحظات</th></tr>
    <tr><td>${esc(p.notes) || dotted(2)}</td></tr>
  </table>
  <p>اطلعت أنا المعلم/ة ${esc(p.teacherName)} على خطة التهيئة.</p>
  <div class="sigrow"><span>توقيع المعلم:</span><span>توقيع المنسق:</span></div>`;
  return printHtml(officialPage(body, { s }));
}
