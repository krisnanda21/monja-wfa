const fs = require('fs');
const path = require('path');

function walk(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    if (isDirectory) {
      walk(dirPath, callback);
    } else {
      if (dirPath.endsWith('.ts') || dirPath.endsWith('.tsx') || dirPath.endsWith('.css')) {
        callback(dirPath);
      }
    }
  });
}

let count = 0;
walk(path.join(__dirname, 'src'), (filePath) => {
  let content = fs.readFileSync(filePath, 'utf8');
  let original = content;

  // Replace strictly quoted or specific patterns
  content = content.replace(/'AnggotaTim'/g, "'Anggota Tim'");
  content = content.replace(/"AnggotaTim"/g, '"Anggota Tim"');
  content = content.replace(/AnggotaTim,/g, 'Anggota Tim,');
  
  content = content.replace(/'KetuaTim'/g, "'Ketua Tim'");
  content = content.replace(/"KetuaTim"/g, '"Ketua Tim"');
  content = content.replace(/KetuaTim,/g, 'Ketua Tim,');

  // Fix dynamic CSS classes in map loops. Look for badgeRole${role} or similar
  content = content.replace(/\$\{user\.role\}/g, "${user.role.replace(/\\s+/g, '')}");
  content = content.replace(/\$\{currentUser\.role\}/g, "${currentUser.role.replace(/\\s+/g, '')}");
  // Also fix `{styles['badgeRole' + user.role]}` if it exists
  content = content.replace(/styles\['badgeRole' \+ user\.role\]/g, "styles['badgeRole' + user.role.replace(/\\s+/g, '')]");
  content = content.replace(/styles\['badgeRole' \+ file\.uploader\.role\]/g, "styles['badgeRole' + file.uploader.role.replace(/\\s+/g, '')]");

  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    count++;
    console.log(`Updated: ${filePath}`);
  }
});
console.log(`Done replacing in ${count} files.`);
