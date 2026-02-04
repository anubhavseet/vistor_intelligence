import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { SitesService } from './sites.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Site } from './dto/site.type';
import { CreateSiteInput } from './dto/create-site.input';
import { UpdateSiteInput } from './dto/update-site.input';
import { mapSiteToGraphQL, mapArrayToGraphQL } from '../common/utils/mappers.util';

@Resolver(() => Site)
@UseGuards(JwtAuthGuard)
export class SitesResolver {
  constructor(private sitesService: SitesService) { }

  @Query(() => [Site])
  async getSites(@CurrentUser() user: any): Promise<Site[]> {
    const sites = await this.sitesService.getUserSites(user.userId);
    return mapArrayToGraphQL(sites, mapSiteToGraphQL);
  }

  @Query(() => Site)
  async getSite(@Args('siteId') siteId: string, @CurrentUser() user: any): Promise<Site> {
    const site = await this.sitesService.getSiteBySiteId(siteId);
    if (String(site.userId) !== String(user.userId)) {
      throw new Error('Not authorized');
    }
    return mapSiteToGraphQL(site);
  }

  @Mutation(() => Site)
  async registerClientSite(
    @Args('input') input: CreateSiteInput,
    @CurrentUser() user: any,
  ): Promise<Site> {
    const site = await this.sitesService.createSite(user.userId, input.name, input.domain);
    return mapSiteToGraphQL(site);
  }

  // Alias for createSite (for frontend compatibility)
  @Mutation(() => Site)
  async createSite(
    @Args('input') input: CreateSiteInput,
    @CurrentUser() user: any,
  ): Promise<Site> {
    const site = await this.sitesService.createSite(user.userId, input.name, input.domain);
    return mapSiteToGraphQL(site);
  }

  @Mutation(() => Site)
  async updateSite(
    @Args('siteId') siteId: string,
    @Args('input') input: UpdateSiteInput,
    @CurrentUser() user: any,
  ): Promise<Site> {
    const site = await this.sitesService.updateSite(user.userId, siteId, input);
    return mapSiteToGraphQL(site);
  }

  @Mutation(() => Boolean)
  async deleteSite(
    @Args('siteId') siteId: string,
    @CurrentUser() user: any,
  ): Promise<boolean> {
    await this.sitesService.deleteSite(user.userId, siteId);
    return true;
  }

  @Mutation(() => Site)
  async regenerateApiKey(
    @Args('siteId') siteId: string,
    @CurrentUser() user: any,
  ): Promise<Site> {
    const site = await this.sitesService.regenerateApiKey(user.userId, siteId);
    return mapSiteToGraphQL(site);
  }
}
