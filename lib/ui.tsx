import React from "react";
import {
  View, Text, TextInput, Pressable, ScrollView, StyleSheet,
  ActivityIndicator, Platform, ViewStyle, TextStyle, useWindowDimensions, Modal,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Alert } from "react-native";
import { colors, radius, shadow, fonts, gradients } from "./theme";

// تنبيه موحّد احترافي داخل الموقع (toast) — يظهر بهوية الموقع ويختفي تلقائياً.
// يُغذّى عبر notify() من أي مكان، ويعرضه مكوّن <Toaster/> المثبّت في الجذر.
type ToastTone = "warn" | "success" | "error";
let toastPush: ((text: string, tone: ToastTone) => void) | null = null;

export function notify(message: string, tone: ToastTone = "warn") {
  if (toastPush) { toastPush(message, tone); return; }
  // احتياطي قبل تثبيت الـToaster
  if (Platform.OS === "web") { if (typeof window !== "undefined" && window.alert) window.alert(message); }
  else Alert.alert("تنبيه", message);
}
export const notifySuccess = (m: string) => notify(m, "success");
export const notifyError = (m: string) => notify(m, "error");

const TOAST_TONE: Record<ToastTone, { bg: string; bar: string; icon: keyof typeof Ionicons.glyphMap }> = {
  warn: { bg: colors.warningSoft, bar: colors.warning, icon: "warning" },
  success: { bg: colors.successSoft, bar: colors.success, icon: "checkmark-circle" },
  error: { bg: colors.dangerSoft, bar: colors.danger, icon: "alert-circle" },
};

// حاجز أخطاء عام — يمنع الشاشة البيضاء عند فشل عابر (مثل انقطاع Convex أو تجاوز الحصة)
export class AppErrorBoundary extends React.Component<{ children: React.ReactNode }, { error: any }> {
  state = { error: null as any };
  static getDerivedStateFromError(error: any) { return { error }; }
  componentDidCatch() {}
  render() {
    if (this.state.error) {
      const reload = () => {
        this.setState({ error: null });
        if (Platform.OS === "web" && typeof window !== "undefined") window.location.reload();
      };
      return (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 28, backgroundColor: colors.bg }}>
          <Ionicons name="cloud-offline-outline" size={48} color={colors.textMuted} />
          <Text style={{ fontFamily: fonts.bold, fontSize: 16, color: colors.text, marginTop: 14, textAlign: "center" }}>تعذّر تحميل البيانات مؤقتاً</Text>
          <Text style={{ fontFamily: fonts.regular, fontSize: 13, color: colors.textSecondary, marginTop: 6, textAlign: "center", lineHeight: 22, maxWidth: 360 }}>
            حدث انقطاع مؤقت في الاتصال بالخادم. حدّثي الصفحة وحاولي مرة أخرى — إن تكرر فقد يكون الخادم تجاوز حد الخطة المجانية مؤقتاً.
          </Text>
          <Pressable onPress={reload} style={{ marginTop: 16, backgroundColor: colors.primary, borderRadius: radius.md, paddingHorizontal: 20, paddingVertical: 11 }}>
            <Text style={{ fontFamily: fonts.semibold, fontSize: 14, color: "#fff" }}>إعادة المحاولة</Text>
          </Pressable>
        </View>
      );
    }
    return this.props.children as any;
  }
}

export function Toaster() {
  const [items, setItems] = React.useState<{ id: number; text: string; tone: ToastTone }[]>([]);
  const seq = React.useRef(0);
  React.useEffect(() => {
    toastPush = (text, tone) => {
      const id = ++seq.current;
      setItems((p) => [...p, { id, text, tone }].slice(-3));
      setTimeout(() => setItems((p) => p.filter((x) => x.id !== id)), 4000);
    };
    return () => { toastPush = null; };
  }, []);
  if (!items.length) return null;
  return (
    <View pointerEvents="box-none" style={tst.host}>
      {items.map((it) => {
        const t = TOAST_TONE[it.tone];
        return (
          <View key={it.id} style={[tst.toast, { backgroundColor: t.bg }]}>
            <View style={[tst.bar, { backgroundColor: t.bar }]} />
            <Ionicons name={t.icon} size={20} color={t.bar} />
            <Text style={tst.txt}>{it.text}</Text>
          </View>
        );
      })}
    </View>
  );
}

