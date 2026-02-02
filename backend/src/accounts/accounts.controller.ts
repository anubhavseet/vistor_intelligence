import { Controller, Get, Param, Res } from '@nestjs/common';
import { Response } from 'express';
import { AnalyticsService } from '../analytics/analytics.service';

@Controller('accounts')
export class AccountsController {
  constructor(private analyticsService: AnalyticsService) {}

  @Get(':siteId/export')
  async exportCSV(@Param('siteId') siteId: string, @Res() res: Response) {
    try {
      const csv = await this.analyticsService.exportAccountsToCSV(siteId);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="accounts-${siteId}-${Date.now()}.csv"`);
      res.send(csv);
    } catch (error) {
      res.status(500).json({ error: 'Failed to export accounts' });
    }
  }
}
