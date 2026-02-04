const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');

function walk(dir, callback) {
    fs.readdirSync(dir).forEach(f => {
        let dirPath = path.join(dir, f);
        let isDirectory = fs.statSync(dirPath).isDirectory();
        isDirectory ? walk(dirPath, callback) : callback(path.join(dir, f));
    });
}

walk(srcDir, (filePath) => {
    if (!filePath.endsWith('.tsx') && !filePath.endsWith('.ts')) return;

    let content = fs.readFileSync(filePath, 'utf8');
    let originalContent = content;

    // Fix Apollo Client 4 imports
    // Hooks and Provider are now in @apollo/client/react
    content = content.replace(/import\s*{([^}]+)}\s*from\s*'@apollo\/client'/g, (match, p1) => {
        const parts = p1.split(',').map(p => p.trim());
        const reactMembers = ['useQuery', 'useMutation', 'useLazyQuery', 'useSubscription', 'useApolloClient', 'ApolloProvider', 'useReadQuery', 'useSuspenseQuery'];
        const coreMembers = ['ApolloClient', 'InMemoryCache', 'createHttpLink', 'gql', 'makeVar', 'ApolloCache'];

        const toReact = parts.filter(p => reactMembers.includes(p));
        const toCore = parts.filter(p => coreMembers.includes(p));

        if (toReact.length > 0 && toCore.length > 0) {
            return `import { ${toCore.join(', ')} } from '@apollo/client'\nimport { ${toReact.join(', ')} } from '@apollo/client/react'`;
        } else if (toReact.length > 0) {
            return `import { ${toReact.join(', ')} } from '@apollo/client/react'`;
        }
        return match;
    });

    // Fix broken react-router-dom imports
    content = content.replace(/import\s*{\s*,\s*Link\s*}\s*from\s*'react-router-dom'/g, "import { Link, useNavigate } from 'react-router-dom'");
    content = content.replace(/import\s*{\s*Link\s*,\s*}\s*from\s*'react-router-dom'/g, "import { Link, useNavigate } from 'react-router-dom'");
    content = content.replace(/import\s*{\s*useRouter\s*}\s*from\s*'react-router-dom'/g, "import { useNavigate } from 'react-router-dom'");
    content = content.replace(/import\s*{\s*usePathname\s*}\s*from\s*'react-router-dom'/g, "import { useLocation } from 'react-router-dom'");

    // Fix missing useNavigate import
    if (content.includes('useNavigate()') && !content.includes('useNavigate') && !content.includes('import { useNavigate }')) {
        if (content.includes("from 'react-router-dom'")) {
            content = content.replace(/import\s*{([^}]+)}\s*from\s*'react-router-dom'/, (match, p1) => {
                if (p1.includes('useNavigate')) return match;
                return `import { ${p1.trim()}, useNavigate } from 'react-router-dom'`;
            });
        }
    }

    // Fix usePathname -> useLocation
    if (content.includes('usePathname()')) {
        content = content.replace(/const\s+pathname\s+=\s+usePathname\(\)/g, "const { pathname } = useLocation()");
        if (!content.includes('useLocation') && content.includes("from 'react-router-dom'")) {
            content = content.replace(/import\s*{([^}]+)}\s*from\s*'react-router-dom'/, (match, p1) => {
                if (p1.includes('useLocation')) return match;
                return `import { ${p1.trim()}, useLocation } from 'react-router-dom'`;
            });
        }
    }

    // Fix router.push -> navigate
    content = content.replace(/router\.push\(/g, 'navigate(');
    content = content.replace(/router\.replace\(([^)]+)\)/g, 'navigate($1, { replace: true })');
    content = content.replace(/router\.refresh\(\)/g, '// router.refresh()');

    // Fix useEffect dependency arrays
    content = content.replace(/\[isAuthenticated,\s*\]/g, '[isAuthenticated]');
    content = content.replace(/\[([^\]]*),\s*\]/g, '[$1]');

    if (content !== originalContent) {
        console.log(`Fixed issues in ${filePath}`);
        fs.writeFileSync(filePath, content, 'utf8');
    }
});
