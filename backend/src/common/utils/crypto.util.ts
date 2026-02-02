import { createHash } from 'crypto';

/**
 * Crypto Utilities
 * 
 * Privacy-safe hashing functions for sensitive data.
 */

/**
 * Hash an IP address using SHA-256
 * This ensures we never store raw IP addresses.
 */
export function hashIP(ip: string): string {
  return createHash('sha256').update(ip).digest('hex');
}

/**
 * Generate a unique session ID
 */
export function generateSessionId(): string {
  return `sess_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
}
