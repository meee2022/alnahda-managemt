import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

const meetingArgs = {
  type: v.string(),
  number: v.optional(v.string()),
  date: v.string(),
  time: v.optional(v.string()),
  place: v.optional(v.string()),
  leader: v.optional(v.string()),
  attendees: v.optional(v.string()),
  absentees: v.optional(v.string()),
  teacherName: v.optional(v.string()),
  goal: v.optional(v.string()),
  items: v.array(v.object({ title: v.string(), content: v.string() })),
  recommendations: v.optional(v.string()),
  followUp: v.optional(v.string()),
};

export const list = query({
  args: {},
  handler: async (ctx) => (await ctx.db.query("meetings").collect()).sort((a, b) => b.date.localeCompare(a.date)),
});

export const get = query({
  args: { id: v.id("meetings") },
  handler: async (ctx, { id }) => ctx.db.get(id),
});

export const create = mutation({
  args: meetingArgs,
  handler: async (ctx, args) => ctx.db.insert("meetings", args),
});

export const update = mutation({
  args: { id: v.id("meetings"), ...Object.fromEntries(Object.entries(meetingArgs).map(([k, val]) => [k, v.optional(val as any)])) } as any,
  handler: async (ctx, { id, ...rest }: any) => {
    const patch = Object.fromEntries(Object.entries(rest).filter(([, val]) => val !== undefined));
    await ctx.db.patch(id, patch);
  },
});

export const remove = mutation({
  args: { id: v.id("meetings") },
  handler: async (ctx, { id }) => ctx.db.delete(id),
});
