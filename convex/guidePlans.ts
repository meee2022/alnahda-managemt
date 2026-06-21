import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

const planRow = v.object({
  guideName: v.optional(v.string()),
  visitDate: v.optional(v.string()),
  domain: v.optional(v.string()),
  actions: v.optional(v.string()),
  period: v.optional(v.string()),
  followDate: v.optional(v.string()),
  indicators: v.optional(v.string()),
});

export const list = query({
  args: {},
  handler: async (ctx) => (await ctx.db.query("guidePlans").collect()).sort((a, b) => b._creationTime - a._creationTime),
});

export const create = mutation({
  args: {
    teacherName: v.string(),
    grade: v.optional(v.string()),
    section: v.optional(v.string()),
    date: v.optional(v.string()),
    rows: v.array(planRow),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => ctx.db.insert("guidePlans", args),
});

export const update = mutation({
  args: {
    id: v.id("guidePlans"),
    teacherName: v.optional(v.string()),
    grade: v.optional(v.string()),
    section: v.optional(v.string()),
    date: v.optional(v.string()),
    rows: v.optional(v.array(planRow)),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, { id, ...rest }) => {
    const patch = Object.fromEntries(Object.entries(rest).filter(([, val]) => val !== undefined));
    await ctx.db.patch(id, patch);
  },
});

export const remove = mutation({
  args: { id: v.id("guidePlans") },
  handler: async (ctx, { id }) => ctx.db.delete(id),
});