const tst = StyleSheet.create({
  host: {
    position: "absolute", top: 14, left: 0, right: 0, alignItems: "center", zIndex: 9999, gap: 8,
    ...(Platform.OS === "web" ? ({ position: "fixed" as any }) : {}),
  },
  toast: {
    flexDirection: "row", alignItems: "center", gap: 9, maxWidth: 460, width: "92%",
    paddingVertical: 12, paddingHorizontal: 14, borderRadius: radius.md, overflow: "hidden", ...shadow.raised,
  },
  bar: { position: "absolute", right: 0, top: 0, bottom: 0, width: 4 },
  txt: { flex: 1, fontFamily: fonts.semibold, fontSize: 13.5, color: colors.text, textAlign: "right", lineHeight: 21 },
});

// غلاف ظهور ناعم — مرئي افتراضياً (لو الحركة ما اشتغلتش يفضل المحتوى ظاهر، مش يختفي)
// نستخدم حركة CSS على الويب عبر react-native-web؛ على المنصات الأخرى يظهر العنصر مباشرة.
export function Reveal({ delay = 0, from = "up", children, style }: {
  delay?: number; from?: "up" | "down"; children: React.ReactNode; style?: ViewStyle;
}) {
  const web =
    Platform.OS === "web"
      ? ({
          animationKeyframes: {
            "0%": { opacity: 0, transform: [{ translateY: from === "up" ? 12 : -12 }] },
            "100%": { opacity: 1, transform: [{ translateY: 0 }] },
          },
          animationDuration: "420ms",
          animationDelay: `${delay}ms`,
          animationTimingFunction: "cubic-bezier(0.22, 1, 0.36, 1)",
          // ملاحظة: لا نستخدم fillMode حتى يبقى العنصر مرئياً افتراضياً قبل/بعد الحركة
        } as any)
      : null;
  return <View style={[web, style]}>{children}</View>;
}

// ترويسة صفحة متدرجة — تعطي كل قسم هويته اللونية
export function PageHero({
  title, desc, icon, gradient = [colors.primaryDark, colors.primary], children,
}: {
  title: string;
  desc?: string;
  icon: keyof typeof Ionicons.glyphMap;
  gradient?: [string, string];
  children?: React.ReactNode; // أزرار الإجراءات داخل الترويسة
}) {
  return (
    <Reveal from="down">
      <LinearGradient
        colors={gradient}
        start={{ x: 1, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={heroStyles.hero}
      >
        <View style={[heroStyles.pattern, { pointerEvents: "none" }]}>
          {[0, 1, 2].map((i) => (
            <View key={i} style={[heroStyles.ring, { width: 200 + i * 110, height: 200 + i * 110 }]} />
          ))}
        </View>
        <View style={heroStyles.topRow}>
          <View style={heroStyles.iconTile}>
            <Ionicons name={icon} size={24} color="#fff" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={heroStyles.title}>{title}</Text>
            {desc ? <Text style={heroStyles.desc}>{desc}</Text> : null}
          </View>
        </View>
        {children ? <View style={heroStyles.actions}>{children}</View> : null}
      </LinearGradient>
    </Reveal>
  );
}

// زر داخل الترويسة — زجاجي شفاف
export function HeroBtn({ title, icon, onPress, prominent }: {
  title: string; icon?: keyof typeof Ionicons.glyphMap; onPress?: () => void; prominent?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ hovered, pressed }: any) => [
        heroStyles.btn,
        prominent && heroStyles.btnProminent,
        hovered && { backgroundColor: prominent ? "#fff" : "rgba(255,255,255,0.26)" },
        pressed && { transform: [{ scale: 0.97 }] },
      ]}
    >
      {icon ? <Ionicons name={icon} size={16} color={prominent ? colors.primaryDark : "#fff"} style={{ marginLeft: 7 }} /> : null}
      <Text style={[heroStyles.btnText, prominent && { color: colors.primaryDark }]}>{title}</Text>
    </Pressable>
  );
}

