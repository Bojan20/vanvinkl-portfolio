#!/bin/bash
# VanVinkl Deploy Script — build + deploy to Vercel production
set -e

echo "=== Building..."
npm run build

echo ""
echo "=== Deploying to Vercel production..."
URL=$(vercel --prod --yes 2>/dev/null)

if [ -n "$URL" ]; then
  echo "=== Deployed: $URL"
  echo "=== Live: https://www.vanvinkl.design"
else
  # Fallback: check if deploy succeeded via vercel ls
  echo "=== Checking deployment status..."
  vercel ls --prod 2>&1 | head -8
  echo ""
  echo "=== If status shows ● Ready, deploy succeeded."
  echo "=== Live: https://www.vanvinkl.design"
fi
