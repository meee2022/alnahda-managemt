import React, { useState } from "react";
import { View } from "react-native";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Screen, Card, H2, P, Input, Button, Loading, Empty, Row, IconBtn, Badge, Select, PageHero, HeroBtn, ExportMenu, AnimatedItem, notify } from "../../lib/ui";
import { colors } from "../../lib/theme";
import { MONTHS } from "../../lib/forms";
import { printAchievementsSheet } from "../../lib/printTemplates";
import { setExportMode } from "../../lib/print";

const CATS = ["أكاديمية", "إدارية", "داخل القسم", "للمدرسة والمجتمع"];

export default function Achievements() {
  const items = useQuery(api.reports.listAchievements, {});
  const settings = useQuery(api.admin.getSettings, {});
  const create = useMutation(api.reports.createAchievement);
  const update = useMutation(api.reports.updateAchievement);
  const remove = useMutation(api.reports.removeAchievement);

  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState({ month: "مايو", category: "أكاديمية", description: "" });

  const reset = () => { setForm({ month: "مايو", category: "أكاديمية", description: "" }); setAdding(false); setEditing(null); };

  const startEdit = (x: any) => {
    setEditing(x._id); setAdding(true);
    setForm({ month: x.month ?? "مايو", category: x.category ?? "أكاديمية", description: x.description ?? "" });
  };

  const save = async () => {
    if (!form.description.trim()) { notify("يرجى إدخال وصف الإنجاز قبل الحفظ."); return; }
    if (editing) await update({ id: editing as any, ...form });
    else await create(form);
    notify("تم حفظ الإنجاز بنجاح", "success");
    reset();
  };

  const printSheet = () => printAchievementsSheet(items ?? [], form.month, settings ?? {});

  if (items === undefined) return <Loading />;

  return (
    <Screen>
      <PageHero
        title="إنجازات القسم"
        desc="توثيق الإنجازات الأكاديمية والإدارية والمجتمعية — بنموذج الإنجاز الرسمي"
        icon="trophy"
        gradient={["#A8853A", "#DFC48E"]}
      >
        <HeroBtn title="إضافة إنجاز" icon="add" prominent onPress={() => { if (adding || editing) reset(); else setAdding(true); }} />
        <ExportMenu heroTitle="تصدير النموذج" run={(m) => { setExportMode(m, "إنجازات القسم"); printSheet(); }} />
      </PageHero>

      {(adding || editing) && (
        <Card>
          <H2>{editing ? "تعديل إنجاز" : "إنجاز جديد"}</H2>
          <Select label="الشهر" options={MONTHS} value={form.month} onChange={(v) => setForm({ ...form, month: v })} />
          <Select label="التصنيف" options={CATS} value={form.category} onChange={(v) => setForm({ ...form, category: v })} />
          <Input label="وصف الإنجاز" value={form.description} onChangeText={(v) => setForm({ ...form, description: v })} multiline />
          <Row>
            <Button title={editing ? "حفظ التعديل" : "حفظ"} icon="checkmark" onPress={save} />
            {editing ? <Button title="إلغاء" variant="ghost" onPress={reset} /> : null}
          </Row>
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
            <Row>
              <IconBtn name="pencil-outline" color={colors.primary} onPress={() => startEdit(x)} />
              <IconBtn name="trash-outline" color={colors.danger} onPress={() => remove({ id: x._id })} />
            </Row>
          </Row>
        </Card>
        </AnimatedItem>
      ))}
    </Screen>
  );
}
