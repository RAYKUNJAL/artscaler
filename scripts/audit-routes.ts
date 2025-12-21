import fs from 'fs';
import path from 'path';

const BASE_URL = 'http://localhost:3000';

// Mock data for dynamic routes
const MOCK_PARAMS: Record<string, string> = {
    '[slug]': 'test-blog-post',
    '[id]': '123'
};

// Routes to ignore (api routes handled separately)
const IGNORE_DIRS = ['api', 'favicon.ico'];

async function getRoutes(dir: string, baseRoute = ''): Promise<string[]> {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    const routes: string[] = [];

    for (const entry of entries) {
        if (entry.isDirectory()) {
            if (IGNORE_DIRS.includes(entry.name)) continue;

            // Handle route groups (e.g., (auth))
            const routeName = entry.name.startsWith('(') ? '' : entry.name;
            let currentRoute = baseRoute;

            if (routeName) {
                // Replace dynamic segments
                const finalSegment = routeName.startsWith('[') && routeName.endsWith(']')
                    ? (MOCK_PARAMS[routeName] || 'mock-id')
                    : routeName;
                currentRoute = `${baseRoute}/${finalSegment}`;
            }

            routes.push(...await getRoutes(path.join(dir, entry.name), currentRoute));
        } else if (entry.name === 'page.tsx' || entry.name === 'page.js') {
            routes.push(baseRoute || '/');
        }
    }

    return routes;
}

async function audit() {
    console.log('🔍 Starting Full System Route Audit...');
    console.log(`📡 Base URL: ${BASE_URL}\n`);

    const appDir = path.join(process.cwd(), 'app');
    const routes = Array.from(new Set(await getRoutes(appDir))); // Deduplicate

    // Add manual API routes to check commonly used endpoints
    routes.push('/api/scrape/status');
    routes.push('/api/wvs');

    let passed = 0;
    let failed = 0;
    const errors: any[] = [];

    console.log('Checking Routes:');
    console.log('----------------------------------------');

    for (const route of routes.sort()) {
        try {
            const start = performance.now();
            const res = await fetch(`${BASE_URL}${route}`);
            const duration = (performance.now() - start).toFixed(0);

            const status = res.status;
            const statusIcon = status === 200 ? '✅' : (status === 404 ? '❌' : '⚠️');

            console.log(`${statusIcon} ${status} ${route.padEnd(40)} ${duration}ms`);

            if (status === 200) {
                passed++;
            } else {
                failed++;
                errors.push({ route, status, statusText: res.statusText });
            }

        } catch (error: any) {
            console.log(`❌ ??? ${route.padEnd(40)} Connection Failed`);
            failed++;
            errors.push({ route, status: 0, error: error.message });
        }
    }

    console.log('\n----------------------------------------');
    console.log(`📊 Audit Summary: ${passed} Passed, ${failed} Failed`);

    if (failed > 0) {
        console.log('\n🚨 Failures detected:');
        console.table(errors);
        process.exit(1);
    } else {
        console.log('\n✨ All systems nominal.');
        process.exit(0);
    }
}

audit();
