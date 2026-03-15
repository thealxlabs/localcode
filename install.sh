#!/bin/sh
set -e

NYX="
  /\\_/\\  
 ( ^.^ ) Installing LocalCode...
  > ♥ <  
"

echo "$NYX"

# Check Node
if ! command -v node >/dev/null 2>&1; then
  echo "✕ Node.js not found. Install from https://nodejs.org (v18+)"
  exit 1
fi

NODE_VERSION=$(node -e "process.stdout.write(process.versions.node.split('.')[0])")
if [ "$NODE_VERSION" -lt 18 ]; then
  echo "✕ Node.js v18+ required (found v$NODE_VERSION)"
  exit 1
fi

# Install
echo "Installing @localcode/cli..."
npm install -g @localcode/cli

echo "
  /\\_/\\  
 ( ^.^ ) LocalCode installed!
  > ★ <  

  Run:  localcode
  Docs: https://localcode.thealxlabs.ca
"
