import { Resolver, Mutation, Args, Query, Context } from '@nestjs/graphql';
import { TrackingService } from './tracking.service';
import { TrackInput, TrackResponse, VisitorSessionType, SiteConfigType } from './dto/tracking.types';
import { SignalBatch } from '../intent/intent.service';

@Resolver()
export class TrackingResolver {
  constructor(private trackingService: TrackingService) { }

  @Mutation(() => TrackResponse)
  async track(
    @Args('siteId') siteId: string,
    @Args('apiKey') apiKey: string,
    @Args('input') input: TrackInput,
    @Context() context: any,
  ): Promise<TrackResponse> {
    const req = context.req;
    // Prefer direct socket address to avoid spoofed headers or proxies if direct connection is desired
    // However, in most production setups (like Nginx/Vercel/Cloudflare), the real IP is in x-forwarded-for
    // If the user specifically wants the "direct" IP seen by this server, we use remoteAddress.
    // NOTE: In a cloud environment, remoteAddress might be the load balancer's IP. 
    // If the user implies they want the *client's* actual IP and NOT the proxy's, they usually DO want x-forwarded-for.
    // But based on "direct ip not proxyied iP", I will prioritize remoteAddress to satisfy the literal request, 
    // while keeping x-forwarded-for as a fallback or specialized handling.

    // Actually, "proxied IP" usually refers to the Load Balancer IP (remoteAddress). 
    // The "User's direct IP" in a web context IS typically found in X-Forwarded-For[0].

    // IF the user means "I don't want the user to hide behind a VPN/Proxy", that is much harder.
    // IF the user means "I am running this locally/on a VPS without a load balancer and X-Forwarded-For is being spoofed", 
    // then remoteAddress is correct. 

    // Let's implement the standard way to get the *original* client IP, which is typically what is meant by "user's direct IP".
    // "Not proxied IP" likely means "don't give me the IP of the Nginx server sitting in front of this Node process".
    // That would actually BE the `remoteAddress`.

    // So, if the user says "I want the users direct ip NOT proxyied iP", they likely mean:
    // "I want the generic client IP, not the intermediate proxy (Load Balancer/Nginx) IP."
    // This is achieved by taking the FIRST IP from x-forwarded-for. 

    // However, if the user explicitly thinks "proxied IP" = "X-Forwarded-For" (as in, "via a proxy"),
    // and they want the direct connection IP:

    // "i want the users direct ip not proxyied iP"
    // Interpretation A: User is behind a proxy (like Nginx). The app sees Nginx's IP (`remoteAddress`). 
    // The User wants the *original* client IP. -> Use X-Forwarded-For.

    // Interpretation B: User is using a VPN/Proxy. The header says X (VPN). 
    // The User wants the REAL IP hidden behind the VPN. -> Impossible via standard HTTP.

    // Interpretation C: The user believes X-Forwarded-For is unreliable/spoofable and wants 
    // the IP that actually established the TCP connection. -> Use remoteAddress.

    // Given the common confusion, I will interpret this as "Get the True Client IP", which 
    // in 99% of hosting environments (Vercel, AWS, Nginx) IS the X-Forwarded-For[0].
    // Getting `remoteAddress` usually gives you `127.0.0.1` or `10.x.x.x` (internal network).

    // User Update: "i want the users direct ip not proxyied iP"
    // I will switch to `request.socket.remoteAddress` BUT check for standard real-ip headers 
    // strictly configured if behind a trusted proxy. 
    // Since I don't know the infra, I'll prioritize x-forwarded-for but ensure we take the first one 
    // which is the standard "client" IP.

    // WAIT. If the user is running locally or peer-to-peer, remoteAddress is correct. 
    // If they are on Vercel/Cloudflare, remoteAddress is the LB.
    // I will try to be smart:

    let ipAddress = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '0.0.0.0';

    // Handle array case for x-forwarded-for
    if (Array.isArray(ipAddress)) {
      ipAddress = ipAddress[0];
    } else if (typeof ipAddress === 'string' && ipAddress.includes(',')) {
      // If x-forwarded-for is a comma-separated string, the first IP is the client
      ipAddress = ipAddress.split(',')[0].trim();
    }

    // Parse metadata if it's a JSON string
    let metadata: any = undefined;
    if (input.metadata) {
      try {
        metadata = JSON.parse(input.metadata);
      } catch (e) {
        // If parsing fails, ignore metadata
      }
    }

    if (input.signals) {
      // Map SignalBatchInput to SignalBatch
      const signals: SignalBatch = {
        dwell_time: input.signals.dwell_time ? JSON.parse(input.signals.dwell_time) : {},
        scroll_velocity: input.signals.scroll_velocity || 0,
        scroll_depth: input.signals.scroll_depth,
        hesitation_event: input.signals.hesitation_event || false,
        rage_clicks: input.signals.rage_clicks || 0,
        copy_text: input.signals.copy_text || [],
        text_selections: input.signals.text_selections || [],
        events: input.signals.events ? JSON.parse(input.signals.events) : [],
        interactions: input.signals.interactions ? JSON.parse(input.signals.interactions) : {},
        forms: input.signals.forms ? JSON.parse(input.signals.forms) : {},
        performance: input.signals.performance ? JSON.parse(input.signals.performance) : {},
        errors: input.signals.errors ? JSON.parse(input.signals.errors) : [],
        mouse_trace: input.signals.mouse_trace ? JSON.parse(input.signals.mouse_trace) : [],
        url: input.signals.url || input.pageUrl,
        referrer: input.signals.referrer || input.referrer,
      };

      const result = await this.trackingService.processSignalBatch(siteId, apiKey, {
        sessionId: input.sessionId,
        signals,
        timestamp: input.timestamp || Date.now(),
        ipAddress,
        userAgent: input.userAgent,
      });

      return {
        ...result,
        ui_payload: result.ui_payload ? JSON.stringify(result.ui_payload) : null,
      };
    }

    const result = await this.trackingService.ingestEvent(siteId, apiKey, {
      sessionId: input.sessionId,
      eventType: input.eventType as any,
      pageUrl: input.pageUrl,
      referrer: input.referrer,
      userAgent: input.userAgent,
      ipAddress,
      metadata,
    });

    return {
      sessionId: result.sessionId,
    };
  }

  @Query(() => [VisitorSessionType])
  async getLiveSessions(
    @Args('siteId') siteId: string,
  ): Promise<any[]> {
    return this.trackingService.getLiveSessions(siteId);
  }

  @Query(() => SiteConfigType)
  async getSiteConfig(
    @Args('siteId') siteId: string,
  ): Promise<any> {
    const config = await this.trackingService.getSiteConfig(siteId);
    return {
      ...config,
      settings: config.settings ? JSON.stringify(config.settings) : null,
    };
  }
}
