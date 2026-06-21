import { query } from "./_generated/server";
import { v } from "convex/values";

// إحصائيات شاملة لكل معلمة عبر كل السجلات — لتقليل العمل اليدوي وإعطاء صورة فورية
export const teacherStats = query({
  args: {},
  handler: async (ctx) => {
    const [teachers, leaves, covers, classVisits, perfVisits, periodic, annual] = await Promise.all([
      ctx.db.query("teachers").collect(),
      ctx.db.query("leaveRegisters").collect(),
      ctx.db.query("coverRegisters").collect(),
      ctx.db.query("classVisits").collect(),
      ctx.db.query("performanceVisits").collect(),
      ctx.db.query("periodicReports").collect(),
      ctx.db.query("annualEvaluations").collect(),
    ]);

    // مهيكل لكل معلمة
    const rows = teachers.map((t) => {
      const name = t.name;
      const match = (n?: string) => !!n && (n === name || name.includes(n) || n.includes(name));

      // استئذانات: عدد المرّات + إجمالي الساعات التقريبي
      let leaveCount = 0;
      const leaveDates: string[] = [];
      for (const r of leaves) for (const e of r.entries) if (match(e.teacherName)) { leaveCount++; leaveDates.push(r.date); }

      // احتياطات نفّذتها هذه المعلمة (كمعلمة احتياط)
      let coversDone = 0;
      // غيابات هذه المعلمة (تطلّبت تغطية)
      let absences = 0;
      for (const r of covers) for (const e of r.entries) {
        if (match(e.coverTeacher)) coversDone++;
        if (match(e.teacherName)) absences++;
      }

      const classVisitCount = classVisits.filter((v: any) => match(v.teacherName)).length;
      const perfCount = perfVisits.filter((v: any) => match(v.teacherName)).length;
      const periodicCount = periodic.filter((v: any) => match(v.teacherName)).length;
      const annualCount = annual.filter((v: any) => match(v.teacherName)).length;
      // آخر نسبة سنوية إن وجدت
      const lastAnnual = annual.filter((v: any) => match(v.teacherName)).sort((a: any, b: any) => b._creationTime - a._creationTime)[0];

      return {
        id: t._id, name, grade: t.grade, section: t.section, subject: t.subject,
        employeeNumber: t.employeeNumber,
        leaveCount, leaveDates, coversDone, absences,
        classVisitCount, perfCount, periodicCount, annualCount,
        lastAnnualScore: lastAnnual?.total ?? null, lastAnnualLevel: lastAnnual?.levelLabel ?? null,
      };
    });

    // إجماليات عامة للقسم
    const totals = {
      teachers: teachers.length,
      leaves: leaves.reduce((s, r) => s + r.entries.length, 0),
      covers: covers.reduce((s, r) => s + r.entries.length, 0),
      classVisits: classVisits.length,
      perfVisits: perfVisits.length,
      periodic: periodic.length,
      annual: annual.length,
      meetings: 0,
    };

    // تنبيهات ذكية لكل معلمة
    const ALERTS: { name: string; level: "warn" | "info" | "danger"; text: string }[] = [];
    for (const r of rows) {
      if (r.leaveCount >= 3) ALERTS.push({ name: r.name, level: "warn", text: `تجاوزت ${r.leaveCount} استئذانات` });
      if (r.absences >= 3) ALERTS.push({ name: r.name, level: "danger", text: `غياب متكرر (${r.absences})` });
      if (r.classVisitCount === 0 && r.perfCount === 0) ALERTS.push({ name: r.name, level: "info", text: "لم تُزَر صفياً بعد" });
      if (r.lastAnnualScore != null && r.lastAnnualScore < 76) ALERTS.push({ name: r.name, level: "danger", text: `تقييم سنوي يحتاج دعم (${r.lastAnnualScore}%)` });
      if (!r.employeeNumber) ALERTS.push({ name: r.name, level: "info", text: "بيانات أساسية ناقصة (الرقم الوظيفي)" });
    }

    // تجميع شهري للاستئذان والاحتياط (من تواريخ بصيغة YYYY-MM-DD)
    const monthKey = (d?: string) => {
      const m = (d ?? "").match(/(\d{4})-(\d{1,2})/);
      return m ? `${m[1]}-${m[2].padStart(2, "0")}` : null;
    };
    const MONTH_AR: Record<string, string> = { "01": "يناير", "02": "فبراير", "03": "مارس", "04": "إبريل", "05": "مايو", "06": "يونيو", "07": "يوليو", "08": "أغسطس", "09": "سبتمبر", "10": "أكتوبر", "11": "نوفمبر", "12": "ديسمبر" };
    const leaveByMonth: Record<string, number> = {};
    const coverByMonth: Record<string, number> = {};
    for (const r of leaves) { const k = monthKey(r.date); if (k) leaveByMonth[k] = (leaveByMonth[k] ?? 0) + r.entries.length; }
    for (const r of covers) { const k = monthKey(r.date); if (k) coverByMonth[k] = (coverByMonth[k] ?? 0) + r.entries.length; }
    const months = [...new Set([...Object.keys(leaveByMonth), ...Object.keys(coverByMonth)])].sort();
    const monthly = months.map((k) => ({ key: k, label: MONTH_AR[k.split("-")[1]] ?? k, leaves: leaveByMonth[k] ?? 0, covers: coverByMonth[k] ?? 0 }));

    return {
      rows: rows.sort((a, b) => b.leaveCount + b.absences - (a.leaveCount + a.absences)),
      totals,
      alerts: ALERTS,
      monthly,
    };
  },
});

