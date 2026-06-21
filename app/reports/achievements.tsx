import React, { useState } from "react";
import { View } from "react-native";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Screen, Card, H2, P, Input, Button, Loading, Empty, Row, IconBtn, Badge, Select, PageHero, HeroBtn, AnimatedItem } from "../../lib/ui";
import { colors } from "../../lib/theme";
import { MONTHS } from "../../lib/forms";
import { printAchievementsSheet } from "../../lib/printTemplates";

const CATS = ["أكاديمية", "إدارية", "داخل القسم", "للمدرسة والمجتمع"];

export default function Achievements() {
  const items = useQuery(api.reports.listAchievements, {});
  const settings = useQuery(api.admin.getSettings, {});
  const create = useMutation(api.reports.createAchievement);
  const remove = useMutation(api.reports.removeAchievement);

  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ month: "مايو", category: "أكاديمية", description: "" });

  const printSheet = () => printAchievementsSheet(items ?? [], form.month, settings ?? {});

  if (items === undefined) return <Loading />;

  return (
    <Screen>
      <PageHero
        title="إنجازات القسم"
        desc="توثيق الإنجازات الأكاديمية والإدارية والمجتمعية — بنموذج الإنجاز الرسمي"
        icon="trophy"
        gradient={["#B0883A", "#D4B05C"]}
      >
        <HeroBtn title="إضافة إنجاز" icon="add" prominent onPress={() => setAdding(!adding)} />
        <HeroBtn title="طباعة النموذج" icon="print-outline" onPress={printSheet} />
      </PageHero>

      {adding && (
        <Card>
          <H2>إنجاز جديد</H2>
          <Select label="الشهر" options={MONTHS} value={form.month} onChange={(v) => setForm({ ...form, month: v })} />
          <Select label="التصنيف" options={CATS} value={form.category} onChange={(v) => setForm({ ...form, category: v })} />
          <Input label="وصف الإنجاز" value={form.description} onChangeText={(v) => setForm({ ...form, description: v })} multiline />
          <Button title="حفظ" icon="checkmark" onPress={async () => {
            if (!form.description.trim()) return;
            await create(form);
            setForm({ ...form, description: "" });
            setAdding(false);
          }} />
        </Card>
      )}

      {items.length === 0 ? (
        <Empty text="لا توجد إنجازات مسجلة بعد" actionTitle="إضافة إنجاز" onAction={() => setAdding(true)} icon="trophy-outline" />
      ) : items.map((x, xi) => (
        <AnimatedItem key={x._id} index={xi}>
        <Card style={{ paddingVertical: 12 }}>
          <Row style={{ justifyContent: "space-between" }}>
            <View style={{ flex: 1 }}>
              <P style={{ color: colors.text }}>{x.description}</P>
              <Row style={{ marginTop: 4 }}>
                <Badge label={x.category} tone="accent" />
                <Badge label={x.month} tone="muted" />
              </Row>
            </View>
            <IconBtn name="trash-outline" color={colors.danger} onPress={() => remove({ id: x._id })} />
          </Row>
        </Card>
        </AnimatedItem>
      ))}
    </Screen>
  );
}
