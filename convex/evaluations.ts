import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// ===== التقرير الدوري الشهري =====
export const listPeriodic = query({
  args: { teacherName: v.optional(v.string()) },
  handler: async (ctx, { teacherName }) => {
    let reports = await ctx.db.query("periodicReports").collect();
    if (teacherName) reports = reports.filter((r) => r.teacherName === teacherName);
    return reports.sort((a, b) => b._creationTime - a._creationTime);
  },
});

export const createPeriodic = mutation({
  args: {
    teacherName: v.string(),
    month: v.string(),
    date: v.optional(v.string()),
    scores: v.array(v.object({ domain: v.string(), practice: v.string(), score: v.number(), note: v.optional(v.string()) })),
    generalNotes: v.optional(v.string()),
  },
  handler: async (ctx, args) => ctx.db.insert("periodicReports", args),
});

export const updatePeriodic = mutation({
  args: {
    id: v.id("periodicReports"),
    scores: v.optional(v.array(v.object({ domain: v.string(), practice: v.string(), score: v.number(), note: v.optional(v.string()) }))),
    generalNotes: v.optional(v.string()),
    month: v.optional(v.string()),
  },
  handler: async (ctx, { id, ...rest }) => {
    const patch = Object.fromEntries(Object.entries(rest).filter(([, val]) => val !== undefined));
    await ctx.db.patch(id, patch);
  },
});

export const removePeriodic = mutation({
  args: { id: v.id("periodicReports") },
  handler: async (ctx, { id }) => ctx.db.delete(id),
});

// ===== التقييم السنوي =====
export const listAnnual = query({
  args: {},
  handler: async (ctx) => (await ctx.db.query("annualEvaluations").collect()).sort((a, b) => b._creationTime - a._creationTime),
});

export const getAnnual = query({
  args: { id: v.id("annualEvaluations") },
  handler: async (ctx, { id }) => ctx.db.get(id),
});

export const createAnnual = mutation({
  args: {
    teacherName: v.string(),
    personalNo: v.optional(v.string()),
    appointmentDate: v.optional(v.string()),
    year: v.string(),
    penalties: v.optional(v.array(v.object({ type: v.string(), reason: v.string(), date: v.string() }))),
    courses: v.optional(v.array(v.object({ name: v.string(), place: v.string(), duration: v.string(), date: v.string() }))),
    indicators: v.array(v.object({ domain: v.string(), indicator: v.string(), code: v.string(), maxScore: v.number(), score: v.number() })),
    total: v.number(),
    levelLabel: v.optional(v.string()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => ctx.db.insert("annualEvaluations", args),
});

export const updateAnnual = mutation({
  args: {
    id: v.id("annualEvaluations"),
    indicators: v.optional(v.array(v.object({ domain: v.string(), indicator: v.string(), code: v.string(), maxScore: v.number(), score: v.number() }))),
    penalties: v.optional(v.array(v.object({ type: v.string(), reason: v.string(), date: v.string() }))),
    courses: v.optional(v.array(v.object({ name: v.string(), place: v.string(), duration: v.string(), date: v.string() }))),
    total: v.optional(v.number()),
    levelLabel: v.optional(v.string()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, { id, ...rest }) => {
    const patch = Object.fromEntries(Object.entries(rest).filter(([, val]) => val !== undefined));
    await ctx.db.patch(id, patch);
  },
});

export const removeAnnual = mutation({
  args: { id: v.id("annualEvaluations") },
  handler: async (ctx, { id }) => ctx.db.delete(id),
});
