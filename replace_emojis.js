const fs = require('fs');
const path = require('path');

const replacements = {
  '👋': '<i class="fa-solid fa-hand-wave"></i>',
  '🏆': '<i class="fa-solid fa-trophy"></i>',
  '📝': '<i class="fa-solid fa-file-pen"></i>',
  '⌛': '<i class="fa-solid fa-hourglass-half"></i>',
  '👤': '<i class="fa-solid fa-user"></i>',
  '📍': '<i class="fa-solid fa-location-dot"></i>',
  '🗺️': '<i class="fa-solid fa-map"></i>',
  '🌿': '<i class="fa-solid fa-leaf"></i>',
  '☀️': '<i class="fa-solid fa-sun"></i>',
  '🌾': '<i class="fa-solid fa-wheat-awn"></i>',
  '🏙️': '<i class="fa-solid fa-city"></i>',
  '🌲': '<i class="fa-solid fa-tree"></i>',
  '📜': '<i class="fa-solid fa-scroll"></i>',
  '🕹️': '<i class="fa-solid fa-gamepad"></i>',
  '🎯': '<i class="fa-solid fa-bullseye"></i>',
  '⚡': '<i class="fa-solid fa-bolt"></i>',
  '⏱️': '<i class="fa-solid fa-stopwatch"></i>',
  '🎥': '<i class="fa-solid fa-video"></i>',
  '📊': '<i class="fa-solid fa-chart-simple"></i>',
  '🔗': '<i class="fa-solid fa-link"></i>',
  '✍️': '<i class="fa-solid fa-pen-nib"></i>',
  '💻': '<i class="fa-solid fa-laptop-code"></i>',
  '⚙️': '<i class="fa-solid fa-gear"></i>',
  '🗄️': '<i class="fa-solid fa-database"></i>',
  '🌐': '<i class="fa-solid fa-globe"></i>',
  '🧠': '<i class=\"fa-solid fa-brain\"></i>',
  '🥇': '<i class="fa-solid fa-medal" style="color:#FFD700"></i>',
  '🥈': '<i class="fa-solid fa-medal" style="color:#C0C0C0"></i>',
  '🥉': '<i class="fa-solid fa-medal" style="color:#CD7F32"></i>',
  '👍': '<i class="fa-solid fa-thumbs-up"></i>',
  '❌': '<i class="fa-solid fa-xmark"></i>',
  '🔥': '<i class="fa-solid fa-fire"></i>',
  '✨': '<i class="fa-solid fa-sparkles"></i>',
  '✅': '<i class="fa-solid fa-check"></i>',
  '⚠️': '<i class="fa-solid fa-triangle-exclamation"></i>',
  '🎉': '<i class="fa-solid fa-party-horn\"></i>',
  '💡': '<i class="fa-solid fa-lightbulb\"></i>',
  '📖': '<i class="fa-solid fa-book-open\"></i>',
  '⭐': '<i class="fa-solid fa-star\"></i>'
};

const fontAwesomeLink = '<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">';

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else if (file.endsWith('.html') || file.endsWith('.js')) {
      results.push(file);
    }
  });
  return results;
}

const files = walk('./frontend');

let filesModified = 0;

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let originalContent = content;
  
  // Replace emojis
  for (const [emoji, icon] of Object.entries(replacements)) {
    content = content.split(emoji).join(icon);
  }
  
  if (content !== originalContent) {
    if (file.endsWith('.html') && !content.includes('font-awesome/6.4.0/css/all.min.css')) {
      if (content.includes('</head>')) {
        content = content.replace('</head>', '  ' + fontAwesomeLink + '\\n</head>');
      }
    }
    
    fs.writeFileSync(file, content, 'utf8');
    console.log('Modified:', file);
    filesModified++;
  }
});

console.log('Total files modified:', filesModified);