// عنصر قائمة متحرك الدخول
export function AnimatedItem({ index = 0, children }: { index?: number; children: React.ReactNode }) {
  return (
    <Reveal delay={60 + Math.min(index, 10) * 45}>
      {children}
    </Reveal>
  );
}

const heroStyles = StyleSheet.create({
  hero: {
    borderRadius: radius.xl, padding: 22, marginBottom: 16, overflow: "hidden",
    ...shadow.raised,
  },
  pattern: { position: "absolute", left: -110, top: -90, alignItems: "center", justifyContent: "center" },
  ring: { position: "absolute", borderRadius: 999, borderWidth: 1, borderColor: "rgba(255,255,255,0.09)" },
  topRow: { flexDirection: "row", alignItems: "center", gap: 14 },
  iconTile: {
    width: 52, height: 52, borderRadius: 17, alignItems: "center", justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.16)", borderWidth: 1, borderColor: "rgba(255,255,255,0.24)",
  },
  title: { fontFamily: fonts.bold, fontSize: 20, color: "#fff", textAlign: "right" },
  desc: { fontFamily: fonts.regular, fontSize: 12.5, color: "rgba(255,255,255,0.75)", textAlign: "right", marginTop: 3 },
  actions: { flexDirection: "row", flexWrap: "wrap", gap: 9, marginTop: 18 },
  btn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    paddingHorizontal: 16, paddingVertical: 9, borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.14)", borderWidth: 1, borderColor: "rgba(255,255,255,0.22)",
    ...(Platform.OS === "web" ? { transitionDuration: "150ms" as any, cursor: "pointer" as any } : {}),
  },
  btnProminent: { backgroundColor: "rgba(255,255,255,0.92)", borderColor: "transparent" },
  btnText: { fontFamily: fonts.semibold, fontSize: 13.5, color: "#fff" },
});

export function Screen({ children, scroll = true, style }: { children: React.ReactNode; scroll?: boolean; style?: ViewStyle }) {
  const { width } = useWindowDimensions();
  // مساحة إضافية أسفل المحتوى حتى لا يغطيه شريط التنقل السفلي على الجوال
  const bottomPad = width > 720 ? 56 : 104;
  const content = <View style={[styles.screenInner, style]}>{children}</View>;
  if (!scroll) return <View style={styles.screen}>{content}</View>;
  return (
    <ScrollView style={styles.screen} contentContainerStyle={{ paddingBottom: bottomPad }}>
      {content}
    </ScrollView>
  );
}

