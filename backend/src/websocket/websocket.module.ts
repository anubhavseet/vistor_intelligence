import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PubSub } from 'graphql-subscriptions';
import { WebSocketTrackingResolver } from './websocket-tracking.resolver';
import { SessionManagerService } from './session-manager.service';
import { StreamProcessingService } from './stream-processing.service';
import { RawTrackingLog, RawTrackingLogSchema } from '../common/schemas/raw-tracking-log.schema';
import { PageEvent, PageEventSchema } from '../common/schemas/page-event.schema';
import { VisitorSession, VisitorSessionSchema } from '../common/schemas/visitor-session.schema';
import { IntentModule } from '../intent/intent.module';

/**
 * WebSocket module for real-time visitor tracking via GraphQL subscriptions
 * 
 * Features:
 * - Real-time event tracking via mutations
 * - Live session updates for admin dashboard
 * - Intent score streaming
 * - UI injection for personalization
 * - Anomaly detection and alerts
 */
@Module({
    imports: [
        MongooseModule.forFeature([
            { name: RawTrackingLog.name, schema: RawTrackingLogSchema },
            { name: PageEvent.name, schema: PageEventSchema },
            { name: VisitorSession.name, schema: VisitorSessionSchema },
        ]),
        IntentModule,
    ],
    providers: [
        // PubSub for GraphQL subscriptions
        {
            provide: 'PUB_SUB',
            useValue: new PubSub(),
        },
        SessionManagerService,
        StreamProcessingService,
        WebSocketTrackingResolver,
    ],
    exports: [SessionManagerService, StreamProcessingService, 'PUB_SUB'],
})
export class WebSocketModule { }
