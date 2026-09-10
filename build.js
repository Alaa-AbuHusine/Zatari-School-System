import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log("==========================================");
console.log(" Running Student Gateway Asset Build Pipeline");
console.log("==========================================");

const publicDir = path.join(__dirname, "public");
const indexPath = path.join(publicDir, "index.html");
const appJsPath = path.join(publicDir, "app.js");
const stylesCssPath = path.join(publicDir, "styles.css");

if (!fs.existsSync(indexPath) || !fs.existsSync(appJsPath) || !fs.existsSync(stylesCssPath)) {
  console.error("Build error: Missing critical frontend files in public/.");
  process.exit(1);
}

// Generate unique timestamp version for cache-busting
const buildVersion = Date.now().toString();

let indexHtml = fs.readFileSync(indexPath, "utf-8");
indexHtml = indexHtml.replace(/href="styles\.css(\?v=[^"]*)?"/g, `href="styles.css?v=${buildVersion}"`);
indexHtml = indexHtml.replace(/src="app\.js(\?v=[^"]*)?"/g, `src="app.js?v=${buildVersion}"`);

fs.writeFileSync(indexPath, indexHtml, "utf-8");

console.log(`Injected cache-busting token v=${buildVersion} into index.html`);
console.log("Build pipeline completed successfully.");
