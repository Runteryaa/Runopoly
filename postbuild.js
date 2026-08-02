#!/usr/bin/env node
/**
 * postbuild.js - Run after `npx expo export`
 * 
 * Fixes "Cannot use 'import.meta' outside a module" SyntaxError in the web bundle.
 * Zustand's devtools middleware uses import.meta.env.MODE which breaks when
 * the bundle is loaded as a regular <script> tag (not type="module").
 * 
 * Replaces: import.meta.env?.MODE  →  "production"
 *           import.meta.env         →  {"MODE":"production"}
 *           import.meta             →  ({"env":{"MODE":"production"}})
 */

const fs = require('fs');
const path = require('path');

const webJsDir = path.join(__dirname, 'dist', '_expo', 'static', 'js', 'web');

if (!fs.existsSync(webJsDir)) {
  console.error('[postbuild] dist/_expo/static/js/web not found. Run expo export first.');
  process.exit(1);
}

const files = fs.readdirSync(webJsDir).filter(f => f.endsWith('.js'));

if (files.length === 0) {
  console.error('[postbuild] No JS files found in web bundle output.');
  process.exit(1);
}

let totalReplacements = 0;

for (const file of files) {
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
