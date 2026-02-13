
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { AnalyticsService } from '../src/analytics/analytics.service';
import { getModelToken } from '@nestjs/mongoose';
import { RawTrackingLog } from '../src/common/schemas/raw-tracking-log.schema';
import { VisitorSession } from '../src/common/schemas/visitor-session.schema';
import { Model } from 'mongoose';

async function bootstrap() {
    const app = await NestFactory.createApplicationContext(AppModule);
    const analyticsService = app.get(AnalyticsService);
    const rawTrackingLogModel = app.get<Model<RawTrackingLog>>(getModelToken(RawTrackingLog.name));
    const visitorSessionModel = app.get<Model<VisitorSession>>(getModelToken(VisitorSession.name));

    const siteId = 'test-site-' + Date.now();
    const sessionId = 'test-session-' + Date.now();

    console.log('Seeding data for site:', siteId);

    // 1. Seed Raw Tracking Logs (Rage Click & Dwell Time)
    await rawTrackingLogModel.create([
        {
            siteId,
            sessionId,
            timestamp: new Date(),
            ipHash: 'test-ip',
            userAgent: 'test-agent',
            raw_signals: {
                url: 'http://localhost/page1',
                scroll_depth: 0.8,
                rage_clicks: 5,
                dwell_time: { total: 5000, 'header': 1000, 'main': 3000 },
                errors: []
            }
        },
        {
            siteId,
            sessionId,
            timestamp: new Date(),
            ipHash: 'test-ip',
            userAgent: 'test-agent',
            raw_signals: {
                url: 'http://localhost/page2',
                scroll_depth: 0.2,
                rage_clicks: 0,
                dwell_time: { total: 10000, 'footer': 5000 },
                errors: [{ message: 'Test Error' }]
            }
        }
    ]);

    // 2. Seed Visitor Session (User Flow)
    await visitorSessionModel.create({
        siteId,
        sessionId,
        ipHash: 'test-ip-hash',
        startedAt: new Date(Date.now() - 10000),
        endedAt: new Date(),
        pagesVisited: ['http://localhost/page1', 'http://localhost/page2', 'http://localhost/page3'],
        totalPageViews: 3
    });

    console.log('Data seeded. Running verifications...');

    // 3. Verify Page Performance
    const perf = await analyticsService.getPagePerformance(siteId, 1);
    console.log('Page Performance:', JSON.stringify(perf, null, 2));

    if (perf.find(p => p.url === 'http://localhost/page1')?.rageClicks === 5) {
        console.log('✅ Page Performance (Rage Clicks) Verified');
    } else {
        console.error('❌ Page Performance Failed');
    }

    // 4. Verify User Flows
    const flows = await analyticsService.getUserFlows(siteId, 1);
    console.log('User Flows:', JSON.stringify(flows, null, 2));

    if (flows.find(f => f.source === 'http://localhost/page1' && f.target === 'http://localhost/page2')) {
        console.log('✅ User Flows Verified');
    } else {
        console.error('❌ User Flows Failed');
    }

    // 5. Verify Behavioral Patterns
    const patterns = await analyticsService.getBehavioralPatterns(siteId, 1);
    console.log('Behavioral Patterns:', JSON.stringify(patterns, null, 2));

    if (patterns.find(p => p.pattern === 'Rage Clicks')?.count === 1) {
        console.log('✅ Behavioral Patterns (Rage Clicks) Verified');
    } else {
        console.error('❌ Behavioral Patterns Failed');
    }

    if (patterns.find(p => p.pattern === 'JS Errors')?.count === 1) {
        console.log('✅ Behavioral Patterns (JS Errors) Verified');
    } else {
        console.error('❌ Behavioral Patterns Failed');
    }

    // 6. Verify Section Metrics
    // Note: Only checking basic aggregation here as Qdrant setup is mocked/complex for script
    const sections = await analyticsService.getSectionMetrics(siteId, 'http://localhost/page1', 1);
    console.log('Section Metrics (Page 1):', JSON.stringify(sections, null, 2));

    if (sections.find(s => s.selector === 'main')?.avgDwellTime === 3) {
        console.log('✅ Section Metrics Verified');
    } else {
        console.error('❌ Section Metrics Failed');
    }

    await app.close();
    process.exit(0);
}

bootstrap();
