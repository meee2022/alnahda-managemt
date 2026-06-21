import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
  args: { month: v.optional(v.string()) },
  handler: async (ctx, { month }) => {
    let visits = await ctx.db.query("visits").collect();
    if (month) visits = visits.filter((x) => x.month === month);
    return visits.sort((a, b) => a.date.localeCompare(b.date));
  },
});

export const create = mutation({
  args: {
    teacherName: v.string(),
    grade: v.string(),
    section: v.string(),
    date: v.string(),
    month: v.string(),
    subject: v.string(),
    lesson: v.optional(v.string()),
    purpose: v.optional(v.string()),
    attendanceType: v.optional(v.string()),
    status: v.string(),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => ctx.db.insert("visits", args),
});

export const update = mutation({
  args: {
    id: v.id("visits"),
    teacherName: v.optional(v.string()),
    grade: v.optional(v.string()),
    section: v.optional(v.string()),
    date: v.optional(v.string()),
    month: v.optional(v.string()),
    subject: v.optional(v.string()),
    lesson: v.optional(v.string()),
    purpose: v.optional(v.string()),
    attendanceType: v.optional(v.string()),
    status: v.optional(v.string()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, { id, ...rest }) => {
    const patch = Object.fromEntries(Object.entries(rest).filter(([, val]) => val !== undefined));
    await ctx.db.patch(id, patch);
  },
});

export const remove = mutation({
  args: { id: v.id("visits") },
  handler: async (ctx, { id }) => ctx.db.delete(id),
});
