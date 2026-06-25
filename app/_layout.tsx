import React, { useEffect } from "react";
import { I18nManager, Platform, View, ActivityIndicator, Pressable, Text, ScrollView, useWindowDimensions } from "react-native";
import { Stack, router, usePathname } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ConvexProvider } from "convex/react";
import {
  useFonts,
  Cairo_400Regular,
  Cairo_500Medium,
  Cairo_600SemiBold,
  Cairo_700Bold,
} from "@expo-google-fonts/cairo";
import { convex } from "../lib/convex";
import { AuthProvider, useAuth } from "../lib/auth";
import { DrawerProvider, MenuButton, HeaderAvatar, useDrawer, NAV } from "../lib/nav";
import { Toaster } from "../lib/ui";
import { colors, fonts, shadow } from "../lib/theme";

// يسار الترويسة (يمين بصرياً في RTL): زر قائمة في الرئيسية، وزر رجوع في الصفحات الداخلية
function HeaderLeading() {
  const pathname = usePathname();
  if (pathname === "/login") return null;
  if (pathname === "/") return <MenuButton />;
  return <BackButton />;
}

// عناصر شريط التنقل السفلي — 4 أقسام أساسية + تبويب «المزيد» يفتح كل الأقسام
type Tab = { label: string; icon: keyof typeof Ionicons.glyphMap; iconActive: keyof typeof Ionicons.glyphMap; href?: string; more?: boolean };
const TABS: Tab[] = [
  { label: "الرئيسية", icon: "home-outline", iconActive: "home", href: "/" },
  { label: "الاجتماعات", icon: "chatbubbles-outline", iconActive: "chatbubbles", href: "/meetings" },
  { label: "الزيارات", icon: "footsteps-outline", iconActive: "footsteps", href: "/visits" },
  { label: "المعلمات", icon: "people-outline", iconActive: "people", href: "/teachers" },
  { label: "المزيد", icon: "grid-outline", iconActive: "grid", more: true },
];

function isTabActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(href + "/");
}

// شريط تنقل سفلي ثابت — يظهر على الجوال والشاشات الضيقة
// هل المسار الحالي ضمن التبويبات الأربعة الأساسية؟ (لتحديد تمييز «المزيد»)
const MAIN_HREFS = ["/", "/meetings", "/visits", "/teachers"];
function onMainTab(pathname: string) {
  return MAIN_HREFS.some((h) => isTabActive(pathname, h));
}

