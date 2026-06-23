import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

const planRow = v.object({
  action: v.optional(v.string()),
  mechanism: v.optional(v.string()),
  period: v.optional(v.string()),
  indicator: v.optional(v.string()),
});

export const list = query({
  args: {},
  handler: async (ctx) => (await ctx.db.query("devPlans").collect()).sort((a, b) => b._creationTime - a._creationTime),
});

export const create = mutation({
  args: {
    teacherName: v.string(),
    category: v.optional(v.string()),
    grade: v.optional(v.string()),
    section: v.optional(v.string()),
    date: v.optional(v.string()),
    criteria: v.optional(v.string()),
    rows: v.array(planRow),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => ctx.db.insert("devPlans", args),
});

export const update = mutation({
  args: {
    id: v.id("devPlans"),
    teacherName: v.optional(v.string()),
    category: v.optional(v.string()),
    grade: v.optional(v.string()),
    section: v.optional(v.string()),
    date: v.optional(v.string()),
    criteria: v.optional(v.string()),
    rows: v.optional(v.array(planRow)),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, { id, ...rest }) => {
    const patch = Object.fromEntries(Object.entries(rest).filter(([, val]) => val !== undefined));
    await ctx.db.patch(id, patch);
  },
});

export const remove = mutation({
  args: { id: v.id("devPlans") },
  handler: async (ctx, { id }) => ctx.db.delete(id),
});
