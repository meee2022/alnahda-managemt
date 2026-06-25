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

// حذف ملف مخزّن — يُستدعى بعد قراءة الملفات المؤقتة (الرفع للتحليل فقط) لتوفير المساحة
export const remove = mutation({
  args: { storageId: v.id("_storage") },
  handler: async (ctx, { storageId }) => {
    try { await ctx.storage.delete(storageId); } catch {}
  },
});

// تنظيف الملفات غير المرتبطة بأي سجل (يتيمة) — يحذف القديمة المتراكمة لتوفير المساحة
// يُبقي الملفات المؤرشفة: توقيع الاجتماع، والملف الأصلي للزيارة الصفية ومتابعة الأداء
export const cleanupOrphans = mutation({
  args: {},
  handler: async (ctx) => {
    const referenced = new Set<string>();
    for (const m of await ctx.db.query("meetingRecords").collect()) if (m.signatureId) referenced.add(m.signatureId as any);
    for (const v of await ctx.db.query("classVisits").collect()) if (v.sourceFileId) referenced.add(v.sourceFileId as any);
    for (const p of await ctx.db.query("performanceVisits").collect()) if (p.sourceFileId) referenced.add(p.sourceFileId as any);

    const files = await ctx.db.system.query("_storage").collect();
    let deleted = 0;
    let freedBytes = 0;
    for (const f of files) {
      if (!referenced.has(f._id)) {
        try { await ctx.storage.delete(f._id); deleted++; freedBytes += (f as any).size ?? 0; } catch {}
      }
    }
    return { deleted, kept: referenced.size, total: files.length, freedKB: Math.round(freedBytes / 1024) };
  },
});
