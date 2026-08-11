const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else if (file.endsWith('.js')) {
      results.push(file);
    }
  });
  return results;
}

const files = walk('./frontend/js');
let fixed = 0;

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  // Match instances of "<i class="fa-solid fa-something"></i>"
  const regex = /"<(i class="[^"]+")><\/i>"/g;
  if (regex.test(content)) {
    content = content.replace(/"<(i class="[^"]+")><\/i>"/g, "'<$1></i>'");
    fs.writeFileSync(file, content, 'utf8');
    console.log('Fixed syntax in:', file);
    fixed++;
  }
});
console.log('Fixed JS syntax in', fixed, 'files');
