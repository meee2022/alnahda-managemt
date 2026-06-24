// توليد صورة Open Graph (1200×630) بهوية المنصة (عنابي + ذهبي) → public/og-image.png
// تُشغَّل قبل بناء الويب. تعتمد على @resvg/resvg-js وخط Cairo المحلي.
import fs from "node:fs";
import path from "node:path";
import { Resvg } from "@resvg/resvg-js";

const ROOT = process.cwd();
const FONT_DIR = path.resolve(ROOT, "node_modules/@expo-google-fonts/cairo");
const bold = path.join(FONT_DIR, "700Bold/Cairo_700Bold.ttf");
const regular = path.join(FONT_DIR, "400Regular/Cairo_400Regular.ttf");

const TITLE = "منصة قسم المسار الأدبي";
const SUBTITLE = "روضة ومدرسة النهضة الابتدائية للبنات";
const TAG = "استمارات رسمية · متابعة · تقارير وإحصائيات";

// ألوان الهوية (عنابي + ذهبي)
const C = {
  deep: "#3B0A14", primary: "#5C1523", dark: "#4A0F1B", light: "#7A1E30",
  gold: "#C9A96E", goldL: "#DFC48E", goldText: "#EBD9B4",
};

const svg = `<svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${C.dark}"/>
      <stop offset="0.55" stop-color="${C.primary}"/>
      <stop offset="1" stop-color="${C.deep}"/>
    </linearGradient>
    <radialGradient id="glow" cx="0.16" cy="0.18" r="0.5">
      <stop offset="0" stop-color="${C.gold}" stop-opacity="0.22"/>
      <stop offset="1" stop-color="${C.gold}" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="orb" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${C.light}"/>
      <stop offset="1" stop-color="${C.dark}"/>
    </linearGradient>
  </defs>

  <rect width="1200" height="630" fill="url(#bg)"/>
  <rect width="1200" height="630" fill="url(#glow)"/>

  <!-- حلقات زخرفية خفيفة -->
  <circle cx="170" cy="120" r="220" fill="none" stroke="${C.gold}" stroke-opacity="0.08" stroke-width="1.5"/>
  <circle cx="170" cy="120" r="320" fill="none" stroke="${C.gold}" stroke-opacity="0.06" stroke-width="1.5"/>

  <!-- إطار ذهبي -->
  <rect x="28" y="28" width="1144" height="574" rx="28" fill="none" stroke="${C.gold}" stroke-opacity="0.45" stroke-width="2"/>

  <!-- شعار ماسي -->
  <g transform="translate(600 188)">
    <rect x="-58" y="-58" width="116" height="116" rx="30" fill="url(#orb)" stroke="${C.gold}" stroke-opacity="0.6" stroke-width="2"/>
    <rect x="-26" y="-26" width="52" height="52" rx="10" fill="${C.gold}" transform="rotate(45)"/>
  </g>

  <!-- العنوان -->
  <text x="600" y="360" text-anchor="middle" font-family="Cairo" font-weight="700" font-size="66" fill="#FFFFFF">${TITLE}</text>

  <!-- العنوان الفرعي -->
  <text x="600" y="418" text-anchor="middle" font-family="Cairo" font-weight="400" font-size="30" fill="${C.goldL}">${SUBTITLE}</text>

  <!-- شريط سفلي -->
  <rect x="350" y="468" width="500" height="56" rx="28" fill="${C.gold}" fill-opacity="0.14" stroke="${C.gold}" stroke-opacity="0.4" stroke-width="1"/>
  <text x="600" y="505" text-anchor="middle" font-family="Cairo" font-weight="400" font-size="23" fill="${C.goldText}">${TAG}</text>
</svg>`;

const resvg = new Resvg(svg, {
  font: { fontFiles: [bold, regular], loadSystemFonts: false, defaultFontFamily: "Cairo" },
  fitTo: { mode: "width", value: 1200 },
});
const png = resvg.render().asPng();

const outDir = path.resolve(ROOT, "public");
fs.mkdirSync(outDir, { recursive: true });
const out = path.join(outDir, "og-image.png");
fs.writeFileSync(out, png);
console.log(`generate-og: wrote ${out} (${png.length} bytes)`);

// لو مجلد dist موجود (بعد البناء) انسخها إليه أيضاً
const dist = path.resolve(ROOT, "dist", "og-image.png");
if (fs.existsSync(path.dirname(dist))) {
  fs.writeFileSync(dist, png);
  console.log(`generate-og: also wrote ${dist}`);
}
