const fs = require('fs');
let content = fs.readFileSync('src/components/report/Dashboard.tsx', 'utf-8');
content = content.replace(/className="modern-card"/g, 'className="section"');
content = content.replace(/className="modern-card-title"/g, 'className="section-title"');
content = content.replace(/className="modern-card-title !mb-0"/g, 'className="section-title !mb-0"');
fs.writeFileSync('src/components/report/Dashboard.tsx', content);
console.log('Replaced modern-card with section.');
