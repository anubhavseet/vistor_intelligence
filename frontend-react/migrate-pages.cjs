#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const OLD_APP_DIR = path.join(__dirname, '..', 'frontend', 'app');
const NEW_PAGES_DIR = path.join(__dirname, 'src', 'pages');

// Create pages directory if it doesn't exist
if (!fs.existsSync(NEW_PAGES_DIR)) {
    fs.mkdirSync(NEW_PAGES_DIR, { recursive: true });
}

// Mapping of old Next.js routes to new React Router page names
const PAGE_MAPPINGS = [
    { old: 'page.tsx', new: 'Home.tsx', route: '/' },
    { old: 'dashboard/page.tsx', new: 'Dashboard.tsx', route: '/dashboard' },
    { old: 'dashboard/sites/page.tsx', new: 'Sites.tsx', route: '/dashboard/sites' },
    { old: 'dashboard/sites/[siteId]/page.tsx', new: 'SiteOverview.tsx', route: '/dashboard/sites/:siteId' },
    { old: 'dashboard/sites/[siteId]/settings/page.tsx', new: 'SiteSettings.tsx', route: '/dashboard/sites/:siteId/settings' },
    { old: 'dashboard/crawling/page.tsx', new: 'Crawling.tsx', route: '/dashboard/crawling' },
    { old: 'dashboard/tracking-code/page.tsx', new: 'TrackingCode.tsx', route: '/dashboard/tracking-code' },
    { old: 'dashboard/integrations/page.tsx', new: 'Integrations.tsx', route: '/dashboard/integrations' },
    { old: 'dashboard/reports/page.tsx', new: 'Reports.tsx', route: '/dashboard/reports' },
    { old: 'dashboard/settings/page.tsx', new: 'Settings.tsx', route: '/dashboard/settings' },
    { old: 'dashboard/[siteId]/page.tsx', new: 'SiteDetail.tsx', route: '/dashboard/:siteId' },
];

function transformPageContent(content, newPageName) {
    let transformed = content;

    // Remove 'use client'
    transformed = transformed.replace(/'use client'\s*\n*/g, '');

    // Update Next.js router imports
    transformed = transformed.replace(
        /import\s+{([^}]+)}\s+from\s+['"]next\/navigation['"]/g,
        "import {$1} from 'react-router-dom'"
    );

    // Update Next.js Link imports
    transformed = transformed.replace(
        /import\s+Link\s+from\s+['"]next\/link['"]/g,
        "import { Link } from 'react-router-dom'"
    );

    // Update useRouter hook
    transformed = transformed.replace(/const\s+router\s*=\s*useRouter\(\)/g, 'const navigate = useNavigate()');

    // Update router.push calls
    transformed = transformed.replace(/router\.push\(/g, 'navigate(');
    transformed = transformed.replace(/router\.replace\(/g, 'navigate(');

    // Update Link href to to
    transformed = transformed.replace(/(<Link[^>]*?)href=/g, '$1to=');

    // Update params from Next.js to React Router
    transformed = transformed.replace(
        /const\s+params\s*=\s*useParams\(\)\s*\n\s*const\s+(\w+)\s*=\s*params\.(\w+)/g,
        'const { $2: $1 } = useParams()'
    );

    // Update path aliases
    transformed = transformed.replace(/from\s+['"]@\/lib\/auth-store['"]/g, "from '@/store/auth-store'");

    // Add export default if not present
    if (!transformed.includes('export default')) {
        const functionMatch = transformed.match(/export\s+function\s+(\w+)/);
        if (functionMatch) {
            const functionName = functionMatch[1];
            transformed = transformed.replace(
                new RegExp(`export\\s+function\\s+${functionName}`),
                `export default function ${functionName}`
            );
        }
    }

    return transformed;
}

function copyAndTransformPage(mapping) {
    const oldPath = path.join(OLD_APP_DIR, mapping.old);
    const newPath = path.join(NEW_PAGES_DIR, mapping.new);

    if (fs.existsSync(oldPath)) {
        const content = fs.readFileSync(oldPath, 'utf8');
        const transformed = transformPageContent(content, mapping.new);
        fs.writeFileSync(newPath, transformed, 'utf8');
        console.log(`✅ Migrated: ${mapping.old} → ${mapping.new} (${mapping.route})`);
        return true;
    } else {
        console.log(`⚠️  Not found: ${mapping.old}`);
        return false;
    }
}

console.log('🚀 Starting page migration...\n');

let successCount = 0;
PAGE_MAPPINGS.forEach(mapping => {
    if (copyAndTransformPage(mapping)) {
        successCount++;
    }
});

console.log(`\n✨ Migration complete! Migrated ${successCount}/${PAGE_MAPPINGS.length} pages.`);

// Update the React Router routes
console.log('\n📋 Add these routes to your App.tsx:');
console.log('\nRoutes Summary:');
PAGE_MAPPINGS.forEach(mapping => {
    console.log(`  ${mapping.route} → ${mapping.new}`);
});
