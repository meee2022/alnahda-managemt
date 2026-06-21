import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// ===== التطوير المهني =====
export const listTrainings = query({
  args: { teacherName: v.optional(v.string()) },
  handler: async (ctx, { teacherName }) => {
    let rows = await ctx.db.query("trainings").collect();
    if (teacherName) rows = rows.filter((x) => x.teacherName === teacherName);
    return rows.sort((a, b) => b.date.localeCompare(a.date));
  },
});

export const createTraining = mutation({
  args: {
    teacherName: v.string(),
    programName: v.string(),
    date: v.string(),
    month: v.string(),
    hours: v.optional(v.string()),
    type: v.string(),
    category: v.optional(v.string()),
    impact: v.optional(v.string()),
  },
  handler: async (ctx, args) => ctx.db.insert("trainings", args),
});

export const updateTraining = mutation({
  args: {
    id: v.id("trainings"),
    programName: v.optional(v.string()),
    date: v.optional(v.string()),
    month: v.optional(v.string()),
    hours: v.optional(v.string()),
    type: v.optional(v.string()),
    category: v.optional(v.string()),
    impact: v.optional(v.string()),
  },
  handler: async (ctx, { id, ...rest }) => {
    const patch = Object.fromEntries(Object.entries(rest).filter(([, val]) => val !== undefined));
    await ctx.db.patch(id, patch);
  },
});

export const removeTraining = mutation({
  args: { id: v.id("trainings") },
  handler: async (ctx, { id }) => ctx.db.delete(id),
});

// ===== القراءة المهنية =====
export const listReadings = query({
  args: {},
  handler: async (ctx) => (await ctx.db.query("professionalReadings").collect()).sort((a, b) => b._creationTime - a._creationTime),
});

export const createReading = mutation({
  args: { teacherName: v.string(), date: v.string(), bookTitle: v.string(), summary: v.string() },
  handler: async (ctx, args) => ctx.db.insert("professionalReadings", args),
});

export const removeReading = mutation({
  args: { id: v.id("professionalReadings") },
  handler: async (ctx, { id }) => ctx.db.delete(id),
});
