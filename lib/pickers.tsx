import React, { useState } from "react";
import { View, Text, Pressable, StyleSheet, ScrollView, Platform, Modal } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, fonts, radius, shadow } from "./theme";

const WEEKDAYS = ["الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];
const WD_SHORT = ["أحد", "إثنين", "ثلاثاء", "أربعاء", "خميس", "جمعة", "سبت"];
const MONTHS_AR = ["يناير", "فبراير", "مارس", "إبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"];

function pad(n: number) { return n < 10 ? "0" + n : String(n); }
// صيغة عربية واضحة تظهر صحيحة في الاتجاه: "17 يونيو 2026"
function fmt(d: number, m: number, y: number) { return `${d} ${MONTHS_AR[m]} ${y}`; }

// مصدّرة للاستخدام في فحوصات السياسة (سجل الاستئذان)
export function parseDate(value?: string) { return parse(value); }
export function weekdayOf(value?: string): string | null {
  const p = parse(value);
  if (!p) return null;
  return WEEKDAYS[new Date(p.y, p.m, p.d).getDay()];
}
// تاريخ اليوم نفسه من الأسبوع السابق (نفس الصيغة العربية)
export function prevWeekSameDay(value?: string): string | null {
  const p = parse(value);
  if (!p) return null;
  const dt = new Date(p.y, p.m, p.d);
  dt.setDate(dt.getDate() - 7);
  return fmt(dt.getDate(), dt.getMonth(), dt.getFullYear());
}
export function monthKeyOf(value?: string): string | null {
  const p = parse(value);
  return p ? `${p.y}-${p.m}` : null;
}
// اليوم السابق مباشرةً (نفس الصيغة العربية)
export function prevDay(value?: string): string | null {
  const p = parse(value);
  if (!p) return null;
  const dt = new Date(p.y, p.m, p.d);
  dt.setDate(dt.getDate() - 1);
  return fmt(dt.getDate(), dt.getMonth(), dt.getFullYear());
}
// تحويل وقت (12 ساعة بـ ص/م أو 24 ساعة قديم) إلى دقائق من منتصف الليل
function toMinutes(str?: string): number | null {
  const m = (str ?? "").match(/(\d{1,2}):(\d{2})/);
  if (!m) return null;
  let h = +m[1]; const mn = +m[2];
  const isPM = /م/.test(str ?? ""); const isAM = /ص/.test(str ?? "");
  if (isPM && h < 12) h += 12;       // مساءً
  if (isAM && h === 12) h = 0;       // 12 ص = منتصف الليل
  return h * 60 + mn;
}
// مدة بالدقائق بين وقتين
export function minutesBetween(from?: string, to?: string): number {
  const a = toMinutes(from); const b = toMinutes(to);
  if (a == null || b == null) return 0;
  return b > a ? b - a : 0;
}

function parse(value?: string): { d: number; m: number; y: number } | null {
  if (!value) return null;
  // صيغة عربية: "17 يونيو 2026"
  const mIdx = MONTHS_AR.findIndex((mn) => value.includes(mn));
  const nums = (value.match(/\d+/g) ?? []).map(Number);
  if (mIdx >= 0 && nums.length >= 2) {
    const y = nums.find((n) => n >= 1000) ?? nums[nums.length - 1];
    const d = nums.find((n) => n < 1000) ?? nums[0];
    return { d, m: mIdx, y };
  }
  // صيغة رقمية قديمة: D-M-YYYY أو D/M/YYYY
  const parts = value.split(/[-/]/).map((x) => parseInt(x.trim(), 10));
  if (parts.length === 3 && parts.every((n) => !isNaN(n))) {
    return { d: parts[0], m: parts[1] - 1, y: parts[2] };
  }
  return null;
}

function Label({ children }: { children: React.ReactNode }) {
  return <Text style={st.label}>{children}</Text>;
}

// ============ منتقي التاريخ (تقويم) ============
export function DateField({
  label, value, onChange, onDay,
}: { label?: string; value?: string; onChange: (v: string) => void; onDay?: (day: string) => void }) {
  const [open, setOpen] = useState(false);
  const now = new Date();
  const parsed = parse(value);
  const [vy, setVy] = useState(parsed?.y ?? now.getFullYear());
  const [vm, setVm] = useState(parsed?.m ?? now.getMonth());

  const first = new Date(vy, vm, 1).getDay();
  const count = new Date(vy, vm + 1, 0).getDate();
  const cells: (number | null)[] = [...Array(first).fill(null), ...Array.from({ length: count }, (_, i) => i + 1)];
  while (cells.length % 7 !== 0) cells.push(null);

  const pick = (day: number) => {
    onChange(fmt(day, vm, vy));
    if (onDay) onDay(WEEKDAYS[new Date(vy, vm, day).getDay()]);
    setOpen(false);
  };

  const selected = parse(value);

  return (
    <View style={{ marginBottom: 14 }}>
      {label ? <Label>{label}</Label> : null}
      <Pressable onPress={() => setOpen(true)} style={({ hovered }: any) => [st.field, hovered && { borderColor: colors.primary }]}>
        <Ionicons name="calendar-clear-outline" size={18} color={colors.primary} />
        <Text style={[st.fieldText, !value && { color: colors.textMuted }]}>{value || "اختر التاريخ"}</Text>
      </Pressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={st.modalBackdrop} onPress={() => setOpen(false)}>
          <Pressable style={st.calendar} onPress={() => {}}>
            <View style={st.calHead}>
              <Pressable onPress={() => { if (vm === 0) { setVm(11); setVy(vy - 1); } else setVm(vm - 1); }} style={st.navBtn}>
                <Ionicons name="chevron-forward" size={20} color={colors.primary} />
              </Pressable>
              <Text style={st.calTitle}>{MONTHS_AR[vm]} {vy}</Text>
              <Pressable onPress={() => { if (vm === 11) { setVm(0); setVy(vy + 1); } else setVm(vm + 1); }} style={st.navBtn}>
                <Ionicons name="chevron-back" size={20} color={colors.primary} />
              </Pressable>
            </View>
            <View style={st.weekRow}>
              {WD_SHORT.map((w) => <Text key={w} style={st.weekCell}>{w}</Text>)}
            </View>
            <View style={st.grid}>
              {cells.map((c, i) => {
                const isSel = !!(c && selected && selected.d === c && selected.m === vm && selected.y === vy);
                const isToday = !!(c && now.getDate() === c && now.getMonth() === vm && now.getFullYear() === vy);
                return (
                  <View key={i} style={st.dayCell}>
                    {c ? (
                      <Pressable onPress={() => pick(c)}
                        style={({ hovered }: any) => [st.day, isToday && st.dayToday, isSel && st.daySel, hovered && !isSel && { backgroundColor: colors.primarySoft }]}>
                        <Text style={[st.dayText, isSel && { color: "#fff", fontFamily: fonts.bold }]}>{c}</Text>
                      </Pressable>
                    ) : <View style={st.day} />}
                  </View>
                );
              })}
            </View>
            <Pressable onPress={() => { const t = new Date(); setVy(t.getFullYear()); setVm(t.getMonth()); pick(t.getDate()); }} style={st.todayBtn}>
              <Text style={st.todayText}>اليوم</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

// ============ منتقي الوقت (نظام 12 ساعة بـ ص/م) ============
const HOURS12 = Array.from({ length: 12 }, (_, i) => i + 1); // 1 → 12
const MINUTES = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];

// تحليل القيمة المخزّنة (12 ساعة بـ ص/م أو 24 ساعة قديم) إلى ساعة 12 ودقيقة وفترة
function parseTime12(value?: string): { h12: number; min: number; period: "ص" | "م" } | null {
  const m = (value ?? "").match(/(\d{1,2}):(\d{2})/);
  if (!m) return null;
  let h = +m[1]; const min = +m[2];
  let period: "ص" | "م";
  if (/ص/.test(value ?? "") || /م/.test(value ?? "")) {
    period = /م/.test(value ?? "") ? "م" : "ص";
  } else {
    // قيمة 24 ساعة قديمة
    period = h >= 12 ? "م" : "ص";
    h = h % 12; if (h === 0) h = 12;
  }
  return { h12: h, min, period };
}
const fmtTime12 = (h12: number, min: number, period: "ص" | "م") => `${h12}:${pad(min)} ${period}`;

export function TimeField({ label, value, onChange }: { label?: string; value?: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  const cur = parseTime12(value);
  const emit = (h12: number, min: number, period: "ص" | "م") => onChange(fmtTime12(h12, min, period));

  return (
    <View style={{ marginBottom: 14 }}>
      {label ? <Label>{label}</Label> : null}
      <Pressable onPress={() => setOpen(true)} style={({ hovered }: any) => [st.field, hovered && { borderColor: colors.primary }]}>
        <Ionicons name="time-outline" size={18} color={colors.primary} />
        <Text style={[st.fieldText, !value && { color: colors.textMuted }]}>{value || "اختر الوقت"}</Text>
      </Pressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={st.modalBackdrop} onPress={() => setOpen(false)}>
          <Pressable style={st.timePanel} onPress={() => {}}>
            <Text style={st.calTitle}>اختر الوقت</Text>
            {/* ص / م */}
            <View style={st.periodRow}>
              {(["ص", "م"] as const).map((p) => (
                <Pressable key={p} onPress={() => emit(cur?.h12 ?? 8, cur?.min ?? 0, p)}
                  style={[st.periodBtn, (cur?.period ?? "ص") === p && st.periodSel]}>
                  <Text style={[st.periodText, (cur?.period ?? "ص") === p && { color: "#fff", fontFamily: fonts.bold }]}>{p === "ص" ? "صباحاً" : "مساءً"}</Text>
                </Pressable>
              ))}
            </View>
            <View style={{ flexDirection: "row", gap: 10, marginTop: 12 }}>
              <View style={{ flex: 1 }}>
                <Text style={st.colLabel}>الساعة</Text>
                <ScrollView style={st.wheel} showsVerticalScrollIndicator={false}>
                  {HOURS12.map((h) => (
                    <Pressable key={h} onPress={() => emit(h, cur?.min ?? 0, cur?.period ?? "ص")}
                      style={[st.wheelItem, cur?.h12 === h && st.wheelSel]}>
                      <Text style={[st.wheelText, cur?.h12 === h && { color: "#fff", fontFamily: fonts.bold }]}>{h}</Text>
                    </Pressable>
                  ))}
                </ScrollView>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={st.colLabel}>الدقيقة</Text>
                <ScrollView style={st.wheel} showsVerticalScrollIndicator={false}>
                  {MINUTES.map((mn) => (
                    <Pressable key={mn} onPress={() => emit(cur?.h12 ?? 8, mn, cur?.period ?? "ص")}
                      style={[st.wheelItem, cur?.min === mn && st.wheelSel]}>
                      <Text style={[st.wheelText, cur?.min === mn && { color: "#fff", fontFamily: fonts.bold }]}>{pad(mn)}</Text>
                    </Pressable>
                  ))}
                </ScrollView>
              </View>
            </View>
            <Pressable onPress={() => setOpen(false)} style={st.todayBtn}>
              <Text style={st.todayText}>تم</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

// ============ عدّاد رقمي ============
export function Stepper({ label, value, onChange, min = 1, max = 20 }: { label?: string; value: string; onChange: (v: string) => void; min?: number; max?: number }) {
  const n = parseInt(value) || 0;
  const set = (x: number) => onChange(String(Math.max(min, Math.min(max, x))));
  return (
    <View style={{ marginBottom: 14 }}>
      {label ? <Label>{label}</Label> : null}
      <View style={st.stepper}>
        <Pressable onPress={() => set(n - 1)} style={st.stepBtn}><Ionicons name="remove" size={20} color={colors.primary} /></Pressable>
        <Text style={st.stepVal}>{value || "—"}</Text>
        <Pressable onPress={() => set(n + 1)} style={st.stepBtn}><Ionicons name="add" size={20} color={colors.primary} /></Pressable>
      </View>
    </View>
  );
}

const st = StyleSheet.create({
  label: { fontFamily: fonts.medium, fontSize: 12.5, color: colors.textSecondary, marginBottom: 7, textAlign: "right" },
  field: {
    flexDirection: "row", alignItems: "center", gap: 9,
    backgroundColor: colors.card, borderWidth: 1, borderColor: colors.borderStrong, borderRadius: radius.md,
    paddingHorizontal: 14, paddingVertical: Platform.OS === "web" ? 11 : 10,
    ...(Platform.OS === "web" ? { cursor: "pointer" as any, transitionDuration: "150ms" as any } : {}),
  },
  fieldText: { fontFamily: fonts.regular, fontSize: 14, color: colors.text, flex: 1, textAlign: "right" },
  modalBackdrop: { flex: 1, backgroundColor: "rgba(7,32,31,0.5)", alignItems: "center", justifyContent: "center", padding: 20 },
  calendar: { width: 330, maxWidth: "100%", backgroundColor: colors.card, borderRadius: radius.xl, padding: 16, ...shadow.raised },
  calHead: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 },
  navBtn: { width: 38, height: 38, borderRadius: 12, alignItems: "center", justifyContent: "center", backgroundColor: colors.primarySoft },
  calTitle: { fontFamily: fonts.bold, fontSize: 16, color: colors.text },
  weekRow: { flexDirection: "row", marginBottom: 4 },
  weekCell: { flex: 1, textAlign: "center", fontFamily: fonts.medium, fontSize: 11, color: colors.textMuted },
  grid: { flexDirection: "row", flexWrap: "wrap" },
  dayCell: { width: `${100 / 7}%`, aspectRatio: 1, padding: 2 } as any,
  day: { flex: 1, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  dayToday: { borderWidth: 1.5, borderColor: colors.gold },
  daySel: { backgroundColor: colors.primary },
  dayText: { fontFamily: fonts.medium, fontSize: 14, color: colors.text },
  todayBtn: { marginTop: 12, backgroundColor: colors.primary, borderRadius: radius.md, paddingVertical: 11, alignItems: "center" },
  todayText: { fontFamily: fonts.semibold, fontSize: 14, color: "#fff" },
  timePanel: { width: 300, maxWidth: "92%", backgroundColor: colors.card, borderRadius: radius.xl, padding: 16, ...shadow.raised },
  periodRow: { flexDirection: "row", gap: 8, marginTop: 12 },
  periodBtn: { flex: 1, paddingVertical: 10, borderRadius: radius.md, backgroundColor: colors.bg, alignItems: "center", borderWidth: 1, borderColor: colors.border },
  periodSel: { backgroundColor: colors.primary, borderColor: colors.primary },
  periodText: { fontFamily: fonts.medium, fontSize: 14, color: colors.text },
  colLabel: { fontFamily: fonts.medium, fontSize: 12, color: colors.textMuted, textAlign: "center", marginBottom: 6 },
  wheel: { height: 180, backgroundColor: colors.bg, borderRadius: radius.md },
  wheelItem: { paddingVertical: 11, alignItems: "center", marginHorizontal: 6, marginVertical: 2, borderRadius: 10 },
  wheelSel: { backgroundColor: colors.primary },
  wheelText: { fontFamily: fonts.medium, fontSize: 16, color: colors.text },
  stepper: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: colors.card, borderWidth: 1, borderColor: colors.borderStrong, borderRadius: radius.md, paddingHorizontal: 8, paddingVertical: 4 },
  stepBtn: { width: 40, height: 40, borderRadius: 10, alignItems: "center", justifyContent: "center", backgroundColor: colors.primarySoft },
  stepVal: { fontFamily: fonts.bold, fontSize: 17, color: colors.text, minWidth: 40, textAlign: "center" },
});
