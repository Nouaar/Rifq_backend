# Model Switch to Gemini Flash

## Problem
The app was using `gemini-2.5-pro` which has:
- **Strict rate limits**: 2 requests per minute
- **Low daily quota**: 50 requests/day on free tier
- **High token usage**: Uses "thoughts" tokens that consume output budget

## Solution
Switched to **Gemini Flash models** which have:
- ✅ **More generous quotas**: Higher daily limits on free tier
- ✅ **Faster responses**: Optimized for speed
- ✅ **Lower token costs**: More efficient token usage
- ✅ **Better for this use case**: Tips/recommendations don't need the most advanced model

## Changes Made

### Backend (`gemini.service.ts`)
- **Model Priority Order**:
  1. `gemini-2.5-flash` (newest, best quotas)
  2. `gemini-1.5-flash` (proven, generous free tier)
  3. `gemini-2.0-flash` (alternative)
  4. `gemini-1.5-pro` (fallback)
  5. `gemini-pro` (last resort)
- **Fallback**: Changed from `gemini-pro` to `gemini-1.5-flash`

### Frontend (`GeminiService.swift`)
- **Model Priority Order**: Same as backend
- **Fallback**: Changed from `gemini-pro-latest` to `gemini-1.5-flash`

## Expected Benefits

1. **Higher Daily Quota**: Flash models typically have 15-50 requests/minute and higher daily limits
2. **Faster Responses**: Flash models are optimized for speed
3. **Lower Costs**: More efficient token usage
4. **Better Reliability**: Less likely to hit quota limits

## 5-Minute Auto-Refresh

The frontend already has a 5-minute auto-refresh timer that:
- ✅ Checks for updates every 5 minutes
- ✅ **Respects 24-hour cache**: Won't make API calls if cache is still valid
- ✅ **Background refresh**: If cache expired, returns stale cache and refreshes in background
- ✅ **No wasted calls**: Only makes API calls when cache doesn't exist or is >24 hours old

### How It Works:
1. Every 5 minutes: Frontend calls backend
2. Backend checks cache:
   - **Cache valid (< 24h)**: Returns immediately, **no API call** ✅
   - **Cache expired (> 24h)**: Returns stale cache, refreshes in background
   - **No cache**: Makes API call

## Next Steps

1. **Restart backend** to pick up new model selection
2. **Restart iOS app** to pick up new model selection
3. **Monitor logs** to confirm Flash model is being used
4. **Check quota usage** - should see fewer quota errors

## Verification

Check backend logs for:
```
[GeminiService] Using Gemini model: gemini-1.5-flash
```
or
```
[GeminiService] Using Gemini model: gemini-2.5-flash
```

If you see `gemini-2.5-pro` or `gemini-pro-latest`, the model selection didn't work and it's using fallback.

