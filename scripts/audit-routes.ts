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

            // Success conditions:
            // 200: OK
            // 401/403: Protected (Passed Audit if it returns correct Auth error)
            const isSuccess = status === 200 || status === 401 || status === 403;
            const statusIcon = status === 200 ? '✅' : (isSuccess ? '🔒' : (status === 404 ? '❌' : '⚠️'));
            const statusLabel = isSuccess ? 'Passed' : 'Failed';

            console.log(`${statusIcon} ${status} ${route.padEnd(40)} ${duration}ms`);

            if (isSuccess) {
                passed++;
            } else {
                failed++;
                errors.push({ route, status, statusText: res.statusText, result: statusLabel });
            }

        } catch (error: any) {
            console.log(`❌ ??? ${route.padEnd(40)} Connection Failed`);
            failed++;
            errors.push({ route, status: 0, error: error.message, result: 'Failed' });
        }
    }

    console.log('\n----------------------------------------');
    console.log(`📊 Audit Summary: ${passed} Passed, ${failed} Failed`);

    if (failed > 0) {
        console.log('\n🚨 Critical failures detected (404/500):');
        console.table(errors);

        // If the only failure is the test blog post, provide instructions
        if (errors.length === 1 && errors[0].route.includes('test-blog-post')) {
            console.log('\n💡 Tip: "/blog/test-blog-post" returned 404. This is expected if you haven\'t run');
            console.log('   the blog migrations yet. Run migrations in Supabase to enable this feature.');
        }

        process.exit(1);
    } else {
        console.log('\n✨ All systems nominal. All routes reachable or protected.');
        process.exit(0);
    }
}

audit();
