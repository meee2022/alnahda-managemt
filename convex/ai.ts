import { action } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";

// تطبيع عربي بسيط للبحث (إزالة التشكيل وتوحيد الألف/الياء/التاء المربوطة)
function norm(s: string) {
  return s
    .replace(/[ً-ْ]/g, "")
    .replace(/[إأآ]/g, "ا").replace(/ى/g, "ي").replace(/ة/g, "ه")
    .replace(/[^؀-ۿ\s]/g, " ")
    .replace(/\s+/g, " ").trim();
}
const STOP = new Set(["في","من","على","الى","إلى","عن","مع","التي","الذي","هذا","هذه","ال","و","أو","ثم","قد","كل","بعض","بشكل","المعلمة","الطالبات","الدرس"]);

function rank(prompt: string, bank: { code: string; text: string }[], code?: string) {
  const q = new Set(norm(prompt).split(" ").filter((w) => w.length > 1 && !STOP.has(w)));
  const scored = bank.map((b) => {
    const words = norm(b.text).split(" ");
    let hits = 0;
    for (const w of words) if (q.has(w)) hits++;
    const codeBonus = code && b.code === code ? 3 : 0;
    return { ...b, score: hits + codeBonus };
  });
  return scored.filter((x) => x.score > 0).sort((a, b) => b.score - a.score).slice(0, 6);
}

// توليد/اقتراح توصية — يستخدم Claude إن توفّر مفتاح، وإلا يقترح من البنك محلياً
export const generateRecommendation = action({
  args: { prompt: v.string(), code: v.optional(v.string()) },
  handler: async (ctx, { prompt, code }): Promise<{ source: "ai" | "local"; text: string; suggestions: string[] }> => {
    const bank: { code: string; text: string }[] = await ctx.runQuery(api.performance.listBank, {});
    const settings: Record<string, string> = await ctx.runQuery(api.admin.getSettings, {});
    const apiKey = settings.anthropicApiKey || process.env.ANTHROPIC_API_KEY;

    const local = rank(prompt, bank, code).map((x) => x.text);

    if (apiKey) {
      try {
        const sys = "أنت مساعد لمنسقة قسم المسار الأدبي بمدرسة ابتدائية في قطر. مهمتك كتابة توصيات تربوية رسمية موجزة وراقية بالعربية الفصحى لمتابعة أداء المعلمات، بنفس أسلوب استمارات الوزارة. اكتب توصية واحدة واضحة بصيغة الغائب المؤنث (المعلمة) دون مقدمات.";
        const ctxBank = local.slice(0, 4).map((t) => "- " + t).join("\n");
        const userMsg = `اكتب توصية تربوية مناسبة لـ: ${prompt}` + (ctxBank ? `\n\nاسترشد بأسلوب هذه التوصيات من بنك القسم:\n${ctxBank}` : "");
        const res = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: { "content-type": "application/json", "x-api-key": apiKey, "anthropic-version": "2023-06-01" },
          body: JSON.stringify({
            model: "claude-haiku-4-5-20251001",
            max_tokens: 400,
            system: sys,
            messages: [{ role: "user", content: userMsg }],
          }),
        });
        if (res.ok) {
          const data: any = await res.json();
          const text = (data?.content?.[0]?.text ?? "").trim();
          if (text) return { source: "ai", text, suggestions: local };
        }
      } catch {
        // يسقط للوضع المحلي
      }
    }

    // وضع محلي: أفضل اقتراح + بدائل
    return {
      source: "local",
      text: local[0] ?? "لا توجد توصية مطابقة في البنك — جرّبي كلمات مفتاحية أخرى أو اختاري المجال.",
      suggestions: local,
    };
  },
});

