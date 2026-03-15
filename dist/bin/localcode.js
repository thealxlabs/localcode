#!/usr/bin/env node
// src/bin/localcode.tsx
import React, { useState } from 'react';
import { render } from 'ink';
import { App } from '../ui/App.js';
import { Setup } from '../ui/Setup.js';
import { loadSession, isFirstRun } from '../sessions/manager.js';
import { createRequire } from 'module';
const _require = createRequire(import.meta.url);
const pkg = _require('../../package.json');
const args = process.argv.slice(2);
const showHelp = args.includes('--help') || args.includes('-h');
const showVersion = args.includes('--version') || args.includes('-v');
const skipSetup = args.includes('--yes');
if (showHelp) {
    console.log(`
@localcode/cli — Local AI coding assistant

USAGE
  localcode [options]

OPTIONS
  --help, -h      Show this help
  --version, -v   Show version
  --yes           Skip first-run setup (use saved config or defaults)

SLASH COMMANDS (inside the app)
  /               Open command picker
  /provider       Switch AI provider (ollama, claude, openai, groq)
  /apikey         Set API key for current provider
  /model          Change model
  /checkpoint     Save a checkpoint
  /restore        Restore a checkpoint
  /commit         AI-generated git commit (co-authored by Nyx)
  /diff           Show session file changes
  /context        Add file/folder to context
  /allowall       Toggle permission prompts
  /compact        Summarize conversation
  /status         Session info
  /exit           Exit

CONTEXT INJECTION
  @file.ts        Inject file contents inline in your message
  @src/           Inject directory tree inline

ENV VARS
  ANTHROPIC_API_KEY   Auto-loaded for Claude provider
  OPENAI_API_KEY      Auto-loaded for OpenAI provider
  GROQ_API_KEY        Auto-loaded for Groq provider

EXAMPLES
  localcode
  localcode --yes
  ANTHROPIC_API_KEY=sk-ant-xxx localcode
`);
    process.exit(0);
}
if (showVersion) {
    console.log(pkg.version);
    process.exit(0);
}
// ── Root component — handles setup → app transition ──────────────────────────
function Root() {
    const firstRun = !skipSetup && isFirstRun();
    const [session, setSession] = useState(firstRun ? null : loadSession());
    if (!session) {
        return React.createElement(Setup, { onComplete: (s) => setSession(s) });
    }
    return React.createElement(App, { initialState: session });
}
// ── Launch ────────────────────────────────────────────────────────────────────
const { waitUntilExit } = render(React.createElement(Root), { exitOnCtrlC: false });
waitUntilExit()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
//# sourceMappingURL=localcode.js.map