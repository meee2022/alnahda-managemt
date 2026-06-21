import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// ===== الخطة السنوية للقسم =====
export const listAnnual = query({
  args: {},
  handler: async (ctx) => (await ctx.db.query("annualPlanRows").collect()).sort((a, b) => a.order - b.order),
});

export const upsertAnnual = mutation({
  args: {
    id: v.optional(v.id("annualPlanRows")),
    year: v.string(),
    order: v.number(),
    domain: v.string(),
    actions: v.string(),
    executor: v.optional(v.string()),
    deadline: v.optional(v.string()),
    evidence: v.optional(v.string()),
    followup: v.optional(v.string()),
    followupDate: v.optional(v.string()),
  },
  handler: async (ctx, { id, ...rest }) => {
    if (id) { await ctx.db.patch(id, rest); return id; }
    return ctx.db.insert("annualPlanRows", rest);
  },
});

export const removeAnnual = mutation({
  args: { id: v.id("annualPlanRows") },
  handler: async (ctx, { id }) => ctx.db.delete(id),
});

// ===== خطة التحصيل الأكاديمي =====
export const listAchievement = query({
  args: {},
  handler: async (ctx) => (await ctx.db.query("achievementPlanRows").collect()).sort((a, b) => a.order - b.order),
});

export const upsertAchievement = mutation({
  args: {
    id: v.optional(v.id("achievementPlanRows")),
    year: v.string(),
    stage: v.string(),
    order: v.number(),
    goal: v.string(),
    actions: v.string(),
    responsible: v.optional(v.string()),
    timeframe: v.optional(v.string()),
    indicators: v.optional(v.string()),
    execution: v.optional(v.string()),
  },
  handler: async (ctx, { id, ...rest }) => {
    if (id) { await ctx.db.patch(id, rest); return id; }
    return ctx.db.insert("achievementPlanRows", rest);
  },
});

export const removeAchievement = mutation({
  args: { id: v.id("achievementPlanRows") },
  handler: async (ctx, { id }) => ctx.db.delete(id),
});

// ===== جدول أعمال المنسقة =====
export const listAgenda = query({
  args: { term: v.optional(v.string()) },
  handler: async (ctx, { term }) => {
    let rows = await ctx.db.query("agendaEntries").collect();
    if (term) rows = rows.filter((r) => r.term === term);
    return rows.sort((a, b) => a.order - b.order);
  },
});

export const upsertAgenda = mutation({
  args: {
    id: v.optional(v.id("agendaEntries")),
    year: v.string(),
    term: v.string(),
    order: v.number(),
    period: v.string(),
    meetings: v.optional(v.string()),
    visitsCol: v.optional(v.string()),
    reportsCol: v.optional(v.string()),
    events: v.optional(v.string()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, { id, ...rest }) => {
    if (id) { await ctx.db.patch(id, rest); return id; }
    return ctx.db.insert("agendaEntries", rest);
  },
});

export const removeAgenda = mutation({
  args: { id: v.id("agendaEntries") },
  handler: async (ctx, { id }) => ctx.db.delete(id),
});
