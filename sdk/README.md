# Visitor Intelligence Tracking SDK

Lightweight JavaScript SDK for tracking anonymous visitor behavior.

## Usage

Include the script on your website:

```html
<script src="https://cdn.myapp.com/tracker.js" data-site-id="YOUR_SITE_ID"></script>
```

## Features

- Privacy-compliant (no cookies, no fingerprinting)
- Session-based tracking
- Automatic page view tracking
- Scroll depth tracking
- Click event tracking (non-PII)
- Time on page tracking
- UTM parameter capture

## Manual Tracking

```javascript
// Track custom event
window.VisitorIntelligence.track('custom_event', {
  metadata: { customData: 'value' }
});

// Get current session ID
const sessionId = window.VisitorIntelligence.getSessionId();
```

## Privacy

- No cookies stored
- No device fingerprinting
- No cross-site tracking
- IP addresses are hashed server-side
- Session-based only
