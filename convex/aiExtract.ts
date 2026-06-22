"use node";
import { action } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";

// مخطط المخرجات المنظّمة لاستمارة متابعة الأداء (يُجبر النموذج على إرجاعها)
const PERF_TOOL = {
  name: "submit_performance",
  description: "أعد بيانات استمارة متابعة أداء المعلم المستخرجة من المستند.",
  input_schema: {
    type: "object",
    properties: {
      teacherName: { type: "string", description: "اسم المعلمة الرباعي" },
      employeeNo: { type: "string", description: "الرقم الوظيفي" },
      nationality: { type: "string" },
      specialization: { type: "string", description: "التخصص" },
      jobTitle: { type: "string", description: "المسمى الوظيفي" },
      subject: { type: "string", description: "المادة" },
      grade: { type: "string", description: "الصف" },
      section: { type: "string", description: "الشعبة" },
      date: { type: "string", description: "تاريخ الزيارة كما هو مكتوب" },
      unit: { type: "string", description: "الوحدة" },
      lessonTitle: { type: "string", description: "عنوان الدرس" },
      visitType: { type: "string", description: "نوع الزيارة (كلي/جزئي)" },
      deputyName: { type: "string" },
      indicators: {
        type: "array",
        description: "تقييم كل مؤشر بكوده (مثل 1.1، 2.3) والدرجة والتوصية المكتوبة",
        items: {
          type: "object",
          properties: {
            code: { type: "string", description: "كود المؤشر مثل 2.3" },
            score: { type: "number", description: "الدرجة: 3 مستكمل، 2 معظم الأدلة، 1 بعض الأدلة، 0 غير متوفر، -1 لم يقاس" },
            recommendation: { type: "string", description: "نص التوصية/الملاحظة لهذا المؤشر كما هو مكتوب" },
          },
          required: ["code"],
        },
      },
      generalRecommendations: { type: "string", description: "التوصيات العامة" },
      nextSteps: { type: "string", description: "الخطوات القادمة" },
      trainingNeeds: { type: "string", description: "الاحتياجات التدريبية" },
      additionalNotes: { type: "string", description: "ملاحظات إضافية" },
    },
    required: ["teacherName", "indicators"],
  },
};

// مخطط استمارة الزيارة الصفية (مؤشرات 1.1–4.4)
const VISIT_TOOL = {
  name: "submit_class_visit",
  description: "أعد بيانات استمارة الزيارة الصفية المستخرجة من المستند.",
  input_schema: {
    type: "object",
    properties: {
      teacherName: { type: "string", description: "اسم المعلمة" },
      subject: { type: "string", description: "المادة" },
      grade: { type: "string", description: "الصف" },
      section: { type: "string", description: "الشعبة" },
      date: { type: "string", description: "اليوم/التاريخ" },
      lessonTopic: { type: "string", description: "موضوع الدرس" },
      visitor: { type: "string", description: "الزائر" },
      visitType: { type: "string", description: "نوع الزيارة (كلية/جزئية)" },
      scores: {
        type: "array",
        description: "تقييم كل مؤشر بكوده (1.1، 2.3...) والدرجة والتوصية المكتوبة",
        items: {
          type: "object",
          properties: {
            code: { type: "string" },
            score: { type: "number", description: "3 مستكمل، 2 معظم، 1 بعض، 0 غير متوفر، -1 لم يقاس" },
            recommendation: { type: "string", description: "نص التوصية كما هو مكتوب" },
          },
          required: ["code"],
        },
      },
      recommendations: { type: "string", description: "ملاحظات وتوصيات عامة" },
    },
    required: ["teacherName", "scores"],
  },
};

// مخطط استخراج جدول الحصص الأسبوعي من صورة/PDF مطبوع
const TIMETABLE_TOOL = {
  name: "submit_timetable",
  description: "أعد كل خلايا جدول الحصص الأسبوعي المستخرجة من الصورة/المستند، خليّة لكل (معلمة + يوم + حصة).",
  input_schema: {
    type: "object",
    properties: {
      entries: {
        type: "array",
        description: "كل حصة مسندة لمعلمة في يوم وحصة محددين",
        items: {
          type: "object",
          properties: {
            teacherName: { type: "string", description: "اسم المعلمة كما هو مكتوب في الجدول" },
            day: { type: "string", description: "اليوم: السبت | الأحد | الاثنين | الثلاثاء | الأربعاء | الخميس" },
            period: { type: "string", description: "رقم الحصة كرقم: 1 .. 8" },
            className: { type: "string", description: "الصف والشعبة، مثل: الأول/أ أو 1/A" },
            subject: { type: "string", description: "المادة إن وُجدت" },
          },
          required: ["teacherName", "day", "period", "className"],
        },
      },
    },
    required: ["entries"],
  },
};

