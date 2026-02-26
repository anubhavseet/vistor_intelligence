import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { WebhooksService } from './webhooks.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Webhook } from './dto/webhook.type';
import { CreateWebhookInput } from './dto/create-webhook.input';
import { mapWebhookToGraphQL, mapArrayToGraphQL } from '../common/utils/mappers.util';
import { SubscriptionGuard } from '../subscription/guards/subscription.guard';
import { RequiresFeature } from '../subscription/decorators/requires-feature.decorator';
import { SubscriptionService } from '../subscription/subscription.service';

@Resolver(() => Webhook)
@UseGuards(JwtAuthGuard)
export class WebhooksResolver {
  constructor(
    private webhooksService: WebhooksService,
    private subscriptionService: SubscriptionService,
  ) { }

  @Query(() => [Webhook])
  async getWebhooks(
    @Args('siteId') siteId: string,
    @CurrentUser() user: any,
  ): Promise<Webhook[]> {
    const webhooks = await this.webhooksService.getWebhooks(siteId, user.userId);
    return mapArrayToGraphQL(webhooks, mapWebhookToGraphQL);
  }

  @Mutation(() => Webhook)
  @UseGuards(SubscriptionGuard)
  @RequiresFeature('maxWebhooks')
  async createWebhook(
    @Args('input') input: CreateWebhookInput,
    @CurrentUser() user: any,
  ): Promise<Webhook> {
    const webhook = await this.webhooksService.createWebhook(
      input.siteId,
      user.userId,
      input.url,
      input.eventType,
    );
    await this.subscriptionService.incrementUsage(user.userId, 'webhooksCreated');
    return mapWebhookToGraphQL(webhook);
  }

  @Mutation(() => Boolean)
  async deleteWebhook(
    @Args('webhookId') webhookId: string,
    @CurrentUser() user: any,
  ): Promise<boolean> {
    await this.webhooksService.deleteWebhook(webhookId, user.userId);
    await this.subscriptionService.decrementUsage(user.userId, 'webhooksCreated');
    return true;
  }
}
