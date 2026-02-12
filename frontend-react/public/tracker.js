/**
 * AI-Powered Intent Engine Tracker SDK
 * 
 * Captures behavioral signals (dwell time, scroll velocity, rage clicks, interactions, etc.)
 * and batches them to the backend for intent analysis.
 */

(function () {
    'use strict';

    // Configuration
    const CONFIG = {
        graphqlEndpoint: document.currentScript ? document.currentScript.getAttribute('data-graphql-endpoint') : 'http://localhost:4040/graphql',
        batchInterval: 20000,
        idleThreshold: 1000,
        maxRetries: 3,
        startUpDelay: 1000 // Default, overridden by server config
    };

    // State
    const siteId = document.currentScript ? document.currentScript.getAttribute('data-site-id') : null;
    const apiKey = document.currentScript ? document.currentScript.getAttribute('data-api-key') : null;
    let sessionId = localStorage.getItem('vi_session_id');
    let userId = localStorage.getItem('vi_user_id');

    if (!siteId) {
        // Fallback: Check if user defined a global var
        if (window.VI_SITE_ID) siteId = window.VI_SITE_ID;
        else {
            console.warn('Tracker: No data-site-id attribute found on script tag. Tracking disabled.');
            return;
        }
    }

    if (!sessionId) {
        sessionId = 'sess_' + Date.now() + '_' + Math.random().toString(36).substring(2, 15);
        localStorage.setItem('vi_session_id', sessionId);
    }
    if (!userId) {
        userId = 'user_' + Math.random().toString(36).substring(2, 15);
        localStorage.setItem('vi_user_id', userId);
    }



    // --- Helper: GraphQL Fetcher ---
    async function graphqlFetch(query, variables = {}) {
        const response = await fetch(CONFIG.graphqlEndpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-site-id': siteId,
                'x-api-key': apiKey
            },
            body: JSON.stringify({ query, variables })
        });
        const result = await response.json();
        if (result.errors) {
            throw new Error(result.errors[0].message);
        }
        return result.data;
    }

    // Signal Accumulator
    let signals = {
        dwell_time: {}, // element_id: seconds
        scroll_velocity: 0, // max pixels/sec observed
        scroll_depth: 0, // max percentage of page viewed
        hesitation_event: false,
        rage_clicks: 0,
        copy_text: [],
        text_selections: [], // strings highlighted
        dead_clicks: [], // selectors of non-interactive clicks
        events: [], // generic events
        interactions: {}, // element_selector -> { clicks: 0, hovers: 0, inputs: 0, last_timestamp: timestamp }
        url: window.location.href, // Initial URL
        referrer: document.referrer, // Traffic source
        // New Signals
        forms: {}, // field_name -> { time_focused: ms, refills: count }
        performance: {}, // lcp, cls, fid
        errors: [], // { msg, stack, time }
        mouse_trace: [] // { x, y, time } (sampled)
    };

    // Internal Logic State
    let lastScrollY = window.scrollY;
    let lastScrollTime = Date.now();
    let clickCounts = {}; // element_selector -> {count, time}
    let ctaHoverTimer = null;
    let activeDwellTimers = {}; // id -> startTime
    let accumulatedDwell = {}; // id -> totalMs

    // Lifecycle Control
    let batchTimer = null;
    let startUpTimer = null;
    let mutationObserver = null;
    let isTrackingActive = false; // Disabled until config loaded

    // --- Helper: Generate robust selector ---
    function getSelector(el) {
        if (!el) return '';
        if (el.id) return '#' + el.id;
        let selector = el.tagName.toLowerCase();
        if (el.className && typeof el.className === 'string' && el.className.trim() !== '') {
            selector += '.' + el.className.trim().split(/\s+/).join('.');
        }
        return selector;
    }

    // --- Helper: Track specific interaction ---
    function trackInteraction(el, type) {
        if (!isTrackingActive || !el) return;
        if (el === document.body || el === document.documentElement) return;

        const selector = getSelector(el);
        if (!signals.interactions[selector]) {
            signals.interactions[selector] = { clicks: 0, hovers: 0, inputs: 0, last_timestamp: Date.now() };
        }

        if (type === 'click') signals.interactions[selector].clicks++;
        else if (type === 'hover') signals.interactions[selector].hovers++;
        else if (type === 'input') signals.interactions[selector].inputs++;

        signals.interactions[selector].last_timestamp = Date.now();
    }


    // --- Dwell Time (IntersectionObserver) ---
    const observerOptions = {
        threshold: 0.1
    };

    let pausedDwellTimers = {};

    const dwellObserver = new IntersectionObserver((entries) => {
        if (!isTrackingActive) return;
        const now = Date.now();
        entries.forEach(entry => {
            const id = entry.target.id;
            if (!id) return;

            if (entry.isIntersecting) {
                if (document.visibilityState === 'visible') {
                    activeDwellTimers[id] = now;
                } else {
                    pausedDwellTimers[id] = true;
                }
            } else {
                if (activeDwellTimers[id]) {
                    const duration = now - activeDwellTimers[id];
                    accumulatedDwell[id] = (accumulatedDwell[id] || 0) + duration;
                    delete activeDwellTimers[id];
                }
                if (pausedDwellTimers[id]) {
                    delete pausedDwellTimers[id];
                }
            }
        });
    }, observerOptions);

    document.addEventListener('visibilitychange', () => {
        const now = Date.now();
        if (document.hidden) {
            for (const id in activeDwellTimers) {
                const duration = now - activeDwellTimers[id];
                accumulatedDwell[id] = (accumulatedDwell[id] || 0) + duration;
                pausedDwellTimers[id] = true;
            }
            activeDwellTimers = {};
        } else {
            for (const id in pausedDwellTimers) {
                activeDwellTimers[id] = now;
            }
            pausedDwellTimers = {};
        }
    });

    function initObserver() {
        const selector = 'section, article, div[id]';
        const targets = document.querySelectorAll(selector);
        targets.forEach(el => {
            if (el.id) dwellObserver.observe(el);
        });

        mutationObserver = new MutationObserver((mutations) => {
            if (!isTrackingActive) return;
            mutations.forEach((mutation) => {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === 1) {
                        if (node.matches && node.matches(selector)) {
                            if (node.id) dwellObserver.observe(node);
                        }
                        if (node.querySelectorAll) {
                            node.querySelectorAll(selector).forEach(el => {
                                if (el.id) dwellObserver.observe(el);
                            });
                        }
                    }
                });
            });
        });

        mutationObserver.observe(document.body, { childList: true, subtree: true });
    }

    // --- Scroll ---
    window.addEventListener('scroll', () => {
        if (!isTrackingActive) return;
        const now = Date.now();
        const dt = now - lastScrollTime;

        // Velocity
        if (dt > 100) {
            const dy = Math.abs(window.scrollY - lastScrollY);
            const speed = (dy / dt) * 1000;
            if (speed > signals.scroll_velocity) {
                signals.scroll_velocity = parseFloat(speed.toFixed(2));
            }
            lastScrollY = window.scrollY;
            lastScrollTime = now;
        }

        // Scroll Depth
        const docHeight = document.documentElement.scrollHeight - window.innerHeight;
        const scrolled = window.scrollY;
        if (docHeight > 0) {
            const percentage = Math.round((scrolled / docHeight) * 100);
            if (percentage > signals.scroll_depth) {
                signals.scroll_depth = percentage;
            }
        }
    }, { passive: true });


    // --- Global Interaction Tracking ---
    document.addEventListener('click', (e) => {
        if (!isTrackingActive) return;
        const target = e.target;
        trackInteraction(target, 'click');

        // Dead Clicks (Non-interactive elements)
        const interactiveTags = ['A', 'BUTTON', 'INPUT', 'SELECT', 'TEXTAREA', 'LABEL', 'VIDEO', 'AUDIO'];
        const isInteractive = interactiveTags.includes(target.tagName) ||
            target.onclick != null ||
            target.closest('a, button, input, select, textarea') != null ||
            window.getComputedStyle(target).cursor === 'pointer';

        if (!isInteractive) {
            const selector = getSelector(target);
            // Limit stored dead clicks to avoid potential spam
            if (signals.dead_clicks.length < 10) {
                signals.dead_clicks.push({
                    selector: selector,
                    x: e.clientX,
                    y: e.clientY,
                    timestamp: Date.now()
                });
            }
        }

        // Rage Clicks
        const selector = getSelector(target);
        const now = Date.now();

        if (!clickCounts[selector]) {
            clickCounts[selector] = { count: 1, firstClick: now };
        } else {
            const data = clickCounts[selector];
            if (now - data.firstClick < 1000) {
                data.count++;
                if (data.count === 4) {
                    signals.rage_clicks++;
                }
            } else {
                clickCounts[selector] = { count: 1, firstClick: now };
            }
        }
    }, { capture: true });

    document.addEventListener('input', (e) => {
        if (!isTrackingActive) return;
        trackInteraction(e.target, 'input');
    }, { capture: true });

    let lastHoverTarget = null;
    let hoverTimeout = null;
    document.addEventListener('mouseover', (e) => {
        if (!isTrackingActive) return;
        if (e.target === lastHoverTarget) return;

        lastHoverTarget = e.target;
        if (hoverTimeout) clearTimeout(hoverTimeout);

        hoverTimeout = setTimeout(() => {
            trackInteraction(e.target, 'hover');
        }, 200);
    }, { capture: true });


    // --- Hesitation ---
    document.addEventListener('mousemove', (e) => {
        if (!isTrackingActive) return;
        const target = e.target;
        const cta = target.closest('button, a, .cta');

        if (cta) {
            if (!ctaHoverTimer) {
                ctaHoverTimer = setTimeout(() => {
                    signals.hesitation_event = true;
                }, 2000);
            }
        } else {
            if (ctaHoverTimer) {
                clearTimeout(ctaHoverTimer);
                ctaHoverTimer = null;
            }
        }
    });

    document.addEventListener('click', () => {
        if (ctaHoverTimer) {
            clearTimeout(ctaHoverTimer);
            ctaHoverTimer = null;
        }
    });

    // --- Copy Text ---
    document.addEventListener('copy', () => {
        if (!isTrackingActive) return;
        const selection = window.getSelection().toString();
        if (selection && selection.length > 0) {
            signals.copy_text.push(selection.substring(0, 100));
        }
    });

    // --- Text Selection (Interest Signal) ---
    let selectionTimeout = null;
    document.addEventListener('selectionchange', () => {
        if (!isTrackingActive) return;
        if (selectionTimeout) clearTimeout(selectionTimeout);

        selectionTimeout = setTimeout(() => {
            const selection = window.getSelection().toString().trim();
            if (selection.length > 5 && selection.length < 200) { // Filter accidental/too long
                // Avoid duplicates
                if (!signals.text_selections.includes(selection)) {
                    signals.text_selections.push(selection);
                }
            }
        }, 1000); // Only capture after 1s of stable selection
    });

    // --- Exit Intent ---
    document.addEventListener('mouseleave', (e) => {
        if (!isTrackingActive) return;
        if (e.clientY <= 0) {
            signals.events.push({ type: 'exit_intent', timestamp: Date.now() });
        }
    });

    // --- Form Analytics ---
    const formTimers = {};
    document.addEventListener('focus', (e) => {
        if (!isTrackingActive) return;
        const target = e.target;
        if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT') {
            const name = target.name || target.id || getSelector(target);
            formTimers[name] = Date.now();
        }
    }, { capture: true });

    document.addEventListener('blur', (e) => {
        if (!isTrackingActive) return;
        const target = e.target;
        if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT') {
            const name = target.name || target.id || getSelector(target);
            if (formTimers[name]) {
                const duration = Date.now() - formTimers[name];
                if (!signals.forms[name]) signals.forms[name] = { time_focused: 0, refills: 0 };
                signals.forms[name].time_focused += duration;
                delete formTimers[name];
            }
        }
    }, { capture: true });

    document.addEventListener('change', (e) => {
        if (!isTrackingActive) return;
        const target = e.target;
        if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
            const name = target.name || target.id || getSelector(target);
            if (!signals.forms[name]) signals.forms[name] = { time_focused: 0, refills: 0 };
            signals.forms[name].refills++;
        }
    }, { capture: true });

    // --- Performance (Web Vitals) ---
    if (window.PerformanceObserver) {
        try {
            const perfObserver = new PerformanceObserver((list) => {
                list.getEntries().forEach((entry) => {
                    if (entry.entryType === 'largest-contentful-paint') {
                        signals.performance.lcp = entry.startTime;
                    }
                    if (entry.entryType === 'layout-shift' && !entry.hadRecentInput) {
                        signals.performance.cls = (signals.performance.cls || 0) + entry.value;
                    }
                    if (entry.entryType === 'first-input') {
                        signals.performance.fid = entry.processingStart - entry.startTime;
                    }
                });
            });
            perfObserver.observe({ type: 'largest-contentful-paint', buffered: true });
            perfObserver.observe({ type: 'layout-shift', buffered: true });
            perfObserver.observe({ type: 'first-input', buffered: true });
        } catch (e) { console.warn("Tracker: PerfObserver error", e); }
    }

    // --- JS Errors ---
    window.addEventListener('error', (e) => {
        if (!isTrackingActive) return;
        if (signals.errors.length < 5) {
            signals.errors.push({
                msg: e.message,
                stack: e.error ? e.error.stack : '',
                time: Date.now()
            });
        }
    });

    // --- Mouse Trace (Sampled) ---
    let mouseSampleTimer = null;
    document.addEventListener('mousemove', (e) => {
        if (!isTrackingActive) return;
        if (mouseSampleTimer) return;
        mouseSampleTimer = setTimeout(() => {
            if (signals.mouse_trace.length < 50) { // Limit per batch
                signals.mouse_trace.push({ x: e.clientX, y: e.clientY, time: Date.now() });
            }
            mouseSampleTimer = null;
        }, 200); // 5 samples/sec
    }, { passive: true });


    // --- Batch Processing ---
    async function sendBatch() {
        // Finalize dwell times
        const now = Date.now();
        for (const id in activeDwellTimers) {
            const duration = now - activeDwellTimers[id];
            accumulatedDwell[id] = (accumulatedDwell[id] || 0) + duration;
            activeDwellTimers[id] = now;
        }

        for (const id in accumulatedDwell) {
            signals.dwell_time[id] = parseFloat((accumulatedDwell[id] / 1000).toFixed(1));
        }

        // Ensure URL is up to date
        signals.url = window.location.href;

        const hasData = Object.keys(signals.dwell_time).length > 0 ||
            signals.scroll_velocity > 0 ||
            signals.scroll_depth > 0 ||
            signals.hesitation_event ||
            signals.rage_clicks > 0 ||
            signals.copy_text.length > 0 ||
            signals.text_selections.length > 0 ||
            signals.dead_clicks.length > 0 ||
            signals.events.length > 0 ||
            Object.keys(signals.interactions).length > 0;

        if (!hasData) return;

        const metadata = {
            screen: {
                width: window.screen.width,
                height: window.screen.height,
                colorDepth: window.screen.colorDepth,
                orientation: (screen.orientation || {}).type
            },
            language: navigator.language,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            platform: navigator.platform,
            connection: navigator.connection ? navigator.connection.effectiveType : 'unknown'
        };

        const input = {
            sessionId,
            signals: {
                dwell_time: JSON.stringify(signals.dwell_time),
                scroll_velocity: signals.scroll_velocity,
                scroll_depth: signals.scroll_depth,
                hesitation_event: signals.hesitation_event,
                rage_clicks: signals.rage_clicks,
                copy_text: signals.copy_text,
                text_selections: signals.text_selections,
                events: JSON.stringify(signals.events),
                interactions: JSON.stringify(signals.interactions),
                url: window.location.href,
                referrer: document.referrer,
                forms: JSON.stringify(signals.forms),
                performance: JSON.stringify(signals.performance),
                errors: JSON.stringify(signals.errors),
                mouse_trace: JSON.stringify(signals.mouse_trace)
            },
            timestamp: Date.now(),
            pageUrl: window.location.href,
            referrer: document.referrer,
            userAgent: navigator.userAgent,
            metadata: JSON.stringify(metadata),
            eventType: 'batch'
        };

        const mutation = `
            mutation Track($siteId: String!, $apiKey: String!, $input: TrackInput!) {
                track(siteId: $siteId, apiKey: $apiKey, input: $input) {
                    sessionId
                    intent_category
                    current_score
                    suggested_action
                    ui_payload
                }
            }
        `;

        // Reset
        signals = {
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
            forms: {},
            performance: {},
            errors: [],
            mouse_trace: []
        };
        accumulatedDwell = {};

        try {
            const data = await graphqlFetch(mutation, { siteId, apiKey: apiKey || 'sk_public', input });
            if (data && data.track) {
                handleServerResponse(data.track);
            }
        } catch (e) {
            console.warn("Tracker: Failed to send batch", e);
        }
    }

    // --- Action Layer ---
    function handleServerResponse(data) {
        if (!data) return;
        if (data.ui_payload) {
            try {
                const payload = JSON.parse(data.ui_payload);
                injectAiUi(payload);
            } catch (e) {
                console.error("Tracker: Failed to parse UI payload", e);
            }
            return;
        }
    }

    function injectAiUi(payload) {
        const { injection_target_selector, html_payload, scoped_css, javascript_payload } = payload;
        if (document.getElementById('vi-ai-host')) return;

        stopTracking();

        const targetElement = document.querySelector(injection_target_selector) || document.body;
        const host = document.createElement('div');
        host.id = 'vi-ai-host';
        host.style.cssText = "position: relative; z-index: 2147483647;";
        const shadow = host.attachShadow({ mode: 'open' });

        shadow.innerHTML = `
    <style>
      ${scoped_css}
      :host { all: initial; display: block; }
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
      <button class="vi-internal-close" title="Close">×</button>
      ${html_payload}
    </div>
  `;

        // Inject JS *after* HTML is ready
        if (javascript_payload) {
            const script = document.createElement('script');
            // Wrap in a closure and proxy 'document' to point to shadowRoot for selectors
            script.textContent = `
                (function() {
                    const host = document.getElementById('vi-ai-host');
                    if (!host || !host.shadowRoot) return;
                    const shadow = host.shadowRoot;
                    
                    const docProxy = new Proxy(document, {
                        get: (target, prop) => {
                            // Redirect selector methods to shadow root
                            if (['getElementById', 'querySelector', 'querySelectorAll'].includes(prop)) {
                                return shadow[prop].bind(shadow);
                            }
                            // Fallback for everything else (createElement, head, body, etc.)
                            const val = target[prop];
                            return typeof val === 'function' ? val.bind(target) : val;
                        }
                    });

                    // Execute payload with hijacked document
                    (function(document) {
                        try {
                            ${javascript_payload}
                        } catch(e) {
                            console.error("Tracker: AI JS Error", e);
                        }
                    })(docProxy);
                })();
            `;
            shadow.appendChild(script);
        }
        if (injection_target_selector === 'body') {
            Object.assign(host.style, {
                position: 'fixed', bottom: '20px', right: '20px', width: 'auto', maxWidth: '400px'
            });
            document.body.appendChild(host);
        } else {
            targetElement.appendChild(host);
        }

        shadow.addEventListener('click', (e) => {
            const target = e.target;
            const isCloseAction = target.classList.contains('vi-internal-close') ||
                target.classList.contains('close-btn') || target.closest('[data-action="close"]');
            if (isCloseAction) {
                host.remove();
            }
        });
        console.log(`Tracker: Injected AI UI into ${injection_target_selector}`);
    }

    function stopTracking() {
        isTrackingActive = false;
        if (batchTimer) clearInterval(batchTimer);
        if (startUpTimer) clearTimeout(startUpTimer);
        if (dwellObserver) dwellObserver.disconnect();
        if (mutationObserver) mutationObserver.disconnect();
        console.log("Tracker: Tracking behavior stopped (AI UI Active).");
    }

    // --- Initialization with Config Fetch ---
    async function bootstrap() {
        console.log("Tracker: Initializing (GraphQL)...");

        try {
            // Fetch configuration via GraphQL
            const query = `
                query GetSiteConfig($siteId: String!) {
                    getSiteConfig(siteId: $siteId) {
                        settings
                        allowedDomains
                        isActive
                    }
                }
            `;

            const data = await graphqlFetch(query, { siteId });
            const config = data.getSiteConfig;

            // 1. Check if active
            if (!config.isActive) {
                console.log("Tracker: Site is disabled. Stopping.");
                return;
            }

            // 2. Check Allowed Domains
            if (window.VI_DEV_MODE) {
                console.log("Tracker: Dev Mode detected. Bypassing domain check.");
            } else if (config.allowedDomains && config.allowedDomains.length > 0) {
                const currentDomain = window.location.hostname;
                const isAllowed = config.allowedDomains.some(d => currentDomain.includes(d) || d.includes(currentDomain));
                if (!isAllowed) {
                    console.warn(`Tracker: Domain ${currentDomain} not in allowed list. Stopping.`);
                    return;
                }
            }

            // 3. Apply settings
            let settings = {};
            if (config.settings) {
                try {
                    settings = JSON.parse(config.settings);
                } catch (e) {
                    console.error("Tracker: Failed to parse settings", e);
                }
            }

            if (settings.trackingStartDelay) {
                CONFIG.startUpDelay = settings.trackingStartDelay;
            }

            console.log(`Tracker: Config loaded. Starting in ${CONFIG.startUpDelay}ms...`);

            // Start Tracking
            startUpTimer = setTimeout(() => {
                isTrackingActive = true;
                console.log("Tracker: Tracking started.");
                initObserver();

                // Send first batch immediately or queue it? 
                // Using interval for batches.
                batchTimer = setInterval(sendBatch, CONFIG.batchInterval);

            }, CONFIG.startUpDelay);

        } catch (error) {
            console.error("Tracker: Error during initialization", error);
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', bootstrap);
    } else {
        bootstrap();
    }

})();
