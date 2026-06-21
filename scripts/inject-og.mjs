// حقن وسوم Open Graph / Twitter في dist/index.html بعد بناء الويب (وضع output: single)
// يُشغَّل بعد: npx expo export -p web
import fs from "node:fs";
import path from "node:path";

const SITE =
  process.env.EXPO_PUBLIC_SITE_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "https://alnahda-managemt.vercel.app");

const TITLE = "منصة قسم المسار الأدبي";
const DESC =
  "منصة إدارة قسم المسار الأدبي — روضة ومدرسة النهضة الابتدائية للبنات: استمارات رسمية، متابعة المعلمات والطالبات، تقارير وإحصائيات ومتابعة ذكية.";
const OG_IMAGE = `${SITE}/og-image.png`;

const tags = `
    <meta property="og:site_name" content="${TITLE}" />
    <meta property="og:type" content="website" />
    <meta property="og:title" content="${TITLE}" />
    <meta property="og:description" content="${DESC}" />
    <meta property="og:url" content="${SITE}" />
    <meta property="og:image" content="${OG_IMAGE}" />
    <meta property="og:image:secure_url" content="${OG_IMAGE}" />
    <meta property="og:image:type" content="image/png" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta property="og:image:alt" content="${TITLE}" />
    <meta property="og:locale" content="ar_AR" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${TITLE}" />
    <meta name="twitter:description" content="${DESC}" />
    <meta name="twitter:image" content="${OG_IMAGE}" />
`;

const file = path.resolve("dist", "index.html");
if (!fs.existsSync(file)) {
  console.error("inject-og: dist/index.html not found — did the export run?");
  process.exit(1);
}
let html = fs.readFileSync(file, "utf8");
if (html.includes('property="og:image"')) {
  console.log("inject-og: OG tags already present — skipping.");
} else {
  html = html.replace("</head>", `${tags}  </head>`);
  fs.writeFileSync(file, html, "utf8");
  console.log(`inject-og: injected OG/Twitter tags (site: ${SITE}).`);
}