// ملف متكامل لمعلمة واحدة — كل سجلاتها بالتفصيل للعرض والطباعة
export const teacherDossier = query({
  args: { teacherId: v.id("teachers") },
  handler: async (ctx, { teacherId }) => {
    const t = await ctx.db.get(teacherId);
    if (!t) return null;
    const name = t.name;
    const match = (n?: string) => !!n && (n === name || name.includes(n) || n.includes(name));

    const [leavesAll, coversAll, classVisits, perfVisits, periodic, annual] = await Promise.all([
      ctx.db.query("leaveRegisters").collect(),
      ctx.db.query("coverRegisters").collect(),
      ctx.db.query("classVisits").collect(),
      ctx.db.query("performanceVisits").collect(),
      ctx.db.query("periodicReports").collect(),
      ctx.db.query("annualEvaluations").collect(),
    ]);

    const leaves: any[] = [];
    for (const r of leavesAll) for (const e of r.entries) if (match(e.teacherName)) leaves.push({ date: r.date, day: r.day, reason: e.reason, fromTime: e.fromTime, toTime: e.toTime });
    const coversDone: any[] = [];
    const absences: any[] = [];
    for (const r of coversAll) for (const e of r.entries) {
      if (match(e.coverTeacher)) coversDone.push({ date: r.date, absent: e.teacherName, grade: e.grade, section: e.section, period: e.period, planType: e.planType });
      if (match(e.teacherName)) absences.push({ date: r.date, reason: e.reason, coverTeacher: e.coverTeacher, period: e.period });
    }
    const visits = classVisits.filter((v: any) => match(v.teacherName)).map((v: any) => ({ date: v.date, subject: v.subject, grade: v.grade, section: v.section, type: v.visitType }));
    const perf = perfVisits.filter((v: any) => match(v.teacherName)).map((v: any) => ({ date: v.date, subject: v.subject, unit: v.unit, type: v.visitType }));
    const periodicReports = periodic.filter((v: any) => match(v.teacherName)).map((v: any) => ({ month: v.month }));
    const annualEvals = annual.filter((v: any) => match(v.teacherName)).map((v: any) => ({ year: v.year, total: v.total, level: v.levelLabel }));

    return { teacher: t, leaves, coversDone, absences, visits, perf, periodicReports, annualEvals };
  },
});
