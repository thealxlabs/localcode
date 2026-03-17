#!/usr/bin/env bash
# LocalCode installer
# Usage: curl -fsSL https://raw.githubusercontent.com/thealxlabs/localcode/main/install.sh | sh

set -e

BOLD="\033[1m"
CYAN="\033[36m"
GREEN="\033[32m"
RED="\033[31m"
RESET="\033[0m"

printf "\n"
printf " /\\_/\\   ${BOLD}LocalCode${RESET} installer\n"
printf "( ·.· )  @localcode/cli\n"
printf " > ♥ <\n"
printf "\n"

# Check for Node.js
if ! command -v node &>/dev/null; then
  printf "${RED}✕  Node.js not found.${RESET}\n"
  printf "   Install Node.js 18+ from https://nodejs.org and re-run this script.\n"
  exit 1
fi

NODE_MAJOR=$(node -e "process.stdout.write(String(parseInt(process.versions.node)))")
NODE_VERSION=$(node -e "process.stdout.write(process.versions.node)")
if [ "$NODE_MAJOR" -lt 18 ]; then
  printf "${RED}✕  Node.js %s is too old. Requires Node 18+.${RESET}\n" "$NODE_VERSION"
  exit 1
fi

printf "${CYAN}→${RESET}  Node.js %s detected\n" "$NODE_VERSION"

# Install or upgrade
if command -v localcode &>/dev/null; then
  CURRENT=$(localcode --version 2>/dev/null || printf "unknown")
  printf "${CYAN}→${RESET}  Upgrading from %s…\n" "$CURRENT"
else
  printf "${CYAN}→${RESET}  Installing @localcode/cli…\n"
fi

npm install -g @localcode/cli

INSTALLED=$(localcode --version 2>/dev/null || printf "?")

printf "\n"
printf "${GREEN}✓  LocalCode %s installed successfully!${RESET}\n" "$INSTALLED"
printf "\n"
printf "   Run it:\n"
printf "   ${BOLD}localcode${RESET}\n"
printf "\n"
printf "   Optional — set API keys in your shell profile:\n"
printf "   export ANTHROPIC_API_KEY=sk-ant-...\n"
printf "   export OPENAI_API_KEY=sk-...\n"
printf "   export GROQ_API_KEY=gsk_...\n"
printf "\n"
printf "   Docs: https://localcode.thealxlabs.ca\n"
printf "\n"
