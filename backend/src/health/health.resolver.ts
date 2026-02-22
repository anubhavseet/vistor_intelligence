import { Resolver, Query } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { ObjectType, Field, Int, Float } from '@nestjs/graphql';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import { ConfigService } from '@nestjs/config';
import * as os from 'os';

// ============ GraphQL Types ============

@ObjectType()
class ServiceHealth {
    @Field() name: string;
    @Field() status: string; // operational | degraded | down
    @Field({ nullable: true }) latencyMs?: number;
    @Field({ nullable: true }) version?: string;
    @Field({ nullable: true }) details?: string;
}

@ObjectType()
class CollectionStats {
    @Field() name: string;
    @Field(() => Int) documentCount: number;
    @Field(() => Float) storageSizeBytes: number;
    @Field(() => Int) indexCount: number;
}

@ObjectType()
class DatabaseStats {
    @Field() name: string;
    @Field(() => Float) dataSize: number;
    @Field(() => Float) storageSize: number;
    @Field(() => Int) collections: number;
    @Field(() => Int) indexes: number;
    @Field(() => Float) avgObjSize: number;
    @Field(() => Int) objects: number;
}

@ObjectType()
class ProcessInfo {
    @Field(() => Float) uptimeSeconds: number;
    @Field(() => Float) memoryUsedMb: number;
    @Field(() => Float) memoryRssMb: number;
    @Field(() => Float) heapUsedMb: number;
    @Field(() => Float) heapTotalMb: number;
    @Field() nodeVersion: string;
    @Field() platform: string;
    @Field() arch: string;
    @Field(() => Int) cpuCount: number;
    @Field(() => Float) totalMemoryGb: number;
    @Field(() => Float) freeMemoryGb: number;
    @Field() hostname: string;
    @Field(() => Float) loadAvg1m: number;
}

@ObjectType()
class EnvironmentInfo {
    @Field() key: string;
    @Field() value: string;
    @Field({ nullable: true }) detail?: string;
}

@ObjectType()
class SystemHealthResponse {
    @Field() overallStatus: string;
    @Field() timestamp: string;
    @Field(() => [ServiceHealth]) services: ServiceHealth[];
    @Field(() => [CollectionStats]) collections: CollectionStats[];
    @Field(() => DatabaseStats, { nullable: true }) database?: DatabaseStats;
    @Field(() => ProcessInfo) process: ProcessInfo;
    @Field(() => [EnvironmentInfo]) environment: EnvironmentInfo[];
}

// ============ Resolver ============

