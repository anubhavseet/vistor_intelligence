/**
 * AI-Powered Intent Engine Tracker SDK
 * 
 * Captures behavioral signals (dwell time, scroll velocity, rage clicks, etc.)
 * and batches them to the backend for intent analysis.
 */

(function () {
  'use strict';

  // Configuration
  const CONFIG = {
    endpoint: 'http://localhost:4040/api/v1/track',
    batchInterval: 20000,
    idleThreshold: 1000,
    maxRetries: 3,
    startUpDelay: 1000 // ms wait before sending first batch
  };

  // State
  let sessionId = localStorage.getItem('vi_session_id');
  let userId = localStorage.getItem('vi_user_id');

  if (!sessionId) {
    sessionId = 'sess_' + Date.now() + '_' + Math.random().toString(36).substring(2, 15);
    localStorage.setItem('vi_session_id', sessionId);
  }
  if (!userId) {
    userId = 'user_' + Math.random().toString(36).substring(2, 15);
    localStorage.setItem('vi_user_id', userId);
  }

  // Signal Accumulator
  let signals = {
    dwell_time: {}, // element_id: seconds
    scroll_velocity: 0, // max pixels/sec observed
    hesitation_event: false,
    rage_clicks: 0,
    copy_text: [],
    events: [] // generic events
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
  let isTrackingActive = true; // Start collecting immediately


  // --- Dwell Time (IntersectionObserver) ---
  const observerOptions = {
    threshold: 0.1 // 10% visibility to support large elements
  };

  let pausedDwellTimers = {}; // Store IDs when page is hidden

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
          // It's intersecting but page is hidden; mark to start when visible
          pausedDwellTimers[id] = true;
        }
      } else {
        // Left the view
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

  // Handle Tab Switching / Visibility
  document.addEventListener('visibilitychange', () => {
    const now = Date.now();
    if (document.hidden) {
      // Pause all timers
      for (const id in activeDwellTimers) {
        const duration = now - activeDwellTimers[id];
        accumulatedDwell[id] = (accumulatedDwell[id] || 0) + duration;
        pausedDwellTimers[id] = true;
      }
      activeDwellTimers = {};
    } else {
      // Resume timers
      for (const id in pausedDwellTimers) {
        activeDwellTimers[id] = now;
      }
      pausedDwellTimers = {};
    }
  });

  // Initialize Observer on relevant sections (Supports Dynamic Content)
  function initObserver() {
    const selector = 'section, article, div[id]';

    // 1. Initial Scan
    const targets = document.querySelectorAll(selector);
    targets.forEach(el => {
      if (el.id) dwellObserver.observe(el);
    });

    // 2. MutationObserver for dynamic content
    mutationObserver = new MutationObserver((mutations) => {
      if (!isTrackingActive) return;
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === 1) { // Element
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

  // --- Scroll Velocity ---
  window.addEventListener('scroll', () => {
    if (!isTrackingActive) return;
    const now = Date.now();
    const dt = now - lastScrollTime;
    if (dt > 100) { // Throttle calc
      const dy = Math.abs(window.scrollY - lastScrollY);
      const speed = (dy / dt) * 1000; // px per second
      // Keep the max velocity observed in the batch window
      if (speed > signals.scroll_velocity) {
        signals.scroll_velocity = parseFloat(speed.toFixed(2));
      }
      lastScrollY = window.scrollY;
      lastScrollTime = now;
    }
  }, { passive: true });

  // --- Hesitation (Cursor near CTA) ---
  document.addEventListener('mousemove', (e) => {
    if (!isTrackingActive) return;
    const target = e.target;
    // Check if target or parent is CTA (button/a)
    const cta = target.closest('button, a, .cta');

    if (cta) {
      if (!ctaHoverTimer) {
        ctaHoverTimer = setTimeout(() => {
          signals.hesitation_event = true;
        }, 2000); // 2s threshold
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

  // --- Rage Clicks ---
  document.addEventListener('click', (e) => {
    if (!isTrackingActive) return;
    const target = e.target;
    // Simple selector generation
    const selector = target.id ? `#${target.id}` : target.tagName + (target.className ? `.${target.className.split(' ').join('.')}` : '');
    console.log("Target: ", target);
    console.log("Selector: ", selector);
    const now = Date.now();

    if (!clickCounts[selector]) {
      clickCounts[selector] = { count: 1, firstClick: now };
    } else {
      const data = clickCounts[selector];
      if (now - data.firstClick < 1000) {
        data.count++;
        if (data.count > 3) {
          // If not already counted as rage click for this element in this batch
          // We just increment a counter for the batch
          // Or we can track *where* it happened. Spec says "Integer", so accumulation is fine.
          // But let's be careful not to over-count (e.g. 5 clicks = 3 rage clicks?)
          // Just detect the event once per burst.
          if (data.count === 4) { // Trigger only on the 4th click
            signals.rage_clicks++;
          }
        }
      } else {
        // Reset window
        clickCounts[selector] = { count: 1, firstClick: now };
      }
    }
  });

  // --- Copy Text ---
  document.addEventListener('copy', () => {
    if (!isTrackingActive) return;
    const selection = window.getSelection().toString();
    if (selection && selection.length > 0) {
      signals.copy_text.push(selection.substring(0, 100)); // Limit length
    }
  });

  // --- Exit Intent (Bouncer detection support) ---
  document.addEventListener('mouseleave', (e) => {
    if (!isTrackingActive) return;
    if (e.clientY <= 0) {
      signals.events.push({ type: 'exit_intent', timestamp: Date.now() });
    }
  });


  // --- Batch Processing ---
  async function sendBatch() {
    // Finalize dwell times for currently active elements
    const now = Date.now();
    for (const id in activeDwellTimers) {
      const duration = now - activeDwellTimers[id];
      accumulatedDwell[id] = (accumulatedDwell[id] || 0) + duration;
      activeDwellTimers[id] = now; // Reset start time for next batch
    }

    // Convert accumulated ms to seconds for report
    for (const id in accumulatedDwell) {
      signals.dwell_time[id] = parseFloat((accumulatedDwell[id] / 1000).toFixed(1));
    }

    // Check if we have any data to send
    const hasData = Object.keys(signals.dwell_time).length > 0 ||
      signals.scroll_velocity > 0 ||
      signals.hesitation_event ||
      signals.rage_clicks > 0 ||
      signals.copy_text.length > 0 ||
      signals.events.length > 0;

    if (!hasData) return; // Skip empty batches

    const payload = {
      userId,
      sessionId,
      signals: { ...signals }, // shallow copy
      timestamp: Date.now()
    };

    // Reset signals
    signals = {
      dwell_time: {},
      scroll_velocity: 0,
      hesitation_event: false,
      rage_clicks: 0,
      copy_text: [],
      events: []
    };
    accumulatedDwell = {}; // Reset processed dwell accumulator

    try {
      const response = await fetch(CONFIG.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        keepalive: true
      });

      if (response.ok) {
        const data = await response.json();
        handleServerResponse(data);
      }
    } catch (e) {
      console.warn("Tracker: Failed to send batch", e);
    }
  }

  // --- Action Layer (UI Triggers) ---
  // --- Action Layer (UI Triggers) ---
  function handleServerResponse(data) {
    if (!data) return;

    // 1. Check for AI UI Payload (Pre-rendered by backend)
    if (data.ui_payload) {
      injectAiUi(data.ui_payload);
      return;
    }

    // 2. Fallback to Simple Actions (Legacy)
    // if (data.suggested_action) {
    //   const action = data.suggested_action;
    //   console.log("Tracker: Suggested Action", action);

    //   // Prevent duplicate duplicates if any overlay exists
    //   if (document.getElementById('vi-ai-root') || document.getElementById('vi-overlay')) return;

    //   if (action === 'priority_support_chat') {
    //     showOverlay("Priority Support Chat", "Need help? Chat with an expert now!");
    //   } else if (action === 'download_pdf') {
    //     showOverlay("Download Comparison PDF", "Get the full feature breakdown.");
    //   } else if (action === 'discount_modal') {
    //     showOverlay("Wait!", "Here is a 15% discount code: STAY15");
    //   }
    // }
  }

  /**
   * Inject AI-generated UI using Shadow DOM to isolate styles.
   */
  function injectAiUi(payload) {
    const { injection_target_selector, html_payload, scoped_css } = payload;

    if (document.getElementById('vi-ai-host')) return;

    // Stop tracking immediately when AI UI is shown
    stopTracking();

    const targetElement = document.querySelector(injection_target_selector) || document.body;

    const host = document.createElement('div');
    host.id = 'vi-ai-host';
    // High z-index to ensure it's on top
    host.style.cssText = "position: relative; z-index: 2147483647;";

    const shadow = host.attachShadow({ mode: 'open' });

    // 1. Define a standard Close Button Style + The AI CSS
    shadow.innerHTML = `
    <style>
      ${scoped_css}
      
      :host { all: initial; display: block; }
      * { box-sizing: border-box; }

      /* Our Standard Global Close Button */
      .vi-internal-close {
        position: absolute;
        top: 10px;
        right: 10px;
        width: 24px;
        height: 24px;
        background: rgba(0,0,0,0.3);
        color: white;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        font-size: 16px;
        line-height: 1;
        border: none;
        transition: background 0.2s;
        z-index: 100;
      }
      .vi-internal-close:hover { background: rgba(0,0,0,0.6); }
    </style>
    
    <div style="position: relative; width: 100%; height: 100%;">
      <button class="vi-internal-close" title="Close">×</button>
      ${html_payload}
    </div>
  `;

    // 2. Optimized Positioning
    if (injection_target_selector === 'body') {
      Object.assign(host.style, {
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        width: 'auto',
        maxWidth: '400px'
      });
      document.body.appendChild(host);
    } else {
      targetElement.appendChild(host);
    }

    // 3. Event Delegation for Closing
    // This catches both our internal button AND any button the AI might have tagged
    shadow.addEventListener('click', (e) => {
      const target = e.target;
      const isCloseAction =
        target.classList.contains('vi-internal-close') ||
        target.classList.contains('close-btn') ||
        target.closest('[data-action="close"]');

      if (isCloseAction) {
        console.log("Tracker: UI Closed by user.");
        host.remove();
      }
    });

    console.log(`Tracker: Injected AI UI into ${injection_target_selector}`);
  }

  function showOverlay(title, message) {
    const div = document.createElement('div');
    div.id = 'vi-overlay';
    div.style.cssText = `
        position: fixed; bottom: 20px; right: 20px; 
        background: #fff; padding: 20px; border-radius: 8px; 
        box-shadow: 0 4px 12px rgba(0,0,0,0.15); z-index: 10000;
        font-family: system-ui, sans-serif; animation: slideIn 0.3s ease-out;
      `;
    div.innerHTML = `
        <h4 style="margin:0 0 8px 0">${title}</h4>
        <p style="margin:0 0 12px 0; font-size: 14px; color: #666">${message}</p>
        <button id="vi-close-btn" style="
            background: #000; color: #fff; border: none; padding: 8px 12px; 
            border-radius: 4px; cursor: pointer; font-size: 12px;">Close</button>
      `;

    const style = document.createElement('style');
    style.innerHTML = `@keyframes slideIn { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }`;
    document.head.appendChild(style);

    document.body.appendChild(div);

    // Clean listener
    document.getElementById('vi-close-btn').onclick = () => div.remove();
  }

  // Helper to ensure DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initObserver);
  } else {
    initObserver();
  }

  function stopTracking() {
    isTrackingActive = false;
    if (batchTimer) clearInterval(batchTimer);
    if (startUpTimer) clearTimeout(startUpTimer);
    if (dwellObserver) dwellObserver.disconnect();
    if (mutationObserver) mutationObserver.disconnect();
    console.log("Tracker: Tracking behavior stopped (AI UI Active).");
  }

  // Initialization: Start collecting immediately, send first batch after delay
  function bootstrap() {
    console.log("Tracker: Initializing signal collection...");
    initObserver();

    startUpTimer = setTimeout(() => {
      if (!isTrackingActive) return;
      console.log("Tracker: Sending first batch...");
      sendBatch();
      batchTimer = setInterval(sendBatch, CONFIG.batchInterval);
    }, CONFIG.startUpDelay);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootstrap);
  } else {
    bootstrap();
  }

})();
