import React, { useState } from "react";
import { View } from "react-native";
import { useQuery, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { Screen, Card, H2, P, Input, Button, Loading, Empty, Row, IconBtn, Badge, Select, Chip, PageHero, HeroBtn, AnimatedItem } from "../lib/ui";
import { colors } from "../lib/theme";

const STATUSES = ["الكل", "جديدة", "قيد التنفيذ", "منفذة"];
const SOURCES = ["مديرة المدرسة", "النائبة الأكاديمية", "النائبة الإدارية", "الموجه التربوي", "المنسقة", "لجنة الاعتماد"];

export default function Recommendations() {
  const [filter, setFilter] = useState("الكل");
  const items = useQuery(api.reports.listRecommendations, filter === "الكل" ? {} : { status: filter });
  const create = useMutation(api.reports.createRecommendation);
  const setStatus = useMutation(api.reports.setRecommendationStatus);
  const remove = useMutation(api.reports.removeRecommendation);

  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ source: "المنسقة", text: "", assignee: "", dueDate: "", createdDate: "" });

  return (
    <Screen>
      <PageHero
        title="متابعة التوصيات"
        desc="توصيات المديرة والنائبات والموجهين — من الرصد حتى التنفيذ"
        icon="checkmark-done"
        gradient={["#5A0C22", "#8A1538"]}
      >
        <HeroBtn title={adding ? "إغلاق النموذج" : "إضافة توصية"} icon={adding ? "close" : "add"} prominent onPress={() => setAdding(!adding)} />
      </PageHero>

      <Card>
        <Row style={{ flexWrap: "wrap" }}>
          {STATUSES.map((s) => <Chip key={s} label={s} active={filter === s} onPress={() => setFilter(s)} color={colors.accent} />)}
        </Row>
      </Card>

      {adding && (
        <Card>
          <H2>توصية جديدة</H2>
          <Select label="المصدر" options={SOURCES} value={form.source} onChange={(v) => setForm({ ...form, source: v })} />
          <Input label="نص التوصية" value={form.text} onChangeText={(v) => setForm({ ...form, text: v })} multiline />
          <Input label="المكلّفة بالتنفيذ" value={form.assignee} onChangeText={(v) => setForm({ ...form, assignee: v })} />
          <Input label="تاريخ الاستحقاق" value={form.dueDate} onChangeText={(v) => setForm({ ...form, dueDate: v })} />
          <Button title="حفظ" icon="checkmark" onPress={async () => {
            if (!form.text.trim()) return;
            await create({ ...form, createdDate: new Date().toLocaleDateString("ar-EG") });
            setForm({ ...form, text: "", assignee: "", dueDate: "" });
            setAdding(false);
          }} />
        </Card>
      )}

      {items === undefined ? <Loading /> : items.length === 0 ? (
        <Empty text="لا توجد توصيات بعد" hint="سجّلي توصيات الاجتماعات والزيارات هنا وتابعي تنفيذها خطوة بخطوة" actionTitle="إضافة أول توصية" onAction={() => setAdding(true)} icon="checkmark-done-outline" />
      ) : items.map((x, xi) => (
        <AnimatedItem key={x._id} index={xi}>
        <Card style={{ paddingVertical: 12 }}>
          <P style={{ color: colors.text }}>{x.text}</P>
          <Row style={{ marginTop: 6, flexWrap: "wrap" }}>
            <Badge label={x.source} tone="accent" />
            {x.assignee ? <Badge label={x.assignee} tone="muted" /> : null}
            {x.dueDate ? <Badge label={`حتى ${x.dueDate}`} tone="warning" /> : null}
            <Badge label={x.status} tone={x.status === "منفذة" ? "success" : x.status === "قيد التنفيذ" ? "warning" : "danger"} />
          </Row>
          <Row style={{ marginTop: 8, justifyContent: "space-between" }}>
            <Row>
              {x.status !== "قيد التنفيذ" && x.status !== "منفذة" && (
                <Button title="بدء التنفيذ" small variant="outline" onPress={() => setStatus({ id: x._id, status: "قيد التنفيذ" })} />
              )}
              {x.status !== "منفذة" && (
                <Button title="تمت ✔" small onPress={() => setStatus({ id: x._id, status: "منفذة" })} />
              )}
            </Row>
            <IconBtn name="trash-outline" color={colors.danger} onPress={() => remove({ id: x._id })} />
          </Row>
        </Card>
        </AnimatedItem>
      ))}
    </Screen>
  );
}
