import type { H3Event } from 'h3'
import { getRequestHeader, createError } from 'h3'

const rateLimitMaps = new Map<string, Map<string, { count: number; resetAt: number }>>()

interface RateLimitOptions {
  /** Unique name for this rate limiter */
  name: string
  /** Maximum number of requests allowed in the window */
  maxRequests: number
  /** Window duration in milliseconds */
  windowMs: number
  /** Response message. Defaults to the English rate-limit sentence. */
  message?: string
}

/**
 * Get client IP from the request, preferring x-real-ip (set by Vercel/proxies)
 * over x-forwarded-for to prevent header spoofing
 */
function getClientIp(event: H3Event): string {
  const realIp = getRequestHeader(event, 'x-real-ip')
  if (realIp) return realIp

  const forwarded = getRequestHeader(event, 'x-forwarded-for')
  if (forwarded) {
    // Use the LAST entry — the one added by the trusted reverse proxy
    const parts = forwarded.split(',').map((s: string) => s.trim())
    return parts[parts.length - 1] || 'unknown'
  }

  return 'unknown'
}

/**
 * Check rate limit for the given event. Throws 429 if limit exceeded.
 */
export function checkRateLimit(event: H3Event, options: RateLimitOptions): void {
  const { name, maxRequests, windowMs } = options
  const message = options.message ?? 'Too many requests. Please try again later.'

  if (!rateLimitMaps.has(name)) {
    rateLimitMaps.set(name, new Map())
  }
  const map = rateLimitMaps.get(name)!

  const ip = getClientIp(event)
  const now = Date.now()
  const entry = map.get(ip)

  if (!entry || now > entry.resetAt) {
    map.set(ip, { count: 1, resetAt: now + windowMs })
    return
  }

  entry.count++
  if (entry.count > maxRequests) {
    throw createError({
      statusCode: 429,
      message,
    })
  }
}
