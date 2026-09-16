import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// ===== استمارات 2026-2027 =====
// خمس استمارات رسمية: التقرير الكمي للمعلم، تقرير القسم، زيارة مساعد المعلم،
// جلسة التحضير الجماعي، وخطة تهيئة معلم مستجد.

const examRow = v.object({
  section: v.string(),
  subject: v.optional(v.string()),
  passRate: v.number(),
  achievementRate: v.number(),
  addedValue: v.number(),
  highCount: v.optional(v.number()),
  midCount: v.optional(v.number()),
  lowCount: v.optional(v.number()),
  failCount: v.optional(v.number()),
});

// ---------- التقرير الكمي/الوصفي للمعلم ----------
export const listTeacherExamReports = query({
  args: {},
  handler: async (ctx) => (await ctx.db.query("teacherExamReports").collect()).reverse(),
});

export const saveTeacherExamReport = mutation({
  args: {
    id: v.optional(v.id("teacherExamReports")),
    teacherName: v.string(),
    examTitle: v.string(),
    subject: v.optional(v.string()),
    date: v.optional(v.string()),
    year: v.string(),
    term: v.optional(v.string()),
    rows: v.array(examRow),
    unmetStandards: v.optional(v.string()),
    remedialActions: v.optional(v.string()),
    enrichmentActions: v.optional(v.string()),
    coordinatorComment: v.optional(v.string()),
  },
  handler: async (ctx, { id, ...data }) => {
    if (id) { await ctx.db.patch(id, data); return id; }
    return await ctx.db.insert("teacherExamReports", data);
  },
});

export const removeTeacherExamReport = mutation({
  args: { id: v.id("teacherExamReports") },
  handler: async (ctx, { id }) => { await ctx.db.delete(id); },
});

// ---------- تقرير القسم ----------
export const listDepartmentReports = query({
  args: {},
  handler: async (ctx) => (await ctx.db.query("departmentReports").collect()).reverse(),
});

export const saveDepartmentReport = mutation({
  args: {
    id: v.optional(v.id("departmentReports")),
    reportNumber: v.optional(v.string()),
    date: v.optional(v.string()),
    year: v.string(),
    term: v.optional(v.string()),
    entries: v.array(v.object({
      domain: v.string(), item: v.string(),
      done: v.optional(v.string()), notes: v.optional(v.string()),
    })),
    deputyFeedback: v.optional(v.string()),
  },
  handler: async (ctx, { id, ...data }) => {
    if (id) { await ctx.db.patch(id, data); return id; }
    return await ctx.db.insert("departmentReports", data);
  },
});

export const removeDepartmentReport = mutation({
  args: { id: v.id("departmentReports") },
  handler: async (ctx, { id }) => { await ctx.db.delete(id); },
});

/**
 * يجمع أرقام القسم الفعلية من بيانات التطبيق ليقترحها في تقرير القسم،
 * فتُملأ البنود من واقع السجلات بدل كتابتها يدوياً.
 */
export const departmentSnapshot = query({
  args: {},
  handler: async (ctx) => {
    const [meetings, visits, classVisits, perf, trainings, readings, exams, weeks, achievements, covers, leaves] =
      await Promise.all([
        ctx.db.query("meetings").collect(),
        ctx.db.query("visits").collect(),
        ctx.db.query("classVisits").collect(),
        ctx.db.query("performanceVisits").collect(),
        ctx.db.query("trainings").collect(),
        ctx.db.query("professionalReadings").collect(),
        ctx.db.query("examResults").collect(),
        ctx.db.query("curriculumWeeks").collect(),
        ctx.db.query("achievements").collect(),
        ctx.db.query("coverRegisters").collect(),
        ctx.db.query("leaveRegisters").collect(),
      ]);
    const coverSlots = covers.reduce((a, c) => a + (c.entries?.length ?? 0), 0);
    return {
      meetingsGroup: meetings.filter((m) => m.type === "group").length,
      meetingsIndividual: meetings.filter((m) => m.type === "individual").length,
      visitsPlanned: visits.length,
      visitsDone: visits.filter((x) => x.status === "تم").length,
      classVisits: classVisits.length,
      performanceVisits: perf.length,
      trainings: trainings.length,
      trainingsInternal: trainings.filter((t) => t.type === "داخلي").length,
      trainingsExternal: trainings.filter((t) => t.type === "خارجي").length,
      readings: readings.length,
      exams: exams.length,
      weeksTotal: weeks.length,
      weeksDone: weeks.filter((w) => w.arabicDone || w.islamicDone).length,
      achievements: achievements.length,
      coverSlots,
      leaveRecords: leaves.length,
    };
  },
});

