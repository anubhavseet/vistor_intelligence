import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SitesService } from './sites.service';
import { SitesResolver } from './sites.resolver';
import { Site, SiteSchema } from '../common/schemas/site.schema';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Site.name, schema: SiteSchema }]),
  ],
  providers: [SitesService, SitesResolver],
  exports: [SitesService],
})
export class SitesModule {}