function BottomBar() {
  const { loggedIn } = useAuth();
  const { open, isOpen } = useDrawer();
  const pathname = usePathname();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  if (!loggedIn || pathname === "/login") return null;
  if (width > 720) return null; // على الويب العريض نكتفي بالصفحة الرئيسية كمركز

  return (
    <View
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        bottom: 0,
        // RTL: أول تبويب (الرئيسية) يظهر على اليمين — الحاوية بالأصل rtl فـ row يكفي
        flexDirection: "row",
        backgroundColor: colors.card,
        borderTopWidth: 1,
        borderTopColor: colors.border,
        paddingTop: 8,
        paddingBottom: Math.max(insets.bottom, 8),
        paddingHorizontal: 6,
        ...shadow.raised,
      }}
    >
      {TABS.map((t) => {
        const active = t.more ? (isOpen || !onMainTab(pathname)) : isTabActive(pathname, t.href!);
        return (
          <Pressable
            key={t.label}
            onPress={() => (t.more ? open() : router.replace(t.href as any))}
            style={({ pressed }: any) => ({
              flex: 1,
              alignItems: "center",
              justifyContent: "center",
              gap: 3,
              paddingVertical: 4,
              opacity: pressed ? 0.6 : 1,
            })}
          >
            <View
              style={{
                width: 46,
                height: 30,
                borderRadius: 12,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: active ? colors.primarySoft : "transparent",
              }}
            >
              <Ionicons name={active ? t.iconActive : t.icon} size={20} color={active ? colors.primary : colors.textMuted} />
            </View>
            <Text
              style={{
                fontFamily: active ? fonts.semibold : fonts.regular,
                fontSize: 10.5,
                color: active ? colors.primary : colors.textMuted,
              }}
            >
              {t.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

// الأقسام الأساسية في الشريط العلوي — 6 + «المزيد» يفتح الباقي
const TOP_SECTIONS: { label: string; icon: keyof typeof Ionicons.glyphMap; href: string }[] = [
  { label: "الرئيسية", icon: "home", href: "/" },
  { label: "الاجتماعات", icon: "chatbubbles", href: "/meetings" },
  { label: "المعلمات", icon: "people", href: "/teachers" },
  { label: "الطالبات", icon: "school", href: "/students" },
  { label: "تقييم الزيارة", icon: "eye", href: "/evaluations/class-visit" },
  { label: "الإحصائيات", icon: "stats-chart", href: "/reports/stats" },
];
const TOP_HREFS = TOP_SECTIONS.map((s) => s.href);

// شريط أقسام أفقي علوي — الأقسام الأساسية + «المزيد»
function TopNav() {
  const { open, isOpen } = useDrawer();
  const { loggedIn } = useAuth();
  const pathname = usePathname();
  const { width } = useWindowDimensions();
  if (!loggedIn || pathname === "/login") return null;
  if (width <= 720) return null; // على الجوال نكتفي بالشريط السفلي — لا تكرار للتنقل
  const onMain = TOP_HREFS.some((h) => isTabActive(pathname, h));

  const Pill = ({ label, icon, active, onPress }: any) => (
    <Pressable
      onPress={onPress}
      style={({ hovered }: any) => [
        {
          flexDirection: "row", alignItems: "center", gap: 5,
          paddingHorizontal: 13, paddingVertical: 7, borderRadius: 999, borderWidth: 1,
          backgroundColor: active ? colors.primary : colors.bg,
          borderColor: active ? colors.primary : colors.border,
        },
        hovered && !active && { backgroundColor: colors.primarySoft },
        Platform.OS === "web" ? ({ cursor: "pointer" } as any) : null,
      ]}
    >
      <Ionicons name={icon} size={14} color={active ? "#fff" : colors.primary} />
      <Text style={{ fontFamily: active ? fonts.semibold : fonts.medium, fontSize: 12.5, color: active ? "#fff" : colors.text }} numberOfLines={1}>{label}</Text>
    </Pressable>
  );

  // عدد التبويبات الظاهرة يُحسب حسب عرض الشاشة — والباقي يُطوى داخل «المزيد»
  const pillW = (label: string) => label.length * 8.2 + 52; // عرض تقريبي للزر
  const avail = width - 24;          // الحشو الجانبي
  const reserved = pillW("المزيد") + 18; // مكان زر «المزيد» دائماً
  let used = reserved;
  let count = 0;
  for (const s of TOP_SECTIONS) {
    const w = pillW(s.label) + 6;
    if (used + w <= avail) { used += w; count++; } else break;
  }
  count = Math.max(1, Math.min(count, TOP_SECTIONS.length));
  let visible = TOP_SECTIONS.slice(0, count);
  // إن كان القسم الحالي مطويّاً، أظهره مكان آخر تبويب ظاهر
  const activeIdx = TOP_SECTIONS.findIndex((s) => isTabActive(pathname, s.href));
  if (activeIdx >= count) visible = [...TOP_SECTIONS.slice(0, count - 1), TOP_SECTIONS[activeIdx]];

  return (
    <View style={{ backgroundColor: colors.card, borderBottomWidth: 1, borderBottomColor: colors.border }}>
      <View style={{ flexDirection: "row", flexWrap: "nowrap", justifyContent: "flex-start", paddingHorizontal: 12, paddingVertical: 7, gap: 6, alignItems: "center" }}>
        {visible.map((it) => (
          <Pill key={it.href} label={it.label} icon={it.icon} active={isTabActive(pathname, it.href)} onPress={() => router.replace(it.href as any)} />
        ))}
        <Pill label="المزيد" icon="grid" active={isOpen || !onMain} onPress={() => open()} />
      </View>
    </View>
  );
}

if (Platform.OS !== "web") {
  I18nManager.allowRTL(true);
  I18nManager.forceRTL(true);
}

// زر بحث في الترويسة
function SearchButton() {
  const pathname = usePathname();
  if (pathname === "/login" || pathname === "/search") return null;
  return (
    <Pressable onPress={() => router.push("/search" as any)} hitSlop={8}
      style={({ hovered, pressed }: any) => [{ width: 36, height: 36, borderRadius: 11, alignItems: "center", justifyContent: "center" }, hovered && { backgroundColor: colors.primarySoft }, pressed && { opacity: 0.7 }]}>
      <Ionicons name="search" size={20} color={colors.primary} />
    </Pressable>
  );
}

// زر رجوع واضح يظهر في كل الصفحات الداخلية
function BackButton() {
  const pathname = usePathname();
  if (pathname === "/" || pathname === "/login") return null;
  const goBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace("/");
  };
  return (
    <Pressable
      onPress={goBack}
      hitSlop={10}
      style={({ hovered, pressed }: any) => ({
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        backgroundColor: hovered ? colors.primarySoft : colors.card,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 12,
        paddingVertical: 7,
        paddingHorizontal: 12,
        marginHorizontal: 10,
        opacity: pressed ? 0.7 : 1,
        ...(Platform.OS === "web" ? { transitionDuration: "150ms", cursor: "pointer" } : {}),
      })}
    >
      <Ionicons name="arrow-forward" size={17} color={colors.primary} />
      <Text style={{ fontFamily: fonts.semibold, fontSize: 13.5, color: colors.primary }}>رجوع</Text>
    </Pressable>
  );
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Cairo_400Regular,
    Cairo_500Medium,
    Cairo_600SemiBold,
    Cairo_700Bold,
  });

  useEffect(() => {
    if (Platform.OS === "web" && typeof document !== "undefined") {
      document.documentElement.dir = "rtl";
      document.documentElement.lang = "ar";
      document.title = "منصة قسم المسار الأدبي";
    }
  }, []);

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.bg }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <ConvexProvider client={convex}>
      <AuthProvider>
        <DrawerProvider>
        <StatusBar style="dark" />
        <View style={{ flex: 1, backgroundColor: colors.bg }}>
        <TopNav />
        <Stack
          screenOptions={{
            headerStyle: { backgroundColor: colors.bg },
            headerTintColor: colors.text,
            headerTitleStyle: { fontFamily: fonts.semibold, fontSize: 16, color: colors.text },
            headerTitleAlign: "center",
            headerBackButtonDisplayMode: "minimal",
            headerShadowVisible: false,
            headerLeft: () => <HeaderLeading />,
            headerRight: () => (
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <SearchButton />
                <HeaderAvatar />
              </View>
            ),
            contentStyle: { backgroundColor: colors.bg },
          }}
        >
          <Stack.Screen name="login" options={{ headerShown: false }} />
          <Stack.Screen name="index" options={{ title: "منصة قسم المسار الأدبي" }} />
          <Stack.Screen name="teachers" options={{ title: "المعلمات" }} />
          <Stack.Screen name="students" options={{ title: "الطالبات" }} />
          <Stack.Screen name="meetings/index" options={{ title: "الاجتماعات" }} />
          <Stack.Screen name="meetings/new" options={{ title: "محضر اجتماع جديد" }} />
          <Stack.Screen name="meetings/[id]" options={{ title: "محضر الاجتماع" }} />
          <Stack.Screen name="visits" options={{ title: "جدول الزيارات الشهري" }} />
          <Stack.Screen name="evaluations/periodic" options={{ title: "التقرير الدوري للمعلمات" }} />
          <Stack.Screen name="evaluations/annual" options={{ title: "تقييم الأداء السنوي" }} />
          <Stack.Screen name="evaluations/class-visit" options={{ title: "استمارة تقييم الزيارة" }} />
          <Stack.Screen name="evaluations/performance" options={{ title: "استمارة متابعة الأداء" }} />
          <Stack.Screen name="evaluations/classification" options={{ title: "تصنيف أداء المعلمين" }} />
          <Stack.Screen name="plans/annual" options={{ title: "الخطة السنوية للقسم" }} />
          <Stack.Screen name="plans/achievement" options={{ title: "خطة التحصيل الأكاديمي" }} />
          <Stack.Screen name="plans/agenda" options={{ title: "جدول أعمال المنسقة" }} />
          <Stack.Screen name="academics/exams" options={{ title: "التحصيل الأكاديمي" }} />
          <Stack.Screen name="academics/curriculum" options={{ title: "متابعة الخطة الفصلية" }} />
          <Stack.Screen name="academics/written-work" options={{ title: "متابعة الأعمال الكتابية" }} />
          <Stack.Screen name="development" options={{ title: "التطوير المهني" }} />
          <Stack.Screen name="reports/stats" options={{ title: "الإحصائيات والتقارير" }} />
          <Stack.Screen name="reports/teacher" options={{ title: "الملف الفردي للمعلمة" }} />
          <Stack.Screen name="assistant" options={{ title: "مساعد التوصيات الذكي" }} />
          <Stack.Screen name="import" options={{ title: "رفع وتحليل استمارة خارجية" }} />
          <Stack.Screen name="chat" options={{ title: "المساعد الذكي (محادثة)" }} />
          <Stack.Screen name="search" options={{ title: "بحث سريع" }} />
          <Stack.Screen name="reports/monthly" options={{ title: "التقرير الشهري للمنسقة" }} />
          <Stack.Screen name="reports/achievements" options={{ title: "إنجازات القسم" }} />
          <Stack.Screen name="registers/leave" options={{ title: "سجل الاستئذان" }} />
          <Stack.Screen name="registers/cover" options={{ title: "سجل الاحتياط" }} />
          <Stack.Screen name="recommendations" options={{ title: "متابعة التوصيات" }} />
          <Stack.Screen name="admin" options={{ title: "لوحة التحكم" }} />
        </Stack>
        <BottomBar />
        <Toaster />
        </View>
        </DrawerProvider>
      </AuthProvider>
    </ConvexProvider>
  );
}
