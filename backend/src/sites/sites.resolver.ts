import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { SitesService } from './sites.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Site } from './dto/site.type';
import { CreateSiteInput } from './dto/create-site.input';
import { UpdateSiteInput } from './dto/update-site.input';
import { mapSiteToGraphQL, mapArrayToGraphQL } from '../common/utils/mappers.util';
import { SubscriptionGuard } from '../subscription/guards/subscription.guard';
import { RequiresFeature } from '../subscription/decorators/requires-feature.decorator';
import { SubscriptionService } from '../subscription/subscription.service';

@Resolver(() => Site)
@UseGuards(JwtAuthGuard)
export class SitesResolver {
  constructor(
    private sitesService: SitesService,
    private subscriptionService: SubscriptionService,
  ) { }

  @Query(() => [Site])
  async getSites(@CurrentUser() user: any): Promise<Site[]> {
    const sites = await this.sitesService.getUserSites(user.userId);
    return mapArrayToGraphQL(sites, mapSiteToGraphQL);
  }

  @Query(() => [Site], { name: 'adminGetAllSites' })
  @UseGuards(RolesGuard)
  @Roles('admin')
  async adminGetAllSites(): Promise<Site[]> {
    const sites = await this.sitesService.getAllSites();
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
  @UseGuards(SubscriptionGuard)
  @RequiresFeature('maxSites')
  async registerClientSite(
    @Args('input') input: CreateSiteInput,
    @CurrentUser() user: any,
  ): Promise<Site> {
    const site = await this.sitesService.createSite(user.userId, input.name, input.domain);
    await this.subscriptionService.incrementUsage(user.userId, 'sitesCreated');
    return mapSiteToGraphQL(site);
  }

  // Alias for createSite (for frontend compatibility)
  @Mutation(() => Site)
  @UseGuards(SubscriptionGuard)
  @RequiresFeature('maxSites')
  async createSite(
    @Args('input') input: CreateSiteInput,
    @CurrentUser() user: any,
  ): Promise<Site> {
    const site = await this.sitesService.createSite(user.userId, input.name, input.domain);
    await this.subscriptionService.incrementUsage(user.userId, 'sitesCreated');
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
    await this.subscriptionService.decrementUsage(user.userId, 'sitesCreated');
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