export const extractTimetable = action({
  args: { storageId: v.id("_storage"), mediaType: v.string() },
  handler: async (ctx, { storageId, mediaType }): Promise<{ ok: boolean; data?: any; error?: string }> => {
    const settings: Record<string, string> = await ctx.runQuery(api.admin.getSettings, {});
    const apiKey = settings.anthropicApiKey || process.env.ANTHROPIC_API_KEY;
    if (!apiKey) return { ok: false, error: "لم يتم إدخال مفتاح Anthropic API. فعّليه من مساعد التوصيات أولاً." };

    const blob = await ctx.storage.get(storageId);
    if (!blob) return { ok: false, error: "تعذّر قراءة الملف المرفوع." };
    const base64 = (globalThis as any).Buffer.from(await blob.arrayBuffer()).toString("base64");

    const isPdf = mediaType === "application/pdf";
    const sourceBlock = isPdf
      ? { type: "document", source: { type: "base64", media_type: "application/pdf", data: base64 } }
      : { type: "image", source: { type: "base64", media_type: mediaType, data: base64 } };

    const sys = `أنت مساعد دقيق لمنسقة قسم. مهمتك قراءة جدول الحصص الأسبوعي المطبوع (صورة أو PDF) واستخراج كل خلية فيه. لكل معلمة، حددي حصصها في كل يوم (السبت، الأحد، الاثنين، الثلاثاء، الأربعاء، الخميس) ورقم الحصة (1 إلى 8) والصف/الشعبة والمادة. أعيدي رقم الحصة كرقم فقط (مثل "3" وليس "الحصة الثالثة"). إن كان الجدول يعرض لكل معلمة صفها وشعبتها لكل حصة، استخرجيها حرفياً. لا تختلقي بيانات؛ تجاهلي الخلايا الفارغة. ثم استدعي الأداة submit_timetable بكل الخلايا.`;

    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "content-type": "application/json", "x-api-key": apiKey, "anthropic-version": "2023-06-01" },
        body: JSON.stringify({
          model: "claude-sonnet-4-6",
          max_tokens: 16000,
          system: sys,
          tools: [TIMETABLE_TOOL],
          tool_choice: { type: "tool", name: TIMETABLE_TOOL.name },
          messages: [{ role: "user", content: [sourceBlock, { type: "text", text: "استخرجي كل خلايا جدول الحصص لكل المعلمات." }] }],
        }),
      });
      if (!res.ok) {
        const t = await res.text();
        return { ok: false, error: `خطأ من Claude API (${res.status}): ${t.slice(0, 200)}` };
      }
      const data: any = await res.json();
      const toolUse = (data?.content ?? []).find((b: any) => b.type === "tool_use");
      if (!toolUse) return { ok: false, error: "لم يُرجع النموذج بيانات منظّمة." };
      return { ok: true, data: toolUse.input };
    } catch (e: any) {
      return { ok: false, error: `فشل الاتصال: ${String(e?.message ?? e).slice(0, 200)}` };
    }
  },
});

export const extractForm = action({
  args: { storageId: v.id("_storage"), mediaType: v.string(), formType: v.optional(v.string()) },
  handler: async (ctx, { storageId, mediaType, formType }): Promise<{ ok: boolean; data?: any; error?: string }> => {
    const settings: Record<string, string> = await ctx.runQuery(api.admin.getSettings, {});
    const apiKey = settings.anthropicApiKey || process.env.ANTHROPIC_API_KEY;
    if (!apiKey) return { ok: false, error: "لم يتم إدخال مفتاح Anthropic API. فعّليه من مساعد التوصيات أولاً." };

    const blob = await ctx.storage.get(storageId);
    if (!blob) return { ok: false, error: "تعذّر قراءة الملف المرفوع." };
    const base64 = (globalThis as any).Buffer.from(await blob.arrayBuffer()).toString("base64");

    const isPdf = mediaType === "application/pdf";
    const sourceBlock = isPdf
      ? { type: "document", source: { type: "base64", media_type: "application/pdf", data: base64 } }
      : { type: "image", source: { type: "base64", media_type: mediaType, data: base64 } };

    const isVisit = formType === "classVisit";
    const tool = isVisit ? VISIT_TOOL : PERF_TOOL;
    const formName = isVisit ? "استمارة الزيارة الصفية" : "استمارة متابعة أداء المعلم";
    const sys = `أنت مساعد دقيق لمنسقة قسم المسار الأدبي. مهمتك قراءة ${formName} واستخراج بياناتها حرفياً كما وردت في المستند، ثم استدعاء الأداة ${tool.name} ببيانات دقيقة. لا تختلق أي بيانات؛ اترك الحقل فارغاً إن لم يرد في المستند. انسخ التوصيات النصية كما هي بالضبط.`;

    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "content-type": "application/json", "x-api-key": apiKey, "anthropic-version": "2023-06-01" },
        body: JSON.stringify({
          model: "claude-sonnet-4-6",
          max_tokens: 8000,
          system: sys,
          tools: [tool],
          tool_choice: { type: "tool", name: tool.name },
          messages: [{ role: "user", content: [sourceBlock, { type: "text", text: "استخرجي كل بيانات الاستمارة وكل المؤشرات وتوصياتها." }] }],
        }),
      });
      if (!res.ok) {
        const t = await res.text();
        return { ok: false, error: `خطأ من Claude API (${res.status}): ${t.slice(0, 200)}` };
      }
      const data: any = await res.json();
      const toolUse = (data?.content ?? []).find((b: any) => b.type === "tool_use");
      if (!toolUse) return { ok: false, error: "لم يُرجع النموذج بيانات منظّمة." };
      return { ok: true, data: toolUse.input };
    } catch (e: any) {
      return { ok: false, error: `فشل الاتصال: ${String(e?.message ?? e).slice(0, 200)}` };
    }
  },
});
