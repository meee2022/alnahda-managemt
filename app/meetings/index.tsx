import React from "react";
import { Pressable, View } from "react-native";
import { router } from "expo-router";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Screen, Card, P, Button, Loading, Empty, Row, Badge, IconBtn, PageHero, HeroBtn, AnimatedItem } from "../../lib/ui";
import { colors } from "../../lib/theme";

export default function Meetings() {
  const meetings = useQuery(api.meetings.list, {});
  const remove = useMutation(api.meetings.remove);

  if (meetings === undefined) return <Loading />;

  return (
    <Screen>
      <PageHero
        title="الاجتماعات"
        desc="محاضر الاجتماعات الأكاديمية الجماعية والفردية — توثيق وطباعة رسمية"
        icon="chatbubbles"
        gradient={["#5E0E24", "#9A1B3C"]}
      >
        <HeroBtn title="محضر اجتماع جماعي" icon="add" prominent onPress={() => router.push("/meetings/new?type=group")} />
        <HeroBtn title="اجتماع فردي" icon="person-add" onPress={() => router.push("/meetings/new?type=individual")} />
      </PageHero>

      {meetings.length === 0 ? (
        <Empty text="لا توجد محاضر اجتماعات بعد" hint="أنشئي أول محضر وسيُحفظ ويُطبع بنفس النموذج الرسمي" actionTitle="محضر جديد" onAction={() => router.push("/meetings/new?type=group")} icon="chatbubbles-outline" />
      ) : meetings.map((m, mi) => (
        <AnimatedItem key={m._id} index={mi}>
        <Pressable onPress={() => router.push(`/meetings/${m._id}`)}>
          <Card style={{ paddingVertical: 12 }}>
            <Row style={{ justifyContent: "space-between" }}>
              <View style={{ flex: 1 }}>
                <P style={{ color: colors.text, fontSize: 15 }}>
                  {m.type === "group" ? `محضر اجتماع أكاديمي ${m.number ? `(${m.number})` : ""}` : `اجتماع فردي — ${m.teacherName ?? ""}`}
                </P>
                <Row style={{ marginTop: 4 }}>
                  <Badge label={m.date} tone="muted" />
                  <Badge label={m.type === "group" ? "جماعي" : "فردي"} tone={m.type === "group" ? "primary" : "accent"} />
                </Row>
              </View>
              <IconBtn name="pencil-outline" color={colors.primary} onPress={() => router.push(`/meetings/new?id=${m._id}`)} />
              <IconBtn name="trash-outline" color={colors.danger} onPress={() => remove({ id: m._id })} />
            </Row>
          </Card>
        </Pressable>
        </AnimatedItem>
      ))}
    </Screen>
  );
}
