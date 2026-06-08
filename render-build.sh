#!/usr/bin/env bash
set -e

echo ">>> Installing pnpm..."
npm install -g pnpm@latest

echo ">>> Installing dependencies..."
pnpm install --frozen-lockfile

echo ">>> Building frontend..."
PORT=3000 BASE_PATH=/ pnpm --filter @workspace/trustbit run build

echo ">>> Building backend..."
pnpm --filter @workspace/api-server run build

echo ">>> Done!"
