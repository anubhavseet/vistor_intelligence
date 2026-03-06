/**
 * Visitor Intelligence Tracker SDK - WebSocket Edition
 * 
 * Full implementation of behavioral tracking (dwell time, scroll velocity, rage clicks, etc.)
 * communicating via GraphQL WebSockets for real-time intent analysis.
 * 
 * @author Visitor Intelligence Platform
 * @version 2.1.0
 */

(function () {
    'use strict';

    // --- Configuration Constants ---
    const CONFIG = {
        batchInterval: 5000,
        idleThreshold: 1000,
        maxRetries: 3,
        startUpDelay: 1000,
        isUiInjectionEnabled: true,
        maxInjectionsPerIntent: {
            'low_intent': 3,
            'medium_intent': 3,
            'high_intent': 3,
            'hesitation': 2,
            'bounce_risk': 1
        }
    };

    // --- GraphQL WebSocket Client ---
    const createGraphQLWSClient = (url) => {
        let ws = null;
        let connectionAttempts = 0;
        const maxReconnectAttempts = 10;
        const subscriptions = new Map();
        let nextId = 0;
        let pendingMessages = [];
        let acknowledged = false;

        const connect = () => {
            if (connectionAttempts >= maxReconnectAttempts) {
                console.error('[Tracker] Max reconnection attempts reached');
                return;
            }

            connectionAttempts++;
            console.log(`[Tracker] Connecting to ${url} (Attempt ${connectionAttempts})`);
            ws = new WebSocket(url, 'graphql-transport-ws');

            ws.onopen = () => {
                console.log('[Tracker] ✅ Connected to GraphQL WebSocket');
                connectionAttempts = 0;
                console.log('[Tracker] Sending connection_init...');
                send({ type: 'connection_init' });
            };

            ws.onmessage = (event) => {
                try {
                    const message = JSON.parse(event.data);
                    console.log(message);
                    console.log('[Tracker] 📩 Received:', message.type, message.id || '');
                    handleMessage(message);
                } catch (e) {
                    console.error('[Tracker] WS Message Parse Error', e);
                }
            };

            ws.onerror = (error) => {
                console.warn('[Tracker] WebSocket error', error);
            };

            ws.onclose = (event) => {
                console.log(`[Tracker] ❌ Disconnected (Code: ${event.code}), reconnecting...`);
                acknowledged = false;
                setTimeout(connect, 2000);
            };
        };

        const send = (message) => {
            const isOpen = ws && ws.readyState === WebSocket.OPEN;
            const isInit = message.type === 'connection_init';

            if (isOpen && (acknowledged || isInit)) {
                console.log('[Tracker] 📤 Sending:', message.type, message.id || '');
                ws.send(JSON.stringify(message));
            } else {
                console.log('[Tracker] ⏳ Queuing message:', message.type, `(Open: ${isOpen}, Ack: ${acknowledged})`);
                pendingMessages.push(message);
            }
        };

        const handleMessage = (message) => {
            const { type, id, payload } = message;

            if (type === 'connection_ack') {
                console.log('[Tracker] ✅ Connection Acknowledged! Flushing queue...');
                acknowledged = true;
                // Resend pending
                while (pendingMessages.length > 0) {
                    const msg = pendingMessages.shift();
                    console.log('[Tracker] 📤 Resending queued:', msg.type, msg.id || '');
                    send(msg);
                }
                // Resubscribe
                subscriptions.forEach((sub, subId) => {
                    console.log('[Tracker] 🔄 Resubscribing:', subId);
                    send({ id: subId, type: 'subscribe', payload: sub.payload });
                });
            } else if (type === 'next' && id) {
                const sub = subscriptions.get(id);
                if (sub && sub.onData) sub.onData(payload.data);
            } else if (type === 'error' && id) {
                console.error('[Tracker] ❌ GraphQL Error:', id, payload);
                const sub = subscriptions.get(id);
                if (sub && sub.onError) sub.onError(payload);
            } else if (type === 'complete' && id) {
                console.log('[Tracker] ☑️ Completed:', id);
                subscriptions.delete(id);
            }
        };

        const subscribe = (query, variables, onData, onError) => {
            const id = String(nextId++);
            subscriptions.set(id, { payload: { query, variables }, onData, onError });
            send({ id, type: 'subscribe', payload: { query, variables } });
            return () => {
                send({ id, type: 'complete' });
                subscriptions.delete(id);
            };
        };

        const execute = async (query, variables) => {
            return new Promise((resolve, reject) => {
                const id = String(nextId++);
                const timeout = setTimeout(() => {
                    subscriptions.delete(id);
                    reject(new Error('GraphQL timeout'));
                }, 5000);

                subscriptions.set(id, {
                    payload: { query, variables },
                    onData: (data) => {
                        clearTimeout(timeout);
                        subscriptions.delete(id);
                        resolve(data);
                    },
                    onError: (errors) => {
                        clearTimeout(timeout);
                        subscriptions.delete(id);
                        reject(errors);
                    }
                });

                send({ id, type: 'subscribe', payload: { query, variables } });
            });
        };

        connect();
        return { subscribe, execute, send };
    };

    // --- Main Tracker Class ---
    class VisitorIntelligenceTracker {
        constructor(config) {
            this.siteId = config.siteId;
            this.apiUrl = config.apiUrl || 'https://vistor-intelligence.vercel.app';

            // Normalize WebSocket URL
            let wsUrl = this.apiUrl.replace('https://', 'wss://').replace('http://', 'ws://');
            if (wsUrl.endsWith('/graphql')) {
                // Already correct
            } else if (wsUrl.endsWith('/')) {
                wsUrl += 'graphql';
            } else {
                wsUrl += '/graphql';
            }

            this.wsUrl = wsUrl;
            this.sessionId = this.getStorage('vi_session_id') || this.generateSessionId();
            this.userId = this.getStorage('vi_user_id') || `user_${Math.random().toString(36).substr(2, 9)}`;

            this.setStorage('vi_session_id', this.sessionId);
            this.setStorage('vi_user_id', this.userId);

            this.client = createGraphQLWSClient(this.wsUrl);
            this.isTrackingActive = false;

            // Buffer for offline events
            this.eventBuffer = [];
            this.isOnline = navigator.onLine;

            // Signal Accumulator
            this.signals = this.resetSignals();

            // Internal State for calculations
            this.lastScrollY = window.scrollY;
            this.lastScrollTime = Date.now();
            this.clickCounts = {};
            this.ctaHoverTimer = null;
            this.activeDwellTimers = {};
            this.accumulatedDwell = {};
            this.formTimers = {};
            this.injectionCounts = {};
            this.activeInjections = new Map(); // Map<injectionId, hostElement>
            this.lastInjectionId = null;
            this.injectionHistory = [];
            this.MAX_SIMULTANEOUS_INJECTIONS = 3;

            // Client-side intelligence state
            // Restore accumulated score from sessionStorage so it survives page navigations
            // within the same tab (sessionStorage is tab-scoped and clears when tab closes).
            const _storedScore = parseFloat(sessionStorage.getItem('vi_intent_score_' + this.siteId) || '40');
            this._currentIntentScore = isNaN(_storedScore) ? 40 : Math.min(Math.max(_storedScore, 0), 100);
            this.intentPayloads = null;      // Prefetched UI payloads: { intent: payload }
            this.intentSelectorMap = null;   // Crawl-derived semantic element map
            this._lastInjectedIntent = null; // Prevents repeat injection of same intent

            // Initialize
            this.bootstrap();
        }

        resetSignals() {
            return {
                dwell_time: {},
                scroll_velocity: 0,
                scroll_depth: 0,
                hesitation_event: false,
                rage_clicks: 0,
                copy_text: [],
                text_selections: [],
                dead_clicks: [],
                events: [],
                interactions: {},
                url: window.location.href,
                referrer: document.referrer,
                forms: {},
                performance: {},
                errors: [],
                mouse_trace: [],
                geolocation: null
            };
        }

        getStorage(key) {
            try { return localStorage.getItem(key); } catch (e) { return null; }
        }

        setStorage(key, val) {
            try { localStorage.setItem(key, val); } catch (e) { }
        }

        generateSessionId() {
            return 'sess_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        }

        async bootstrap() {
            console.log(`[Tracker] Initializing for Site: ${this.siteId}`);
            try {
                // Fetch Config via HTTP (REST/GraphQL over HTTP)
                const query = `
                    query GetSiteConfig($siteId: String!) {
                        getSiteConfig(siteId: $siteId) {
                            settings
                            allowedDomains
                            isActive
                        }
                    }
                `;

                // Determine HTTP Endpoint
                let httpUrl = this.apiUrl;
                if (!httpUrl.endsWith('/graphql')) {
                    httpUrl = httpUrl.endsWith('/') ? httpUrl + 'graphql' : httpUrl + '/graphql';
                }

                // Allow 1s delay for consistency
                setTimeout(async () => {
                    try {
                        const response = await fetch(httpUrl, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'Accept': 'application/json',
                            },
                            body: JSON.stringify({
                                query,
                                variables: { siteId: this.siteId }
                            })
                        });

                        const result = await response.json();
                        const config = result.data?.getSiteConfig;

                        if (!config) {
                            console.warn('[Tracker] Invalid Site ID');
                            return;
                        }

                        if (!config.isActive) {
                            console.log('[Tracker] Site is disabled');
                            return;
                        }

                        // Domain Check
                        if (config.allowedDomains && config.allowedDomains.length > 0) {
                            const hostname = window.location.hostname;
                            const isAllowed = config.allowedDomains.some(d => hostname.includes(d));
                            if (!isAllowed && !hostname.includes('localhost')) {
                                console.warn(`[Tracker] Domain ${hostname} not allowed`);
                                return;
                            }
                        }

                        // Parse Settings
                        if (config.settings) {
                            try {
                                const settings = JSON.parse(config.settings);
                                if (settings.trackingStartDelay) CONFIG.startUpDelay = settings.trackingStartDelay;
                                if (typeof settings.isUiInjectionEnabled !== 'undefined') CONFIG.isUiInjectionEnabled = settings.isUiInjectionEnabled;
                                if (settings.maxInjectionsPerIntent && Array.isArray(settings.maxInjectionsPerIntent)) {
                                    // Convert array to object map
                                    const limitMap = {};
                                    settings.maxInjectionsPerIntent.forEach(item => {
                                        limitMap[item.intent] = item.limit;
                                    });
                                    CONFIG.maxInjectionsPerIntent = limitMap;
                                } else if (typeof settings.maxInjectionsPerIntent === 'number') {
                                    // Fallback for legacy number format
                                    CONFIG.maxInjectionsPerIntent = { 'general': settings.maxInjectionsPerIntent };
                                }
                            } catch (e) { }
                        }

                        // Prefetch UI payloads + intent selectors in parallel (non-blocking)
                        await Promise.all([
                            this._prefetchIntentPayloads(),
                            this._prefetchIntentSelectors(),
                        ]);

                        this.startTracking();

                    } catch (e) {
                        console.warn('[Tracker] Config Fetch Failed - Starting Anyway', e);
                        this.startTracking();
                    }
                }, 1000);

            } catch (e) {
                console.error('[Tracker] Bootstrap Error', e);
            }
        }

        getMetadata() {
            return {
                screen: {
                    width: window.screen.width,
                    height: window.screen.height,
                    colorDepth: window.screen.colorDepth,
                    orientation: (screen.orientation || {}).type
                },
                language: navigator.language,
                timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                platform: navigator.platform,
                connection: navigator.connection ? navigator.connection.effectiveType : 'unknown',
                hardwareConcurrency: navigator.hardwareConcurrency || 'unknown',
                deviceMemory: navigator.deviceMemory || 'unknown',
                renderer: (function () {
                    try {
                        const canvas = document.createElement('canvas');
                        const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
                        if (gl) {
                            const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
                            return debugInfo ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) : 'unknown';
                        }
                        return 'unknown';
                    } catch (e) { return 'unknown'; }
                })()
            };
        }

        async bootstrapSession() {
            try {
                // Collect Metadata
                const metadata = this.getMetadata();

                const input = {
                    sessionId: this.sessionId,
                    eventType: 'pageview',
                    pageUrl: window.location.href,
                    referrer: document.referrer,
                    userAgent: navigator.userAgent,
                    timestamp: Date.now(),
                    metadata: JSON.stringify(metadata)
                };

                const mutation = `
                    mutation Track($siteId: String!, $apiKey: String!, $input: TrackInput!) {
                        track(siteId: $siteId, apiKey: $apiKey, input: $input) {
                            sessionId
                            ui_payload
                        }
                    }
                `;

                // Determine HTTP Endpoint
                let httpUrl = this.apiUrl;
                if (!httpUrl.endsWith('/graphql')) {
                    httpUrl = httpUrl.endsWith('/') ? httpUrl + 'graphql' : httpUrl + '/graphql';
                }

                await fetch(httpUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        query: mutation,
                        variables: { siteId: this.siteId, apiKey: 'public', input }
                    })
                });
                console.log('[Tracker] Session bootstrapped via HTTP');
            } catch (e) {
                console.warn('[Tracker] Session bootstrap failed (will fallback to WS)', e);
            }
        }

        // ---- Client-Side Prefetch: UI Payloads + Intent Selectors ----

        /**
         * Fetches all pre-generated intent UI payloads into browser memory.
         * After this, when an intent is detected locally, the payload is injected
         * instantly without any WS round-trip.
         */
        async _prefetchIntentPayloads() {
            try {
                const query = `
                    query GetIntentPayloads($siteId: String!) {
                        getIntentPayloads(siteId: $siteId) {
                            intent
                            type
                            html
                            css
                            js
                            targetSelector
                            injectionPosition
                            injectionMode
                        }
                    }
                `;
                let httpUrl = this.apiUrl;
                if (!httpUrl.endsWith('/graphql')) httpUrl = httpUrl.endsWith('/') ? httpUrl + 'graphql' : httpUrl + '/graphql';

                const response = await fetch(httpUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ query, variables: { siteId: this.siteId } })
                });
                const result = await response.json();
                const payloads = result.data?.getIntentPayloads;

                if (payloads && payloads.length > 0) {
                    this.intentPayloads = {};
                    payloads.forEach(p => {
                        this.intentPayloads[p.intent] = p;
                    });
                    console.log(`[Tracker] ✅ Prefetched ${payloads.length} intent UI payloads:`, Object.keys(this.intentPayloads));
                } else {
                    console.log('[Tracker] No intent payloads configured for this site.');
                    this.intentPayloads = {};
                }
            } catch (e) {
                console.warn('[Tracker] Failed to prefetch intent payloads', e);
                this.intentPayloads = {};
            }
        }

        /**
         * Fetches the crawl-derived Intent Selector Map into browser memory.
         * This map tells the tracker which DOM selectors correspond to which
         * semantic content categories (pricing, features, cta, etc.) on THIS site.
         */
        async _prefetchIntentSelectors() {
            try {
                const query = `
                    query GetIntentSelectors($siteId: String!) {
                        getIntentSelectors(siteId: $siteId) {
                            category
                            selectors
                            confidence
                        }
                    }
                `;
                let httpUrl = this.apiUrl;
                if (!httpUrl.endsWith('/graphql')) httpUrl = httpUrl.endsWith('/') ? httpUrl + 'graphql' : httpUrl + '/graphql';

                const response = await fetch(httpUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ query, variables: { siteId: this.siteId } })
                });
                const result = await response.json();
                const entries = result.data?.getIntentSelectors;

                if (entries && entries.length > 0) {
                    this.intentSelectorMap = {};
                    entries.forEach(e => {
                        this.intentSelectorMap[e.category] = e.selectors;
                    });
                    console.log('[Tracker] ✅ Prefetched intent selector map:', Object.keys(this.intentSelectorMap));
                } else {
                    console.log('[Tracker] No intent selector map available (crawl may not have run yet).');
                    this.intentSelectorMap = {}; // Initialize as empty object instead of null
                }
            } catch (e) {
                console.warn('[Tracker] Failed to prefetch intent selectors', e);
                this.intentSelectorMap = {}; // Initialize as empty object instead of null
            }
        }

        async startTracking() {
            if (this.isTrackingActive) return;

            // 1. Bootstrap Session via HTTP (for rich context)
            await this.bootstrapSession();
            console.log('[Tracker] Session bootstrapped');
            this.setupSubscriptions();

            // 2. Start Tracking (with delay)
            setTimeout(() => {
                this.isTrackingActive = true;
                this.setupEventListeners();
                this.initObserver(); // Dwell time
                this.initPerformanceObserver();
                this.fetchGeolocation();

                // Start batch interval
                setInterval(() => this.sendBatch(), CONFIG.batchInterval);

                console.log('[Tracker] Tracking Active');

                // Send initial pageview immediately
                this.trackEvent('pageview', {
                    url: window.location.href,
                    title: document.title,
                    referrer: document.referrer
                });

                // Restore any persisted inline injections from previous sessions
                // Use 1200ms delay to let the page DOM settle before injecting
                setTimeout(() => this._restoreInlineInjections(), 1200);

            }, CONFIG.startUpDelay);

            // Online/Offline
            window.addEventListener('online', () => { this.isOnline = true; this.flushBuffer(); });
            window.addEventListener('offline', () => { this.isOnline = false; });
        }

        // ---- Inline Injection Persistence (localStorage) ----

        _getPersistedInjectionsKey() {
            return `vi_persisted_inline_${this.siteId}`;
        }

        _persistInlineInjection(intent, uniqueId, targetSelector, position, htmlPayload, scopedCss, jsPayload) {
            try {
                const key = this._getPersistedInjectionsKey();
                console.log(`[Tracker] [Persist] Writing inline injection to localStorage. Key: ${key}, intent: ${intent}, uniqueId: ${uniqueId}`);

                const raw = localStorage.getItem(key);
                let entries = [];
                if (raw) {
                    try { entries = JSON.parse(raw); } catch (_) { entries = []; }
                }

                const currentFingerprint = `inline_inject|${targetSelector}|${position}|${(htmlPayload || '').substring(0, 150)}`;

                // Remove any prior entry for same uniqueId OR same fingerprint (dedup) and expired entries
                const TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
                entries = entries.filter(e => {
                    const age = Date.now() - e.timestamp;
                    if (age >= TTL_MS) return false;
                    if (e.uniqueId === uniqueId) return false;
                    const fingerprint = `inline_inject|${e.targetSelector}|${e.position}|${(e.htmlPayload || '').substring(0, 150)}`;
                    if (fingerprint === currentFingerprint) return false;
                    return true;
                });

                entries.push({
                    intent,
                    uniqueId,
                    targetSelector,
                    position,
                    htmlPayload,
                    scopedCss,
                    jsPayload: jsPayload || '',
                    timestamp: Date.now(),
                    path: window.location.pathname,
                });

                localStorage.setItem(key, JSON.stringify(entries));
                console.log(`[Tracker] [Persist] ✅ Successfully persisted inline injection. localStorage key: "${key}", total entries: ${entries.length}`);
            } catch (e) {
                console.error('[Tracker] [Persist] ❌ FAILED to persist inline injection. localStorage may be blocked or full.', e);
            }
        }

        _clearPersistedInjection(uniqueId) {
            try {
                const key = this._getPersistedInjectionsKey();
                const raw = localStorage.getItem(key);
                if (!raw) return;
                let entries = JSON.parse(raw);
                entries = entries.filter(e => e.uniqueId !== uniqueId);
                localStorage.setItem(key, JSON.stringify(entries));
                console.log(`[Tracker] Cleared persisted injection for uniqueId: ${uniqueId}`);
            } catch (e) { }
        }

        _restoreInlineInjections() {
            try {
                const key = this._getPersistedInjectionsKey();
                console.log(`[Tracker] [Restore] Checking localStorage for persisted injections. Key: "${key}"`);

                const raw = localStorage.getItem(key);
                if (!raw) {
                    console.log('[Tracker] [Restore] No persisted injections found in localStorage.');
                    return;
                }

                const TTL_MS = 24 * 60 * 60 * 1000;
                let allEntries;
                try {
                    allEntries = JSON.parse(raw);
                } catch (_) {
                    console.warn('[Tracker] [Restore] Failed to parse localStorage entry, clearing corrupted data.');
                    localStorage.removeItem(key);
                    return;
                }

                console.log(`[Tracker] [Restore] Found ${allEntries.length} total entries in storage.`);

                // Normalize current path — strip trailing slash for comparison
                const currentPath = window.location.pathname.replace(/\/$/, '') || '/';

                // Restore entries within TTL whose stored path matches current path
                // (normalized: ignore trailing slashes, allow sub-path prefix match)
                const validEntries = allEntries.filter(e => {
                    const age = Date.now() - e.timestamp;
                    if (age >= TTL_MS) {
                        console.log(`[Tracker] [Restore] Skipping entry (EXPIRED, ${Math.round(age / 3600000)}h old): intent=${e.intent}`);
                        return false;
                    }
                    if (!e.path) return true; // legacy entry with no path → restore on any page
                    const storedPath = e.path.replace(/\/$/, '') || '/';
                    const pathMatch = storedPath === currentPath || currentPath.startsWith(storedPath + '/');
                    if (!pathMatch) {
                        console.log(`[Tracker] [Restore] Skipping entry (PATH MISMATCH, stored: "${storedPath}", current: "${currentPath}"): intent=${e.intent}`);
                    } else {
                        console.log(`[Tracker] [Restore] ✅ Entry eligible for restore: intent=${e.intent}, uniqueId=${e.uniqueId}`);
                    }
                    return pathMatch;
                });

                if (validEntries.length === 0) {
                    console.log('[Tracker] [Restore] No entries match current path/TTL. Nothing to restore.');
                    // Clean up expired entries from storage
                    const fresh = allEntries.filter(e => (Date.now() - e.timestamp) < TTL_MS);
                    if (fresh.length < allEntries.length) localStorage.setItem(key, JSON.stringify(fresh));
                    return;
                }

                console.log(`[Tracker] [Restore] Restoring ${validEntries.length} inline injection(s) from localStorage`);

                validEntries.forEach((entry, i) => {
                    // Stagger restores to avoid race conditions with page paint
                    setTimeout(() => {
                        // Content fingerprint check: prevent identical content restore
                        const fingerprint = `inline_inject|${entry.targetSelector}|${entry.position}|${(entry.htmlPayload || '').substring(0, 150)}`;
                        for (const [id, activeEntry] of this.activeInjections.entries()) {
                            const existingFingerprint = (activeEntry instanceof HTMLElement) ? activeEntry.getAttribute('data-vi-fingerprint') : activeEntry.fingerprint;
                            if (existingFingerprint === fingerprint) {
                                console.log(`[Tracker] [Restore] Skipping restore for ${entry.uniqueId} — identical content already in DOM.`);
                                return;
                            }
                        }

                        // Bug fix: check BOTH the original ID and the restore-suffixed ID
                        // to prevent duplicate injection when server also pushes the same payload
                        if (document.getElementById(`vi-ai-${entry.uniqueId}`) ||
                            document.getElementById(`vi-ai-${entry.uniqueId}_r`) ||
                            document.querySelector(`[data-vi-original-id="${entry.uniqueId}"]`)) {
                            console.log(`[Tracker] [Restore] Skipping restore for ${entry.uniqueId} — already in DOM.`);
                            return;
                        }

                        console.log(`[Tracker] [Restore] Injecting restored entry: intent=${entry.intent}, selector=${entry.targetSelector}`);
                        this._handleInlineInject(
                            entry.uniqueId + '_r', // suffix _r marks it as a restore
                            entry.targetSelector,
                            entry.position,
                            entry.htmlPayload,
                            entry.scopedCss,
                            entry.jsPayload,
                            5, // default priority for restored
                            entry.intent, // pass intent for clear-on-dismiss
                            entry.uniqueId // pass original ID for guard attribute
                        );
                    }, i * 200);
                });

                // Clean up expired entries from storage
                const fresh = allEntries.filter(e => (Date.now() - e.timestamp) < TTL_MS);
                localStorage.setItem(key, JSON.stringify(fresh));
            } catch (e) {
                console.warn('[Tracker] Could not restore inline injections', e);
            }
        }

        // --- Subscriptions ---
        setupSubscriptions() {
            // UI Injection Subscription
            const uiQuery = `
                subscription UIInjection($sessionId: String!) {
                    uiInjection(sessionId: $sessionId) {
                        sessionId
                        payload
                        timestamp
                    }
                }
            `;
            this.client.subscribe(uiQuery, { sessionId: this.sessionId }, (data) => {
                if (data && data.uiInjection && data.uiInjection.payload) {
                    try {
                        const payload = JSON.parse(data.uiInjection.payload);
                        this.handleUIInjection(payload);
                    } catch (e) {
                        console.error('[Tracker] Failed to parse UI payload', e);
                    }
                }
            });

            // Intent Update (Optional Debug)
            if (window.VI_DEBUG) {
                const intentQuery = `
                    subscription IntentUpdate($sessionId: String!) {
                        intentUpdate(sessionId: $sessionId) {
                            score
                            category
                        }
                    }
                `;
                this.client.subscribe(intentQuery, { sessionId: this.sessionId }, (data) => {
                    if (data && data.intentUpdate) console.log('[Tracker] Intent:', data.intentUpdate);
                });
            }
        }

        // --- Tracking Logic ---

        trackEvent(eventType, data) {
            const payloadData = {
                ...data,
                userAgent: navigator.userAgent
            };

            // Attach rich metadata for session initialization events
            if (eventType === 'pageview' || eventType === 'signals_batch') {
                payloadData.metadata = this.getMetadata();
            }

            const event = {
                siteId: this.siteId,
                sessionId: this.sessionId,
                eventType,
                data: JSON.stringify(payloadData),
                timestamp: Date.now()
            };

            // Ensure data is always a JSON string as per GraphQL schema
            // event.data is already stringified above.

            if (this.isOnline) {
                this.sendEventToBackend(event).catch(err => {
                    console.error('[Tracker] Send failed', err);
                    this.eventBuffer.push(event);
                });
            } else {
                this.eventBuffer.push(event);
            }
        }

        async sendEventToBackend(event) {
            const mutation = `
                mutation TrackEvent($input: TrackingEventInput!) {
                    trackEvent(input: $input) {
                        success
                        sessionId
                        intentScore
                        uiPayload
                    }
                }
            `;
            const result = await this.client.execute(mutation, { input: event });
            // Handle UI injection from mutation response (in addition to subscription)
            if (result && result.trackEvent && result.trackEvent.uiPayload) {
                try {
                    const payload = JSON.parse(result.trackEvent.uiPayload);
                    this.handleUIInjection(payload);
                } catch (e) {
                    console.error('[Tracker] Failed to parse UI payload from response', e);
                }
            }
            return result;
        }

        async flushBuffer() {
            while (this.eventBuffer.length > 0 && this.isOnline) {
                const event = this.eventBuffer.shift();
                await this.sendEventToBackend(event).catch(() => this.eventBuffer.unshift(event));
            }
        }

        // --- Signal Collection ---

        sendBatch() {
            if (!this.isTrackingActive) return;

            // 1. Finalize Dwell Times
            const now = Date.now();
            for (const id in this.activeDwellTimers) {
                const duration = now - this.activeDwellTimers[id];
                this.accumulatedDwell[id] = (this.accumulatedDwell[id] || 0) + duration;
                this.activeDwellTimers[id] = now;
            }

            // Convert to seconds for sending
            for (const id in this.accumulatedDwell) {
                this.signals.dwell_time[id] = parseFloat((this.accumulatedDwell[id] / 1000).toFixed(1));
            }

            // 2. Refresh URL
            this.signals.url = window.location.href;

            // 3. Check if any data to send
            const hasData = Object.keys(this.signals.dwell_time).length > 0 ||
                this.signals.scroll_velocity > 0 ||
                this.signals.events.length > 0 ||
                this.signals.rage_clicks > 0 ||
                this.signals.copy_text.length > 0;

            if (!hasData) return;

            // 4. LOCAL SCORING + LOCAL UI INJECTION
            const batchData = JSON.parse(JSON.stringify(this.signals));
            const localScore = this._scoreSignalsLocally(batchData);
            const detectedIntent = this._detectIntent(batchData, localScore);

            console.log(`[Tracker] Local score: ${localScore}, detected intent: ${detectedIntent || 'none'}`);

            // Inject from prefetched payloads if intent detected
            if (detectedIntent) {
                this._maybeInjectLocal(detectedIntent);
            }

            // 5. Send Batch to backend (fire-and-forget for persistence/analytics)
            // Include local-computed score and intent for the backend to persist
            this.trackEvent('signals_batch', { ...batchData, localScore, detectedIntent });

            // 6. Full Reset
            this.signals = this.resetSignals();
            this.accumulatedDwell = {};
        }

        // ─── Client-Side Scoring Engine ─────────────────────────────────────────

        /**
         * Scores the current signal batch against the in-memory cumulative score.
         * Uses semantic element categories from the intent selector map when available,
         * falling back to element ID string matching for uncrawled sites.
         */
        _scoreSignalsLocally(signals) {
            let score = this._currentIntentScore || 40;

            // 1. Dwell Time (semantic category scoring)
            if (signals.dwell_time) {
                for (const [elementId, duration] of Object.entries(signals.dwell_time)) {
                    const el = document.getElementById(elementId);
                    const category = (el && el.getAttribute('data-vi-intent-category')) || this._guessCategory(elementId);

                    if (category === 'pricing') score += 15;
                    else if (category === 'features') score += 5;
                    else if (category === 'testimonial') score += 10;
                    else if (category === 'docs') score += 5;
                    else if (category === 'cta') score += 8;
                    else if (category === 'faq') score += 4;
                    else if (category === 'hero') score += 3;
                }
            }

            // 2. Behavioral signals
            if (signals.scroll_velocity > 2000) score -= 10; // Fast scroll = scanning
            if (signals.copy_text && signals.copy_text.length > 0) score += 15;
            if (signals.text_selections && signals.text_selections.length > 0) score += 10;
            if (signals.hesitation_event) score += 10;

            if (signals.scroll_depth) {
                if (signals.scroll_depth > 75) score += 10;
                else if (signals.scroll_depth > 50) score += 5;
            }

            if (signals.rage_clicks > 0 || (signals.dead_clicks && signals.dead_clicks.length > 0)) {
                score += 5;
            }

            score = Math.min(Math.max(score, 0), 100);
            this._currentIntentScore = score; // Persist across batches in memory
            // Persist to sessionStorage so score survives navigations within same tab
            try { sessionStorage.setItem('vi_intent_score_' + this.siteId, String(score)); } catch (_) { }
            return score;
        }

        /**
         * Determines the semantic category of a DOM element by its ID string.
         * This is the fallback path for sites that haven't been crawled yet.
         */
        _guessCategory(elementId) {
            const id = (elementId || '').toLowerCase();
            if (id.includes('pric') || id.includes('plan') || id.includes('billing')) return 'pricing';
            if (id.includes('feature') || id.includes('benefit') || id.includes('product')) return 'features';
            if (id.includes('testimonial') || id.includes('review') || id.includes('social-proof')) return 'testimonial';
            if (id.includes('doc') || id.includes('tech') || id.includes('api')) return 'docs';
            if (id.includes('cta') || id.includes('hero') || id.includes('header')) return 'cta';
            if (id.includes('faq') || id.includes('question')) return 'faq';
            return 'other';
        }

        /**
         * Checks if the visitor has dwelled >= minSeconds on any element
         * belonging to the given semantic category.
         */
        _hasCategoryDwell(dwell_time, category, minSeconds) {
            if (!dwell_time) return false;
            for (const [elementId, duration] of Object.entries(dwell_time)) {
                const el = document.getElementById(elementId);
                const cat = (el && el.getAttribute('data-vi-intent-category')) || this._guessCategory(elementId);
                if (cat === category && duration >= minSeconds) return true;
            }
            return false;
        }

        /**
         * Detects the primary intent from the current signal batch + score.
         * Returns an intent key matching an IntentCategory value, or null.
         */
        _detectIntent(signals, score) {
            const exitIntent = signals.events && signals.events.find(e => e.type === 'exit_intent');
            const hasPricingDwell = this._hasCategoryDwell(signals.dwell_time, 'pricing', 10);
            const hasFeatureDwell = this._hasCategoryDwell(signals.dwell_time, 'features', 15);
            const hasFeatureSelections = signals.text_selections && signals.text_selections.length > 0 && hasFeatureDwell;
            const isHesitating = signals.hesitation_event;
            const isConfused = (signals.rage_clicks > 2 || (signals.dead_clicks && signals.dead_clicks.length > 3))
                && (!signals.scroll_depth || signals.scroll_depth < 30);

            if (exitIntent) return 'bounce_risk';
            if (isHesitating) return 'hesitation';
            if (isConfused) return 'confused';
            if (hasPricingDwell) return 'price_sensitive';
            if (hasFeatureSelections) return 'feature_evaluator';
            if (score >= 70) return 'high_intent';
            if (score >= 30) return 'researcher';
            return null;
        }

        /**
         * Attempts to inject the prefetched UI payload for a detected intent.
         * Respects all existing cooldown, dedup, and limit guard rails.
         */
        _maybeInjectLocal(intentKey) {
            if (!this.intentPayloads || !this.intentPayloads[intentKey]) return;

            // Cooldown: minimum 60s between injections
            const lastInjection = this.injectionHistory[this.injectionHistory.length - 1];
            const timeSinceLastInjection = lastInjection ? Date.now() - lastInjection.timestamp : Infinity;
            const COOLDOWN_MS = 60000;
            if (timeSinceLastInjection < COOLDOWN_MS) return;

            // Dismissal guard: skip if user dismissed 2+ in last 5 minutes
            const recentDismissals = this.injectionHistory.filter(
                h => h.dismissed && Date.now() - h.timestamp < 300000
            ).length;
            if (recentDismissals >= 2) return;

            // Deduplicate: don't re-inject the same intent in one session
            if (this._lastInjectedIntent === intentKey) return;

            const payload = this.intentPayloads[intentKey];
            const uniqueId = `vi_local_${intentKey}_${Date.now()}`;

            console.log(`[Tracker] ⚡ Local intent detected: ${intentKey} — injecting from prefetched payload`);

            this.handleUIInjection({
                injection_target_selector: payload.targetSelector || 'body',
                injection_position: payload.injectionPosition || 'afterend',
                html_payload: payload.html || '',
                scoped_css: payload.css || '',
                javascript_payload: payload.js || '',
                intent: intentKey,
                id: uniqueId,
                type: payload.type || 'inject',
                persistence: 'session',
                priority: 5,
            });

            this._lastInjectedIntent = intentKey;
        }

        // ─── Dwell Time ───────────────────────────────────────────────────────

        // --- Event Listeners ---

        getSelector(el) {
            if (!el) return '';
            if (el.id) return '#' + el.id;
            // Simplified selector
            return el.tagName.toLowerCase();
        }

        setupEventListeners() {
            // Click & Rage Click
            document.addEventListener('click', (e) => {
                if (!this.isTrackingActive) return;
                const target = e.target;
                const selector = this.getSelector(target);
                const now = Date.now();

                // 1. Rage Click Detection
                if (!this.clickCounts[selector]) {
                    this.clickCounts[selector] = { count: 1, firstClick: now };
                } else {
                    const data = this.clickCounts[selector];
                    if (now - data.firstClick < 1000) {
                        data.count++;
                        if (data.count === 4) {
                            this.signals.rage_clicks++;
                            this.trackEvent('rage_click', { selector }); // Immediate alert
                        }
                    } else {
                        this.clickCounts[selector] = { count: 1, firstClick: now };
                    }
                }

                // 2. Track Interaction
                if (!this.signals.interactions[selector]) {
                    this.signals.interactions[selector] = { clicks: 0, hovers: 0, inputs: 0, last_timestamp: now };
                }
                this.signals.interactions[selector].clicks++;

                // 3. Dead Clicks
                const isInteractive = ['A', 'BUTTON', 'INPUT', 'SELECT', 'TEXTAREA', 'LABEL'].includes(target.tagName) ||
                    target.onclick || target.closest('a,button');
                if (!isInteractive && this.signals.dead_clicks.length < 10) {
                    this.signals.dead_clicks.push({ selector, x: e.clientX, y: e.clientY, timestamp: now });
                }
            }, { capture: true });

            // Scroll Velocity & Depth
            window.addEventListener('scroll', () => {
                if (!this.isTrackingActive) return;
                const now = Date.now();
                const dt = now - this.lastScrollTime;

                if (dt > 100) {
                    const dy = Math.abs(window.scrollY - this.lastScrollY);
                    const speed = (dy / dt) * 1000;
                    if (speed > this.signals.scroll_velocity) {
                        this.signals.scroll_velocity = parseFloat(speed.toFixed(2));
                    }
                    this.lastScrollY = window.scrollY;
                    this.lastScrollTime = now;
                }

                const docHeight = document.documentElement.scrollHeight - window.innerHeight;
                if (docHeight > 0) {
                    const percentage = Math.round((window.scrollY / docHeight) * 100);
                    if (percentage > this.signals.scroll_depth) {
                        this.signals.scroll_depth = percentage;
                    }
                }
            }, { passive: true });

            // Hesitation (Hovering CTA)
            document.addEventListener('mousemove', (e) => {
                if (!this.isTrackingActive) return;
                const cta = e.target.closest('button, a, .cta');
                if (cta) {
                    if (!this.ctaHoverTimer) {
                        this.ctaHoverTimer = setTimeout(() => {
                            this.signals.hesitation_event = true;
                        }, 2000);
                    }
                } else {
                    clearTimeout(this.ctaHoverTimer);
                    this.ctaHoverTimer = null;
                }
            });

            // Copy
            document.addEventListener('copy', () => {
                if (!this.isTrackingActive) return;
                const sel = window.getSelection().toString();
                if (sel) this.signals.copy_text.push(sel.substring(0, 100));
            });

            document.addEventListener('mouseup', () => {
                if (!this.isTrackingActive) return;
                const sel = window.getSelection().toString().trim();
                if (sel.length > 5 && sel.length < 200) {
                    if (!this.signals.text_selections.includes(sel)) {
                        this.signals.text_selections.push(sel);
                    }
                }
            });

            // Exit Intent
            document.addEventListener('mouseleave', (e) => {
                if (!this.isTrackingActive) return;
                if (e.clientY <= 0) {
                    this.signals.events.push({ type: 'exit_intent', timestamp: Date.now() });
                    this.trackEvent('exit_intent', { url: window.location.href }); // Immediate
                }
            });

            // Form Analytics
            document.addEventListener('focus', (e) => {
                if (!this.isTrackingActive) return;
                const t = e.target;
                if (['INPUT', 'TEXTAREA', 'SELECT'].includes(t.tagName)) {
                    const name = t.name || t.id || this.getSelector(t);
                    this.formTimers[name] = Date.now();
                }
            }, { capture: true });

            document.addEventListener('blur', (e) => {
                if (!this.isTrackingActive) return;
                const t = e.target;
                if (['INPUT', 'TEXTAREA', 'SELECT'].includes(t.tagName)) {
                    const name = t.name || t.id || this.getSelector(t);
                    if (this.formTimers[name]) {
                        const duration = Date.now() - this.formTimers[name];
                        if (!this.signals.forms[name]) this.signals.forms[name] = { time_focused: 0, refills: 0 };
                        this.signals.forms[name].time_focused += duration;
                    }
                }
            }, { capture: true });
        }

        initObserver() {
            const options = { threshold: 0.1 };
            this.dwellObserver = new IntersectionObserver((entries) => {
                if (!this.isTrackingActive) return;
                const now = Date.now();
                entries.forEach(entry => {
                    const id = entry.target.id;
                    if (!id) return;
                    if (entry.isIntersecting && document.visibilityState === 'visible') {
                        this.activeDwellTimers[id] = now;
                    } else {
                        if (this.activeDwellTimers[id]) {
                            this.accumulatedDwell[id] = (this.accumulatedDwell[id] || 0) + (now - this.activeDwellTimers[id]);
                            delete this.activeDwellTimers[id];
                        }
                    }
                });
            }, options);

            if (this.intentSelectorMap && Object.keys(this.intentSelectorMap).length > 0) {
                // Use crawl-derived semantic selectors — accurate for any host website
                console.log('[Tracker] Using crawl-derived intent selectors for dwell observation');
                let observed = 0;
                for (const [category, selectors] of Object.entries(this.intentSelectorMap)) {
                    for (const selector of selectors) {
                        try {
                            const el = document.querySelector(selector);
                            if (el) {
                                // Tag element with semantic category for scoring
                                el.setAttribute('data-vi-intent-category', category);
                                // Ensure element has an ID for the dwell timer map
                                if (!el.id) {
                                    el.id = `vi-auto-${category}-${Math.random().toString(36).substr(2, 4)}`;
                                }
                                this.dwellObserver.observe(el);
                                observed++;
                            }
                        } catch (e) { /* silently skip invalid selectors */ }
                    }
                }
                console.log(`[Tracker] Observing ${observed} semantic elements`);

                // Also observe generic elements as a supplement
                document.querySelectorAll('section, article, div[id]').forEach(el => {
                    if (el.id && !el.hasAttribute('data-vi-intent-category')) {
                        this.dwellObserver.observe(el);
                    }
                });
            } else {
                // Fallback: generic element observation (original behavior)
                document.querySelectorAll('section, article, div[id]').forEach(el => {
                    if (el.id) this.dwellObserver.observe(el);
                });
            }
        }

        // --- Performance ---
        initPerformanceObserver() {
            if (!window.PerformanceObserver) return;
            const po = new PerformanceObserver((list) => {
                list.getEntries().forEach((entry) => {
                    if (entry.entryType === 'largest-contentful-paint') this.signals.performance.lcp = entry.startTime;
                    if (entry.entryType === 'layout-shift' && !entry.hadRecentInput) this.signals.performance.cls = (this.signals.performance.cls || 0) + entry.value;
                    if (entry.entryType === 'first-input') this.signals.performance.fid = entry.processingStart - entry.startTime;
                });
            });
            try {
                po.observe({ type: 'largest-contentful-paint', buffered: true });
                po.observe({ type: 'layout-shift', buffered: true });
                po.observe({ type: 'first-input', buffered: true });
            } catch (e) { }
        }

        // --- Geolocation ---
        fetchGeolocation() {
            if ('geolocation' in navigator) {
                navigator.geolocation.getCurrentPosition(
                    (pos) => {
                        this.signals.geolocation = {
                            lat: pos.coords.latitude,
                            lng: pos.coords.longitude,
                            accuracy: pos.coords.accuracy
                        };
                    },
                    (err) => { }, // ignore
                    { timeout: 5000 }
                );
            }
        }

        // --- UI Injection (Multi-Type, Multi-Instance) ---
        handleUIInjection(payload) {
            console.log('[Tracker] Received AI UI Payload', payload);

            if (!CONFIG.isUiInjectionEnabled) {
                console.log('[Tracker] UI Injection disabled by site settings');
                return;
            }

            const {
                injection_target_selector,
                injection_position,
                html_payload,
                scoped_css,
                javascript_payload,
                intent,
                id: injectionId,
                type: mutationType = 'inject',
                persistence,
                priority = 5,
                highlight_css,
                css_modifications,
            } = payload;

            // Ensure intent is captured regardless of field name casing or position
            const intentType = intent || payload.intent || 'general';
            const uniqueId = injectionId || `vi_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;

            // Content-based fingerprint for dedup (mutation type, selector, position, content snippet)
            const fingerprint = `${mutationType}|${injection_target_selector}|${injection_position || ''}|${(html_payload || '').substring(0, 150)}`;

            // Bug fix (Race condition): Debounce guard — prevent the same injection from
            // being applied twice when both the restore (_r) and a live server push arrive
            // concurrently on page load. If the injection (or its restore counterpart) is
            // already in the DOM, skip silently.
            if (document.getElementById(`vi-ai-${uniqueId}`) ||
                document.getElementById(`vi-ai-${uniqueId}_r`) ||
                document.querySelector(`[data-vi-original-id="${uniqueId}"]`)) {
                console.log(`[Tracker] Injection ${uniqueId} already in DOM, skipping duplicate`);
                return;
            }

            // Fingerprint check: avoid identical content even with different IDs
            for (const [id, entry] of this.activeInjections.entries()) {
                const existingFingerprint = (entry instanceof HTMLElement) ? entry.getAttribute('data-vi-fingerprint') : entry.fingerprint;
                if (existingFingerprint === fingerprint) {
                    console.log(`[Tracker] Injection content duplicate found for fingerprint: ${fingerprint}, skipping...`);
                    return;
                }
            }

            // Check injection limits per intent
            const currentCount = this.injectionCounts[intentType] || 0;
            let maxLimit = CONFIG.maxInjectionsPerIntent[intentType];
            if (typeof maxLimit === 'undefined') {
                maxLimit = CONFIG.maxInjectionsPerIntent['general'] || 3;
            }
            if (currentCount >= maxLimit) {
                console.log(`[Tracker] Max injections reached for intent: ${intentType} (${currentCount}/${maxLimit})`);
                return;
            }

            // Multi-injection: cap at MAX_SIMULTANEOUS_INJECTIONS
            if (this.activeInjections.size >= this.MAX_SIMULTANEOUS_INJECTIONS && mutationType === 'inject' && mutationType !== 'concierge') {
                console.log(`[Tracker] Max simultaneous injections reached (${this.activeInjections.size})`);
                return;
            }

            this.lastInjectionId = uniqueId;

            // Route to the appropriate mutation handler
            switch (mutationType) {
                case 'highlight':
                    this._handleHighlight(uniqueId, injection_target_selector, html_payload, scoped_css, javascript_payload, highlight_css, priority);
                    break;
                case 'modify':
                    this._handleModify(uniqueId, injection_target_selector, javascript_payload, css_modifications, priority);
                    break;
                case 'replace':
                    this._handleReplace(uniqueId, injection_target_selector, html_payload, scoped_css, javascript_payload, priority);
                    break;
                case 'concierge':
                    this._handleConcierge(uniqueId, html_payload, priority);
                    break;
                case 'inline_inject':
                    this._handleInlineInject(uniqueId, injection_target_selector, injection_position, html_payload, scoped_css, javascript_payload, priority, intentType);
                    break;
                case 'inject':
                default:
                    this._handleInject(uniqueId, injection_target_selector, html_payload, scoped_css, javascript_payload, priority);
                    break;
            }

            // Increment injection count
            this.injectionCounts[intentType] = currentCount + 1;
            this.injectionHistory.push({ id: uniqueId, type: mutationType, intent: intentType, timestamp: Date.now() });
            console.log(`[Tracker] Injected AI UI (${mutationType}) into ${injection_target_selector}, id: ${uniqueId}`);
        }

        // --- Mutation Type: INJECT (Shadow DOM popup/sidebar) ---
        _handleInject(uniqueId, targetSelector, htmlPayload, scopedCss, jsPayload, priority) {
            const targetElement = document.querySelector(targetSelector) || document.body;
            const host = document.createElement('div');
            host.id = `vi-ai-${uniqueId}`;
            host.setAttribute('data-vi-injection', uniqueId);
            host.setAttribute('data-vi-fingerprint', `inject|${targetSelector}||${(htmlPayload || '').substring(0, 150)}`);
            host.style.cssText = `position: relative; z-index: ${2147483600 + priority};`;

            const shadow = host.attachShadow({ mode: 'open' });
            shadow.innerHTML = `
                <style>
                    ${scopedCss}
                    :host { all: initial; display: block; font-family: sans-serif; }
                    * { box-sizing: border-box; }
                    .vi-internal-close {
                        position: absolute; top: 10px; right: 10px; width: 24px; height: 24px;
                        background: rgba(0,0,0,0.3); color: white; border-radius: 50%;
                        display: flex; align-items: center; justify-content: center;
                        cursor: pointer; font-size: 16px; line-height: 1; border: none;
                        transition: background 0.2s; z-index: 100;
                    }
                    .vi-internal-close:hover { background: rgba(0,0,0,0.6); }
                </style>
                <div style="position: relative; width: 100%; height: 100%;">
                    <button class="vi-internal-close" title="Close">&times;</button>
                    ${htmlPayload}
                </div>
            `;

            if (jsPayload) {
                this._executeInShadow(host, shadow, jsPayload, uniqueId);
            }

            if (targetSelector === 'body') {
                const offset = this.activeInjections.size * 90;
                Object.assign(host.style, {
                    position: 'fixed', bottom: `${20 + offset}px`, right: '20px', width: 'auto', maxWidth: '400px'
                });
                document.body.appendChild(host);
            } else {
                targetElement.appendChild(host);
            }

            this._attachInteractionTracking(shadow, host, uniqueId);
            this.activeInjections.set(uniqueId, host);
        }

        // --- Mutation Type: INLINE_INJECT (Block flow Shadow DOM adjacent to existing element) ---
        // originalId: when called from _restoreInlineInjections, the original uniqueId of the
        //   persisted injection (before the '_r' suffix). Used to set data-vi-original-id so
        //   the live server-push de-dup guard can detect an already-restored injection.
        _handleInlineInject(uniqueId, targetSelector, injectionPosition, htmlPayload, scopedCss, jsPayload, priority, intent, originalId) {
            const positions = ['beforebegin', 'afterbegin', 'beforeend', 'afterend'];
            const position = positions.includes(injectionPosition) ? injectionPosition : 'afterend';

            const targetElement = document.querySelector(targetSelector);
            if (!targetElement) {
                console.warn(`[Tracker] Inline inject: target not found: ${targetSelector}.`);
                const isRestore = uniqueId.endsWith('_r');
                if (!isRestore) {
                    console.warn(`[Tracker] Falling back to body.`);
                    // Fallback to standard inject at body
                    this._handleInject(uniqueId, 'body', htmlPayload, scopedCss, jsPayload, priority);
                }
                return;
            }

            const host = document.createElement('div');
            host.id = `vi-ai-${uniqueId}`;
            host.setAttribute('data-vi-injection', uniqueId);
            host.setAttribute('data-vi-inline', 'true');
            host.setAttribute('data-vi-fingerprint', `inline_inject|${targetSelector}|${position}|${(htmlPayload || '').substring(0, 150)}`);
            // Bug fix: store the original (pre-restore) ID so the live-push guard can find it
            if (originalId) {
                host.setAttribute('data-vi-original-id', originalId);
            }
            // Inline flow — no fixed positioning
            host.style.cssText = `position: relative; display: block; width: 100%; z-index: ${2147483600 + priority};`;

            const shadow = host.attachShadow({ mode: 'open' });
            shadow.innerHTML = `
                <style>
                    ${scopedCss}
                    :host { all: initial; display: block; font-family: inherit; width: 100%; }
                    * { box-sizing: border-box; }
                    .vi-internal-close {
                        position: absolute; top: 8px; right: 8px; width: 22px; height: 22px;
                        background: rgba(0,0,0,0.2); color: #333; border-radius: 50%;
                        display: flex; align-items: center; justify-content: center;
                        cursor: pointer; font-size: 14px; line-height: 1; border: none;
                        transition: background 0.2s; z-index: 10;
                    }
                    .vi-internal-close:hover { background: rgba(0,0,0,0.4); color: #fff; }
                </style>
                <div style="position: relative; width: 100%;">
                    <button class="vi-internal-close" title="Dismiss">&times;</button>
                    ${htmlPayload}
                </div>
            `;

            if (jsPayload) {
                this._executeInShadow(host, shadow, jsPayload, uniqueId);
            }

            // insertAdjacentElement respects document flow
            targetElement.insertAdjacentElement(position, host);

            this._attachInteractionTracking(shadow, host, uniqueId);
            this.activeInjections.set(uniqueId, host);

            // Persist for page refresh survival — only for new injections (not restores)
            const persistIntent = intent || 'general';
            if (!uniqueId.endsWith('_r')) {
                console.log(`[Tracker] [InlineInject] Persisting injection to localStorage: intent=${persistIntent}, uniqueId=${uniqueId}, path=${window.location.pathname}`);
                this._persistInlineInjection(persistIntent, uniqueId, targetSelector, position, htmlPayload, scopedCss, jsPayload);
            } else {
                console.log(`[Tracker] [InlineInject] RESTORED injection active: id=${uniqueId}`);
            }

            // Wire close button to clear from localStorage so dismiss = never replay
            const closeBtn = shadow.querySelector('.vi-internal-close');
            if (closeBtn) {
                const baseId = originalId || uniqueId;
                closeBtn.addEventListener('click', () => {
                    this._clearPersistedInjection(baseId);
                }, { once: true });
            }
        }

        // --- Mutation Type: HIGHLIGHT (CSS highlight + tooltip) ---
        _handleHighlight(uniqueId, targetSelector, tooltipHtml, tooltipCss, jsPayload, highlightCss, priority) {
            const target = document.querySelector(targetSelector);
            if (!target) {
                console.warn(`[Tracker] Highlight target not found: ${targetSelector}`);
                return;
            }

            const originalStyles = target.getAttribute('style') || '';
            const highlightStyles = highlightCss || 'outline: 3px solid #2563eb; outline-offset: 4px; box-shadow: 0 0 0 4px rgba(37,99,235,0.2); transition: all 0.3s ease;';
            target.style.cssText = originalStyles + '; ' + highlightStyles;

            if (!document.getElementById('vi-pulse-styles')) {
                const style = document.createElement('style');
                style.id = 'vi-pulse-styles';
                style.textContent = `
                    @keyframes vi-pulse {
                        0%, 100% { box-shadow: 0 0 0 4px rgba(37,99,235,0.2); }
                        50% { box-shadow: 0 0 0 8px rgba(37,99,235,0.4); }
                    }
                `;
                document.head.appendChild(style);
            }
            target.style.animation = 'vi-pulse 2s infinite';

            if (tooltipHtml) {
                const tooltipHost = document.createElement('div');
                tooltipHost.id = `vi-ai-${uniqueId}`;
                tooltipHost.setAttribute('data-vi-injection', uniqueId);
                tooltipHost.setAttribute('data-vi-fingerprint', `highlight|${targetSelector}||${(tooltipHtml || '').substring(0, 150)}`);
                tooltipHost.style.cssText = `position: absolute; z-index: ${2147483600 + priority};`;

                const shadow = tooltipHost.attachShadow({ mode: 'open' });
                shadow.innerHTML = `
                    <style>
                        ${tooltipCss || ''}
                        :host { all: initial; display: block; font-family: sans-serif; }
                        .vi-tooltip-close {
                            position: absolute; top: 4px; right: 4px; width: 18px; height: 18px;
                            background: rgba(0,0,0,0.2); color: white; border-radius: 50%;
                            display: flex; align-items: center; justify-content: center;
                            cursor: pointer; font-size: 12px; border: none;
                        }
                    </style>
                    <div style="position: relative;">
                        <button class="vi-tooltip-close vi-internal-close" title="Close">&times;</button>
                        ${tooltipHtml}
                    </div>
                `;

                const rect = target.getBoundingClientRect();
                tooltipHost.style.position = 'fixed';
                tooltipHost.style.top = `${rect.bottom + window.scrollY + 8}px`;
                tooltipHost.style.left = `${rect.left + window.scrollX}px`;
                tooltipHost.style.maxWidth = '300px';

                document.body.appendChild(tooltipHost);

                shadow.addEventListener('click', (e) => {
                    const t = e.target;
                    if (t.classList.contains('vi-internal-close') || t.classList.contains('vi-tooltip-close') || t.closest('[data-action="close"]')) {
                        tooltipHost.remove();
                        target.style.cssText = originalStyles;
                        target.style.animation = '';
                        this.activeInjections.delete(uniqueId);
                        this.trackEvent('injection_dismissed', { injection_id: uniqueId });
                    }
                });

                this._attachInteractionTracking(shadow, tooltipHost, uniqueId);
                this.activeInjections.set(uniqueId, tooltipHost);
            }

            if (jsPayload) {
                try { new Function(jsPayload)(); } catch (e) { console.error('[Tracker] Highlight JS Error', e); }
            }
        }

        // --- Mutation Type: MODIFY (Inline CSS/text changes) ---
        _handleModify(uniqueId, targetSelector, jsPayload, cssModifications, priority) {
            const target = document.querySelector(targetSelector);
            if (!target) {
                console.warn(`[Tracker] Modify target not found: ${targetSelector}`);
                return;
            }

            const originalStyles = target.getAttribute('style') || '';
            const originalHtml = target.innerHTML;

            if (cssModifications && typeof cssModifications === 'object') {
                for (const [prop, val] of Object.entries(cssModifications)) {
                    target.style[prop] = val;
                }
            }

            if (jsPayload) {
                try { new Function('target', jsPayload)(target); } catch (e) { console.error('[Tracker] Modify JS Error', e); }
            }

            const fingerprint = `modify|${targetSelector}||${(jsPayload || JSON.stringify(cssModifications) || '').substring(0, 150)}`;
            this.activeInjections.set(uniqueId, { element: target, originalStyles, originalHtml, fingerprint });
            this.trackEvent('injection_interaction', { injection_id: uniqueId, action: 'modify_applied' });
        }

        // --- Mutation Type: REPLACE (innerHTML swap) ---
        _handleReplace(uniqueId, targetSelector, htmlPayload, scopedCss, jsPayload, priority) {
            const target = document.querySelector(targetSelector);
            if (!target) {
                console.warn(`[Tracker] Replace target not found: ${targetSelector}`);
                return;
            }

            const originalHtml = target.innerHTML;
            const originalStyles = target.getAttribute('style') || '';

            target.innerHTML = htmlPayload;

            if (scopedCss) {
                const style = document.createElement('style');
                style.textContent = scopedCss;
                target.prepend(style);
            }

            if (jsPayload) {
                try { new Function('target', jsPayload)(target); } catch (e) { console.error('[Tracker] Replace JS Error', e); }
            }

            const fingerprint = `replace|${targetSelector}||${(htmlPayload || '').substring(0, 150)}`;
            this.activeInjections.set(uniqueId, { element: target, originalHtml, originalStyles, fingerprint });
            this.trackEvent('injection_interaction', { injection_id: uniqueId, action: 'replace_applied' });
        }

        // --- Helper: Execute JS inside Shadow DOM ---
        _executeInShadow(host, shadow, jsPayload, uniqueId) {
            const script = document.createElement('script');
            script.textContent = `
                (function() {
                    const host = document.querySelector('[data-vi-injection="${uniqueId}"]');
                    if (!host || !host.shadowRoot) return;
                    const shadow = host.shadowRoot;
                    
                    const docProxy = new Proxy(document, {
                        get: (target, prop) => {
                            if (['getElementById', 'querySelector', 'querySelectorAll'].includes(prop)) {
                                return shadow[prop].bind(shadow);
                            }
                            const val = target[prop];
                            return typeof val === 'function' ? val.bind(target) : val;
                        }
                    });

                    (function(document) {
                        try {
                            ${jsPayload}
                        } catch(e) {
                            console.error("Tracker: AI JS Error", e);
                        }
                    })(docProxy);
                })();
            `;
            shadow.appendChild(script);
        }

        // --- Helper: Track interactions inside injected Shadow DOM ---
        _attachInteractionTracking(shadow, host, uniqueId) {
            shadow.addEventListener('click', (e) => {
                const target = e.target;
                const isCloseAction = target.classList.contains('vi-internal-close') ||
                    target.classList.contains('close-btn') || target.closest('[data-action="close"]');

                if (isCloseAction) {
                    host.remove();
                    this.activeInjections.delete(uniqueId);
                    this.trackEvent('injection_dismissed', { injection_id: uniqueId });
                } else {
                    this.trackEvent('injection_interaction', {
                        injection_id: uniqueId,
                        element: this.getSelector(target),
                        action: 'click'
                    });
                }
            });

            const forms = shadow.querySelectorAll('form');
            forms.forEach(form => {
                form.addEventListener('submit', (e) => {
                    this.trackEvent('conversion', {
                        type: 'form_submit',
                        lastInjectionId: uniqueId,
                        attribution: 'auto'
                    });
                });
            });
        }

        // --- Public API: Track Conversion ---
        trackConversion({ type = 'custom', value = 0, attribution = 'auto' } = {}) {
            this.trackEvent('conversion', {
                type,
                value,
                attribution,
                lastInjectionId: this.lastInjectionId
            });
            console.log(`[Tracker] Conversion tracked: ${type}, value: ${value}, attributed to: ${this.lastInjectionId}`);
        }

        // --- Public API: Undo a specific modification ---
        undoInjection(injectionId) {
            const data = this.activeInjections.get(injectionId);
            if (!data) return;

            if (data instanceof HTMLElement) {
                data.remove();
            } else if (data.element) {
                data.element.innerHTML = data.originalHtml;
                data.element.setAttribute('style', data.originalStyles);
            }

            this.activeInjections.delete(injectionId);
            console.log(`[Tracker] Injection ${injectionId} undone`);
        }


        // --- Mutation Type: CONCIERGE (AI Chat Widget) ---
        _handleConcierge(uniqueId, greeting, priority) {
            // Don't create multiple chat widgets
            if (document.querySelector('[data-vi-concierge]')) {
                console.log('[Tracker] Concierge already active');
                return;
            }

            const host = document.createElement('div');
            host.id = `vi-ai-${uniqueId}`;
            host.setAttribute('data-vi-injection', uniqueId);
            host.setAttribute('data-vi-concierge', 'true');
            host.style.cssText = `position: fixed; bottom: 20px; right: 20px; z-index: ${2147483600 + priority}; font-family: system-ui, -apple-system, sans-serif;`;

            const shadow = host.attachShadow({ mode: 'open' });
            shadow.innerHTML = `
                <style>
                    :host { all: initial; display: block; font-family: system-ui, -apple-system, sans-serif; }
                    * { box-sizing: border-box; margin: 0; padding: 0; }

                    .vi-chat-container {
                        width: 380px; max-width: calc(100vw - 40px);
                        height: 500px; max-height: calc(100vh - 100px);
                        background: #ffffff;
                        border-radius: 16px;
                        box-shadow: 0 20px 60px rgba(0,0,0,0.15), 0 0 0 1px rgba(0,0,0,0.05);
                        display: flex; flex-direction: column;
                        overflow: hidden;
                        animation: vi-chat-enter 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
                        transform-origin: bottom right;
                    }
                    @keyframes vi-chat-enter {
                        0% { opacity: 0; transform: scale(0.8) translateY(20px); }
                        100% { opacity: 1; transform: scale(1) translateY(0); }
                    }
                    .vi-chat-header {
                        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                        color: white; padding: 16px 20px;
                        display: flex; align-items: center; justify-content: space-between;
                    }
                    .vi-chat-header-info { display: flex; align-items: center; gap: 12px; }
                    .vi-chat-avatar {
                        width: 36px; height: 36px; border-radius: 50%;
                        background: rgba(255,255,255,0.2); display: flex;
                        align-items: center; justify-content: center; font-size: 18px;
                    }
                    .vi-chat-header-text h3 { font-size: 14px; font-weight: 600; margin-bottom: 2px; }
                    .vi-chat-header-text span { font-size: 11px; opacity: 0.85; }
                    .vi-chat-close {
                        background: rgba(255,255,255,0.15); border: none; color: white;
                        width: 28px; height: 28px; border-radius: 50%; cursor: pointer;
                        display: flex; align-items: center; justify-content: center;
                        font-size: 16px; transition: background 0.2s;
                    }
                    .vi-chat-close:hover { background: rgba(255,255,255,0.3); }

                    .vi-chat-messages {
                        flex: 1; overflow-y: auto; padding: 16px;
                        display: flex; flex-direction: column; gap: 12px;
                        background: #f7f8fa;
                    }
                    .vi-chat-messages::-webkit-scrollbar { width: 4px; }
                    .vi-chat-messages::-webkit-scrollbar-thumb { background: #ccc; border-radius: 2px; }

                    .vi-msg { max-width: 85%; padding: 10px 14px; border-radius: 12px; font-size: 13.5px; line-height: 1.5; word-wrap: break-word; }
                    .vi-msg-bot { background: white; color: #1a1a2e; align-self: flex-start; border: 1px solid #e8e8ee; border-bottom-left-radius: 4px; }
                    .vi-msg-user { background: #667eea; color: white; align-self: flex-end; border-bottom-right-radius: 4px; }
                    .vi-msg-typing { align-self: flex-start; background: white; border: 1px solid #e8e8ee; padding: 12px 18px; border-radius: 12px; }
                    .vi-typing-dots { display: flex; gap: 4px; }
                    .vi-typing-dots span {
                        width: 6px; height: 6px; border-radius: 50%; background: #667eea;
                        animation: vi-bounce 1.4s infinite ease-in-out both;
                    }
                    .vi-typing-dots span:nth-child(1) { animation-delay: -0.32s; }
                    .vi-typing-dots span:nth-child(2) { animation-delay: -0.16s; }
                    @keyframes vi-bounce {
                        0%, 80%, 100% { transform: scale(0); opacity: 0.5; }
                        40% { transform: scale(1); opacity: 1; }
                    }

                    .vi-chat-actions { display: flex; gap: 6px; flex-wrap: wrap; margin-top: 6px; }
                    .vi-action-btn {
                        background: #f0f0ff; color: #667eea; border: 1px solid #d5d5f5;
                        padding: 6px 12px; border-radius: 16px; font-size: 12px;
                        cursor: pointer; transition: all 0.2s; font-family: inherit;
                    }
                    .vi-action-btn:hover { background: #667eea; color: white; border-color: #667eea; }

                    .vi-chat-input-area {
                        padding: 12px 16px; background: white;
                        border-top: 1px solid #e8e8ee;
                        display: flex; gap: 8px; align-items: center;
                    }
                    .vi-chat-input {
                        flex: 1; border: 1px solid #ddd; border-radius: 20px;
                        padding: 10px 16px; font-size: 13.5px; outline: none;
                        font-family: inherit; transition: border-color 0.2s;
                    }
                    .vi-chat-input:focus { border-color: #667eea; }
                    .vi-chat-send {
                        background: #667eea; color: white; border: none;
                        width: 36px; height: 36px; border-radius: 50%;
                        cursor: pointer; display: flex; align-items: center;
                        justify-content: center; transition: background 0.2s;
                        flex-shrink: 0;
                    }
                    .vi-chat-send:hover { background: #5a6fd6; }
                    .vi-chat-send:disabled { opacity: 0.5; cursor: not-allowed; }
                    .vi-powered { text-align: center; padding: 6px; font-size: 10px; color: #999; background: white; }
                </style>
                <div class="vi-chat-container">
                    <div class="vi-chat-header">
                        <div class="vi-chat-header-info">
                            <div class="vi-chat-avatar">🤖</div>
                            <div class="vi-chat-header-text">
                                <h3>Sales Assistant</h3>
                                <span>● Online — typically replies instantly</span>
                            </div>
                        </div>
                        <button class="vi-chat-close vi-internal-close" title="Close">&times;</button>
                    </div>
                    <div class="vi-chat-messages" id="vi-messages"></div>
                    <div class="vi-chat-input-area">
                        <input class="vi-chat-input" id="vi-chat-input" type="text" placeholder="Type your message..." autocomplete="off" />
                        <button class="vi-chat-send" id="vi-chat-send" title="Send">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
                        </button>
                    </div>
                    <div class="vi-powered">Powered by AI</div>
                </div>
            `;

            document.body.appendChild(host);

            // Get shadow DOM elements
            const messagesEl = shadow.getElementById('vi-messages');
            const inputEl = shadow.getElementById('vi-chat-input');
            const sendBtn = shadow.getElementById('vi-chat-send');

            // Show initial greeting
            const greetingText = greeting || "Hi! 👋 I noticed you've been exploring — is there anything I can help you with?";
            this._addChatMessage(messagesEl, greetingText, 'bot');

            // Send message handler
            const sendMessage = async () => {
                const msg = inputEl.value.trim();
                if (!msg) return;

                inputEl.value = '';
                sendBtn.disabled = true;

                // Show user message
                this._addChatMessage(messagesEl, msg, 'user');

                // Show typing indicator
                const typingEl = this._showTyping(messagesEl);

                // Track the interaction
                this.trackEvent('injection_interaction', { injection_id: uniqueId, action: 'chat_message' });

                try {
                    // Send to backend via GraphQL mutation
                    const response = await this._sendChatMessage(msg);

                    // Remove typing indicator
                    typingEl.remove();

                    // Show AI response
                    this._addChatMessage(messagesEl, response.message, 'bot');

                    // Show action buttons if any
                    if (response.suggestedActions) {
                        let actions = response.suggestedActions;
                        if (typeof actions === 'string') {
                            try { actions = JSON.parse(actions); } catch (e) { actions = []; }
                        }
                        if (actions.length > 0) {
                            this._addChatActions(messagesEl, actions, inputEl);
                        }
                    }
                } catch (err) {
                    typingEl.remove();
                    this._addChatMessage(messagesEl, "Sorry, I had trouble processing that. Could you try again?", 'bot');
                    console.error('[Tracker] Chat error', err);
                }

                sendBtn.disabled = false;
                inputEl.focus();
            };

            sendBtn.addEventListener('click', sendMessage);
            inputEl.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                }
            });

            // Close handler
            shadow.querySelector('.vi-chat-close').addEventListener('click', () => {
                host.style.animation = 'none';
                host.style.transition = 'opacity 0.2s, transform 0.2s';
                host.style.opacity = '0';
                host.style.transform = 'scale(0.8) translateY(20px)';
                setTimeout(() => {
                    host.remove();
                    this.activeInjections.delete(uniqueId);
                    this.trackEvent('injection_dismissed', { injection_id: uniqueId });
                }, 200);
            });

            this.activeInjections.set(uniqueId, host);
        }

        // --- Chat Helpers ---
        _addChatMessage(container, text, type) {
            const msg = document.createElement('div');
            msg.className = `vi-msg vi-msg-${type}`;
            msg.textContent = text;
            container.appendChild(msg);
            container.scrollTop = container.scrollHeight;
        }

        _showTyping(container) {
            const typing = document.createElement('div');
            typing.className = 'vi-msg-typing';
            typing.innerHTML = '<div class="vi-typing-dots"><span></span><span></span><span></span></div>';
            container.appendChild(typing);
            container.scrollTop = container.scrollHeight;
            return typing;
        }

        _addChatActions(container, actions, inputEl) {
            const actionsDiv = document.createElement('div');
            actionsDiv.className = 'vi-chat-actions';
            actions.forEach(action => {
                const btn = document.createElement('button');
                btn.className = 'vi-action-btn';
                btn.textContent = action.label;
                btn.addEventListener('click', () => {
                    if (action.action && action.action.startsWith('http')) {
                        window.open(action.action, '_blank');
                    } else {
                        // Use as a quick reply
                        inputEl.value = action.label;
                        inputEl.dispatchEvent(new Event('input'));
                        inputEl.focus();
                    }
                    this.trackEvent('injection_interaction', {
                        injection_id: 'concierge',
                        action: 'action_click',
                        label: action.label
                    });
                });
                actionsDiv.appendChild(btn);
            });
            container.appendChild(actionsDiv);
            container.scrollTop = container.scrollHeight;
        }

        async _sendChatMessage(message) {
            const query = `mutation ChatMessage($input: ChatMessageInput!) {
                chatMessage(input: $input) {
                    sessionId message suggestedActions timestamp shouldEscalate
                }
            }`;

            const variables = {
                input: {
                    sessionId: this.sessionId,
                    siteId: this.siteId,
                    message: message
                }
            };

            // Use the existing WebSocket client instead of REST fetch
            const result = await this.client.execute(query, variables);
            if (!result || !result.chatMessage) throw new Error('No chat response received');
            return result.chatMessage;
        }
    }


    // --- Auto-Initialize ---
    // document.currentScript is null for dynamically created <script> elements.
    // Fallback: find the script tag by its src attribute containing 'socketTracker'.
    let script = document.currentScript;
    if (!script) {
        const allScripts = document.querySelectorAll('script[data-site-id]');
        for (let i = 0; i < allScripts.length; i++) {
            const s = allScripts[i];
            if (s.src && s.src.indexOf('socketTracker') !== -1) {
                script = s;
                break;
            }
        }
    }

    if (script) {
        const siteId = script.getAttribute('data-site-id');
        const apiUrl = script.getAttribute('data-api-url') || script.getAttribute('data-graphql-endpoint');
        if (siteId) {
            console.log('[Tracker] Auto-initializing with siteId:', siteId, 'apiUrl:', apiUrl);
            window.VisitorIntelligence = new VisitorIntelligenceTracker({ siteId, apiUrl });
        }
    } else {
        console.warn('[Tracker] Could not find script element for auto-initialization. Use manual init: new VisitorIntelligenceTracker({ siteId, apiUrl })');
    }

    // Expose
    window.VisitorIntelligenceTracker = VisitorIntelligenceTracker;

})();
