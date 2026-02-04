const fs = require('fs');
const path = require('path');

const componentsDir = path.join(__dirname, 'src', 'components');
const pagesDir = path.join(__dirname, 'src', 'pages');

function updateImports(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;

    // Remove 'use client' directive
    if (content.includes("'use client'")) {
        content = content.replace(/'use client'\s*\n/g, '');
        modified = true;
    }

    // Update Next.js router imports
    if (content.includes("from 'next/navigation'")) {
        content = content.replace(
            /import\s+{([^}]+)}\s+from\s+['"]next\/navigation['"]/g,
            "import {$1} from 'react-router-dom'"
        );

        // Update useRouter hook usage
        content = content.replace(/const\s+router\s*=\s*useRouter\(\)/g, 'const navigate = useNavigate()');
        content = content.replace(/router\.push\(/g, 'navigate(');
        content = content.replace(/router\.replace\(/g, 'navigate(');

        modified = true;
    }

    // Update Next.js Link imports
    if (content.includes("from 'next/link'")) {
        content = content.replace(/import\s+Link\s+from\s+['"]next\/link['"]/g, "import { Link } from 'react-router-dom'");
        modified = true;
    }

    // Update Link href to to
    content = content.replace(/(<Link\s+[^>]*?)href=/g, '$1to=');

    // Update path aliases
    content = content.replace(/@\/lib\//g, '@/lib/');
    content = content.replace(/@\/components\//g, '@/components/');
    content = content.replace(/@\/store\//g, '@/store/');

    // Special case: auth-store moved to store folder
    content = content.replace(/from\s+['"]@\/lib\/auth-store['"]/g, "from '@/store/auth-store'");

    if (modified || content !== fs.readFileSync(filePath, 'utf8')) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`✅ Updated: ${path.basename(filePath)}`);
        return true;
    }

    return false;
}

function processDirectory(dir) {
    if (!fs.existsSync(dir)) {
        console.log(`⚠️  Directory not found: ${dir}`);
        return;
    }

    const files = fs.readdirSync(dir);
    let count = 0;

    files.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);

        if (stat.isDirectory()) {
            count += processDirectory(filePath);
        } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
            if (updateImports(filePath)) {
                count++;
            }
        }
    });

    return count;
}

console.log('🚀 Starting import migration...\n');

let totalUpdated = 0;

console.log('📦 Processing components...');
totalUpdated += processDirectory(componentsDir);

console.log('\n📄 Processing pages...');
totalUpdated += processDirectory(pagesDir);

console.log(`\n✨ Migration complete! Updated ${totalUpdated} files.`);
