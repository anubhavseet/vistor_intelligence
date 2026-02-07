import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { QdrantClient } from '@qdrant/js-client-rest';

@Injectable()
export class QdrantService implements OnModuleInit {
    private readonly logger = new Logger(QdrantService.name);
    private client: QdrantClient;
    private readonly collectionName = 'site_content';

    constructor(private configService: ConfigService) {
        const url = this.configService.get<string>('QDRANT_URL') || 'http://localhost:6333';
        const apiKey = this.configService.get<string>('QDRANT_API_KEY');

        this.client = new QdrantClient({
            url,
            apiKey,
        });
    }

    async onModuleInit() {
        await this.ensureCollection();
    }

    async ensureCollection() {
        try {
            const result = await this.client.getCollections();
            const exists = result.collections.some((c) => c.name === this.collectionName);

            if (!exists) {
                this.logger.log(`Creating collection ${this.collectionName}...`);
                await this.client.createCollection(this.collectionName, {
                    vectors: {
                        size: 768, // Gemini embedding dimension size
                        distance: 'Cosine',
                    },
                });
                this.logger.log(`Collection ${this.collectionName} created.`);
            }
        } catch (error) {
            this.logger.error('Error ensuring Qdrant collection', error);
        }
    }

    async upsertPoint(
        id: string,
        vector: number[],
        payload: Record<string, any>,
    ) {
        try {
            await this.client.upsert(this.collectionName, {
                points: [
                    {
                        id,
                        vector,
                        payload,
                    },
                ],
            });
            this.logger.debug(`Upserted point ${id} for ${payload.url || 'unknown'}`);
        } catch (error) {
            this.logger.error(`Error upserting point ${id}`, error);
            throw error;
        }
    }

    async search(vector: number[], filter?: any, limit = 3) {
        try {
            const searchResult = await this.client.search(this.collectionName, {
                vector,
                filter,
                limit,
                with_payload: true,
            });
            return searchResult;
        } catch (error) {
            this.logger.error('Error searching Qdrant', error);
            throw error;
        }
    }

    async deletePoints(filter: any) {
        try {
            this.logger.log(`Deleting points with filter: ${JSON.stringify(filter)}`);
            await this.client.delete(this.collectionName, {
                filter,
            });
        } catch (error) {
            this.logger.error('Error deleting points from Qdrant', error);
            throw error;
        }
    }
}
