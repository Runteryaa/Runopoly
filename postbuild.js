#!/usr/bin/env node
/**
 * postbuild.js - Run after `npx expo export`
 *
 * 1. Fixes "Cannot use 'import.meta' outside a module" SyntaxError in the web bundle.
 *    Replaces: import.meta.env?.MODE  →  "production"
 *              import.meta.env         →  {"MODE":"production"}
 *              import.meta             →  ({"env":{"MODE":"production"}})
 *
 * 2. Copies MaterialCommunityIcons.ttf to a FLAT, simple path
 *    (dist/assets/MaterialCommunityIcons.ttf) so CDN/Cloudflare serves
 *    it as a binary file instead of returning an HTML page for the deeply
 *    nested node_modules path, then injects an @font-face rule into the CSS.
 */

const fs   = require('fs');
const path = require('path');

const distDir   = path.join(__dirname, 'dist');
const webJsDir  = path.join(distDir, '_expo', 'static', 'js', 'web');
const webCssDir = path.join(distDir, '_expo', 'static', 'css');

// ─── 1. Fix import.meta in JS bundles ───────────────────────────────────────

if (!fs.existsSync(webJsDir)) {
  console.error('[postbuild] dist/_expo/static/js/web not found. Run expo export first.');
  process.exit(1);
}

const jsFiles = fs.readdirSync(webJsDir).filter(f => f.endsWith('.js'));
if (jsFiles.length === 0) {
  console.error('[postbuild] No JS files found in web bundle output.');
  process.exit(1);
}

let totalReplacements = 0;
for (const file of jsFiles) {
  const filePath = path.join(webJsDir, file);
  let content    = fs.readFileSync(filePath, 'utf8');
  const original = content;

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

// ─── 2. Copy font to flat path & inject @font-face ──────────────────────────

/**
 * Recursively search for a file starting with `prefix` and ending with `ext`
 * inside `dir`. Returns the absolute path or null if not found.
 */
function findFile(dir, prefix, ext) {
  if (!fs.existsSync(dir)) return null;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      const found = findFile(full, prefix, ext);
      if (found) return found;
    } else if (entry.name.startsWith(prefix) && entry.name.endsWith(ext)) {
      return full;
    }
  }
  return null;
}

const srcFont = findFile(distDir, 'MaterialCommunityIcons', '.ttf');

if (!srcFont) {
  console.warn('[postbuild] WARNING: MaterialCommunityIcons.ttf not found in dist – icons may show as squares on web.');
} else {
  // Copy to a flat, predictable path that any static host will serve correctly
  const destFont    = path.join(distDir, 'assets', 'MaterialCommunityIcons.ttf');
  const fontPublicUrl = '/assets/MaterialCommunityIcons.ttf';

  fs.mkdirSync(path.dirname(destFont), { recursive: true });
  fs.copyFileSync(srcFont, destFont);
  console.log(`[postbuild] Copied font  →  ${destFont}`);

  // Inject @font-face into the generated CSS file
  const fontFaceCSS = `
/* MaterialCommunityIcons – injected by postbuild.js */
@font-face {
  font-family: "MaterialCommunityIcons";
  src: url("${fontPublicUrl}") format("truetype");
  font-weight: normal;
  font-style: normal;
}
`;

  if (fs.existsSync(webCssDir)) {
    const cssFiles = fs.readdirSync(webCssDir).filter(f => f.endsWith('.css'));
    if (cssFiles.length > 0) {
      const cssPath = path.join(webCssDir, cssFiles[0]);
      let css       = fs.readFileSync(cssPath, 'utf8');

      // Remove any previously injected @font-face for MaterialCommunityIcons
      css = css.replace(/\/\* MaterialCommunityIcons[\s\S]*?\}\n/g, '');

      fs.writeFileSync(cssPath, fontFaceCSS + css, 'utf8');
      console.log(`[postbuild] @font-face injected into ${cssFiles[0]}`);
    }
  }
}
