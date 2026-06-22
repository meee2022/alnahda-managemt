import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// ===== استمارة زيارة المنسق الصفية لمعلم =====
export const list = query({
  args: {},
  handler: async (ctx) => (await ctx.db.query("classVisits").collect()).sort((a, b) => b._creationTime - a._creationTime),
});

export const get = query({
  args: { id: v.id("classVisits") },
  handler: async (ctx, { id }) => ctx.db.get(id),
});

export const create = mutation({
  args: {
    teacherName: v.string(),
    subject: v.string(),
    grade: v.string(),
    section: v.string(),
    date: v.string(),
    lessonTopic: v.optional(v.string()),
    visitor: v.optional(v.string()),
    visitType: v.string(),
    scores: v.array(v.object({ code: v.string(), score: v.number(), recommendation: v.optional(v.string()) })),
    followup: v.optional(v.array(v.string())),
    recommendations: v.optional(v.string()),
    sourceFileId: v.optional(v.id("_storage")),
  },
  handler: async (ctx, args) => ctx.db.insert("classVisits", args),
});

export const update = mutation({
  args: {
    id: v.id("classVisits"),
    teacherName: v.optional(v.string()),
    subject: v.optional(v.string()),
    grade: v.optional(v.string()),
    section: v.optional(v.string()),
    date: v.optional(v.string()),
    lessonTopic: v.optional(v.string()),
    visitor: v.optional(v.string()),
    visitType: v.optional(v.string()),
    scores: v.optional(v.array(v.object({ code: v.string(), score: v.number(), recommendation: v.optional(v.string()) }))),
    followup: v.optional(v.array(v.string())),
    recommendations: v.optional(v.string()),
  },
  handler: async (ctx, { id, ...rest }) => {
    const patch = Object.fromEntries(Object.entries(rest).filter(([, val]) => val !== undefined));
    await ctx.db.patch(id, patch);
  },
});

export const remove = mutation({
  args: { id: v.id("classVisits") },
  handler: async (ctx, { id }) => ctx.db.delete(id),
});

// ===== تصنيف أداء المعلمين =====
export const listClassifications = query({
  args: {},
  handler: async (ctx) => ctx.db.query("teacherClassifications").collect(),
});

export const setClassification = mutation({
  args: { teacherName: v.string(), category: v.string(), term: v.optional(v.string()) },
  handler: async (ctx, { teacherName, category, term }) => {
    const existing = await ctx.db
      .query("teacherClassifications")
      .withIndex("by_teacher", (q) => q.eq("teacherName", teacherName))
      .first();
    if (existing) await ctx.db.patch(existing._id, { category, term });
    else await ctx.db.insert("teacherClassifications", { teacherName, category, term });
  },
});

export const clearClassification = mutation({
  args: { teacherName: v.string() },
  handler: async (ctx, { teacherName }) => {
    const existing = await ctx.db
      .query("teacherClassifications")
      .withIndex("by_teacher", (q) => q.eq("teacherName", teacherName))
      .first();
    if (existing) await ctx.db.delete(existing._id);
  },
});
