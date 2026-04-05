import fs from 'fs';
import path from 'path';

function getFiles(dir, filesList = []) {
  const files = fs.readdirSync(dir, { withFileTypes: true });
  for (const file of files) {
    if (file.isDirectory()) {
      if (!['__tests__', 'node_modules'].includes(file.name)) {
        getFiles(path.join(dir, file.name), filesList);
      }
    } else {
      if (file.name.endsWith('.ts') && !file.name.endsWith('.bak') && file.name !== 'migrate-history.ts') {
        filesList.push(path.join(dir, file.name));
      }
    }
  }
  return filesList;
}

const serverDir = path.resolve('./server');
const files = getFiles(serverDir);

for (const filePath of files) {
  let code = fs.readFileSync(filePath, 'utf-8');

  // Skip if no console.*
  // Also only match actual console.log, info, warn, error followed by (
  if (!/console\.(log|info|warn|error)\s*\(/.test(code)) {
    continue;
  }

  // Calculate relative path to logger
  // logger is at server/lib/logger.ts
  const fileDir = path.dirname(filePath);
  const loggerPath = path.resolve(serverDir, 'lib/logger.ts');
  let relPath = path.relative(fileDir, loggerPath).replace('.ts', '');
  if (!relPath.startsWith('.')) relPath = './' + relPath;

  // Read existing imports
  let hasLoggerImport = code.includes('import { logger }') || code.includes('import { logger,') || code.includes(', logger }') || /import\s+{[^}]*\blogger\b[^}]*}\s+from/.test(code);
  
  if (!hasLoggerImport) {
    code = `import { logger } from '${relPath}';\n` + code;
  }

  // Replace console.log/info -> logger.info
  code = code.replace(/console\.log\(/g, 'logger.info(');
  code = code.replace(/console\.info\(/g, 'logger.info(');
  
  // Replace console.warn
  // Fix error arguments if second arg is an error
  code = code.replace(/console\.warn\(\s*([^,]+),\s*(error|err|e)\s*\)/g, 'logger.warn({ err: $2 }, $1)');
  code = code.replace(/console\.warn\(/g, 'logger.warn(');

  // Replace console.error
  code = code.replace(/console\.error\(\s*([^,]+),\s*(error|err|e)\s*\)/g, 'logger.error({ err: $2 }, $1)');
  code = code.replace(/console\.error\(/g, 'logger.error(');

  fs.writeFileSync(filePath, code);
  console.log('Patched', filePath);
}
