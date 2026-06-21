import React, { useState } from "react";
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, useWindowDimensions } from "react-native";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { useAuth } from "../lib/auth";
import { Input, Button } from "../lib/ui";
import { colors, fonts, radius, shadow } from "../lib/theme";

export default function Login() {
  const { login } = useAuth();
  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");
  const [error, setError] = useState("");
  const { width } = useWindowDimensions();
  const wide = width > 880;

  const submit = () => {
    if (login(user, pass)) router.replace("/");
    else setError("اسم المستخدم أو كلمة المرور غير صحيحة");
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.wrap}>
      <View style={[styles.shell, wide && styles.shellWide, shadow.raised]}>
        {/* اللوحة التعريفية */}
        <LinearGradient
          colors={[colors.primaryDeep, colors.primaryDark, colors.primary]}
          start={{ x: 1, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={[styles.brand, wide ? { flex: 1.1 } : { paddingVertical: 36 }]}
        >
          <View style={[styles.brandPattern, { pointerEvents: "none" }]}>
            {[0, 1, 2, 3].map((i) => (
              <View key={i} style={[styles.ring, { width: 200 + i * 110, height: 200 + i * 110 }]} />
            ))}
          </View>
          <View style={styles.monogram}>
            <Text style={styles.monogramText}>م</Text>
          </View>
          <Text style={styles.brandTitle}>منصة قسم{"\n"}المسار الأدبي</Text>
          <View style={styles.brandRule} />
          <Text style={styles.brandSub}>مدرسة النهضة الابتدائية للبنات</Text>
          {wide && (
            <Text style={styles.brandFoot}>
              الاجتماعات · الزيارات · التقييم · التحصيل{"\n"}التطوير المهني · التقارير الرسمية
            </Text>
          )}
        </LinearGradient>

        {/* نموذج الدخول */}
        <View style={[styles.form, wide && { flex: 1 }]}>
          <Text style={styles.formTitle}>تسجيل الدخول</Text>
          <Text style={styles.formSub}>أهلاً بعودتكِ، أدخلي بياناتك للمتابعة</Text>
          <Input label="اسم المستخدم" value={user} onChangeText={setUser} autoCapitalize="none" placeholder="admin" />
          <Input label="كلمة المرور" value={pass} onChangeText={setPass} secureTextEntry placeholder="********" onSubmitEditing={submit} />
          {error ? <Text style={styles.err}>{error}</Text> : null}
          <Button title="دخول المنصة" onPress={submit} style={{ marginTop: 4 }} />
          <Text style={styles.foot}>العام الأكاديمي 2025 – 2026</Text>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.bg, alignItems: "center", justifyContent: "center", padding: 18 },
  shell: {
    width: "100%", maxWidth: 460, borderRadius: radius.xl, overflow: "hidden",
    backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border,
  },
  shellWide: { maxWidth: 880, flexDirection: "row-reverse", minHeight: 520 },
  brand: { padding: 30, justifyContent: "center", overflow: "hidden" },
  brandPattern: { position: "absolute", left: -110, bottom: -130, alignItems: "center", justifyContent: "center" },
  ring: { position: "absolute", borderRadius: 999, borderWidth: 1, borderColor: "rgba(255,255,255,0.06)" },
  monogram: {
    width: 58, height: 58, borderRadius: 18, backgroundColor: "rgba(255,255,255,0.10)",
    borderWidth: 1, borderColor: "rgba(255,255,255,0.18)", alignItems: "center", justifyContent: "center",
    alignSelf: "flex-end", marginBottom: 22,
  },
  monogramText: { fontFamily: fonts.bold, fontSize: 26, color: colors.white },
  brandTitle: { fontFamily: fonts.bold, fontSize: 27, lineHeight: 40, color: colors.white, textAlign: "right" },
  brandRule: { width: 44, height: 3, borderRadius: 2, backgroundColor: colors.gold, alignSelf: "flex-end", marginVertical: 16 },
  brandSub: { fontFamily: fonts.medium, fontSize: 13.5, color: "rgba(255,255,255,0.8)", textAlign: "right" },
  brandFoot: { fontFamily: fonts.regular, fontSize: 12, lineHeight: 21, color: "rgba(255,255,255,0.45)", textAlign: "right", marginTop: 34 },
  form: { padding: 30, justifyContent: "center" },
  formTitle: { fontFamily: fonts.bold, fontSize: 21, color: colors.text, textAlign: "right" },
  formSub: { fontFamily: fonts.regular, fontSize: 13, color: colors.textMuted, textAlign: "right", marginTop: 4, marginBottom: 24 },
  err: { fontFamily: fonts.medium, color: colors.danger, fontSize: 13, textAlign: "right", marginBottom: 8 },
  foot: { fontFamily: fonts.regular, fontSize: 11.5, color: colors.textMuted, textAlign: "center", marginTop: 26 },
});
