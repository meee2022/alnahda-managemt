import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
  args: {},
  handler: async (ctx) => ctx.db.query("timetable").collect(),
});

export const byTeacherDay = query({
  args: { teacherName: v.string(), day: v.string() },
  handler: async (ctx, { teacherName, day }) => {
    if (!teacherName || !day) return [];
    return ctx.db.query("timetable")
      .withIndex("by_teacher_day", (q) => q.eq("teacherName", teacherName).eq("day", day))
      .collect();
  },
});

export const byDay = query({
  args: { day: v.string() },
  handler: async (ctx, { day }) => {
    if (!day) return [];
    return ctx.db.query("timetable")
      .withIndex("by_day", (q) => q.eq("day", day))
      .collect();
  },
});

export const byTeacher = query({
  args: { teacherName: v.string() },
  handler: async (ctx, { teacherName }) => {
    if (!teacherName) return [];
    return ctx.db.query("timetable")
      .withIndex("by_teacher_day", (q) => q.eq("teacherName", teacherName))
      .collect();
  },
});

export const upsert = mutation({
  args: {
    teacherName: v.string(),
    day: v.string(),
    period: v.string(),
    className: v.string(),
    subject: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db.query("timetable")
      .withIndex("by_teacher_day", (q) => q.eq("teacherName", args.teacherName).eq("day", args.day))
      .collect();
    const match = existing.find((e) => e.period === args.period);
    if (match) {
      await ctx.db.patch(match._id, { className: args.className, subject: args.subject });
    } else {
      await ctx.db.insert("timetable", args);
    }
  },
});

export const remove = mutation({
  args: { id: v.id("timetable") },
  handler: async (ctx, { id }) => ctx.db.delete(id),
});

// إدخال جماعي من الجدول المرفوع — يحدّث الموجود ويضيف الجديد ويعيد عدد المعلمات والخلايا
export const bulkUpsert = mutation({
  args: {
    entries: v.array(
      v.object({
        teacherName: v.string(),
        day: v.string(),
        period: v.string(),
        className: v.string(),
        subject: v.optional(v.string()),
      })
    ),
    replaceTeachers: v.optional(v.boolean()),
  },
  handler: async (ctx, { entries, replaceTeachers }) => {
    const valid = entries.filter((e) => e.teacherName?.trim() && e.day?.trim() && e.period?.trim() && e.className?.trim());

    // عند الاستبدال: امسح كل حصص المعلمات الواردة في الملف أولاً (جدول جديد بالكامل)
    if (replaceTeachers) {
      const names = Array.from(new Set(valid.map((e) => e.teacherName.trim())));
      for (const name of names) {
        const old = await ctx.db
          .query("timetable")
          .withIndex("by_teacher_day", (q) => q.eq("teacherName", name))
          .collect();
        for (const o of old) await ctx.db.delete(o._id);
      }
      for (const e of valid) {
        await ctx.db.insert("timetable", {
          teacherName: e.teacherName.trim(),
          day: e.day.trim(),
          period: e.period.trim(),
          className: e.className.trim(),
          subject: e.subject?.trim() || undefined,
        });
      }
    } else {
      for (const e of valid) {
        const existing = await ctx.db
          .query("timetable")
          .withIndex("by_teacher_day", (q) => q.eq("teacherName", e.teacherName.trim()).eq("day", e.day.trim()))
          .collect();
        const match = existing.find((x) => x.period === e.period.trim());
        if (match) {
          await ctx.db.patch(match._id, { className: e.className.trim(), subject: e.subject?.trim() || undefined });
        } else {
          await ctx.db.insert("timetable", {
            teacherName: e.teacherName.trim(),
            day: e.day.trim(),
            period: e.period.trim(),
            className: e.className.trim(),
            subject: e.subject?.trim() || undefined,
          });
        }
      }
    }

    const teacherCount = new Set(valid.map((e) => e.teacherName.trim())).size;
    return { cells: valid.length, teachers: teacherCount };
  },
});
