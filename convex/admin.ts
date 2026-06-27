import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { seedData } from "./seedData";

// ===== الإعدادات =====
export const getSettings = query({
  args: {},
  handler: async (ctx) => {
    const rows = await ctx.db.query("settings").collect();
    return Object.fromEntries(rows.map((r) => [r.key, r.value]));
  },
});

export const setSetting = mutation({
  args: { key: v.string(), value: v.string() },
  handler: async (ctx, { key, value }) => {
    const existing = await ctx.db.query("settings").withIndex("by_key", (q) => q.eq("key", key)).first();
    if (existing) await ctx.db.patch(existing._id, { value });
    else await ctx.db.insert("settings", { key, value });
  },
});

// ===== قوالب الاستمارات (لوحة التحكم) =====
export const listTemplates = query({
  args: {},
  handler: async (ctx) => ctx.db.query("formTemplates").collect(),
});

export const getTemplate = query({
  args: { key: v.string() },
  handler: async (ctx, { key }) =>
    ctx.db.query("formTemplates").withIndex("by_key", (q) => q.eq("key", key)).first(),
});

export const upsertTemplate = mutation({
  args: { key: v.string(), title: v.string(), description: v.optional(v.string()), fields: v.string() },
  handler: async (ctx, { key, title, description, fields }) => {
    const existing = await ctx.db.query("formTemplates").withIndex("by_key", (q) => q.eq("key", key)).first();
    if (existing) await ctx.db.patch(existing._id, { title, description, fields });
    else await ctx.db.insert("formTemplates", { key, title, description, fields, active: true });
  },
});

// ===== إحصائيات لوحة المعلومات =====
export const dashboardStats = query({
  args: {},
  handler: async (ctx) => {
    const [teachers, students, meetings, visits, recs, trainings, exams] = await Promise.all([
      ctx.db.query("teachers").collect(),
      ctx.db.query("students").collect(),
      ctx.db.query("meetings").collect(),
      ctx.db.query("visits").collect(),
      ctx.db.query("recommendations").collect(),
      ctx.db.query("trainings").collect(),
      ctx.db.query("examResults").collect(),
    ]);
    return {
      teachers: teachers.filter((t) => t.active).length,
      students: students.filter((s) => s.active).length,
      meetings: meetings.length,
      visits: visits.length,
      visitsDone: visits.filter((x) => x.status === "تم").length,
      pendingRecommendations: recs.filter((r) => r.status !== "منفذة").length,
      trainings: trainings.length,
      exams: exams.length,
      latestMeetings: meetings.sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5),
      latestVisits: visits.sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5),
    };
  },
});

// ===== استيراد البيانات الأولية من ملفات القسم =====
export const seed = mutation({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db.query("settings").withIndex("by_key", (q) => q.eq("key", "seeded")).first();
    if (existing) return "already-seeded";

    for (const [key, value] of [
      ["school", seedData.school],
      ["department", seedData.department],
      ["coordinator", seedData.coordinator],
      ["academicYear", seedData.academicYear],
    ] as const) {
      await ctx.db.insert("settings", { key, value });
    }
    for (const t of seedData.teachers) await ctx.db.insert("teachers", { name: t.name, jobTitle: "معلمة", active: true });
    for (const c of seedData.classes) await ctx.db.insert("classes", { grade: c.grade, section: c.section, active: true });
    for (const s of seedData.students)
      await ctx.db.insert("students", { name: s.name, grade: s.grade, section: s.section, active: true });
    await ctx.db.insert("settings", { key: "seeded", value: "true" });
    return "seeded";
  },
});

// تصدير كل بيانات القسم (نسخة احتياطية)
// كل جداول البيانات (للنسخ الاحتياطي والاستعادة) — شاملة
const ALL_TABLES = [
  "settings", "teachers", "classes", "students", "meetings", "visits", "classVisits",
  "annualPlanRows", "achievementPlanRows", "agendaEntries", "teacherClassifications",
  "performanceVisits", "recommendationBank", "periodicReports", "annualEvaluations",
  "writtenWorkRecords", "examResults", "curriculumWeeks", "trainings", "professionalReadings",
  "monthlyReports", "achievements", "recommendations", "formTemplates",
  "leaveRegisters", "coverRegisters", "timetable", "guidePlans", "devPlans",
];

export const exportAll = query({
  args: {},
  handler: async (ctx) => {
    const out: Record<string, any[]> = {};
    for (const t of ALL_TABLES) {
      try { out[t] = await ctx.db.query(t as any).collect(); } catch { out[t] = []; }
    }
    return { exportedAt: Date.now(), data: out };
  },
});

// استعادة نسخة احتياطية — يُدرج السجلات من ملف النسخة (الإعدادات تُدمج بالمفتاح)
export const importAll = mutation({
  args: { data: v.any() },
  handler: async (ctx, { data }) => {
    let inserted = 0;
    for (const t of ALL_TABLES) {
      const rows = (data?.[t] ?? []) as any[];
      if (!Array.isArray(rows)) continue;
      for (const row of rows) {
        const { _id, _creationTime, ...rest } = row ?? {};
        try {
          if (t === "settings") {
            const ex = await ctx.db.query("settings").withIndex("by_key", (q) => q.eq("key", rest.key)).first();
            if (ex) await ctx.db.patch(ex._id, { value: rest.value });
            else await ctx.db.insert("settings", rest);
          } else {
            await ctx.db.insert(t as any, rest);
          }
          inserted++;
        } catch {}
      }
    }
    return { inserted };
  },
});
