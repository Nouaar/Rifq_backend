# AI Quota Management Fixes

## Problem Summary

The app was hitting Google Gemini's **50 requests/day free tier limit** because:
- Multiple pets (3 pets × 3 AI calls each = 9+ calls per page load)
- 5-minute cache TTL was too short (causing frequent regenerations)
- No distinction between daily quota exhaustion vs rate limits
- Retries were happening even when daily quota was exhausted

## Fixes Implemented

### 1. ✅ Increased Cache TTL (24 hours)
- **Before**: 5 minutes cache
- **After**: 24 hours cache
- **Impact**: Each pet's AI content is cached for 24 hours, dramatically reducing API calls
- **Location**: `ai.service.ts` - `cacheTTL = 24 * 60 * 60 * 1000`

### 2. ✅ Distinguish Daily Quota vs Rate Limits
- **Daily Quota (RESOURCE_EXHAUSTED)**: Don't retry, return error immediately
- **Rate Limits (429 Too Many Requests)**: Retry with proper delays
- **Location**: `gemini.service.ts` - Error handling in `makeApiRequest()`

### 3. ✅ Better Error Handling
- Daily quota errors return: `AI_DAILY_QUOTA_EXCEEDED` with 24-hour retry-after
- Rate limit errors return: `AI_RATE_LIMITED` with 60-second retry-after
- Stale cache is returned when available, even on quota errors
- **Location**: `ai.controller.ts` and `ai.service.ts`

### 4. ✅ Applied to All Endpoints
- Tips, Recommendations, Reminders, and Status all have:
  - 24-hour caching
  - Daily quota detection
  - Stale cache fallback

## Expected Behavior Now

### First Request (No Cache)
- Makes API call to Gemini
- Caches result for 24 hours
- If daily quota exceeded: Returns error, no retries

### Subsequent Requests (Within 24 hours)
- Returns cached data immediately (no API call)
- Zero quota usage

### After 24 Hours
- Cache expires
- New API call made
- New 24-hour cache created

## Daily Quota Management

### Current Usage Pattern
- **3 pets** × **3 AI calls each** (tips, status, reminders) = **9 calls per day**
- With 24-hour cache: **9 calls total per day** (not per page load!)
- **Well within 50 calls/day limit** ✅

### If You Need More
1. **Upgrade Google AI plan** (attach billing account)
2. **Use gemini-1.5-flash** (more generous free tier)
3. **Reduce AI features** (e.g., only generate tips, skip status/reminders)

## Error Codes

### `AI_DAILY_QUOTA_EXCEEDED`
- **HTTP Status**: 503 Service Unavailable
- **Retry-After**: 86400 seconds (24 hours)
- **Action**: Don't retry, return cached data if available

### `AI_RATE_LIMITED`
- **HTTP Status**: 503 Service Unavailable
- **Retry-After**: 60 seconds
- **Action**: Can retry after delay

## Frontend Handling

The frontend already:
- ✅ Makes sequential calls (not parallel) - reduces burst usage
- ✅ Has 180-second timeout for rate-limited requests
- ✅ Falls back gracefully when backend fails

## Monitoring

Watch for these log messages:
- `❌ Daily quota exhausted` - Quota exceeded, no retries
- `⚠️ Rate limit exceeded` - Per-minute limit, will retry
- `📦 Returning cached response` - Using cache, no API call

## Next Steps

1. **Monitor usage**: Check if 24-hour cache is sufficient
2. **Consider upgrade**: If you need more than 50 calls/day
3. **Optimize further**: Only generate what's needed (e.g., skip status if not displayed)