// توليد مسودة التقرير الشهري للمنسقة تلقائياً من بيانات الشهر
export const draftMonthly = action({
  args: { month: v.string(), sections: v.array(v.object({ domain: v.string(), subDomain: v.string() })) },
  handler: async (ctx, { month, sections }): Promise<{ ok: boolean; sections?: any[]; error?: string }> => {
    const settings: Record<string, string> = await ctx.runQuery(api.admin.getSettings, {});
    const apiKey = settings.anthropicApiKey || process.env.ANTHROPIC_API_KEY;
    if (!apiKey) return { ok: false, error: "فعّلي مفتاح Anthropic API أولاً." };

    const [visits, leaves, covers, periodic, annual, meetings]: any[] = await Promise.all([
      ctx.runQuery(api.visits.list, { month }),
      ctx.runQuery(api.registers.listLeave, {}),
      ctx.runQuery(api.registers.listCover, {}),
      ctx.runQuery(api.evaluations.listPeriodic, {}),
      ctx.runQuery(api.evaluations.listAnnual, {}),
      ctx.runQuery(api.meetings.list, {}),
    ]);

    const inMonth = (d?: string) => !!d && d.includes(month);
    const leaveN = (leaves ?? []).filter((r: any) => inMonth(r.date)).reduce((s: number, r: any) => s + (r.entries?.length ?? 0), 0);
    const coverN = (covers ?? []).filter((r: any) => inMonth(r.date)).reduce((s: number, r: any) => s + (r.entries?.length ?? 0), 0);
    const periodicN = (periodic ?? []).filter((p: any) => p.month === month).length;
    const visitsDone = (visits ?? []).filter((v: any) => v.status === "تم").length;

    const dataSummary = [
      `الشهر: ${month}`,
      `الزيارات الصفية المخططة: ${(visits ?? []).length}، المنفذة: ${visitsDone}`,
      `التقارير الدورية للمعلمات هذا الشهر: ${periodicN}`,
      `استئذانات: ${leaveN}، حصص احتياط: ${coverN}`,
      `تقييمات سنوية مسجلة (إجمالي): ${(annual ?? []).length}`,
      `محاضر اجتماعات (إجمالي): ${(meetings ?? []).length}`,
      `الزيارات (تفصيل): ${(visits ?? []).map((v: any) => `${v.teacherName} (${v.subject} ${v.status})`).slice(0, 25).join("، ") || "لا يوجد"}`,
    ].join("\n");

    const tool = {
      name: "submit_monthly",
      description: "أعد ملخصاً موجزاً ومهنياً لكل بند من بنود التقرير الشهري بناءً على البيانات.",
      input_schema: {
        type: "object",
        properties: {
          sections: {
            type: "array",
            items: {
              type: "object",
              properties: {
                subDomain: { type: "string", description: "اسم البند كما ورد في القائمة" },
                summary: { type: "string", description: "ملخص موجز مهني لما تم في هذا البند خلال الشهر (جملة أو جملتان)؛ اتركه فارغاً إن لا توجد بيانات" },
              },
              required: ["subDomain"],
            },
          },
        },
        required: ["sections"],
      },
    };

    const sys = "أنت مساعد لمنسقة قسم المسار الأدبي بمدرسة النهضة الابتدائية للبنات في قطر. اكتبي مسودة بنود التقرير الشهري بأسلوب رسمي موجز بالعربية الفصحى، مستندة فقط إلى البيانات المعطاة. لا تختلقي أرقاماً؛ إن لم تتوفر بيانات لبند اتركيه فارغاً أو اكتبي 'لا توجد بيانات لهذا الشهر'.";
    const userMsg = `بيانات الشهر:\n${dataSummary}\n\nالبنود المطلوب تلخيصها:\n${sections.map((s) => `- [${s.domain}] ${s.subDomain}`).join("\n")}`;

    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "content-type": "application/json", "x-api-key": apiKey, "anthropic-version": "2023-06-01" },
        body: JSON.stringify({
          model: "claude-sonnet-4-6", max_tokens: 4000, system: sys,
          tools: [tool], tool_choice: { type: "tool", name: "submit_monthly" },
          messages: [{ role: "user", content: userMsg }],
        }),
      });
      if (!res.ok) return { ok: false, error: `خطأ Claude (${res.status})` };
      const data: any = await res.json();
      const tu = (data?.content ?? []).find((b: any) => b.type === "tool_use");
      if (!tu) return { ok: false, error: "لم يُرجع النموذج بيانات." };
      return { ok: true, sections: tu.input.sections ?? [] };
    } catch (e: any) {
      return { ok: false, error: `فشل: ${String(e?.message ?? e).slice(0, 160)}` };
    }
  },
});

// شات بوت محادثة — يجاوب على أسئلة المنسقة بالاستناد إلى بيانات القسم
export const chat = action({
  args: { messages: v.array(v.object({ role: v.string(), content: v.string() })) },
  handler: async (ctx, { messages }): Promise<{ ok: boolean; reply?: string; error?: string }> => {
    const settings: Record<string, string> = await ctx.runQuery(api.admin.getSettings, {});
    const apiKey = settings.anthropicApiKey || process.env.ANTHROPIC_API_KEY;
    if (!apiKey) return { ok: false, error: "فعّلي مفتاح Anthropic API أولاً." };

    // سياق مختصر عن القسم لتمكين الإجابة على أسئلة البيانات
    let context = "";
    try {
      const stats: any = await ctx.runQuery(api.analytics.teacherStats, {});
      const lines = (stats?.rows ?? []).map((r: any) =>
        `${r.name}: استئذان ${r.leaveCount}، احتياط ${r.coversDone}، غياب ${r.absences}، زيارات ${r.classVisitCount}، متابعة أداء ${r.perfCount}${r.lastAnnualScore != null ? `، آخر تقييم ${r.lastAnnualScore}%` : ""}`
      );
      context = `بيانات القسم الحالية (لكل معلمة):\n${lines.join("\n")}\nإجمالي: ${stats?.totals?.teachers ?? 0} معلمة.`;
    } catch {}

    const sys = `أنتِ مساعدة ذكية لمنسقة قسم المسار الأدبي (أ. ${settings.coordinator ?? "عائشة"}) بمدرسة النهضة الابتدائية للبنات في قطر. تساعدينها في: صياغة التوصيات والملاحظات، كتابة خطط تحسين للمعلمات، تلخيص الأداء، اقتراح أفكار، والإجابة على أسئلتها عن بيانات القسم. ردّي بالعربية الفصحى، بإيجاز ومهنية، وبأسلوب عملي قابل للتطبيق. استندي إلى البيانات أدناه عند السؤال عنها، ولا تختلقي أرقاماً.\n\n${context}`;

    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "content-type": "application/json", "x-api-key": apiKey, "anthropic-version": "2023-06-01" },
        body: JSON.stringify({
          model: "claude-sonnet-4-6", max_tokens: 2000, system: sys,
          messages: messages.map((m) => ({ role: m.role === "assistant" ? "assistant" : "user", content: m.content })),
        }),
      });
      if (!res.ok) return { ok: false, error: `خطأ Claude (${res.status})` };
      const data: any = await res.json();
      const reply = (data?.content ?? []).filter((b: any) => b.type === "text").map((b: any) => b.text).join("\n").trim();
      return { ok: true, reply: reply || "(لا رد)" };
    } catch (e: any) {
      return { ok: false, error: `فشل: ${String(e?.message ?? e).slice(0, 160)}` };
    }
  },
});
