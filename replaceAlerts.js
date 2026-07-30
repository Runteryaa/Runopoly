const fs = require('fs');
const path = require('path');

const walkSync = (dir, filelist = []) => {
  fs.readdirSync(dir).forEach(file => {
    const dirFile = path.join(dir, file);
    if (fs.statSync(dirFile).isDirectory()) {
      if (!dirFile.includes('node_modules')) {
        filelist = walkSync(dirFile, filelist);
      }
    } else {
      if (dirFile.endsWith('.tsx') || dirFile.endsWith('.ts')) {
        filelist.push(dirFile);
      }
    }
  });
  return filelist;
};

const files = walkSync(path.join(__dirname, 'app')).concat(walkSync(path.join(__dirname, 'components')));

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  if (content.includes('Alert.alert')) {
    // Check if CustomAlert is imported
    if (!content.includes('CustomAlert')) {
      // Find import depth
      const depth = file.split(path.sep).length - __dirname.split(path.sep).length - 1;
      const relativePath = depth === 0 ? './utils/alert' : '../'.repeat(depth) + 'utils/alert';
      
      content = `import { CustomAlert } from '${relativePath}';\n` + content;
    }
    content = content.replace(/Alert\.alert\(/g, 'CustomAlert.alert(');
    fs.writeFileSync(file, content, 'utf8');
    console.log(`Updated ${file}`);
  }
});
