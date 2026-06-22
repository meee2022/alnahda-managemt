import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

const sectionObj = v.object({ domain: v.string(), subDomain: v.string(), summary: v.string(), notes: v.string() });

// ===== التقرير الشهري للمنسقة =====
export const listMonthly = query({
  args: {},
  handler: async (ctx) => (await ctx.db.query("monthlyReports").collect()).sort((a, b) => b._creationTime - a._creationTime),
});

export const getMonthly = query({
  args: { id: v.id("monthlyReports") },
  handler: async (ctx, { id }) => ctx.db.get(id),
});

export const createMonthly = mutation({
  args: { month: v.string(), year: v.string(), sections: v.array(sectionObj), deputyFeedback: v.optional(v.string()) },
  handler: async (ctx, args) => ctx.db.insert("monthlyReports", args),
});

export const updateMonthly = mutation({
  args: { id: v.id("monthlyReports"), sections: v.optional(v.array(sectionObj)), deputyFeedback: v.optional(v.string()) },
  handler: async (ctx, { id, ...rest }) => {
    const patch = Object.fromEntries(Object.entries(rest).filter(([, val]) => val !== undefined));
    await ctx.db.patch(id, patch);
  },
});

export const removeMonthly = mutation({
  args: { id: v.id("monthlyReports") },
  handler: async (ctx, { id }) => ctx.db.delete(id),
});

// ===== الإنجازات =====
export const listAchievements = query({
  args: {},
  handler: async (ctx) => (await ctx.db.query("achievements").collect()).sort((a, b) => b._creationTime - a._creationTime),
});

export const createAchievement = mutation({
  args: { month: v.string(), category: v.string(), description: v.string() },
  handler: async (ctx, args) => ctx.db.insert("achievements", args),
});

export const updateAchievement = mutation({
  args: { id: v.id("achievements"), month: v.optional(v.string()), category: v.optional(v.string()), description: v.optional(v.string()) },
  handler: async (ctx, { id, ...rest }) => {
    const patch = Object.fromEntries(Object.entries(rest).filter(([, val]) => val !== undefined));
    await ctx.db.patch(id, patch);
  },
});

export const removeAchievement = mutation({
  args: { id: v.id("achievements") },
  handler: async (ctx, { id }) => ctx.db.delete(id),
});

// ===== التوصيات المتتبعة =====
export const listRecommendations = query({
  args: { status: v.optional(v.string()) },
  handler: async (ctx, { status }) => {
    let rows = await ctx.db.query("recommendations").collect();
    if (status) rows = rows.filter((x) => x.status === status);
    return rows.sort((a, b) => b._creationTime - a._creationTime);
  },
});

export const createRecommendation = mutation({
  args: {
    source: v.string(),
    sourceLabel: v.optional(v.string()),
    text: v.string(),
    assignee: v.optional(v.string()),
    dueDate: v.optional(v.string()),
    createdDate: v.string(),
  },
  handler: async (ctx, args) => ctx.db.insert("recommendations", { ...args, status: "جديدة" }),
});

export const updateRecommendation = mutation({
  args: {
    id: v.id("recommendations"),
    source: v.optional(v.string()),
    sourceLabel: v.optional(v.string()),
    text: v.optional(v.string()),
    assignee: v.optional(v.string()),
    dueDate: v.optional(v.string()),
    createdDate: v.optional(v.string()),
  },
  handler: async (ctx, { id, ...rest }) => {
    const patch = Object.fromEntries(Object.entries(rest).filter(([, val]) => val !== undefined));
    await ctx.db.patch(id, patch);
  },
});

export const setRecommendationStatus = mutation({
  args: { id: v.id("recommendations"), status: v.string() },
  handler: async (ctx, { id, status }) => ctx.db.patch(id, { status }),
});

export const removeRecommendation = mutation({
  args: { id: v.id("recommendations") },
  handler: async (ctx, { id }) => ctx.db.delete(id),
});
