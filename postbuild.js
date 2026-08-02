#!/usr/bin/env node
/**
 * postbuild.js - Run after `npx expo export`
 * 
 * 1. Fixes "Cannot use 'import.meta' outside a module" SyntaxError in the web bundle.
 *    Zustand's devtools middleware uses import.meta.env.MODE which breaks when
 *    the bundle is loaded as a regular <script> tag (not type="module").
 * 
 *    Replaces: import.meta.env?.MODE  →  "production"
 *              import.meta.env         →  {"MODE":"production"}
 *              import.meta             →  ({"env":{"MODE":"production"}})
 * 
 * 2. Injects @font-face for MaterialCommunityIcons into the generated CSS file
 *    so vector icons render correctly on web (not as squares).
 */

const fs = require('fs');
const path = require('path');

const distDir = path.join(__dirname, 'dist');
const webJsDir = path.join(distDir, '_expo', 'static', 'js', 'web');
const webCssDir = path.join(distDir, '_expo', 'static', 'css');

if (!fs.existsSync(webJsDir)) {
  console.error('[postbuild] dist/_expo/static/js/web not found. Run expo export first.');
  process.exit(1);
}

// ─── 1. Fix import.meta in JS bundles ───────────────────────────────────────

const jsFiles = fs.readdirSync(webJsDir).filter(f => f.endsWith('.js'));

if (jsFiles.length === 0) {
  console.error('[postbuild] No JS files found in web bundle output.');
  process.exit(1);
}

let totalReplacements = 0;

for (const file of jsFiles) {
  const filePath = path.join(webJsDir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  const original = content;

  // Replace in order from most specific to least specific
  content = content.replace(/import\.meta\.env\s*\?\s*import\.meta\.env\.MODE/g, '"production"');
  content = content.replace(/import\.meta\.env\?\.MODE/g, '"production"');
  content = content.replace(/import\.meta\.env\.MODE/g, '"production"');
  content = content.replace(/import\.meta\.env/g, '{"MODE":"production"}');
  content = content.replace(/import\.meta/g, '({"env":{"MODE":"production"}})');

  const count = (original.match(/import\.meta/g) || []).length;
  if (count > 0) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`[postbuild] Fixed ${count} import.meta usage(s) in ${file}`);
    totalReplacements += count;
  }
}

console.log(`[postbuild] Done. Total import.meta usages replaced: ${totalReplacements}`);

// ─── 2. Inject @font-face for MaterialCommunityIcons into CSS ───────────────

// Find the hashed font file in dist
const fontsDir = path.join(distDir, '_expo', 'static', 'js');
let fontUrl = null;

// Search recursively for the MaterialCommunityIcons .ttf asset in dist
function findFontFile(dir) {
  if (!fs.existsSync(dir)) return null;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      const found = findFontFile(fullPath);
      if (found) return found;
    } else if (entry.name.startsWith('MaterialCommunityIcons') && entry.name.endsWith('.ttf')) {
      // Return relative URL path from dist root
      return '/' + path.relative(distDir, fullPath).replace(/\\/g, '/');
    }
  }
  return null;
}

// Also check the assets folder at dist root level
function findFontInAssets() {
  const assetsDir = path.join(distDir, 'assets');
  if (fs.existsSync(assetsDir)) {
    const files = fs.readdirSync(assetsDir);
    const font = files.find(f => f.startsWith('MaterialCommunityIcons') && f.endsWith('.ttf'));
    if (font) return '/assets/' + font;
  }
  return null;
}

fontUrl = findFontFile(distDir) || findFontInAssets();

if (!fontUrl) {
  console.warn('[postbuild] WARNING: Could not find MaterialCommunityIcons.ttf in dist. Icons may render as squares on web.');
} else {
  console.log(`[postbuild] Found font at: ${fontUrl}`);

  const fontFaceRule = `
/* MaterialCommunityIcons - injected by postbuild.js */
@font-face {
  font-family: "MaterialCommunityIcons";
  src: url("${fontUrl}") format("truetype");
  font-weight: normal;
  font-style: normal;
}
`;

  if (fs.existsSync(webCssDir)) {
    const cssFiles = fs.readdirSync(webCssDir).filter(f => f.endsWith('.css'));
    if (cssFiles.length > 0) {
      const cssPath = path.join(webCssDir, cssFiles[0]);
      const existing = fs.readFileSync(cssPath, 'utf8');
      if (!existing.includes('MaterialCommunityIcons')) {
        fs.writeFileSync(cssPath, fontFaceRule + existing, 'utf8');
        console.log(`[postbuild] Injected @font-face into ${cssFiles[0]}`);
      } else {
        console.log(`[postbuild] @font-face already present in ${cssFiles[0]}, skipping.`);
      }
    }
  }
}
