import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { RECOMMENDATION_SEED } from "./recommendationSeed";

const indicator = v.object({ code: v.string(), score: v.number(), recommendation: v.optional(v.string()) });

// ===== استمارة متابعة أداء معلم =====
export const list = query({
  args: {},
  handler: async (ctx) => (await ctx.db.query("performanceVisits").collect()).sort((a, b) => b._creationTime - a._creationTime),
});

export const get = query({
  args: { id: v.id("performanceVisits") },
  handler: async (ctx, { id }) => ctx.db.get(id),
});

export const create = mutation({
  args: {
    date: v.string(), day: v.optional(v.string()), subject: v.string(), unit: v.optional(v.string()),
    lessonTitle: v.optional(v.string()), visitType: v.string(), visitNumber: v.optional(v.string()),
    startTime: v.optional(v.string()), endTime: v.optional(v.string()),
    teacherName: v.string(), employeeNo: v.optional(v.string()), jobTitle: v.optional(v.string()),
    nationality: v.optional(v.string()), specialization: v.optional(v.string()),
    grade: v.string(), section: v.string(), yearsTrack: v.optional(v.string()), yearsTotal: v.optional(v.string()),
    followMode: v.optional(v.string()),
    deputyName: v.optional(v.string()), feedbackAttendance: v.optional(v.string()), deputyNotes: v.optional(v.string()),
    indicators: v.array(indicator),
    generalRecommendations: v.optional(v.string()), nextSteps: v.optional(v.string()),
    trainingNeeds: v.optional(v.string()), additionalNotes: v.optional(v.string()),
    coordinatorName: v.optional(v.string()), discussionTime: v.optional(v.string()),
    teacherAttended: v.optional(v.string()), sendDate: v.optional(v.string()),
    sourceFileId: v.optional(v.id("_storage")),
  },
  handler: async (ctx, args) => ctx.db.insert("performanceVisits", args),
});

export const update = mutation({
  args: { id: v.id("performanceVisits"), indicators: v.optional(v.array(indicator)),
    generalRecommendations: v.optional(v.string()), nextSteps: v.optional(v.string()),
    trainingNeeds: v.optional(v.string()), additionalNotes: v.optional(v.string()) },
  handler: async (ctx, { id, ...rest }) => {
    const patch = Object.fromEntries(Object.entries(rest).filter(([, x]) => x !== undefined));
    await ctx.db.patch(id, patch);
  },
});

export const remove = mutation({
  args: { id: v.id("performanceVisits") },
  handler: async (ctx, { id }) => ctx.db.delete(id),
});

// ===== بنك التوصيات والملاحظات =====
export const listBank = query({
  args: { code: v.optional(v.string()) },
  handler: async (ctx, { code }) => {
    const all = await ctx.db.query("recommendationBank").collect();
    const filtered = code ? all.filter((x) => x.code === code || x.code === "عام") : all;
    return filtered.sort((a, b) => b._creationTime - a._creationTime);
  },
});

export const addBank = mutation({
  args: { code: v.string(), text: v.string(), tags: v.optional(v.string()) },
  handler: async (ctx, args) => {
    // تجنّب التكرار الحرفي لنفس الرمز والنص
    const existing = await ctx.db
      .query("recommendationBank")
      .withIndex("by_code", (q) => q.eq("code", args.code))
      .collect();
    if (existing.some((x) => x.text.trim() === args.text.trim())) return null;
    return ctx.db.insert("recommendationBank", args);
  },
});

export const editBank = mutation({
  args: { id: v.id("recommendationBank"), text: v.string() },
  handler: async (ctx, { id, text }) => ctx.db.patch(id, { text }),
});

export const removeBank = mutation({
  args: { id: v.id("recommendationBank") },
  handler: async (ctx, { id }) => ctx.db.delete(id),
});

// بذر بنك التوصيات من الاستمارات المعبأة فعلياً (يتجاهل المكرر — آمن لإعادة التشغيل)
export const seedBank = mutation({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db.query("recommendationBank").collect();
    const have = new Set(existing.map((x) => x.code + "||" + x.text.trim()));
    let added = 0;
    for (const r of RECOMMENDATION_SEED) {
      const key = r.code + "||" + r.text.trim();
      if (have.has(key)) continue;
      await ctx.db.insert("recommendationBank", { code: r.code, text: r.text });
      have.add(key);
      added++;
    }
    return { added, total: RECOMMENDATION_SEED.length };
  },
});
