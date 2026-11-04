const fs = require('fs');

let code = fs.readFileSync('assets/js/i18n.js', 'utf8');

// 1. Update ID section
// Replace 'nav.scan': 'Scan / Upload' with 'nav.scan': 'Pindai'
code = code.replace("'nav.scan': 'Scan / Upload'", "'nav.scan': 'Pindai',\n      'nav.facts': 'Fakta Buah'");
// In ID, update cta.btn and add any needed footer keys
code = code.replace("'cta.btn': 'Start Scanning'", "'cta.btn': 'Mulai Pindai'");
code = code.replace("'footer.navTitle': 'Navigasi'", "'footer.navTitle': 'Navigasi',\n      'footer.fruitsTitle': 'Buah Didukung',\n      'footer.backToTop': 'Kembali ke atas'");

// 2. Update EN section
code = code.replace("'nav.scan': 'Scan / Upload'", "'nav.scan': 'Scan',\n      'nav.facts': 'Fun Facts'");
code = code.replace("'footer.navTitle': 'Navigation'", "'footer.navTitle': 'Navigation',\n      'footer.fruitsTitle': 'Supported Fruits',\n      'footer.backToTop': 'Back to top'");

fs.writeFileSync('assets/js/i18n.js', code, 'utf8');
console.log('Successfully updated i18n.js keys!');