// ---------- زيارة المنسق الصفية لمساعد معلم ----------
export const listAssistantVisits = query({
  args: {},
  handler: async (ctx) => (await ctx.db.query("assistantVisits").collect()).reverse(),
});

export const saveAssistantVisit = mutation({
  args: {
    id: v.optional(v.id("assistantVisits")),
    assistantName: v.string(),
    jobNumber: v.optional(v.string()),
    date: v.optional(v.string()),
    day: v.optional(v.string()),
    grade: v.optional(v.string()),
    section: v.optional(v.string()),
    period: v.optional(v.string()),
    subject: v.optional(v.string()),
    guide: v.optional(v.string()),
    scores: v.array(v.object({
      indicator: v.string(),
      score: v.optional(v.number()),
      recommendation: v.optional(v.string()),
    })),
    domainScore: v.optional(v.number()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, { id, ...data }) => {
    if (id) { await ctx.db.patch(id, data); return id; }
    return await ctx.db.insert("assistantVisits", data);
  },
});

export const removeAssistantVisit = mutation({
  args: { id: v.id("assistantVisits") },
  handler: async (ctx, { id }) => { await ctx.db.delete(id); },
});

// ---------- جلسة التحضير الجماعي ----------
export const listPrepSessions = query({
  args: {},
  handler: async (ctx) => (await ctx.db.query("prepSessions").collect()).reverse(),
});

export const savePrepSession = mutation({
  args: {
    id: v.optional(v.id("prepSessions")),
    date: v.optional(v.string()),
    time: v.optional(v.string()),
    subject: v.optional(v.string()),
    supervisor: v.optional(v.string()),
    attendees: v.optional(v.string()),
    coversFrom: v.optional(v.string()),
    coversTo: v.optional(v.string()),
    items: v.array(v.object({
      item: v.string(), status: v.optional(v.string()), notes: v.optional(v.string()),
    })),
    assignments: v.array(v.object({
      lessons: v.optional(v.string()), teacher: v.optional(v.string()), dueDate: v.optional(v.string()),
    })),
    improvements: v.optional(v.string()),
    reflection: v.optional(v.string()),
  },
  handler: async (ctx, { id, ...data }) => {
    if (id) { await ctx.db.patch(id, data); return id; }
    return await ctx.db.insert("prepSessions", data);
  },
});

export const removePrepSession = mutation({
  args: { id: v.id("prepSessions") },
  handler: async (ctx, { id }) => { await ctx.db.delete(id); },
});

// ---------- خطة تهيئة معلم مستجد ----------
export const listInductionPlans = query({
  args: {},
  handler: async (ctx) => (await ctx.db.query("inductionPlans").collect()).reverse(),
});

export const saveInductionPlan = mutation({
  args: {
    id: v.optional(v.id("inductionPlans")),
    teacherName: v.string(),
    subjectDept: v.optional(v.string()),
    date: v.optional(v.string()),
    year: v.string(),
    rows: v.array(v.object({
      aspect: v.string(),
      actions: v.optional(v.string()),
      owner: v.optional(v.string()),
      timeframe: v.optional(v.string()),
      evidence: v.optional(v.string()),
    })),
    notes: v.optional(v.string()),
    acknowledged: v.optional(v.boolean()),
  },
  handler: async (ctx, { id, ...data }) => {
    if (id) { await ctx.db.patch(id, data); return id; }
    return await ctx.db.insert("inductionPlans", data);
  },
});

export const removeInductionPlan = mutation({
  args: { id: v.id("inductionPlans") },
  handler: async (ctx, { id }) => { await ctx.db.delete(id); },
});
