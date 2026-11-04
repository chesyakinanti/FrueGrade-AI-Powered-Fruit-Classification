const fs = require('fs');
const path = require('path');

// 1. Read i18n dictionary
const i18nContent = fs.readFileSync('assets/js/i18n.js', 'utf8');
const idMatch = i18nContent.match(/id:\s*{([\s\S]*?)},\s*en:/);
const enMatch = i18nContent.match(/en:\s*{([\s\S]*?)}\s*};/);

if (!idMatch || !enMatch) {
  console.error("Could not parse i18n.js dictionaries!");
  process.exit(1);
}

const idKeys = new Set([...idMatch[1].matchAll(/'([^']+)'\s*:/g)].map(m => m[1]));
const enKeys = new Set([...enMatch[1].matchAll(/'([^']+)'\s*:/g)].map(m => m[1]));

console.log(`Found ${idKeys.size} ID keys and ${enKeys.size} EN keys.`);

// 2. Check each HTML file
const pages = ['index.html', 'upload.html', 'result.html'];
let hasError = false;

pages.forEach(file => {
  const html = fs.readFileSync(file, 'utf8');
  const i18nAttrs = [...html.matchAll(/data-i18n(?:-title|-aria)?="([^"]+)"/g)].map(m => m[1]);
  
  const missingId = i18nAttrs.filter(k => !idKeys.has(k));
  const missingEn = i18nAttrs.filter(k => !enKeys.has(k));

  if (missingId.length > 0) {
    console.error(`[${file}] Missing ID keys:`, missingId);
    hasError = true;
  }
  if (missingEn.length > 0) {
    console.error(`[${file}] Missing EN keys:`, missingEn);
    hasError = true;
  }
  if (missingId.length === 0 && missingEn.length === 0) {
    console.log(`[${file}] All ${i18nAttrs.length} i18n keys verified present in both ID and EN!`);
  }

  // Check tag balance for common tags
  const tags = ['div', 'section', 'header', 'footer', 'main', 'nav', 'button', 'a', 'p', 'span'];
  tags.forEach(tag => {
    const openCount = (html.match(new RegExp(`<${tag}(\\s+[^>]*)?>`, 'gi')) || []).length;
    const closeCount = (html.match(new RegExp(`</${tag}>`, 'gi')) || []).length;
    if (openCount !== closeCount) {
      console.error(`[${file}] Mismatch for <${tag}>: opened ${openCount}, closed ${closeCount}`);
      hasError = true;
    }
  });
});

if (hasError) {
  process.exit(1);
} else {
  console.log("All pages verified with 0 errors!");
}
