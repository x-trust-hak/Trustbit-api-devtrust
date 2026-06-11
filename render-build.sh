#!/usr/bin/env bash
set -e

echo ">>> Installing dependencies..."
npx --yes pnpm@9 install --no-frozen-lockfile

echo ">>> Building frontend..."
PORT=3000 BASE_PATH=/ npx pnpm@9 --filter @workspace/trustbit run build

echo ">>> Building backend..."
npx pnpm@9 --filter @workspace/api-server run build

echo ">>> Done!"
