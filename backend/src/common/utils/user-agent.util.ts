
export interface UserAgentInfo {
    browser: string;
    os: string;
    deviceType: 'Desktop' | 'Mobile' | 'Tablet';
}

export function parseUserAgent(userAgent: string): UserAgentInfo {
    const ua = userAgent.toLowerCase();

    // Device Type
    let deviceType: 'Desktop' | 'Mobile' | 'Tablet' = 'Desktop';
    if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
        deviceType = 'Tablet';
    } else if (/Mobile|iP(hone|od)|Android|BlackBerry|IEMobile|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(ua)) {
        deviceType = 'Mobile';
    }

    // Browser
    let browser = 'Unknown';
    if (ua.indexOf('firefox') > -1) {
        browser = 'Firefox';
    } else if (ua.indexOf('samsung') > -1) {
        browser = 'Samsung Internet';
    } else if (ua.indexOf('opera') > -1 || ua.indexOf('opr') > -1) {
        browser = 'Opera';
    } else if (ua.indexOf('trident') > -1) {
        browser = 'Internet Explorer';
    } else if (ua.indexOf('edge') > -1) {
        browser = 'Edge';
    } else if (ua.indexOf('chrome') > -1) {
        browser = 'Chrome';
    } else if (ua.indexOf('safari') > -1) {
        browser = 'Safari';
    }

    // OS
    let os = 'Unknown';
    if (ua.indexOf('win') > -1) {
        os = 'Windows';
    } else if (ua.indexOf('mac') > -1) {
        os = 'MacOS';
    } else if (ua.indexOf('linux') > -1) {
        os = 'Linux';
    } else if (ua.indexOf('android') > -1) {
        os = 'Android';
    } else if (ua.indexOf('ios') > -1 || ua.indexOf('iphone') > -1 || ua.indexOf('ipad') > -1) {
        os = 'iOS';
    }

    return { browser, os, deviceType };
}