export function Card({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function H1({ children }: { children: React.ReactNode }) {
  return <Text style={styles.h1}>{children}</Text>;
}
export function H2({ children }: { children: React.ReactNode }) {
  return (
    <View style={{ marginBottom: 12 }}>
      <Text style={styles.h2}>{children}</Text>
      <View style={styles.h2rule} />
    </View>
  );
}
export function P({ children, muted, style }: { children: React.ReactNode; muted?: boolean; style?: TextStyle }) {
  return <Text style={[styles.p, muted && { color: colors.textMuted }, style]}>{children}</Text>;
}

export function Label({ children }: { children: React.ReactNode }) {
  return <Text style={styles.label}>{children}</Text>;
}

export function Input(props: React.ComponentProps<typeof TextInput> & { label?: string }) {
  const { label, style, ...rest } = props;
  const [focused, setFocused] = React.useState(false);
  return (
    <View style={{ marginBottom: 14 }}>
      {label ? <Label>{label}</Label> : null}
      <TextInput
        placeholderTextColor={colors.textMuted}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        {...rest}
        style={[
          styles.input,
          focused && styles.inputFocused,
          rest.multiline && { minHeight: 96, textAlignVertical: "top", paddingTop: 12 },
          style,
        ]}
      />
    </View>
  );
}

export function Button({
  title, onPress, variant = "primary", icon, loading, small, style,
}: {
  title: string;
  onPress?: () => void;
  variant?: "primary" | "accent" | "outline" | "ghost" | "danger";
  icon?: keyof typeof Ionicons.glyphMap;
  loading?: boolean;
  small?: boolean;
  style?: ViewStyle;
}) {
  const bg =
    variant === "primary" ? colors.primary :
    variant === "accent" ? colors.accent :
    variant === "danger" ? colors.dangerSoft : "transparent";
  const fg =
    variant === "outline" || variant === "ghost" ? colors.primary :
    variant === "danger" ? colors.danger : colors.white;
  return (
    <Pressable
      onPress={onPress}
      disabled={loading}
      style={({ pressed, hovered }: any) => [
        styles.btn,
        small && styles.btnSmall,
        { backgroundColor: bg },
        variant === "outline" && { borderWidth: 1, borderColor: colors.borderStrong, backgroundColor: colors.card },
        variant === "ghost" && { backgroundColor: "transparent" },
        hovered && variant === "primary" && { backgroundColor: colors.primaryLight },
        hovered && variant === "accent" && { backgroundColor: colors.accentDark },
        hovered && variant === "ghost" && { backgroundColor: colors.primarySoft },
        hovered && variant === "danger" && { backgroundColor: "#F6DAD5" },
        hovered && variant === "outline" && { borderColor: colors.primary, backgroundColor: colors.primaryTint },
        pressed && { transform: [{ scale: 0.985 }], opacity: 0.92 },
        (variant === "primary" || variant === "accent") && shadow.card,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={fg} size="small" />
      ) : (
        <>
          {icon ? <Ionicons name={icon} size={small ? 15 : 17} color={fg} style={{ marginLeft: 7 }} /> : null}
          <Text style={[styles.btnText, small && { fontSize: 13 }, { color: fg }]}>{title}</Text>
        </>
      )}
    </Pressable>
  );
}

export function Chip({ label, active, onPress, color }: { label: string; active?: boolean; onPress?: () => void; color?: string }) {
  const c = color ?? colors.primary;
  return (
    <Pressable
      onPress={onPress}
      style={({ hovered }: any) => [
        styles.chip,
        hovered && !active && { borderColor: colors.borderStrong, backgroundColor: colors.bg },
        active && { backgroundColor: c, borderColor: c, ...shadow.card },
      ]}
    >
      <Text style={[styles.chipText, active && { color: colors.white, fontFamily: fonts.semibold }]}>{label}</Text>
    </Pressable>
  );
}

export function Select({
  label, options, value, onChange, searchable, placeholder,
}: { label?: string; options: string[]; value?: string; onChange: (v: string) => void; searchable?: boolean; placeholder?: string }) {
  // القوائم الطويلة (مثل أسماء المعلمات) تتحوّل تلقائياً لمنتقي بحث أنيق
  const asSearch = searchable ?? options.length > 7;
  if (asSearch) {
    return <SearchSelect label={label} options={options} value={value} onChange={onChange} placeholder={placeholder} />;
  }
  return (
    <View style={{ marginBottom: 14 }}>
      {label ? <Label>{label}</Label> : null}
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
        {options.map((o) => (
          <Chip key={o} label={o} active={value === o} onPress={() => onChange(o)} />
        ))}
      </View>
    </View>
  );
}

// منتقي بحث منسدل — للقوائم الطويلة (أسماء المعلمات/الطالبات…)
export function SearchSelect({
  label, options, value, onChange, placeholder,
}: { label?: string; options: string[]; value?: string; onChange: (v: string) => void; placeholder?: string }) {
  const [open, setOpen] = React.useState(false);
  const [q, setQ] = React.useState("");
  const filtered = q.trim() ? options.filter((o) => o.includes(q.trim())) : options;
  return (
    <View style={{ marginBottom: 14 }}>
      {label ? <Label>{label}</Label> : null}
      <Pressable style={selStyles.btn} onPress={() => setOpen(true)}>
        <View style={selStyles.btnInner}>
          <Ionicons name="search-outline" size={18} color={colors.primary} />
          <Text style={[selStyles.val, !value && selStyles.placeholder]} numberOfLines={1}>
            {value || placeholder || "اختاري…"}
          </Text>
        </View>
        <Ionicons name="chevron-down" size={18} color={colors.textMuted} />
      </Pressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={selStyles.backdrop} onPress={() => setOpen(false)}>
          <Pressable style={selStyles.sheet} onPress={(ev) => ev.stopPropagation()}>
            <Text style={selStyles.sheetTitle}>{label || "اختاري"}</Text>
            <View style={selStyles.searchWrap}>
              <Ionicons name="search-outline" size={18} color={colors.textMuted} />
              <TextInput
                value={q}
                onChangeText={setQ}
                placeholder="ابحثي بالاسم…"
                placeholderTextColor={colors.textMuted}
                style={selStyles.searchInput}
                autoFocus
              />
            </View>
            <ScrollView style={{ marginTop: 10, maxHeight: 360 }} keyboardShouldPersistTaps="handled">
              {filtered.length === 0 ? (
                <Text style={selStyles.noRes}>لا توجد نتائج</Text>
              ) : (
                filtered.map((o) => {
                  const sel = o === value;
                  return (
                    <Pressable
                      key={o}
                      style={[selStyles.opt, sel && selStyles.optSel]}
                      onPress={() => { onChange(o); setOpen(false); setQ(""); }}
                    >
                      <Text style={[selStyles.optTxt, sel && selStyles.optTxtSel]}>{o}</Text>
                      {sel ? <Ionicons name="checkmark-circle" size={20} color={colors.primary} /> : null}
                    </Pressable>
                  );
                })
              )}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const selStyles = StyleSheet.create({
  btn: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    backgroundColor: colors.primaryTint, borderWidth: 1, borderColor: colors.border,
    borderRadius: radius.md, paddingHorizontal: 14, paddingVertical: 13,
  },
  btnInner: { flexDirection: "row", alignItems: "center", gap: 10, flex: 1 },
  val: { fontFamily: fonts.semibold, fontSize: 15, color: colors.text, flex: 1 },
  placeholder: { color: colors.textMuted, fontFamily: fonts.regular },
  backdrop: { flex: 1, backgroundColor: "#0008", alignItems: "center", justifyContent: "center", padding: 20 },
  sheet: { backgroundColor: "#fff", borderRadius: 16, padding: 18, width: "100%", maxWidth: 460, maxHeight: "82%" },
  sheetTitle: { fontFamily: fonts.bold, fontSize: 18, color: colors.text, marginBottom: 12 },
  searchWrap: {
    flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: colors.bg,
    borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingHorizontal: 12, paddingVertical: 4,
  },
  searchInput: { flex: 1, fontFamily: fonts.regular, fontSize: 15, color: colors.text, paddingVertical: 9, textAlign: "right", outlineStyle: "none" } as any,
  noRes: { textAlign: "center", color: colors.textMuted, paddingVertical: 18, fontFamily: fonts.regular },
  opt: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingVertical: 13, paddingHorizontal: 14, borderRadius: radius.sm, marginBottom: 4, backgroundColor: colors.bg,
  },
  optSel: { backgroundColor: colors.primarySoft },
  optTxt: { fontFamily: fonts.medium, fontSize: 15, color: colors.text },
  optTxtSel: { fontFamily: fonts.bold, color: colors.primary },
});

export function Badge({ label, tone = "primary" }: { label: string; tone?: "primary" | "accent" | "success" | "warning" | "danger" | "muted" | "gold" }) {
  const map = {
    primary: { bg: colors.primarySoft, fg: colors.primary },
    accent: { bg: colors.accentSoft, fg: colors.accent },
    success: { bg: colors.successSoft, fg: colors.success },
    warning: { bg: colors.warningSoft, fg: colors.warning },
    danger: { bg: colors.dangerSoft, fg: colors.danger },
    muted: { bg: "#F1F0EC", fg: colors.textSecondary },
    gold: { bg: colors.goldSoft, fg: colors.gold },
  } as const;
  const t = map[tone];
  return (
    <View style={{ backgroundColor: t.bg, borderRadius: 999, paddingHorizontal: 11, paddingVertical: 4.5, alignSelf: "flex-start", marginLeft: 5, marginBottom: 3 }}>
      <Text style={{ color: t.fg, fontFamily: fonts.semibold, fontSize: 11.5 }}>{label}</Text>
    </View>
  );
}

export function Row({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  return <View style={[{ flexDirection: "row", alignItems: "center", gap: 8 }, style]}>{children}</View>;
}

export function Empty({
  text = "لا توجد بيانات بعد", hint, actionTitle, onAction, icon = "sparkles-outline",
}: {
  text?: string; hint?: string; actionTitle?: string; onAction?: () => void;
  icon?: keyof typeof Ionicons.glyphMap;
}) {
  return (
    <Reveal delay={120}>
      <View style={styles.emptyCard}>
        <LinearGradient
          colors={[colors.primarySoft, colors.goldSoft]}
          start={{ x: 1, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={styles.emptyCircle}
        >
          <Ionicons name={icon} size={30} color={colors.primary} />
        </LinearGradient>
        <Text style={styles.emptyTitle}>{text}</Text>
        <Text style={styles.emptyHint}>{hint ?? "ابدئي بإضافة أول سجل وسيظهر هنا فوراً"}</Text>
        {actionTitle && onAction ? (
          <Button title={actionTitle} icon="add" onPress={onAction} style={{ marginTop: 16 }} />
        ) : null}
      </View>
    </Reveal>
  );
}

// مستطيل هيكلي ثابت — إحساس تحميل أنيق وآمن
export function Skeleton({ h = 14, w = "100%" as any, r = 8, style }: { h?: number; w?: any; r?: number; style?: ViewStyle }) {
  return <View style={[{ height: h, width: w, borderRadius: r, backgroundColor: colors.border, opacity: 0.7 }, style]} />;
}

export function Loading() {
  return (
    <View style={{ padding: 20, gap: 14, width: "100%", maxWidth: 1040, alignSelf: "center" }}>
      {[0, 1, 2].map((i) => (
        <View key={i} style={styles.card}>
          <Row style={{ gap: 12, marginBottom: 12 }}>
            <Skeleton h={40} w={40} r={12} />
            <View style={{ flex: 1, gap: 8 }}>
              <Skeleton h={15} w="55%" />
              <Skeleton h={11} w="78%" />
            </View>
          </Row>
          <Skeleton h={11} w="92%" style={{ marginBottom: 8 }} />
          <Skeleton h={11} w="64%" />
        </View>
      ))}
    </View>
  );
}

export function IconBtn({ name, onPress, color = colors.textSecondary }: { name: keyof typeof Ionicons.glyphMap; onPress?: () => void; color?: string }) {
  return (
    <Pressable
      onPress={onPress}
      hitSlop={8}
      style={({ pressed, hovered }: any) => [
        styles.iconBtn,
        hovered && { backgroundColor: colors.bg },
        pressed && { opacity: 0.6 },
      ]}
    >
      <Ionicons name={name} size={19} color={color} />
    </Pressable>
  );
}

// قائمة تصدير: طباعة / PDF / Word — تُستدعى run(mode) بعد اختيار النوع
// heroTitle: لو مُرِّر يظهر كزر هيرو بدل أيقونة (للأزرار على مستوى الصفحة)
export function ExportMenu({ run, color = colors.primary, heroTitle, heroIcon }: { run: (mode: "print" | "pdf" | "word") => void; color?: string; heroTitle?: string; heroIcon?: keyof typeof Ionicons.glyphMap }) {
  const [open, setOpen] = React.useState(false);
  const pick = (mode: "print" | "pdf" | "word") => { setOpen(false); run(mode); };
  const opts: { mode: "print" | "pdf" | "word"; label: string; icon: keyof typeof Ionicons.glyphMap; tint: string }[] = [
    { mode: "print", label: "طباعة", icon: "print-outline", tint: colors.primary },
    { mode: "pdf", label: "حفظ PDF", icon: "document-text-outline", tint: colors.danger },
    { mode: "word", label: "حفظ Word", icon: "document-outline", tint: "#2B579A" },
  ];
  return (
    <>
      {heroTitle
        ? <HeroBtn title={heroTitle} icon={heroIcon ?? "download-outline"} onPress={() => setOpen(true)} />
        : <IconBtn name="download-outline" color={color} onPress={() => setOpen(true)} />}
      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.exBackdrop} onPress={() => setOpen(false)}>
          <Pressable style={styles.exSheet} onPress={() => {}}>
            <Text style={styles.exTitle}>تصدير الاستمارة</Text>
            {opts.map((o) => (
              <Pressable key={o.mode} onPress={() => pick(o.mode)}
                style={({ hovered }: any) => [styles.exRow, hovered && { backgroundColor: colors.bg }]}>
                <Ionicons name={o.icon} size={20} color={o.tint} />
                <Text style={styles.exLabel}>{o.label}</Text>
              </Pressable>
            ))}
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

// ── جدول بيانات مرتّب — رأس عنابي متدرّج بنص ذهبي + صفوف متناوبة ──────
export type Col<T> = {
  key: string;
  label: string;
  width?: number;          // عرض ثابت (px) — يُترك فارغاً للتمدّد (flex)
  flex?: number;           // نسبة التمدّد (افتراضي 1)
  align?: "right" | "center" | "left";
  render?: (row: T, index: number) => React.ReactNode; // محتوى مخصّص (شارة مثلاً)
};

export function DataTable<T extends Record<string, any>>({
  columns, data, minWidth = 0, emptyText = "لا توجد بيانات",
}: {
  columns: Col<T>[];
  data: T[];
  minWidth?: number;       // أقل عرض قبل ظهور تمرير أفقي
  emptyText?: string;
}) {
  const { width: winW } = useWindowDimensions();
  // على الشاشات العريضة يملأ الجدول العرض كاملاً بلا تمرير؛ على الضيّقة يظهر تمرير أفقي
  const wide = !minWidth || winW >= minWidth + 24;

  const cellBase = (c: Col<T>): ViewStyle =>
    c.width ? { width: c.width } : { flex: c.flex ?? 1 };
  const alignText = (c: Col<T>): TextStyle => ({
    textAlign: c.align ?? "right",
  });

  const table = (
    <View style={[tbl.wrap, minWidth ? (wide ? { width: "100%" as any } : { minWidth }) : null]}>
      {/* الرأس */}
      <LinearGradient
        colors={gradients.heroDeep}
        start={{ x: 1, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={tbl.head}
      >
        {columns.map((c) => (
          <View key={c.key} style={cellBase(c)}>
            <Text style={[tbl.headTxt, alignText(c)]} numberOfLines={1}>{c.label}</Text>
          </View>
        ))}
      </LinearGradient>

      {/* الصفوف */}
      {data.length === 0 ? (
        <Text style={tbl.empty}>{emptyText}</Text>
      ) : (
        data.map((row, i) => (
          <Pressable
            key={row.id ?? row._id ?? i}
            style={({ hovered }: any) => [
              tbl.row,
              i % 2 === 1 && { backgroundColor: "rgba(245,237,216,0.45)" },
              hovered && { backgroundColor: "rgba(201,169,110,0.14)" },
              i === data.length - 1 && { borderBottomWidth: 0 },
            ]}
          >
            {columns.map((c) => (
              <View key={c.key} style={cellBase(c)}>
                {c.render ? (
                  <View style={{ alignItems: c.align === "center" ? "center" : c.align === "left" ? "flex-start" : "flex-end" }}>
                    {c.render(row, i)}
                  </View>
                ) : (
                  <Text style={[tbl.cell, alignText(c)]} numberOfLines={2}>
                    {row[c.key] ?? "—"}
                  </Text>
                )}
              </View>
            ))}
          </Pressable>
        ))
      )}
    </View>
  );

  // تمرير أفقي فقط على الشاشات الأضيق من الحد الأدنى
  if (minWidth && !wide) {
    return (
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={tbl.scroll} contentContainerStyle={{ flexGrow: 1 }}>
        {table}
      </ScrollView>
    );
  }
  return table;
}

const tbl = StyleSheet.create({
  scroll: { borderRadius: radius.lg, alignSelf: "stretch", width: "100%", ...shadow.card } as any,
  wrap: {
    borderRadius: radius.lg, overflow: "hidden", borderWidth: 1, borderColor: colors.border,
    backgroundColor: colors.card, ...shadow.card,
  },
  head: { flexDirection: "row", alignItems: "center", paddingHorizontal: 14, paddingVertical: 12, gap: 10 },
  headTxt: { fontFamily: fonts.bold, fontSize: 11.5, color: "#EBD9B4", letterSpacing: 0.2 },
  row: {
    flexDirection: "row", alignItems: "center", paddingHorizontal: 14, paddingVertical: 12, gap: 10,
    borderBottomWidth: 1, borderBottomColor: "rgba(28,16,8,0.06)",
    ...(Platform.OS === "web" ? { transitionDuration: "150ms" as any } : {}),
  },
  cell: { fontFamily: fonts.medium, fontSize: 13, color: colors.text },
  empty: { fontFamily: fonts.regular, fontSize: 13, color: colors.textMuted, textAlign: "center", paddingVertical: 22 },
});

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  screenInner: {
    padding: 20,
    width: "100%",
    maxWidth: 1040,
    alignSelf: "center",
  },
  exBackdrop: { flex: 1, backgroundColor: "rgba(7,32,31,0.5)", alignItems: "center", justifyContent: "center", padding: 20 },
  exSheet: { width: 280, maxWidth: "100%", backgroundColor: colors.card, borderRadius: radius.xl, padding: 14, ...shadow.raised },
  exTitle: { fontFamily: fonts.bold, fontSize: 15, color: colors.text, textAlign: "center", marginBottom: 10 },
  exRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 13, paddingHorizontal: 12, borderRadius: radius.md },
  exLabel: { fontFamily: fonts.semibold, fontSize: 14.5, color: colors.text },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: 20,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow.card,
  },
  h1: { fontFamily: fonts.bold, fontSize: 22, color: colors.text, textAlign: "right", marginBottom: 4, letterSpacing: -0.2 },
  h2: { fontFamily: fonts.bold, fontSize: 16.5, color: colors.primaryDeep, textAlign: "right", letterSpacing: -0.2 },
  h2rule: { width: 30, height: 3, borderRadius: 2, backgroundColor: colors.gold, marginTop: 6, alignSelf: "flex-end" },
  p: { fontFamily: fonts.regular, fontSize: 14, color: colors.textSecondary, textAlign: "right", lineHeight: 23 },
  label: { fontFamily: fonts.medium, fontSize: 12.5, color: colors.textSecondary, marginBottom: 7, textAlign: "right" },
  input: {
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: 15,
    paddingVertical: Platform.OS === "web" ? 12 : 10,
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.text,
    textAlign: "right",
    ...(Platform.OS === "web" ? { outlineStyle: "none" as any, transitionDuration: "150ms" as any } : {}),
  },
  inputFocused: {
    borderColor: colors.primary,
    backgroundColor: colors.card,
    ...(Platform.OS === "web" ? { boxShadow: `0 0 0 3px ${colors.primarySoft}` } : {}),
  } as any,
  btn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.md,
    paddingHorizontal: 20,
    paddingVertical: 12,
    ...(Platform.OS === "web" ? { transitionDuration: "150ms" as any, cursor: "pointer" as any } : {}),
  },
  btnSmall: { paddingHorizontal: 14, paddingVertical: 8 },
  btnText: { fontFamily: fonts.semibold, fontSize: 14.5 },
  chip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 999,
    paddingHorizontal: 15,
    paddingVertical: 7,
    backgroundColor: colors.card,
    ...(Platform.OS === "web" ? { transitionDuration: "150ms" as any, cursor: "pointer" as any } : {}),
  },
  chipText: { fontFamily: fonts.medium, fontSize: 13, color: colors.textSecondary },
  iconBtn: { padding: 7, borderRadius: 10 },
  emptyCard: {
    alignItems: "center", paddingVertical: 46, paddingHorizontal: 24,
    backgroundColor: colors.card, borderRadius: radius.xl,
    borderWidth: 1.5, borderColor: colors.border, borderStyle: "dashed",
  },
  emptyCircle: {
    width: 72, height: 72, borderRadius: 24,
    alignItems: "center", justifyContent: "center",
  },
  emptyTitle: { fontFamily: fonts.semibold, fontSize: 15.5, color: colors.text, marginTop: 16, textAlign: "center" },
  emptyHint: { fontFamily: fonts.regular, fontSize: 12.5, color: colors.textMuted, marginTop: 5, textAlign: "center" },
});
