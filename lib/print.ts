import * as Print from "expo-print";
import { Platform } from "react-native";

// قالب HTML رسمي للطباعة بالعربي (RTL) بهوية المنصة
export function officialDoc({
  title, subtitle, body, school, year,
}: { title: string; subtitle?: string; body: string; school?: string; year?: string }) {
  return `<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
<meta charset="utf-8" />
<style>
  @page { margin: 18mm 14mm; }
  * { box-sizing: border-box; }
  body { font-family: 'Segoe UI', Tahoma, Arial, sans-serif; color: #15292B; margin: 0; font-size: 13px; }
  .head { display: flex; justify-content: space-between; align-items: center; border-bottom: 3px solid #0E4F4F; padding-bottom: 10px; margin-bottom: 16px; }
  .head .right { text-align: right; font-size: 12px; color: #5C7273; line-height: 1.7; }
  .head .center { text-align: center; }
  .head .center h1 { margin: 0; font-size: 19px; color: #0E4F4F; }
  .head .center h2 { margin: 2px 0 0; font-size: 13px; color: #8E1F3F; font-weight: 600; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 12px; }
  th, td { border: 1px solid #B9CECE; padding: 6px 8px; text-align: right; vertical-align: top; }
  th { background: #0E4F4F; color: #fff; font-size: 12.5px; }
  tr:nth-child(even) td { background: #F3F8F8; }
  .section-title { background: #8E1F3F; color: #fff; padding: 5px 10px; border-radius: 4px; font-weight: 700; margin: 14px 0 8px; font-size: 13.5px; }
  .sig { display: flex; justify-content: space-between; margin-top: 28px; }
  .sig div { text-align: center; min-width: 180px; color: #15292B; }
  .sig .line { margin-top: 26px; border-top: 1.5px dotted #5C7273; padding-top: 4px; font-size: 12px; color: #5C7273; }
  .muted { color: #5C7273; }
  .foot { margin-top: 24px; border-top: 1px solid #B9CECE; padding-top: 6px; font-size: 10.5px; color: #8FA3A3; text-align: center; }
</style>
</head>
<body>
  <div class="head">
    <div class="right">
      ${school ? `المدرسة: <b>${school}</b><br/>` : ""}
      ${year ? `العام الأكاديمي: <b>${year}</b>` : ""}
    </div>
    <div class="center">
      <h1>${title}</h1>
      ${subtitle ? `<h2>${subtitle}</h2>` : ""}
    </div>
    <div style="width:120px"></div>
  </div>
  ${body}
  <div class="foot">أُنشئت هذه الوثيقة عبر منصة قسم المسار الأدبي الإلكترونية</div>
</body>
</html>`;
}

export function signatures(names: string[]) {
  return `<div class="sig">${names.map((n) => `<div><b>${n}</b><div class="line">التوقيع</div></div>`).join("")}</div>`;
}

export function kvTable(rows: [string, string][]) {
  return `<table>${rows.map(([k, val]) => `<tr><th style="width:28%">${k}</th><td>${val || "&nbsp;"}</td></tr>`).join("")}</table>`;
}

export function dataTable(headers: string[], rows: string[][]) {
  return `<table><tr>${headers.map((h) => `<th>${h}</th>`).join("")}</tr>
  ${rows.map((r) => `<tr>${r.map((c) => `<td>${c ?? ""}</td>`).join("")}</tr>`).join("")}</table>`;
}

export async function printHtml(html: string) {
  if (Platform.OS === "web") {
    const w = window.open("", "_blank");
    if (!w) return;
    w.document.write(html);
    w.document.close();
    w.focus();
    setTimeout(() => w.print(), 400);
  } else {
    await Print.printAsync({ html });
  }
}
