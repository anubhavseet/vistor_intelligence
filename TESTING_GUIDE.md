# Quick Reference: Testing the Fixed Tracker

## 1. Test Pre-Generated UI

### Setup:
1. Go to Dashboard → Sites → [Your Site] → Settings
2. Enable "Use Pre-Generated AI Intent UI"
3. Click "Save Changes"
4. Make sure you have IntentPrompts created with HTML/CSS/JS

### Test:
1. Open your host website with the tracker script
2. Open browser DevTools (F12) → Console tab
3. Trigger an intent:
   - **Exit Intent**: Move mouse to top of browser window quickly
   - **Hesitation**: Hover over a button/CTA for 2+ seconds without clicking
   - **High Intent**: Interact heavily with pricing/features sections

### Expected Console Output:
```
✅ Tracker: Config loaded. Starting in 1000ms...
✅ Tracker: Tracking started.
✅ Tracker: Attempting to inject AI UI with payload: {injection_target_selector: "body", ...}
✅ Tracker: Target element for injection: <body>...</body>
✅ Tracker: Executing injected JavaScript (if JS payload exists)
✅ Tracker: Successfully injected AI UI into body
✅ Tracker: Tracking behavior stopped (AI UI Active).
```

### What to Look For:
- ✅ UI should appear on screen
- ✅ UI should match your pre-generated design
- ✅ Close button (×) should work
- ✅ Any JavaScript interactions should work
- ✅ No errors in console

---

## 2. Test On-the-Go Generation

### Setup:
1. Go to Dashboard → Sites → [Your Site] → Settings
2. Disable "Use Pre-Generated AI Intent UI"
3. Click "Save Changes"

### Test:
Same as above, but UI will be generated in real-time by Gemini API.

### Expected Console Output:
Same as above, plus backend should log:
```
[Backend] Generating UI on-the-go for intent: high_intent
```

---

## 3. Debug Common Issues

### Issue: No UI Appears

**Check 1: Is tracking active?**
```
Console should show: "Tracker: Tracking started."
If not, check site config endpoint: /api/v1/track/config/{siteId}
```

**Check 2: Was intent triggered?**
```
Console should show batch sends every 20 seconds:
Network tab → Look for POST to /api/v1/track
Check response has ui_payload field
```

**Check 3: Is payload valid?**
```
Console should show: "Tracker: Attempting to inject AI UI"
If you see "No html_payload in UI payload", the backend didn't generate UI
```

**Check 4: Any errors?**
```
Look for red errors in console
Common: "Cannot read property 'shadowRoot'" = script executed before DOM ready
```

### Issue: UI Appears But JavaScript Doesn't Work

**Check 1: Is JavaScript being executed?**
```
Console should show: "Tracker: Executing injected JavaScript"
If not, check if javascript_payload exists in the response
```

**Check 2: JavaScript errors?**
```
Look for: "Tracker: Error in injected JavaScript: ..."
This shows what went wrong in your JS payload
```

**Check 3: Selector issues?**
```javascript
// Your JS might be trying:
document.querySelector('.my-element')  // ❌ Won't work, it's in shadow

// Should be:
const shadowRoot = document.querySelector('#vi-ai-host').shadowRoot;
shadowRoot.querySelector('.my-element')  // ✅ Works!
```

### Issue: UI Doesn't Close

**Check 1: Close button exists?**
```
Inspect shadow DOM (DevTools → Elements → #vi-ai-host → #shadow-root)
Should see: <button class="vi-internal-close">×</button>
```

**Check 2: Event listener attached?**
```
Console should show on click: "Tracker: Close button clicked, removing AI UI"
If not, button isn't receiving click events
```

---

## 4. Network Debugging

### Check Backend Response:

**Request:**
```
POST /api/v1/track
Body: {
  siteId: "site_xxx",
  sessionId: "sess_xxx",
  signals: {...},
  timestamp: 1234567890
}
```

**Expected Response:**
```json
{
  "intent_category": "Lead",
  "current_score": 85,
  "suggested_action": "priority_support_chat",
  "ui_payload": {
    "injection_target_selector": "body",
    "html_payload": "<div>...</div>",
    "scoped_css": ".my-class { color: red; }",
    "javascript_payload": "console.log('Hello');"
  }
}
```

**If `ui_payload` is null:**
- Intent score might be too low (< 50)
- No intent key matched (not: bounce_risk, hesitation, high_intent, researcher)
- Pre-generated UI not found (when enabled) and fallback failed

---

## 5. Quick Fixes

### UI Not Showing:
```javascript
// Open console and manually inject a test UI:
window.testUI = () => {
    const event = new CustomEvent('vi-test-inject', {
        detail: {
            ui_payload: {
                injection_target_selector: 'body',
                html_payload: '<div style="padding:20px;background:white;border:2px solid blue;">TEST UI</div>',
                scoped_css: '',
                javascript_payload: ''
            }
        }
    });
    
    // Trigger the injection manually (you'll need to modify handleServerResponse)
};
```

### Force Intent Trigger:
```javascript
// Open console on host site:
window.forceIntent = () => {
    // Simulate exit intent
    document.dispatchEvent(new MouseEvent('mouseleave', {
        clientY: -10
    }));
};
```

### Check Shadow DOM:
```javascript
// Open console:
const host = document.getElementById('vi-ai-host');
console.log('Host:', host);
console.log('Shadow Root:', host?.shadowRoot);
console.log('Shadow Content:', host?.shadowRoot?.innerHTML);
```

---

## 6. Testing Checklist

- [ ] Tracker script loads without errors
- [ ] Config API call succeeds
- [ ] Tracking starts after delay
- [ ] Signal batches sent every 20s
- [ ] Intent triggers when expected
- [ ] UI payload received from backend
- [ ] UI injection starts (console log)
- [ ] UI appears on screen
- [ ] UI styles are correct
- [ ] UI is interactive
- [ ] JavaScript executes without errors
- [ ] Close button works
- [ ] Tracking stops when UI appears
- [ ] No console errors

---

## 7. Browser DevTools Tips

### View Shadow DOM:
1. Open DevTools (F12)
2. Elements tab
3. Find `<div id="vi-ai-host">`
4. Expand `#shadow-root (open)`
5. Inspect injected content

### Monitor Network:
1. Network tab
2. Filter: XHR
3. Look for `/api/v1/track` requests
4. Check request/response payloads

### Debug JavaScript:
1. Sources tab
2. Event Listener Breakpoints
3. Check "Script First Statement" to debug injected scripts

### Performance:
1. Performance tab
2. Record a session
3. Check if UI injection causes lag
4. Should be < 100ms

---

Good luck testing! 🚀
