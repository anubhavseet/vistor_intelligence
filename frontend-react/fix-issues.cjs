const fs = require('fs');
const path = require('path');

const pagesDir = path.join(__dirname, 'src', 'pages');

function fixCommonIssues(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;

    // Fix duplicate imports of Link
    if (content.includes("from 'react-router-dom'") && content.match(/import.*Link.*from.*react-router-dom/g)?.length > 1) {
        // Remove duplicate Link imports
        const lines = content.split('\n');
        const seen = new Set();
        const fixed = [];

        for (const line of lines) {
            if (line.includes("import") && line.includes("from 'react-router-dom'")) {
                const key = line.trim();
                if (seen.has('react-router-dom-import')) {
                    // Skip duplicate
                    continue;
                }
                seen.add('react-router-dom-import');
            }
            fixed.push(line);
        }
        content = fixed.join('\n');
        modified = true;
    }

    // Fix useRouter which doesn't exist in react-router-dom
    if (content.includes('useRouter')) {
        content = content.replace(/import\s*{\s*([^}]*?),?\s*useRouter\s*([^}]*?)}\s*from\s*'react-router-dom'/g,
            (match, before, after) => {
                const cleaned = [before, after].filter(x => x?.trim()).join(', ');
                return `import { ${cleaned} } from 'react-router-dom'`;
            });
        modified = true;
    }

    // Fix router variable references (should be navigate)
    if (content.match(/}\s*,\s*\[.*router.*\]/)) {
        content = content.replace(/}\s*,\s*\[([^\]]*?)router([^\]]*?)\]/, (match, before, after) => {
            const deps = [before, after].filter(x => x?.trim()).join('navigate');
            return `}, [${deps}]`;
        });
        modified = true;
    }

    // Ensure gql is imported if GraphQL queries exist
    if (content.includes('gql`') && !content.includes("import { gql") && !content.includes("import {gql")) {
        content = content.replace(
            /import\s*{\s*([^}]+)}\s*from\s*'@apollo\/client'/,
            (match, imports) => {
                if (imports.includes('gql')) return match;
                return `import { ${imports.trim()}, gql } from '@apollo/client'`;
            }
        );
        modified = true;
    }

    // Fix double imports
    const importLines = {};
    const lines = content.split('\n');
    let fixedContent = [];

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (line.trim().startsWith('import ') && line.includes('from')) {
            const match = line.match(/from\s+['"]([^'"]+)['"]/);
            if (match) {
                const module = match[1];
                if (importLines[module]) {
                    // Merge imports
                    const existing = importLines[module];
                    const existingImports = existing.match(/{([^}]+)}/);
                    const newImports = line.match(/{([^}]+)}/);

                    if (existingImports && newImports) {
                        const allImports = [...new Set([
                            ...existingImports[1].split(',').map(x => x.trim()),
                            ...newImports[1].split(',').map(x => x.trim())
                        ])].join(', ');

                        importLines[module] = existing.replace(/{[^}]+}/, `{ ${allImports} }`);
                        modified = true;
                        continue;
                    }
                } else {
                    importLines[module] = line;
                }
            }
        }

        if (!line.trim().startsWith('import ') || !line.includes('from')) {
            fixedContent.push(line);
        }
    }

    if (modified) {
        // Reconstruct with fixed imports
        const importStatements = Object.values(importLines);
        const nonImportLines = fixedContent;

        // Find first non-import line
        let firstNonImport = 0;
        for (let i = 0; i < lines.length; i++) {
            if (!lines[i].trim().startsWith('import ') && lines[i].trim() !== '') {
                firstNonImport = i;
                break;
            }
        }

        content = [...importStatements, '', ...nonImportLines.filter(x => x.trim() !== '' || !x.startsWith('import'))].join('\n');
    }

    if (modified) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`✅ Fixed: ${path.basename(filePath)}`);
        return true;
    }

    return false;
}

function processDirectory(dir) {
    if (!fs.existsSync(dir)) {
        console.log(`⚠️  Directory not found: ${dir}`);
        return 0;
    }

    const files = fs.readdirSync(dir);
    let count = 0;

    files.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);

        if (stat.isDirectory()) {
            count += processDirectory(filePath);
        } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
            if (fixCommonIssues(filePath)) {
                count++;
            }
        }
    });

    return count;
}

console.log('🔧 Fixing common React Router migration issues...\n');

let totalFixed = 0;
totalFixed += processDirectory(pagesDir);

console.log(`\n✨ Fixed ${totalFixed} files.`);
