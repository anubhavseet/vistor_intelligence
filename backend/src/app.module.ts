import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { BullModule } from '@nestjs/bull';
import { ScheduleModule } from '@nestjs/schedule';

import { TrackingModule } from './tracking/tracking.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { AuthModule } from './auth/auth.module';
import { SitesModule } from './sites/sites.module';
import { AccountsModule } from './accounts/accounts.module';
import { EnrichmentModule } from './enrichment/enrichment.module';
import { IntentModule } from './intent/intent.module';
import { WebhooksModule } from './webhooks/webhooks.module';
import { HealthModule } from './health/health.module';
import { CrawlerModule } from './crawler/crawler.module';
import { UsersModule } from './users/users.module';
import { WebSocketModule } from './websocket/websocket.module';
import { SubscriptionModule } from './subscription/subscription.module';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // MongoDB
    MongooseModule.forRoot(process.env.MONGODB_URI || 'mongodb://root:password123@localhost:27017/visitor-intelligence', {
      connectionFactory: (connection) => {
        connection.on('connected', () => {
          console.log('✅ MongoDB connected');
        });
        return connection;
      },
    }),

    // GraphQL
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: 'schema.gql',
      sortSchema: true,
      subscriptions: {
        'graphql-ws': true,
      },
      context: ({ req, connection }) => {
        // For subscriptions, connection context is used
        if (connection) {
          return connection.context;
        }
        // For queries/mutations, request context is used
        return { req };
      },
    }),

    // Serve Static Files (Public Assets)
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'public'),
      serveRoot: '/',
    }),

    // BullMQ for background jobs
    BullModule.forRoot({
      redis: {

        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379', 10),
      },
    }),

    // Scheduled tasks
    ScheduleModule.forRoot(),

    // Feature modules
    AuthModule,
    SitesModule,
    TrackingModule,
    AnalyticsModule,
    AccountsModule,
    EnrichmentModule,
    IntentModule,
    WebhooksModule,
    HealthModule,
    CrawlerModule,
    UsersModule,
    WebSocketModule, // Real-time tracking via GraphQL subscriptions
    SubscriptionModule, // Razorpay subscription management
  ],
})
export class AppModule { }
