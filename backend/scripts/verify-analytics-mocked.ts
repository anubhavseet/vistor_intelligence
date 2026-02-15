
import { Test } from '@nestjs/testing';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TrackingService } from '../src/tracking/tracking.service';
import { AnalyticsService } from '../src/analytics/analytics.service';
import { IntentService } from '../src/intent/intent.service';
import { SitesService } from '../src/sites/sites.service';
import { QdrantService } from '../src/qdrant/qdrant.service';
import { getQueueToken } from '@nestjs/bull';
import { VisitorSession, VisitorSessionSchema } from '../src/common/schemas/visitor-session.schema';
import { PageEvent, PageEventSchema } from '../src/common/schemas/page-event.schema';
import { RawTrackingLog, RawTrackingLogSchema } from '../src/common/schemas/raw-tracking-log.schema';

async function bootstrap() {
    const mockIntentService = {
        analyzeAndGetUi: async () => ({ score: 50, category: 'Researcher', suggestedAction: null })
    };
    const mockSitesService = {
        validateApiKey: async () => true,
        getSiteBySiteId: async () => ({ settings: {} })
    };
    const mockQdrantService = {
        scroll: async () => []
    };
    const mockQueue = {
        add: async () => ({})
    };

    const moduleRef = await Test.createTestingModule({
        imports: [
            ConfigModule.forRoot(),
            MongooseModule.forRootAsync({
                imports: [ConfigModule],
                useFactory: async (configService: ConfigService) => ({
                    uri: configService.get<string>('MONGODB_URI') || 'mongodb://localhost:27017/visitor-intelligence',
                }),
                inject: [ConfigService],
            }),
            MongooseModule.forFeature([
                { name: VisitorSession.name, schema: VisitorSessionSchema },
                { name: PageEvent.name, schema: PageEventSchema },
                { name: RawTrackingLog.name, schema: RawTrackingLogSchema },
            ]),
        ],
        providers: [
            TrackingService,
            AnalyticsService,
            { provide: IntentService, useValue: mockIntentService },
            { provide: SitesService, useValue: mockSitesService },
            { provide: QdrantService, useValue: mockQdrantService },
            { provide: getQueueToken('enrichment'), useValue: mockQueue },
        ],
    }).compile();

    const trackingService = moduleRef.get<TrackingService>(TrackingService);
    const analyticsService = moduleRef.get<AnalyticsService>(AnalyticsService);

    const siteId = 'test-site-mocked-' + Date.now();
    const sessionId = 'test-session-mocked-' + Date.now();

    console.log(`Test Site ID: ${siteId}`);

    const batch1: any = {
        sessionId,
        timestamp: Date.now(),
        ipAddress: '127.0.0.1',
        userAgent: 'Mozilla/5.0 (Test Agent)',
        signals: {
            url: 'http://test.com/landing?utm_source=google&utm_medium=cpc',
            dwell_time: { 'header': 5000, 'features': 10000 },
            scroll_depth: 50,
            events: [
                { type: 'add_to_cart', timestamp: Date.now(), payload: { sku: '123', price: 99 } }
            ],
            interactions: {
                '#signup-btn': { clicks: 2, hovers: 5, inputs: 0, last_timestamp: Date.now() },
                '.nav-link': { clicks: 1, hovers: 2, inputs: 0, last_timestamp: Date.now() }
            }
        }
    };

    console.log('Processing Batch 1 (Mocked)...');
    await trackingService.processSignalBatch(siteId, 'ignored', batch1);

    const batch2: any = {
        sessionId,
        timestamp: Date.now() + 10000,
        ipAddress: '127.0.0.1',
        userAgent: 'Mozilla/5.0 (Test Agent)',
        signals: {
            url: 'http://test.com/landing',
            dwell_time: { 'footer': 5000 },
            scroll_depth: 80,
            events: [
                { type: 'newsletter_signup', timestamp: Date.now() }
            ],
            interactions: {
                '#signup-btn': { clicks: 1, hovers: 0, inputs: 0, last_timestamp: Date.now() }
            }
        }
    };

    console.log('Processing Batch 2 (Mocked)...');
    await trackingService.processSignalBatch(siteId, 'ignored', batch2);

    // Verify Analytics
    console.log('Verifying Analytics...');
    const topInteractions = await analyticsService.getTopInteractions(siteId, 1);
    console.log('Top Interactions:', JSON.stringify(topInteractions, null, 2));

    const customEvents = await analyticsService.getCustomEvents(siteId, 1);
    console.log('Custom Events:', JSON.stringify(customEvents, null, 2));

    if (topInteractions.length > 0 && customEvents.length > 0) {
        console.log('✅ Analytics Verification Successful');
    } else {
        console.error('❌ Analytics Verification Failed - No Data Retrieved');
    }

    await moduleRef.close();
    process.exit(0);
}

bootstrap();
