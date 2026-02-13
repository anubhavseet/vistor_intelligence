
import { Test, TestingModule } from '@nestjs/testing';
import { AnalyticsService } from './analytics.service';
import { getModelToken } from '@nestjs/mongoose';
import { VisitorSession } from '../common/schemas/visitor-session.schema';
import { RawTrackingLog } from '../common/schemas/raw-tracking-log.schema';
import { QdrantService } from '../qdrant/qdrant.service';

describe('AnalyticsService', () => {
    let service: AnalyticsService;

    const mockVisitorSessionModel = {
        aggregate: jest.fn(),
        find: jest.fn(),
    };

    const mockRawTrackingLogModel = {
        aggregate: jest.fn(),
        find: jest.fn(),
    };

    const mockQdrantService = {
        search: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                AnalyticsService,
                {
                    provide: getModelToken(VisitorSession.name),
                    useValue: mockVisitorSessionModel,
                },
                {
                    provide: getModelToken(RawTrackingLog.name),
                    useValue: mockRawTrackingLogModel,
                },
                {
                    provide: QdrantService,
                    useValue: mockQdrantService,
                },
            ],
        }).compile();

        service = module.get<AnalyticsService>(AnalyticsService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('getUserFlows', () => {
        it('should aggregate user flows correctly', async () => {
            const mockSessions = [
                { pagesVisited: ['/home', '/pricing', '/signup'] },
                { pagesVisited: ['/home', '/pricing'] },
                { pagesVisited: ['/home', '/features', '/pricing'] },
            ];

            mockVisitorSessionModel.aggregate.mockResolvedValue(mockSessions);

            const flows = await service.getUserFlows('site1', 30);

            // Expected flows:
            // /home -> /pricing: 2
            // /pricing -> /signup: 1
            // /home -> /features: 1
            // /features -> /pricing: 1

            expect(flows).toEqual(expect.arrayContaining([
                { source: '/home', target: '/pricing', count: 2 },
                { source: '/pricing', target: '/signup', count: 1 },
                { source: '/home', target: '/features', count: 1 },
                { source: '/features', target: '/pricing', count: 1 },
            ]));
        });
    });

    describe('getBehavioralPatterns', () => {
        it('should detect rage clicks and js errors', async () => {
            mockRawTrackingLogModel.aggregate
                .mockResolvedValueOnce([{ count: 5, sessionIds: ['s1', 's2'] }]) // Rage clicks
                .mockResolvedValueOnce([{ count: 3, sessionIds: ['s3'] }]); // JS Errors

            const patterns = await service.getBehavioralPatterns('site1', 30);

            expect(patterns).toEqual([
                { pattern: 'Rage Clicks', count: 5, sessionIds: ['s1', 's2'] },
                { pattern: 'JS Errors', count: 3, sessionIds: ['s3'] },
            ]);
        });
    });

    describe('getSectionMetrics', () => {
        it('should aggregate dwell time correctly', async () => {
            const mockLogs = [
                {
                    dwell_time: {
                        'header': 5000,
                        'footer': 2000,
                        'main': 10000
                    }
                },
                {
                    dwell_time: {
                        'header': 3000,
                        'main': 15000
                    }
                }
            ];

            mockRawTrackingLogModel.aggregate.mockResolvedValue(mockLogs);

            const metrics = await service.getSectionMetrics('site1', '/home', 30);

            // header: (5000+3000)/2 = 4000ms = 4s
            // footer: (2000)/1 = 2000ms = 2s
            // main: (10000+15000)/2 = 12500ms = 12.5s

            expect(metrics).toEqual(expect.arrayContaining([
                { selector: 'header', avgDwellTime: 4.0, clickCount: 0 },
                { selector: 'footer', avgDwellTime: 2.0, clickCount: 0 },
                { selector: 'main', avgDwellTime: 12.5, clickCount: 0 },
            ]));
        });
    });
});
