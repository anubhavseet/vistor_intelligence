import { Resolver, Query, Args } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { AccountsService } from './accounts.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Account } from './dto/account.type';
import { VisitorSession } from '../analytics/dto/visitor-session.type';
import { mapAccountToGraphQL, mapVisitorSessionToGraphQL, mapArrayToGraphQL } from '../common/utils/mappers.util';

@Resolver(() => Account)
@UseGuards(JwtAuthGuard)
export class AccountsResolver {
  constructor(private accountsService: AccountsService) {}

  @Query(() => Account)
  async getAccount(@Args('accountId') accountId: string): Promise<Account> {
    const account = await this.accountsService.getAccount(accountId);
    return mapAccountToGraphQL(account);
  }

  @Query(() => [Account])
  async getAccountIntentScores(
    @Args('siteId') siteId: string,
    @Args('minScore', { nullable: true, defaultValue: 0 }) minScore: number,
    @Args('search', { nullable: true }) search?: string,
    @Args('category', { nullable: true }) category?: string,
  ): Promise<Account[]> {
    let accounts;
    if (minScore > 0) {
      accounts = await this.accountsService.getHighIntentAccounts(siteId, minScore);
    } else {
      accounts = await this.accountsService.getSiteAccounts(siteId, {
        search,
        minIntentScore: minScore,
        category,
      });
    }
    return mapArrayToGraphQL(accounts, mapAccountToGraphQL);
  }

  @Query(() => [Account])
  async getTopHighIntentAccounts(
    @Args('siteId') siteId: string,
    @Args('limit', { nullable: true, defaultValue: 10 }) limit: number,
  ): Promise<Account[]> {
    const accounts = await this.accountsService.getHighIntentAccounts(siteId, 70);
    return mapArrayToGraphQL(accounts.slice(0, limit), mapAccountToGraphQL);
  }

  @Query(() => [VisitorSession])
  async getAccountTimeline(@Args('accountId') accountId: string): Promise<VisitorSession[]> {
    const sessions = await this.accountsService.getAccountTimeline(accountId);
    return mapArrayToGraphQL(sessions, mapVisitorSessionToGraphQL);
  }
}
