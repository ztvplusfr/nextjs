
const fs = require('fs');
const path = require('path');

// Trouver tous les fichiers route.ts
function findRouteFiles(dir) {
  const files = [];
  const items = fs.readdirSync(dir);
  
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      files.push(...findRouteFiles(fullPath));
    } else if (item === 'route.ts') {
      files.push(fullPath);
    }
  }
  
  return files;
}

// Corriger un fichier route.ts
function fixRouteFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Vérifier si le fichier utilise prisma
  if (!content.includes('prisma')) {
    return false;
  }
  
  // Vérifier si ensurePrismaConnected est déjà importé
  if (content.includes('ensurePrismaConnected')) {
    return false;
  }
  
  let modified = false;
  
  // Ajouter l'import de ensurePrismaConnected
  if (content.includes("import { prisma } from '@/lib/prisma';")) {
    content = content.replace(
      "import { prisma } from '@/lib/prisma';",
      "import { prisma, ensurePrismaConnected } from '@/lib/prisma';"
    );
    modified = true;
  }
  
  // Ajouter ensurePrismaConnected() au début de chaque fonction GET/POST/PUT/DELETE
  const functionRegex = /export async function (GET|POST|PUT|DELETE)\([^)]*\)\s*\{[^}]*try\s*\{/g;
  content = content.replace(functionRegex, (match) => {
    // Vérifier si ensurePrismaConnected est déjà présent
    if (match.includes('ensurePrismaConnected()')) {
      return match;
    }
    
    // Ajouter ensurePrismaConnected() après le try
    return match.replace(
      /try\s*\{/,
      'try {\n    // S\'assurer que Prisma est connecté\n    await ensurePrismaConnected();\n    '
    );
  });
  
  if (modified) {
    fs.writeFileSync(filePath, content);
    console.log(`✅ Corrigé: ${filePath}`);
    return true;
  }
  
  return false;
}

// Trouver et corriger tous les fichiers route.ts
const apiDir = path.join(__dirname, 'src', 'app', 'api');
const routeFiles = findRouteFiles(apiDir);

console.log(`🔍 Trouvé ${routeFiles.length} fichiers route.ts`);

let fixedCount = 0;
for (const file of routeFiles) {
  if (fixRouteFile(file)) {
    fixedCount++;
  }
}

console.log(`✅ ${fixedCount} fichiers corrigés sur ${routeFiles.length}`);
