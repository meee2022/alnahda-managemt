import fs from "node:fs";
import { execFileSync } from "node:child_process";

let revision = process.env.VERCEL_GIT_COMMIT_SHA || "";
if (!revision) {
  try {
    revision = execFileSync("git", ["rev-parse", "--short=12", "HEAD"], { encoding: "utf8" }).trim();
  } catch {
    revision = "local";
  }
}

const meta = {
  version: `${revision}-${Date.now()}`,
  revision,
  builtAt: new Date().toISOString(),
};

fs.mkdirSync("public", { recursive: true });
fs.writeFileSync("public/build-meta.json", `${JSON.stringify(meta, null, 2)}\n`, "utf8");
console.log(`generate-build-meta: ${meta.version}`);
