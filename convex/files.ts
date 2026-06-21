import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// رابط رفع مؤقت لتخزين Convex
export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => await ctx.storage.generateUploadUrl(),
});

// رابط عرض/تنزيل ملف مخزّن (لأرشفة الاستمارة الأصلية)
export const getUrl = query({
  args: { storageId: v.id("_storage") },
  handler: async (ctx, { storageId }) => await ctx.storage.getUrl(storageId),
});
