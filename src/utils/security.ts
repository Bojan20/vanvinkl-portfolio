/**
 * Security Utilities
 *
 * Input validation for user-controlled paths and data.
 */

/**
 * Validate media file path (images, audio, video)
 *
 * SECURITY: Only allows relative paths starting with /
 * Prevents:
 * - Absolute URLs (http://, https://, //)
 * - Data URLs (data:)
 * - Blob URLs (blob:)
 * - File URLs (file:)
 * - Protocol-relative URLs (//)
 *
 * @param path - Path to validate
 * @returns true if safe, false otherwise
 */
export function isValidMediaPath(path: string | undefined): boolean {
  if (!path || typeof path !== 'string') return false

  // Must start with / (relative path)
  if (!path.startsWith('/')) return false

  // Block absolute URLs
  if (path.includes('://')) return false

  // Block protocol-relative URLs
  if (path.startsWith('//')) return false

  // Block data/blob URLs
  if (path.startsWith('data:') || path.startsWith('blob:')) return false

  // Block parent directory traversal (raw and URL-encoded)
  const decoded = decodeURIComponent(path)
  if (decoded.includes('../') || decoded.includes('..\\')) return false
  if (path.includes('../') || path.includes('..\\')) return false

  return true
}

/**
 * Validate localStorage key
 *
 * SECURITY: Only allows alphanumeric + dash + underscore
 * Prevents injection attacks via localStorage keys
 *
 * @param key - Key to validate
 * @returns true if safe, false otherwise
 */
export function isValidStorageKey(key: string | undefined): boolean {
  if (!key || typeof key !== 'string') return false

  // Only alphanumeric, dash, underscore (no special chars)
  const validPattern = /^[a-zA-Z0-9_-]+$/
  return validPattern.test(key)
}

/**
 * Safely get item from localStorage with validation
 *
 * @param key - Storage key
 * @returns Value or null if invalid/missing
 */
export function safeGetLocalStorage(key: string): string | null {
  if (!isValidStorageKey(key)) {
    console.warn(`[Security] Invalid localStorage key: ${key}`)
    return null
  }

  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

/**
 * Safely set item in localStorage with validation
 *
 * @param key - Storage key
 * @param value - Value to store
 * @returns true if successful, false otherwise
 */
export function safeSetLocalStorage(key: string, value: string): boolean {
  if (!isValidStorageKey(key)) {
    console.warn(`[Security] Invalid localStorage key: ${key}`)
    return false
  }

  try {
    localStorage.setItem(key, value)
    return true
  } catch {
    return false
  }
}

/**
 * Validate external URL for fetch/WebSocket
 *
 * SECURITY: Only allows HTTPS URLs to trusted domains
 *
 * @param url - URL to validate
 * @param allowedDomains - List of allowed domains (optional)
 * @returns true if safe, false otherwise
 */
export function isValidExternalURL(
  url: string | undefined,
  allowedDomains?: string[]
): boolean {
  if (!url || typeof url !== 'string') return false

  try {
    const parsed = new URL(url)

    // Only HTTPS allowed (no HTTP, FTP, etc.)
    if (parsed.protocol !== 'https:') return false

    // If allowedDomains specified, check domain whitelist
    if (allowedDomains && allowedDomains.length > 0) {
      const isAllowed = allowedDomains.some(domain =>
        parsed.hostname === domain || parsed.hostname.endsWith('.' + domain)
      )
      if (!isAllowed) return false
    }

    return true
  } catch {
    // Invalid URL
    return false
  }
}
