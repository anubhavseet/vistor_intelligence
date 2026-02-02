import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import { Site, SiteDocument } from '../common/schemas/site.schema';

@Injectable()
export class SitesService {
  constructor(
    @InjectModel(Site.name) private siteModel: Model<SiteDocument>,
  ) { }

  async createSite(userId: string, name: string, domain?: string): Promise<Site> {
    const siteId = `site_${uuidv4()}`;
    const apiKey = `sk_${uuidv4().replace(/-/g, '')}`;

    const site = await this.siteModel.create({
      siteId,
      name,
      domain,
      userId,
      apiKey,
      allowedDomains: domain ? [domain] : [],
    });

    return site;
  }

  async getSiteBySiteId(siteId: string): Promise<Site> {
    const site = await this.siteModel.findOne({ siteId });
    if (!site) {
      throw new NotFoundException('Site not found');
    }
    return site;
  }

  async getUserSites(userId: string): Promise<Site[]> {
    return this.siteModel.find({ userId, isActive: true });
  }

  async validateApiKey(siteId: string, apiKey: string): Promise<boolean> {
    const site = await this.siteModel.findOne({ siteId, apiKey });
    return !!site;
  }

  async updateSite(userId: string, siteId: string, updates: Partial<Site>): Promise<Site> {
    const site = await this.getSiteBySiteId(siteId);
    if (site.userId !== userId) {
      throw new ForbiddenException('Not authorized to update this site');
    }

    Object.assign(site, updates);
    await site.save();
    return site;
  }
}
