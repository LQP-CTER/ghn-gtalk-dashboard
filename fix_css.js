const fs = require('fs');
let css = fs.readFileSync('src/app/globals.css', 'utf-8');
css = css.replace('max-height: 192px;', '');
css = css.replace('overflow-y: auto;', '');
fs.writeFileSync('src/app/globals.css', css);
console.log('Fixed sidebar-multiselect CSS.');
