/**
 * Security Utilities Tests
 *
 * Comprehensive tests for input validation functions.
 * Tests cover both valid inputs and attack vectors.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  isValidMediaPath,
  isValidStorageKey,
  safeGetLocalStorage,
  safeSetLocalStorage,
  isValidExternalURL
} from './security'

describe('isValidMediaPath', () => {
  describe('valid paths', () => {
    it('accepts relative path starting with /', () => {
      expect(isValidMediaPath('/audio/sound.mp3')).toBe(true)
      expect(isValidMediaPath('/images/bg.png')).toBe(true)
      expect(isValidMediaPath('/assets/model.glb')).toBe(true)
    })

    it('accepts nested paths', () => {
      expect(isValidMediaPath('/audio/effects/click.wav')).toBe(true)
      expect(isValidMediaPath('/a/b/c/d/e.mp3')).toBe(true)
    })

    it('accepts paths with various extensions', () => {
      expect(isValidMediaPath('/file.mp3')).toBe(true)
      expect(isValidMediaPath('/file.wav')).toBe(true)
      expect(isValidMediaPath('/file.ogg')).toBe(true)
      expect(isValidMediaPath('/file.png')).toBe(true)
      expect(isValidMediaPath('/file.jpg')).toBe(true)
      expect(isValidMediaPath('/file.webp')).toBe(true)
      expect(isValidMediaPath('/file.glb')).toBe(true)
      expect(isValidMediaPath('/file.gltf')).toBe(true)
    })

    it('accepts paths with hyphens and underscores', () => {
      expect(isValidMediaPath('/audio-files/my_sound.mp3')).toBe(true)
      expect(isValidMediaPath('/my-folder/my_file.wav')).toBe(true)
    })
  })

  describe('invalid paths', () => {
    it('rejects undefined/null', () => {
      expect(isValidMediaPath(undefined)).toBe(false)
      // @ts-expect-error - testing runtime behavior
      expect(isValidMediaPath(null)).toBe(false)
    })

    it('rejects non-string types', () => {
      // @ts-expect-error - testing runtime behavior
      expect(isValidMediaPath(123)).toBe(false)
      // @ts-expect-error - testing runtime behavior
      expect(isValidMediaPath({})).toBe(false)
      // @ts-expect-error - testing runtime behavior
      expect(isValidMediaPath([])).toBe(false)
    })

    it('rejects empty string', () => {
      expect(isValidMediaPath('')).toBe(false)
    })

    it('rejects paths not starting with /', () => {
      expect(isValidMediaPath('audio/sound.mp3')).toBe(false)
      expect(isValidMediaPath('./audio/sound.mp3')).toBe(false)
      expect(isValidMediaPath('sound.mp3')).toBe(false)
    })
  })

  describe('attack vectors', () => {
    it('blocks absolute URLs (http/https)', () => {
      expect(isValidMediaPath('http://evil.com/malware.js')).toBe(false)
      expect(isValidMediaPath('https://evil.com/malware.js')).toBe(false)
      expect(isValidMediaPath('/path/http://nested.com')).toBe(false)
    })

    it('blocks protocol-relative URLs', () => {
      expect(isValidMediaPath('//evil.com/malware.js')).toBe(false)
    })

    it('blocks data URLs', () => {
      expect(isValidMediaPath('data:text/javascript,alert(1)')).toBe(false)
      expect(isValidMediaPath('data:audio/mp3;base64,AAAA')).toBe(false)
    })

    it('blocks blob URLs', () => {
      expect(isValidMediaPath('blob:http://localhost/uuid')).toBe(false)
    })

    it('blocks file URLs', () => {
      expect(isValidMediaPath('file:///etc/passwd')).toBe(false)
    })

    it('blocks directory traversal', () => {
      expect(isValidMediaPath('/../../../etc/passwd')).toBe(false)
      expect(isValidMediaPath('/audio/../../../etc/passwd')).toBe(false)
      expect(isValidMediaPath('/audio/..\\..\\windows\\system32')).toBe(false)
    })

    it('blocks URL-encoded directory traversal', () => {
      expect(isValidMediaPath('/audio/%2e%2e/%2e%2e/etc/passwd')).toBe(false)
      expect(isValidMediaPath('/audio/%2E%2E/%2E%2E/etc/passwd')).toBe(false)
      expect(isValidMediaPath('/%2e%2e%2f%2e%2e%2fetc%2fpasswd')).toBe(false)
      expect(isValidMediaPath('/audio/..%2f..%2fetc/passwd')).toBe(false)
      expect(isValidMediaPath('/audio/..%5c..%5cwindows%5csystem32')).toBe(false)
    })

    it('blocks JavaScript protocol', () => {
      expect(isValidMediaPath('javascript:alert(1)')).toBe(false)
    })

    it('blocks FTP protocol', () => {
      expect(isValidMediaPath('ftp://evil.com/file')).toBe(false)
    })
  })
})

describe('isValidStorageKey', () => {
  describe('valid keys', () => {
    it('accepts alphanumeric keys', () => {
      expect(isValidStorageKey('settings')).toBe(true)
      expect(isValidStorageKey('userPrefs')).toBe(true)
      expect(isValidStorageKey('audio123')).toBe(true)
    })

    it('accepts keys with dashes', () => {
      expect(isValidStorageKey('user-settings')).toBe(true)
      expect(isValidStorageKey('audio-volume')).toBe(true)
    })

    it('accepts keys with underscores', () => {
      expect(isValidStorageKey('user_settings')).toBe(true)
      expect(isValidStorageKey('audio_volume')).toBe(true)
    })

    it('accepts mixed valid characters', () => {
      expect(isValidStorageKey('user_settings-v2')).toBe(true)
      expect(isValidStorageKey('A1-B2_C3')).toBe(true)
    })
  })

  describe('invalid keys', () => {
    it('rejects undefined/null', () => {
      expect(isValidStorageKey(undefined)).toBe(false)
      // @ts-expect-error - testing runtime behavior
      expect(isValidStorageKey(null)).toBe(false)
    })

    it('rejects non-string types', () => {
      // @ts-expect-error - testing runtime behavior
      expect(isValidStorageKey(123)).toBe(false)
      // @ts-expect-error - testing runtime behavior
      expect(isValidStorageKey({})).toBe(false)
    })

    it('rejects empty string', () => {
      expect(isValidStorageKey('')).toBe(false)
    })
  })

  describe('attack vectors', () => {
    it('blocks keys with spaces', () => {
      expect(isValidStorageKey('user settings')).toBe(false)
      expect(isValidStorageKey(' settings')).toBe(false)
    })

    it('blocks keys with dots', () => {
      expect(isValidStorageKey('user.settings')).toBe(false)
      expect(isValidStorageKey('../passwd')).toBe(false)
    })

    it('blocks keys with special characters', () => {
      expect(isValidStorageKey('key<script>')).toBe(false)
      expect(isValidStorageKey('key"value')).toBe(false)
      expect(isValidStorageKey("key'value")).toBe(false)
      expect(isValidStorageKey('key&value')).toBe(false)
      expect(isValidStorageKey('key=value')).toBe(false)
    })

    it('blocks keys with path separators', () => {
      expect(isValidStorageKey('path/to/key')).toBe(false)
      expect(isValidStorageKey('path\\to\\key')).toBe(false)
    })

    it('blocks keys with null bytes', () => {
      expect(isValidStorageKey('key\x00value')).toBe(false)
    })

    it('blocks keys with newlines', () => {
      expect(isValidStorageKey('key\nvalue')).toBe(false)
      expect(isValidStorageKey('key\rvalue')).toBe(false)
    })

    it('blocks keys containing dots (proto pollution vectors)', () => {
      // Note: __proto__ itself passes the regex (alphanumeric + underscore)
      // but __proto__.polluted fails due to the dot
      expect(isValidStorageKey('__proto__')).toBe(true) // valid per regex
      expect(isValidStorageKey('constructor')).toBe(true) // alphanumeric, allowed
      expect(isValidStorageKey('__proto__.polluted')).toBe(false) // dot blocked
      expect(isValidStorageKey('constructor.prototype')).toBe(false) // dot blocked
    })
  })
})

describe('safeGetLocalStorage', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('returns value for valid key', () => {
    localStorage.setItem('valid-key', 'test-value')
    expect(safeGetLocalStorage('valid-key')).toBe('test-value')
  })

  it('returns null for missing key', () => {
    expect(safeGetLocalStorage('nonexistent')).toBeNull()
  })

  it('returns null for invalid key', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    expect(safeGetLocalStorage('invalid.key')).toBeNull()
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('Invalid localStorage key'))
    warnSpy.mockRestore()
  })

  it('handles localStorage errors gracefully', () => {
    // jsdom localStorage doesn't use Storage.prototype, so we mock the object directly
    const originalGetItem = localStorage.getItem
    localStorage.getItem = () => {
      throw new Error('Storage quota exceeded')
    }
    expect(safeGetLocalStorage('valid-key')).toBeNull()
    localStorage.getItem = originalGetItem
  })
})

describe('safeSetLocalStorage', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('sets value for valid key', () => {
    expect(safeSetLocalStorage('valid-key', 'test-value')).toBe(true)
    expect(localStorage.getItem('valid-key')).toBe('test-value')
  })

  it('returns false for invalid key', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    expect(safeSetLocalStorage('invalid.key', 'value')).toBe(false)
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('Invalid localStorage key'))
    warnSpy.mockRestore()
  })

  it('handles localStorage errors gracefully', () => {
    // jsdom localStorage doesn't use Storage.prototype, so we mock the object directly
    const originalSetItem = localStorage.setItem
    localStorage.setItem = () => {
      throw new Error('Storage quota exceeded')
    }
    expect(safeSetLocalStorage('valid-key', 'value')).toBe(false)
    localStorage.setItem = originalSetItem
  })
})

describe('isValidExternalURL', () => {
  describe('valid URLs', () => {
    it('accepts HTTPS URLs', () => {
      expect(isValidExternalURL('https://example.com')).toBe(true)
      expect(isValidExternalURL('https://api.example.com/v1/data')).toBe(true)
    })

    it('accepts URLs with query params', () => {
      expect(isValidExternalURL('https://example.com?foo=bar')).toBe(true)
    })

    it('accepts URLs with paths', () => {
      expect(isValidExternalURL('https://example.com/path/to/resource')).toBe(true)
    })

    it('accepts URLs with ports', () => {
      expect(isValidExternalURL('https://example.com:8443')).toBe(true)
    })
  })

  describe('invalid URLs', () => {
    it('rejects undefined/null', () => {
      expect(isValidExternalURL(undefined)).toBe(false)
      // @ts-expect-error - testing runtime behavior
      expect(isValidExternalURL(null)).toBe(false)
    })

    it('rejects non-string types', () => {
      // @ts-expect-error - testing runtime behavior
      expect(isValidExternalURL(123)).toBe(false)
    })

    it('rejects empty string', () => {
      expect(isValidExternalURL('')).toBe(false)
    })

    it('rejects malformed URLs', () => {
      expect(isValidExternalURL('not-a-url')).toBe(false)
      expect(isValidExternalURL('://missing-protocol.com')).toBe(false)
    })
  })

  describe('protocol restrictions', () => {
    it('blocks HTTP URLs', () => {
      expect(isValidExternalURL('http://example.com')).toBe(false)
    })

    it('blocks FTP URLs', () => {
      expect(isValidExternalURL('ftp://example.com')).toBe(false)
    })

    it('blocks file URLs', () => {
      expect(isValidExternalURL('file:///etc/passwd')).toBe(false)
    })

    it('blocks javascript URLs', () => {
      expect(isValidExternalURL('javascript:alert(1)')).toBe(false)
    })

    it('blocks data URLs', () => {
      expect(isValidExternalURL('data:text/html,<script>alert(1)</script>')).toBe(false)
    })

    it('blocks blob URLs', () => {
      expect(isValidExternalURL('blob:http://example.com/uuid')).toBe(false)
    })
  })

  describe('domain whitelist', () => {
    const allowedDomains = ['example.com', 'api.trusted.io']

    it('accepts exact domain match', () => {
      expect(isValidExternalURL('https://example.com', allowedDomains)).toBe(true)
      expect(isValidExternalURL('https://api.trusted.io', allowedDomains)).toBe(true)
    })

    it('accepts subdomain of allowed domain', () => {
      expect(isValidExternalURL('https://api.example.com', allowedDomains)).toBe(true)
      expect(isValidExternalURL('https://v2.api.trusted.io', allowedDomains)).toBe(true)
    })

    it('rejects non-whitelisted domains', () => {
      expect(isValidExternalURL('https://evil.com', allowedDomains)).toBe(false)
      expect(isValidExternalURL('https://example.com.evil.com', allowedDomains)).toBe(false)
    })

    it('handles suffix attacks', () => {
      // example.com.evil.com should NOT be allowed
      expect(isValidExternalURL('https://example.com.evil.com', allowedDomains)).toBe(false)
      // evilexample.com should NOT be allowed
      expect(isValidExternalURL('https://evilexample.com', allowedDomains)).toBe(false)
    })

    it('allows any HTTPS URL when no domains specified', () => {
      expect(isValidExternalURL('https://any-domain.com')).toBe(true)
      expect(isValidExternalURL('https://any-domain.com', [])).toBe(true)
    })
  })
})
