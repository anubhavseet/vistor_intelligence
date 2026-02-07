import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { HttpModule } from '@nestjs/axios';
import { QdrantModule } from '../qdrant/qdrant.module';
import { SitesService } from './sites.service';
import { SitesResolver } from './sites.resolver';
import { SitesController } from './sites.controller';
import { Site, SiteSchema } from '../common/schemas/site.schema';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Site.name, schema: SiteSchema }]),
    HttpModule,
    QdrantModule,
  ],
  controllers: [SitesController],
  providers: [SitesService, SitesResolver],
  exports: [SitesService],
})
export class SitesModule { }
