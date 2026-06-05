# 🔧 Render Build Fix - Prisma Error

## Error

```
Cannot find module '/opt/render/project/src/node_modules/@prisma/client/runtime/query_engine_bg.postgresql.wasm-base64.js'
```

## Root Cause

The build command is running `npx prisma generate` which uses a cached/global version of Prisma instead of the locally installed version with --legacy-peer-deps.

## Solution

### Update Render Build Command

Go to Render Dashboard → Your Service → Settings → Build & Deploy

**Change Build Command from:**

```bash
npm install --legacy-peer-deps && npx prisma generate && npm run build
```

**To:**

```bash
npm install --legacy-peer-deps && npm run build:render
```

## Why This Works

The new `build:render` script explicitly specifies the schema path and uses the locally installed Prisma:

```json
"build:render": "prisma generate --schema=./prisma/schema.prisma && next build"
```

This ensures:

1. Uses the Prisma version installed with --legacy-peer-deps
2. Explicitly points to the schema file
3. Avoids npx caching issues
4. Runs in the correct context

## Alternative Solution (If Above Doesn't Work)

**Build Command:**

```bash
npm install --legacy-peer-deps && npm run build
```

The regular `build` script already includes `prisma generate`, so we don't need to run it twice.

## Verification Steps

After changing the build command:

1. Save Changes in Render
2. Render will auto-deploy
3. Check logs for:
   - ✅ `npm install --legacy-peer-deps` completes
   - ✅ `prisma generate` runs successfully
   - ✅ `next build` completes
   - ✅ "Build successful"

## If Still Failing

Try this build command instead:

```bash
npm ci --legacy-peer-deps && npx prisma generate && npm run build
```

Note: `npm ci` does a clean install which might resolve any caching issues.

---

**Created**: 2025-11-16
**Status**: Apply this fix in Render Dashboard
