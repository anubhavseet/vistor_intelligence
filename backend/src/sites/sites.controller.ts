import { Controller, Get, Param, Res, NotFoundException } from '@nestjs/common';
import { SitesService } from './sites.service';
import { HttpService } from '@nestjs/axios';
import { Response } from 'express';
import { firstValueFrom } from 'rxjs';

@Controller('sites')
export class SitesController {
    constructor(
        private readonly sitesService: SitesService,
        private readonly httpService: HttpService,
    ) { }

    @Get('proxy/:siteId')
    async proxySite(@Param('siteId') siteId: string, @Res() res: Response) {
        try {
            // 1. Get Site
            const site = await this.sitesService.getSiteBySiteId(siteId);
            if (!site) throw new NotFoundException('Site not found');

            if (!site.domain) {
                return res.send(
                    `<html><body><h1>Error: No domain configured for this site.</h1></body></html>`,
                );
            }

            // Ensure Protocol
            let url = site.domain;
            if (!url.startsWith('http')) {
                url = 'https://' + url;
            }

            // 2. Fetch Content
            // We ignore SSL errors because some dev sites might have self-signed certs
            // though typically this is for external sites.
            const response = await firstValueFrom(
                this.httpService.get(url, {
                    headers: {
                        'User-Agent':
                            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36 VisitorIntelligence/1.0',
                    },
                    responseType: 'text', // Ensure we get the raw HTML string
                }),
            );

            let html = response.data;
            if (typeof html !== 'string') {
                html = JSON.stringify(html); // Fallback if for some reason it is parsed as JSON
            }

            // Resolve final URL in case of redirects to ensure correct base path
            const finalUrl = response.request?.res?.responseUrl || url;

            // 3. Inject Tracker & Base Tag
            const trackerScript = `
      <!-- Visitor Intelligence Dev Proxy Injection -->
      <script>window.VI_DEV_MODE = true;</script>
      <script src="http://localhost:3000/tracker.js" data-site-id="${siteId}"></script>
      <script>
        console.log('Visitor Intelligence Proxy: Tracker injected for site ${siteId}');
      </script>
      <!-- End Injection -->
      `;

            // Remove existing CSP
            html = html.replace(/<meta\s+http-equiv=["']Content-Security-Policy["'][^>]*>/gi, '');
            html = html.replace(/<meta\s+name=["']Content-Security-Policy["'][^>]*>/gi, '');

            // Remove existing Base tag
            html = html.replace(/<base[^>]*>/gi, '');

            // Convert protocol-relative URLs to HTTPS to avoid HTTP blocking
            html = html.replace(/src="\/\//g, 'src="https://');
            html = html.replace(/href="\/\//g, 'href="https://');

            // Inject Base Tag and Header Meta
            const baseUrl = finalUrl.endsWith('/') ? finalUrl : finalUrl + '/';
            const baseTag = `<base href="${baseUrl}" />`;
            const metaTags = `<meta name="referrer" content="no-referrer" />\n${baseTag}`;

            if (html.match(/<head>/i)) {
                html = html.replace(/<head>/i, `<head>\n${metaTags}`);
            } else {
                html = `<head>\n${metaTags}\n</head>\n${html}`;
            }

            // Inject Tracker before closing head
            if (html.includes('</head>')) {
                html = html.replace('</head>', `${trackerScript}\n</head>`);
            } else if (html.includes('</body>')) {
                html = html.replace('</body>', `${trackerScript}\n</body>`);
            } else {
                html += trackerScript;
            }

            // Return
            res.setHeader('Content-Type', 'text/html');
            res.send(html);
        } catch (error) {
            console.error('Proxy Error:', error);
            res
                .status(500)
                .send(
                    `<html><body><h1>Error fetching site</h1><p>${error.message}</p></body></html>`,
                );
        }
    }
}
