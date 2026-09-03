import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { CHILDHOOD_TIMETABLE } from "./timetableData";
import { DEPT_TIMETABLE_V2 } from "./timetableData2";

// استيراد جدول حصص معلمات الطفولة من الملف الرسمي.
// يوفّق كل معلمة مع سجلها في قائمة المعلمات (بمطابقة الاسم الأول واسم العائلة)،
// ويضيف المعلمات غير الموجودة، ثم يستبدل جدول كل معلمة بالكامل بحصصها من الملف.
export const importChildhood = mutation({
  args: {},
  handler: async (ctx) => {
    const data = CHILDHOOD_TIMETABLE;
    const teachers = await ctx.db.query("teachers").collect();
    const norm = (s: string) => s.replace(/[إأآ]/g, "ا").replace(/ـ/g, "").replace(/\s+/g, " ").trim();
    const toks = (s: string) => norm(s).split(" ").filter(Boolean);

    const pdfNames = Array.from(new Set(data.map((d) => d.teacherName)));
    const nameMap: Record<string, string> = {};
    const pool: { id: any; name: string }[] = teachers.map((t) => ({ id: t._id, name: t.name }));
    let addedTeachers = 0;

    for (const pn of pdfNames) {
      const pt = toks(pn);
      const first = pt[0], last = pt[pt.length - 1];
      const match = pool.find((t) => { const tt = toks(t.name); return tt[0] === first && tt[tt.length - 1] === last; });
      if (match) {
        nameMap[pn] = match.name;
      } else {
        const id = await ctx.db.insert("teachers", { name: pn, jobTitle: "معلمة", active: true });
        pool.push({ id, name: pn });
        nameMap[pn] = pn;
        addedTeachers++;
      }
    }

    const canonical = Array.from(new Set(Object.values(nameMap)));
    for (const cn of canonical) {
      const old = await ctx.db.query("timetable")
        .withIndex("by_teacher_day", (q) => q.eq("teacherName", cn)).collect();
      for (const o of old) await ctx.db.delete(o._id);
    }

    let cells = 0;
    for (const d of data) {
      await ctx.db.insert("timetable", {
        teacherName: nameMap[d.teacherName],
        day: d.day,
        period: d.period,
        className: d.className,
        subject: d.subject || undefined,
      });
      cells++;
    }
    return { teachers: pdfNames.length, addedTeachers, cells };
  },
});

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

// نسخة خفيفة ليوم واحد — تُعيد الحقول اللازمة فقط لاقتراح الاحتياط
// (أخف بكثير من تحميل الجدول كامل، وأقل عرضة للفشل عند ضغط الخادم)
export const byDayLite = query({
  args: { day: v.string() },
  handler: async (ctx, { day }) => {
    if (!day) return [];
    const rows = await ctx.db.query("timetable")
      .withIndex("by_day", (q) => q.eq("day", day))
      .collect();
    return rows.map((r) => ({
      teacherName: r.teacherName,
      period: r.period,
      className: r.className,
    }));
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

// استيراد النسخة المحدّثة من جدول الطفولة (٩/٢/٢٠٢٦).
// يوفّق أسماء المعلمات مع القائمة (الاسم الأول + العائلة)، ويضيف الجديدات،
// ثم يستبدل جدول كل معلمة واردة بالكامل. الخانات الثابتة تُحفظ باسمها في className.
export const importDeptV2 = mutation({
  args: {},
  handler: async (ctx) => {
    const data = DEPT_TIMETABLE_V2;
    const teachers = await ctx.db.query("teachers").collect();
    const norm = (s: string) => s.replace(/[إأآ]/g, "ا").replace(/ـ/g, "").replace(/\s+/g, " ").trim();
    const toks = (s: string) => norm(s).split(" ").filter(Boolean);

    const names = Array.from(new Set(data.map((d) => d.t)));
    const nameMap: Record<string, string> = {};
    const pool: { name: string }[] = teachers.map((t) => ({ name: t.name }));
    let addedTeachers = 0;
    for (const pn of names) {
      const pt = toks(pn);
      const first = pt[0], last = pt[pt.length - 1];
      const match = pool.find((t) => { const tt = toks(t.name); return tt[0] === first && tt[tt.length - 1] === last; });
      if (match) nameMap[pn] = match.name;
      else {
        await ctx.db.insert("teachers", { name: pn, jobTitle: "معلمة", active: true });
        pool.push({ name: pn });
        nameMap[pn] = pn;
        addedTeachers++;
      }
    }

    // استبدال كامل: يُمسح الجدول القديم بالكامل حتى لا تبقى حصص معلمات
    // لم تعد ضمن الجدول الجديد فتُحدث ازدواجاً في الصفوف.
    const oldRows = await ctx.db.query("timetable").collect();
    for (const o of oldRows) await ctx.db.delete(o._id);

    for (const d of data) {
      await ctx.db.insert("timetable", {
        teacherName: nameMap[d.t], day: d.d, period: d.p,
        className: d.c, subject: d.s || undefined,
      });
    }
    return { teachers: names.length, addedTeachers, cells: data.length, removed: oldRows.length };
  },
});

// حفظ جدول مولَّد: يستبدل حصص المعلمات الواردة فقط
export const applyGenerated = mutation({
  args: {
    entries: v.array(v.object({
      teacherName: v.string(), day: v.string(), period: v.string(),
      className: v.string(), subject: v.optional(v.string()),
    })),
  },
  handler: async (ctx, { entries }) => {
    const names = Array.from(new Set(entries.map((e) => e.teacherName)));
    for (const n of names) {
      const old = await ctx.db.query("timetable")
        .withIndex("by_teacher_day", (q) => q.eq("teacherName", n)).collect();
      for (const o of old) await ctx.db.delete(o._id);
    }
    for (const e of entries) {
      await ctx.db.insert("timetable", {
        teacherName: e.teacherName, day: e.day, period: e.period,
        className: e.className, subject: e.subject || undefined,
      });
    }
    return { teachers: names.length, cells: entries.length };
  },
});
