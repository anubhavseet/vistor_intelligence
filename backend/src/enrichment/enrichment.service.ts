import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

/**
 * Enrichment Service
 * 
 * Resolves IP addresses to:
 * - Geographic location (country, region, city, coordinates)
 * - Organization/company (if corporate IP)
 * - Flags (VPN, mobile, data center, proxy)
 * 
 * Designed to fail gracefully - never blocks the ingestion pipeline.
 * Results are cached to avoid rate limits.
 */
@Injectable()
export class EnrichmentService {
  private readonly logger = new Logger(EnrichmentService.name);
  private cache = new Map<string, any>(); // Simple in-memory cache (use Redis in production)

  constructor(
    private configService: ConfigService,
    private httpService: HttpService,
  ) {}

  /**
   * Enrich IP address with geo and organization data
   * Returns null if enrichment fails (non-blocking)
   */
  async enrichIP(ip: string): Promise<{
    geo?: {
      country?: string;
      region?: string;
      city?: string;
      lat?: number;
      lng?: number;
      timezone?: string;
    };
    organization?: string;
    flags?: {
      isVPN?: boolean;
      isMobile?: boolean;
      isDataCenter?: boolean;
      isProxy?: boolean;
    };
  } | null> {
    try {
      // Check cache first
      const cached = this.cache.get(ip);
      if (cached) {
        return cached;
      }

      // Use free IP geolocation service (ip-api.com)
      // In production, use MaxMind GeoIP2 or similar
      const response = await firstValueFrom(
        this.httpService.get(`http://ip-api.com/json/${ip}?fields=status,message,country,regionName,city,lat,lon,timezone,org,as,mobile,proxy,hosting`, {
          timeout: 3000, // 3 second timeout
        }),
      );

      if (response.data.status === 'fail') {
        this.logger.warn(`GeoIP lookup failed for ${ip}: ${response.data.message}`);
        return null;
      }

      const result = {
        geo: {
          country: response.data.country,
          region: response.data.regionName,
          city: response.data.city,
          lat: response.data.lat,
          lng: response.data.lon,
          timezone: response.data.timezone,
        },
        organization: response.data.org,
        flags: {
          isVPN: response.data.proxy === true,
          isMobile: response.data.mobile === true,
          isDataCenter: response.data.hosting === true,
          isProxy: response.data.proxy === true,
        },
      };

      // Cache for 24 hours
      this.cache.set(ip, result);
      setTimeout(() => this.cache.delete(ip), 24 * 60 * 60 * 1000);

      return result;
    } catch (error) {
      // Fail gracefully - never throw
      this.logger.error(`Enrichment error for IP ${ip}:`, error.message);
      return null;
    }
  }

  /**
   * Extract domain from organization string
   */
  extractDomain(organization?: string): string | undefined {
    if (!organization) return undefined;
    
    // Try to extract domain from org string like "AS12345 Company Name"
    const match = organization.match(/([a-zA-Z0-9-]+\.[a-zA-Z]{2,})/);
    return match ? match[1] : undefined;
  }
}