@Resolver()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class HealthResolver {
    constructor(
        @InjectConnection() private connection: Connection,
        private configService: ConfigService,
    ) { }

    @Query(() => SystemHealthResponse, { name: 'adminSystemHealth' })
    async getSystemHealth(): Promise<SystemHealthResponse> {
        const [services, collections, database] = await Promise.all([
            this.checkServices(),
            this.getCollectionStats(),
            this.getDatabaseStats(),
        ]);

        const processInfo = this.getProcessInfo();
        const environment = this.getEnvironmentInfo();

        const overallStatus = services.every(s => s.status === 'operational')
            ? 'operational'
            : services.some(s => s.status === 'down')
                ? 'major_outage'
                : 'degraded';

        return {
            overallStatus,
            timestamp: new Date().toISOString(),
            services,
            collections,
            database,
            process: processInfo,
            environment,
        };
    }

    private async checkServices(): Promise<ServiceHealth[]> {
        const services: ServiceHealth[] = [];

        // MongoDB
        const mongoStart = Date.now();
        try {
            const state = this.connection.readyState;
            const mongoLatency = Date.now() - mongoStart;
            const mongoVersion = await this.getMongoVersion();
            services.push({
                name: 'MongoDB Database',
                status: state === 1 ? 'operational' : state === 2 ? 'degraded' : 'down',
                latencyMs: mongoLatency,
                version: mongoVersion,
                details: `${this.connection.host}:${this.connection.port}`,
            });
        } catch {
            services.push({ name: 'MongoDB Database', status: 'down', details: 'Connection failed' });
        }

        // Redis (check via Bull config)
        const redisHost = this.configService.get('REDIS_HOST', 'localhost');
        const redisPort = this.configService.get('REDIS_PORT', '6379');
        try {
            const Redis = require('ioredis');
            const redis = new Redis({ host: redisHost, port: parseInt(redisPort), connectTimeout: 3000, lazyConnect: true });
            const redisStart = Date.now();
            await redis.connect();
            const info = await redis.info('server');
            const redisLatency = Date.now() - redisStart;
            const versionMatch = info.match(/redis_version:(\S+)/);
            await redis.disconnect();
            services.push({
                name: 'Redis Cache',
                status: 'operational',
                latencyMs: redisLatency,
                version: versionMatch ? `v${versionMatch[1]}` : 'unknown',
                details: `${redisHost}:${redisPort}`,
            });
        } catch {
            services.push({
                name: 'Redis Cache',
                status: 'down',
                details: `${redisHost}:${redisPort} — connection failed`,
            });
        }

        // NestJS API (it's running if we got here)
        services.push({
            name: 'NestJS API Server',
            status: 'operational',
            version: 'NestJS v10',
            details: `Port ${this.configService.get('PORT', '4040')}`,
        });

        // WebSocket Server
        services.push({
            name: 'WebSocket Server',
            status: 'operational',
            version: 'graphql-ws',
            details: `Port ${this.configService.get('PORT', '4040')}`,
        });

        // Bull Queue Workers
        services.push({
            name: 'Bull Queue Workers',
            status: services.find(s => s.name === 'Redis Cache')?.status === 'operational' ? 'operational' : 'degraded',
            version: 'Bull v4',
            details: 'Depends on Redis',
        });

        // AI Engine
        const geminiKey = this.configService.get('GEMINI_API_KEY', '');
        services.push({
            name: 'AI Engine (Gemini)',
            status: geminiKey ? 'operational' : 'degraded',
            version: '@google/generative-ai',
            details: geminiKey ? 'API key configured' : 'API key NOT configured',
        });

        // Razorpay
        const rzpKey = this.configService.get('RAZORPAY_KEY_ID', '');
        services.push({
            name: 'Razorpay Payments',
            status: rzpKey ? 'operational' : 'degraded',
            version: 'razorpay SDK',
            details: rzpKey ? 'Keys configured' : 'Keys NOT configured',
        });

        // Qdrant Vector DB
        const qdrantUrl = this.configService.get('QDRANT_URL', '');
        try {
            if (qdrantUrl) {
                const { QdrantClient } = require('@qdrant/js-client-rest');
                const qdrantApiKey = this.configService.get('QDRANT_API_KEY', '');

                const client = new QdrantClient({
                    url: qdrantUrl,
                    apiKey: qdrantApiKey || undefined,
                });
                const qStart = Date.now();

                // Add an abort controller to prevent hanging if qdrant is unresponsive
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 second timeout

                const res = await fetch(`${qdrantUrl}/readyz`, {
                    method: 'GET',
                    signal: controller.signal
                });

                clearTimeout(timeoutId);

                if (!res.ok) {
                    throw new Error(`Qdrant returned status ${res.status}`);
                }

                const qLatency = Date.now() - qStart;

                services.push({
                    name: 'Qdrant Vector DB',
                    status: 'operational',
                    latencyMs: qLatency,
                    version: 'Qdrant',
                    details: new URL(qdrantUrl).host,
                });
            } else {
                services.push({
                    name: 'Qdrant Vector DB',
                    status: 'degraded',
                    version: 'Qdrant',
                    details: 'URL NOT configured',
                });
            }
        } catch (e: any) {
            services.push({
                name: 'Qdrant Vector DB',
                status: 'down',
                version: 'Qdrant',
                details: 'Connection failed',
            });
        }

        // GeoIP
        services.push({
            name: 'GeoIP Service',
            status: 'operational',
            version: 'geoip-lite',
            details: 'Local database',
        });

        return services;
    }

    private async getCollectionStats(): Promise<CollectionStats[]> {
        try {
            const db = this.connection.db;
            if (!db) return [];

            const colls = await db.listCollections().toArray();
            const stats: CollectionStats[] = [];

            for (const coll of colls) {
                try {
                    const collStats = await db.command({ collStats: coll.name });
                    stats.push({
                        name: coll.name,
                        documentCount: collStats.count || 0,
                        storageSizeBytes: collStats.storageSize || 0,
                        indexCount: collStats.nindexes || 0,
                    });
                } catch {
                    // Some system collections may not be accessible
                    const count = await db.collection(coll.name).countDocuments();
                    stats.push({
                        name: coll.name,
                        documentCount: count,
                        storageSizeBytes: 0,
                        indexCount: 0,
                    });
                }
            }

            return stats.sort((a, b) => b.documentCount - a.documentCount);
        } catch {
            return [];
        }
    }

    private async getDatabaseStats(): Promise<DatabaseStats | undefined> {
        try {
            const db = this.connection.db;
            if (!db) return undefined;

            const stats = await db.stats();
            return {
                name: db.databaseName,
                dataSize: stats.dataSize || 0,
                storageSize: stats.storageSize || 0,
                collections: stats.collections || 0,
                indexes: stats.indexes || 0,
                avgObjSize: stats.avgObjSize || 0,
                objects: stats.objects || 0,
            };
        } catch {
            return undefined;
        }
    }

    private async getMongoVersion(): Promise<string> {
        try {
            const db = this.connection.db;
            if (!db) return 'unknown';
            const admin = db.admin();
            const info = await admin.serverInfo();
            return `v${info.version}`;
        } catch {
            return 'unknown';
        }
    }

    private getProcessInfo(): ProcessInfo {
        const mem = process.memoryUsage();
        const cpus = os.cpus();
        const loadAvg = os.loadavg();

        return {
            uptimeSeconds: process.uptime(),
            memoryUsedMb: Math.round(mem.heapUsed / 1024 / 1024 * 100) / 100,
            memoryRssMb: Math.round(mem.rss / 1024 / 1024 * 100) / 100,
            heapUsedMb: Math.round(mem.heapUsed / 1024 / 1024 * 100) / 100,
            heapTotalMb: Math.round(mem.heapTotal / 1024 / 1024 * 100) / 100,
            nodeVersion: process.version,
            platform: process.platform,
            arch: process.arch,
            cpuCount: cpus.length,
            totalMemoryGb: Math.round(os.totalmem() / 1024 / 1024 / 1024 * 100) / 100,
            freeMemoryGb: Math.round(os.freemem() / 1024 / 1024 / 1024 * 100) / 100,
            hostname: os.hostname(),
            loadAvg1m: Math.round(loadAvg[0] * 100) / 100,
        };
    }

    private getEnvironmentInfo(): EnvironmentInfo[] {
        return [
            { key: 'Runtime', value: 'Node.js', detail: process.version },
            { key: 'Framework', value: 'NestJS', detail: 'v10' },
            { key: 'GraphQL', value: 'Apollo Server', detail: 'v4' },
            { key: 'Frontend', value: 'React + Vite', detail: 'v19' },
            { key: 'Auth', value: 'JWT + Passport', detail: `${this.configService.get('JWT_EXPIRY', '7d')} expiry` },
            { key: 'AI Provider', value: 'Google Gemini', detail: this.configService.get('GEMINI_API_KEY') ? 'Configured ✅' : 'Not configured ⚠️' },
            { key: 'Queue', value: 'Bull + Redis', detail: `${this.configService.get('REDIS_HOST', 'localhost')}:${this.configService.get('REDIS_PORT', '6379')}` },
            { key: 'Payments', value: 'Razorpay', detail: this.configService.get('RAZORPAY_KEY_ID') ? 'Configured ✅' : 'Not configured ⚠️' },
            { key: 'Vector DB', value: 'Qdrant', detail: this.configService.get('QDRANT_URL') ? 'Configured ✅' : 'Not configured ⚠️' },
        ];
    }
}
