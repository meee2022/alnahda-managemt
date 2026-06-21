import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

const examRow = v.object({
  grade: v.string(),
  section: v.string(),
  passRate: v.number(),
  achievementRate: v.number(),
  addedValue: v.number(),
  highCount: v.optional(v.number()),
  midCount: v.optional(v.number()),
  lowCount: v.optional(v.number()),
  failCount: v.optional(v.number()),
});

// ===== نتائج الاختبارات =====
export const listExams = query({
  args: {},
  handler: async (ctx) => (await ctx.db.query("examResults").collect()).sort((a, b) => b._creationTime - a._creationTime),
});

export const createExam = mutation({
  args: {
    title: v.string(),
    subject: v.string(),
    term: v.string(),
    year: v.string(),
    rows: v.array(examRow),
    riseReasons: v.optional(v.string()),
    declineReasons: v.optional(v.string()),
    unmetStandards: v.optional(v.string()),
    remedialActions: v.optional(v.string()),
    enrichmentActions: v.optional(v.string()),
    coordinatorRecommendations: v.optional(v.string()),
    deputyRecommendations: v.optional(v.string()),
  },
  handler: async (ctx, args) => ctx.db.insert("examResults", args),
});

export const updateExam = mutation({
  args: {
    id: v.id("examResults"),
    title: v.optional(v.string()),
    rows: v.optional(v.array(examRow)),
    riseReasons: v.optional(v.string()),
    declineReasons: v.optional(v.string()),
    unmetStandards: v.optional(v.string()),
    remedialActions: v.optional(v.string()),
    enrichmentActions: v.optional(v.string()),
    coordinatorRecommendations: v.optional(v.string()),
    deputyRecommendations: v.optional(v.string()),
  },
  handler: async (ctx, { id, ...rest }) => {
    const patch = Object.fromEntries(Object.entries(rest).filter(([, val]) => val !== undefined));
    await ctx.db.patch(id, patch);
  },
});

export const removeExam = mutation({
  args: { id: v.id("examResults") },
  handler: async (ctx, { id }) => ctx.db.delete(id),
});

// ===== متابعة الخطة الفصلية =====
export const listWeeks = query({
  args: { grade: v.optional(v.string()), term: v.optional(v.string()) },
  handler: async (ctx, { grade, term }) => {
    let weeks = await ctx.db.query("curriculumWeeks").collect();
    if (grade) weeks = weeks.filter((w) => w.grade === grade);
    if (term) weeks = weeks.filter((w) => w.term === term);
    return weeks.sort((a, b) => a.weekNumber - b.weekNumber);
  },
});

export const upsertWeek = mutation({
  args: {
    id: v.optional(v.id("curriculumWeeks")),
    grade: v.string(),
    term: v.string(),
    weekNumber: v.number(),
    unit: v.optional(v.string()),
    arabicLessons: v.optional(v.string()),
    arabicDone: v.optional(v.boolean()),
    arabicNotes: v.optional(v.string()),
    islamicLessons: v.optional(v.string()),
    islamicDone: v.optional(v.boolean()),
    islamicNotes: v.optional(v.string()),
  },
  handler: async (ctx, { id, ...rest }) => {
    if (id) {
      await ctx.db.patch(id, rest);
      return id;
    }
    return ctx.db.insert("curriculumWeeks", rest);
  },
});

export const removeWeek = mutation({
  args: { id: v.id("curriculumWeeks") },
  handler: async (ctx, { id }) => ctx.db.delete(id),
});

// ===== متابعة الأعمال الكتابية =====
export const listWrittenWork = query({
  args: { grade: v.optional(v.string()), section: v.optional(v.string()), subject: v.optional(v.string()) },
  handler: async (ctx, { grade, section, subject }) => {
    let rows = await ctx.db.query("writtenWorkRecords").collect();
    if (grade) rows = rows.filter((x) => x.grade === grade);
    if (section) rows = rows.filter((x) => x.section === section);
    if (subject) rows = rows.filter((x) => x.subject === subject);
    return rows;
  },
});

const triple = v.object({ date: v.string(), continuity: v.number(), accuracy: v.number(), reinforcement: v.number(), correction: v.number() });
const hw = v.object({ date: v.string(), accuracy: v.number(), reinforcement: v.number(), correction: v.number() });
const qz = v.object({ date: v.string(), accuracy: v.number(), reinforcement: v.number() });

export const upsertWrittenWork = mutation({
  args: {
    id: v.optional(v.id("writtenWorkRecords")),
    studentName: v.string(),
    grade: v.string(),
    section: v.string(),
    subject: v.string(),
    teacherName: v.optional(v.string()),
    term: v.optional(v.string()),
    notebook: v.optional(triple),
    homework: v.optional(hw),
    quizzes: v.optional(qz),
    feedback: v.optional(v.string()),
  },
  handler: async (ctx, { id, ...rest }) => {
    if (id) {
      const patch = Object.fromEntries(Object.entries(rest).filter(([, val]) => val !== undefined));
      await ctx.db.patch(id, patch);
      return id;
    }
    return ctx.db.insert("writtenWorkRecords", rest);
  },
});
