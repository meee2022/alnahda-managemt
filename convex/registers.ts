import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// ===== سجل الاستئذان =====
const leaveEntry = v.object({
  teacherName: v.string(),
  reason: v.string(),
  fromTime: v.optional(v.string()),
  toTime: v.optional(v.string()),
  deputyOpinion: v.optional(v.string()),
});

export const listLeave = query({
  args: {},
  handler: async (ctx) => (await ctx.db.query("leaveRegisters").collect()).sort((a, b) => b._creationTime - a._creationTime),
});

export const createLeave = mutation({
  args: {
    date: v.string(), day: v.optional(v.string()), term: v.optional(v.string()),
    department: v.optional(v.string()), entries: v.array(leaveEntry),
  },
  handler: async (ctx, args) => ctx.db.insert("leaveRegisters", args),
});

export const removeLeave = mutation({
  args: { id: v.id("leaveRegisters") },
  handler: async (ctx, { id }) => ctx.db.delete(id),
});

// ===== سجل الاحتياط =====
const coverEntry = v.object({
  teacherName: v.string(),
  reason: v.string(),
  grade: v.optional(v.string()),
  section: v.optional(v.string()),
  period: v.optional(v.string()),
  coverTeacher: v.string(),
  planType: v.optional(v.string()),
  notify: v.optional(v.string()),
  notes: v.optional(v.string()),
});

export const listCover = query({
  args: {},
  handler: async (ctx) => (await ctx.db.query("coverRegisters").collect()).sort((a, b) => b._creationTime - a._creationTime),
});

export const createCover = mutation({
  args: {
    date: v.string(), day: v.optional(v.string()),
    department: v.optional(v.string()), entries: v.array(coverEntry),
  },
  handler: async (ctx, args) => ctx.db.insert("coverRegisters", args),
});

export const removeCover = mutation({
  args: { id: v.id("coverRegisters") },
  handler: async (ctx, { id }) => ctx.db.delete(id),
});
