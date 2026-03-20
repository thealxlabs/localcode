// src/core/types.ts

export type Provider = 'ollama' | 'claude' | 'openai' | 'groq';

export type ApprovalMode = 'suggest' | 'auto-edit' | 'full-auto';

export interface ProviderConfig {
  name: Provider;
  displayName: string;
  baseUrl: string;
  defaultModel: string;
  apiKey?: string;
  color: string;
  requiresKey: boolean;
}

export interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  images?: Array<{ base64: string; mimeType: string }>;
}

export interface ToolCall {
  name: string;
  args: Record<string, unknown>;
}

export interface ToolResult {
  success: boolean;
  output: string;
  diff?: FileDiff;
}

export interface FileDiff {
  path: string;
  before: string;
  after: string;
  additions: number;
  deletions: number;
}

export interface Checkpoint {
  id: string;
  label: string;
  timestamp: number;
  messages: Message[];
  files: Record<string, string>; // path -> content snapshots
}

export interface Persona {
  name: string;
  prompt: string;
}

// ── Theme system ─────────────────────────────────────────────────────────────

export type ThemeName = 'dark' | 'nord' | 'monokai' | 'light';

export interface Theme {
  name: ThemeName;
  primary: string;   // user prompt color
  accent: string;    // assistant icon color
  tool: string;      // tool message color
  system: string;    // system message color
  error: string;     // error color
  border: string;    // input box border color
  header: string;    // header art color
}

export const THEMES: Record<ThemeName, Theme> = {
  dark:    { name: 'dark',    primary: 'yellowBright', accent: 'white',         tool: 'cyan',         system: 'gray', error: 'red', border: 'yellowBright', header: 'white' },
  nord:    { name: 'nord',    primary: 'blueBright',   accent: 'cyanBright',    tool: 'cyan',         system: 'gray', error: 'red', border: 'blueBright',   header: 'cyanBright' },
  monokai: { name: 'monokai', primary: 'greenBright',  accent: 'magentaBright', tool: 'yellowBright', system: 'gray', error: 'red', border: 'greenBright',  header: 'magentaBright' },
  light:   { name: 'light',   primary: 'blue',         accent: 'black',         tool: 'cyan',         system: 'gray', error: 'red', border: 'blue',         header: 'blue' },
};

export interface ModelRouting {
  planning: string | null;    // model used for first 1-2 steps
  execution: string | null;   // model used for middle steps
  review: string | null;      // model used for last step
}

export interface ProviderCallEntry {
  provider: Provider;
  model: string;
  estimatedTokens: number;
  timestamp: number;
}

export interface SessionState {
  provider: Provider;
  model: string;
  messages: Message[];
  checkpoints: Checkpoint[];
  approvalMode: ApprovalMode;
  workingDir: string;
  apiKeys: Partial<Record<Provider, string>>;
  systemPrompt: string;
  personas: Persona[];
  activePersona: string | null;
  pinnedContext: string[];        // messages always prepended to context
  autoCheckpoint: boolean;        // auto-save checkpoint every 20 messages
  maxSteps: number;               // max agent tool-call iterations per response
  sessionCost: number;            // estimated USD cost this session
  lastAssistantMessage: string;   // for /retry and /copy
  theme: ThemeName;               // UI color theme
  // ── v4 additions ────────────────────────────────────────────────────────────
  modelRouting: ModelRouting | null;          // per-step model routing
  budgetLimit: number | null;                 // max USD per session
  budgetFallbackModel: string | null;         // model to switch to at budget limit
  safeMode: boolean;                          // git stash before edits, auto-revert on test fail
  autopilotActive: boolean;                   // background auto-commit daemon
  providerCallLog: ProviderCallEntry[];       // telemetry log (not persisted)
  dna: string | null;                         // extracted codebase DNA (style guide)
}

export const DEFAULT_SYSTEM_PROMPT = `You are Nyx, an AI coding assistant built into LocalCode — a terminal tool made by TheAlxLabs.

You are an autonomous coding agent — you MUST use tools to do real work. Never respond with code blocks and ask the user to copy-paste them. Instead, use tools directly to read, write, and edit files.

**CRITICAL RULES:**
1. To create or overwrite a file → use write_file. Never show code and say "save this to X".
2. To edit part of a file → use read_file first, then patch_file with a precise old_str/new_str.
3. To understand a codebase → use list_dir, find_files, search_files before answering.
4. To run commands (install, test, build) → use run_shell. Show the command first, then call it.
5. Before editing ANY file you haven't read this session → call read_file first.
6. Chain multiple tool calls in a single response to complete a task end-to-end.

**Available tools:**
- read_file / write_file / patch_file / delete_file / move_file — file operations
- search_files — grep-like: search file contents by regex/string across the project
- find_files — find files by name pattern (e.g. "*.ts", "*.test.*")
- list_dir — list directory contents (recursive optional)
- run_shell — run any shell command
- git_operation — run git commands

Be direct and concise. Explain what you're doing and why in 1-2 sentences, then act. The user is a developer — treat them like one. Never refuse to help with code; if something is risky, warn and ask first.`;

export const DEFAULT_PERSONAS: Persona[] = [
  {
    name: 'pair-programmer',
    prompt: DEFAULT_SYSTEM_PROMPT,
  },
  {
    name: 'senior-engineer',
    prompt: `You are Nyx, a senior engineer with strong opinions. Be direct, blunt, and efficient. Point out bad patterns immediately. No hand-holding — give the right answer fast. If the user's approach is wrong, say so and suggest better. Skip lengthy explanations unless asked.`,
  },
  {
    name: 'rubber-duck',
    prompt: `You are Nyx, a rubber duck debugger. Ask questions more than you answer. Guide the user to figure things out themselves by asking "what do you expect to happen here?", "have you checked X?", "what does the error tell you?". Only give the answer directly if they're truly stuck.`,
  },
  {
    name: 'code-reviewer',
    prompt: `You are Nyx, doing a thorough code review. Look for: bugs, security issues, performance problems, readability issues, missing error handling, and anti-patterns. Be specific — reference exact line numbers and variable names. Prioritize issues by severity: critical > warning > suggestion.`,
  },
  {
    name: 'minimal',
    prompt: `You are a coding assistant. Do exactly what is asked. No commentary, no explanations unless requested. Return only code or direct answers.`,
  },
  {
    name: 'security-auditor',
    prompt: `You are Nyx in security-auditor mode — a red-team security researcher. Your job is to find and document vulnerabilities before attackers do.

When reviewing code, hunt for:
- Injection vulnerabilities (SQL, command, LDAP, XPath)
- Authentication and authorization bypasses
- Insecure deserialization
- Path traversal and file inclusion
- Cryptographic weaknesses (hardcoded secrets, weak algorithms, improper key management)
- SSRF, XXE, and prototype pollution
- Race conditions and TOCTOU bugs
- Dependency vulnerabilities (flag outdated packages in package.json, requirements.txt, etc.)

For each finding output: severity (Critical/High/Medium/Low), CVE class if applicable, exact file + line, proof-of-concept exploitation scenario, and remediation. Be adversarial and thorough. Use read_file and search_files to actually inspect the code — don't guess.`,
  },
  {
    name: 'chaos-refactor',
    prompt: `You are Nyx in chaos-refactor mode. You proactively hunt for code quality issues WITHOUT being asked about specific files.

Your mission: crawl the codebase unsolicited and fix everything you find wrong:
- Dead code and unused exports
- Duplicate logic that should be extracted
- Functions over 40 lines that should be split
- Inconsistent naming conventions
- Missing type annotations
- Anti-patterns specific to the detected language/framework
- Obvious performance issues (N+1 queries, re-renders, synchronous I/O on hot paths)

Workflow: list_dir to survey → find_files to locate source → read_file to inspect → patch_file to fix. Keep going until you've swept the whole codebase. Report a summary at the end.`,
  },
];

export interface SlashCommand {
  name: string;          // e.g. "help"
  trigger: string;       // e.g. "/help"
  icon: string;          // emoji or ascii
  description: string;   // short desc shown in picker
  detail?: string;       // longer detail shown on highlight
  usage?: string;        // usage example e.g. "/model claude-opus-4-5"
  category: 'session' | 'context' | 'git' | 'tools' | 'providers';
}

export type NyxMood = 'idle' | 'thinking' | 'happy' | 'error' | 'waiting';

export const PROVIDERS: Record<Provider, ProviderConfig> = {
  ollama: {
    name: 'ollama',
    displayName: 'Ollama',
    baseUrl: 'http://localhost:11434',
    defaultModel: 'qwen2.5-coder:7b',
    color: 'gray',
    requiresKey: false,
  },
  claude: {
    name: 'claude',
    displayName: 'Claude',
    baseUrl: 'https://api.anthropic.com',
    defaultModel: 'claude-sonnet-4-6',
    color: 'orange',
    requiresKey: true,
  },
  openai: {
    name: 'openai',
    displayName: 'OpenAI',
    baseUrl: 'https://api.openai.com',
    defaultModel: 'gpt-4o',
    color: 'green',
    requiresKey: true,
  },
  groq: {
    name: 'groq',
    displayName: 'Groq',
    baseUrl: 'https://api.groq.com/openai',
    defaultModel: 'llama-3.3-70b-versatile',
    color: 'red',
    requiresKey: true,
  },
};

export const SLASH_COMMANDS: SlashCommand[] = [
  // ── Session ───────────────────────────────────────────────────────────────
  {
    name: 'clear',
    trigger: '/clear',
    icon: '✕',
    description: 'Clear conversation history',
    detail: 'Wipe the current conversation and start fresh. Checkpoints are preserved.',
    category: 'session',
  },
  {
    name: 'compact',
    trigger: '/compact',
    icon: '⊟',
    description: 'Summarize & compress the conversation',
    detail: 'Asks the model to summarize the full conversation, then replaces messages with that summary. Saves context window space.',
    usage: '/compact',
    category: 'session',
  },
  {
    name: 'status',
    trigger: '/status',
    icon: '◎',
    description: 'Show session status',
    detail: 'Provider, model, API key status, message count, estimated tokens, checkpoint count, and working directory.',
    usage: '/status',
    category: 'session',
  },
  {
    name: 'checkpoint',
    trigger: '/checkpoint',
    icon: '◉',
    description: 'Save a checkpoint',
    detail: 'Snapshot the conversation state so you can return to it later. Label is optional.',
    usage: '/checkpoint before-refactor',
    category: 'session',
  },
  {
    name: 'restore',
    trigger: '/restore',
    icon: '↺',
    description: 'Restore a checkpoint',
    detail: 'List all saved checkpoints, or restore a specific one by ID.',
    usage: '/restore  |  /restore <id>',
    category: 'session',
  },
  {
    name: 'exit',
    trigger: '/exit',
    icon: '⏻',
    description: 'Exit LocalCode',
    detail: 'Save session state and quit.',
    category: 'session',
  },
  {
    name: 'retry',
    trigger: '/retry',
    icon: '↻',
    description: 'Regenerate last response',
    detail: 'Removes the last assistant message and re-sends the last user message.',
    category: 'session',
  },
  {
    name: 'copy',
    trigger: '/copy',
    icon: '⎘',
    description: 'Copy last response to clipboard',
    detail: 'Copies the last assistant message to your system clipboard.',
    category: 'session',
  },
  {
    name: 'export',
    trigger: '/export',
    icon: '↗',
    description: 'Export conversation to markdown',
    detail: 'Saves the full conversation as a .md file in the current working directory.',
    usage: '/export  |  /export my-session',
    category: 'session',
  },
  {
    name: 'undo',
    trigger: '/undo',
    icon: '⟲',
    description: 'Undo last file change',
    detail: 'Reverts the most recent file write or patch made by the model this session.',
    category: 'session',
  },
  {
    name: 'allowall',
    trigger: '/allowall',
    icon: '⚡',
    description: 'Cycle approval mode: suggest → auto-edit → full-auto',
    detail: 'Cycles through approval modes. suggest: prompt before every write/shell. auto-edit: only prompt for shell. full-auto: run everything without asking.',
    category: 'session',
  },
  {
    name: 'mode',
    trigger: '/mode',
    icon: '◉',
    description: 'Set approval mode: suggest / auto-edit / full-auto',
    detail: 'suggest: prompt before every write/shell. auto-edit: file edits auto-approved; only shell needs approval. full-auto: run everything without prompting.',
    usage: '/mode  |  /mode auto-edit  |  /mode full-auto',
    category: 'session',
  },
  {
    name: 'steps',
    trigger: '/steps',
    icon: '⇥',
    description: 'Set max agent steps per response',
    detail: 'Controls how many tool-call iterations the agent can take before stopping. Default: 20.',
    usage: '/steps 40',
    category: 'session',
  },
  {
    name: 'theme',
    trigger: '/theme',
    icon: '◑',
    description: 'Switch color theme',
    detail: 'List available themes or switch to one: dark, nord, monokai, light.',
    usage: '/theme  |  /theme nord  |  /theme monokai',
    category: 'session',
  },
  // ── System & Personas ─────────────────────────────────────────────────────
  {
    name: 'sys',
    trigger: '/sys',
    icon: '⊕',
    description: 'View or set the system prompt',
    detail: 'Show the current system prompt, or set a new one. Usage: /sys <prompt text>',
    usage: '/sys  |  /sys You are a senior Rust engineer…',
    category: 'session',
  },
  {
    name: 'persona',
    trigger: '/persona',
    icon: '◐',
    description: 'Switch Nyx persona',
    detail: 'List personas or switch to one: pair-programmer, senior-engineer, rubber-duck, code-reviewer, minimal.',
    usage: '/persona  |  /persona senior-engineer',
    category: 'session',
  },
  {
    name: 'pin',
    trigger: '/pin',
    icon: '⊛',
    description: 'Pin context that survives /compact',
    detail: 'Add text that is always prepended to every request, even after compacting.',
    usage: '/pin We are using Next.js 14 with the App Router and Prisma 7.',
    category: 'context',
  },
  {
    name: 'unpin',
    trigger: '/unpin',
    icon: '⊝',
    description: 'Remove pinned context',
    detail: 'List pinned items or remove one by index. Usage: /unpin  or  /unpin 1',
    usage: '/unpin  |  /unpin 1',
    category: 'context',
  },
  {
    name: 'todo',
    trigger: '/todo',
    icon: '☐',
    description: 'Extract a todo list from the conversation',
    detail: 'Asks the model to scan the conversation and produce a structured todo list.',
    category: 'context',
  },
  {
    name: 'web',
    trigger: '/web',
    icon: '⌖',
    description: 'Search the web and inject results as context',
    detail: 'Runs a web search and adds the top results to the conversation. Usage: /web <query>',
    usage: '/web Next.js 14 app router file conventions',
    category: 'context',
  },
  {
    name: 'open',
    trigger: '/open',
    icon: '⬡',
    description: 'Open a file in your default editor',
    detail: 'Opens a file with $EDITOR or the system default. Usage: /open src/app.ts',
    usage: '/open src/app.ts',
    category: 'context',
  },
  {
    name: 'template',
    trigger: '/template',
    icon: '⊞',
    description: 'Manage prompt templates',
    detail: 'List, add, use, or delete prompt templates. Usage: /template list | /template add <name> <prompt> | /template use <name> | /template delete <name>',
    usage: '/template  |  /template add mytemplate Fix all TypeScript errors  |  /template use mytemplate',
    category: 'context',
  },
  {
    name: 'alias',
    trigger: '/alias',
    icon: '⇒',
    description: 'Manage command aliases',
    detail: 'Create shortcuts for commands. Usage: /alias | /alias <name> <command> | /alias delete <name>',
    usage: '/alias  |  /alias review /review  |  /alias delete review',
    category: 'session',
  },
  {
    name: 'models',
    trigger: '/models',
    icon: '⊞',
    description: 'List available models for current provider',
    detail: 'Fetches the model list from the active provider without leaving the app.',
    category: 'providers',
  },
  {
    name: 'cost',
    trigger: '/cost',
    icon: '$',
    description: 'Show estimated session cost',
    detail: 'Calculates estimated USD cost based on token usage for paid providers.',
    category: 'providers',
  },
  // ── Context ───────────────────────────────────────────────────────────────
  {
    name: 'context',
    trigger: '/context',
    icon: '@',
    description: 'Add file or folder to context',
    detail: 'Reads a file or lists a directory and injects it into the conversation. Also usable inline with @path syntax.',
    usage: '/context src/app.ts  |  /context src/',
    category: 'context',
  },
  {
    name: 'diff',
    trigger: '/diff',
    icon: '±',
    description: 'Show session file changes',
    detail: 'Lists all files modified by tool calls in this session.',
    usage: '/diff',
    category: 'context',
  },
  // ── Git ───────────────────────────────────────────────────────────────────
  {
    name: 'review',
    trigger: '/review',
    icon: '◎',
    description: 'AI code review of current changes',
    detail: 'Reviews staged changes (or HEAD diff if nothing staged). Flags bugs, security issues, anti-patterns, and suggestions.',
    usage: '/review',
    category: 'git',
  },
  {
    name: 'commit',
    trigger: '/commit',
    icon: '⎇',
    description: 'AI-generated git commit',
    detail: 'Reads your staged diff and generates a conventional commit message. Nyx is added as co-author automatically.',
    usage: '/commit',
    category: 'git',
  },
  {
    name: 'git',
    trigger: '/git',
    icon: '⎇',
    description: 'Run git commands and show results',
    detail: 'Quick git panel: status, log, stash, branch, or any git command. Usage: /git | /git log | /git stash | /git branch',
    usage: '/git  |  /git log  |  /git stash  |  /git branch  |  /git diff HEAD',
    category: 'git',
  },
  {
    name: 'history',
    trigger: '/history',
    icon: '◷',
    description: 'Browse and restore session history',
    detail: 'List recent sessions or restore one by index.',
    usage: '/history  |  /history 3',
    category: 'session',
  },
  {
    name: 'share',
    trigger: '/share',
    icon: '↗',
    description: 'Export conversation as self-contained HTML',
    detail: 'Generates a beautiful HTML file of the conversation with syntax highlighting.',
    usage: '/share',
    category: 'session',
  },
  // ── Tools ─────────────────────────────────────────────────────────────────
  {
    name: 'init',
    trigger: '/init',
    icon: '⬡',
    description: 'Generate a .nyx.md project config for this repo',
    detail: 'Analyzes the project structure and generates a .nyx.md file with project-specific context, conventions, and instructions.',
    usage: '/init',
    category: 'tools',
  },
  {
    name: 'doctor',
    trigger: '/doctor',
    icon: '✚',
    description: 'Check LocalCode health — providers, tools, git, memory',
    detail: 'Runs diagnostics: Ollama status, API keys, git repo, .nyx.md, MCP servers, hooks, and Node.js version.',
    usage: '/doctor',
    category: 'tools',
  },
  {
    name: 'memory',
    trigger: '/memory',
    icon: '◈',
    description: 'Show and manage memory files (.nyx.md)',
    detail: 'Shows all loaded .nyx.md memory files. Use /memory edit to open global ~/.nyx.md in your editor.',
    usage: '/memory  |  /memory edit',
    category: 'tools',
  },
  {
    name: 'hooks',
    trigger: '/hooks',
    icon: '⚙',
    description: 'Show configured hooks (PreToolUse / PostToolUse / Notification)',
    detail: 'Hooks run shell commands before/after tool calls. Configure in ~/.localcode/hooks.json.',
    category: 'tools',
  },
  {
    name: 'mcp',
    trigger: '/mcp',
    icon: '⬡',
    description: 'Manage MCP servers',
    detail: 'List, add, or remove MCP servers. Tools from connected servers are available to the agent automatically.',
    usage: '/mcp list  |  /mcp add <n> stdio <cmd>  |  /mcp tools',
    category: 'tools',
  },
  {
    name: 'watch',
    trigger: '/watch',
    icon: '◉',
    description: 'Watch a file for changes and re-run last message',
    detail: 'Automatically re-sends your last message when a file changes. Usage: /watch <file> | /watch stop',
    usage: '/watch src/app.ts  |  /watch stop  |  /watch',
    category: 'tools',
  },
  {
    name: 'explain',
    trigger: '/explain',
    icon: '◈',
    description: 'Explain code — a file or the last snippet',
    detail: 'Pass a file path to explain that file, or use with no args to explain the last code snippet.',
    usage: '/explain  |  /explain src/app.ts',
    category: 'tools',
  },
  {
    name: 'test',
    trigger: '/test',
    icon: '✚',
    description: 'Run tests using the detected test runner',
    detail: 'Detects jest/vitest/pytest/cargo/go and runs tests. Offers to fix failures.',
    usage: '/test',
    category: 'tools',
  },
  {
    name: 'image',
    trigger: '/image',
    icon: '⊞',
    description: 'Load an image file for vision analysis',
    detail: 'Read an image file and add it to the conversation for vision-capable models.',
    usage: '/image screenshot.png',
    category: 'context',
  },
  {
    name: 'index',
    trigger: '/index',
    icon: '⌖',
    description: 'Build TF-IDF search index for working directory',
    detail: 'Indexes all text files for semantic search. Use /search after indexing for better results.',
    usage: '/index',
    category: 'tools',
  },
  {
    name: 'plugins',
    trigger: '/plugins',
    icon: '⬡',
    description: 'List loaded plugins',
    detail: 'Shows all plugins loaded from ~/.localcode/plugins/',
    usage: '/plugins',
    category: 'tools',
  },
  // ── Providers ─────────────────────────────────────────────────────────────
  {
    name: 'provider',
    trigger: '/provider',
    icon: '◈',
    description: 'Switch AI provider',
    detail: 'List available providers, or switch to one. Switches model to the provider\'s default automatically.',
    usage: '/provider  |  /provider claude  |  /provider ollama',
    category: 'providers',
  },
  {
    name: 'apikey',
    trigger: '/apikey',
    icon: '⚿',
    description: 'Set API key for current provider',
    detail: 'Stores a key for the active provider in memory. Keys can also be set via env: ANTHROPIC_API_KEY, OPENAI_API_KEY, GROQ_API_KEY.',
    usage: '/apikey sk-ant-...',
    category: 'providers',
  },
  {
    name: 'model',
    trigger: '/model',
    icon: '⊞',
    description: 'Change model',
    detail: 'Switch to any model supported by the active provider.',
    usage: '/model claude-opus-4-5  |  /model qwen2.5-coder:7b',
    category: 'providers',
  },
  // ── Navigation & Quick Tools ──────────────────────────────────────────────
  {
    name: 'cd',
    trigger: '/cd',
    icon: '⇒',
    description: 'Change working directory',
    detail: 'Change the working directory for file operations and git commands. All tool paths update immediately.',
    usage: '/cd ../other-project  |  /cd /absolute/path',
    category: 'tools',
  },
  {
    name: 'ls',
    trigger: '/ls',
    icon: '≡',
    description: 'List current directory',
    detail: 'Quick directory listing without asking the AI. Use /ls <path> for a specific directory.',
    usage: '/ls  |  /ls src/',
    category: 'tools',
  },
  {
    name: 'search',
    trigger: '/search',
    icon: '⌖',
    description: 'Search file contents (grep or TF-IDF if indexed)',
    detail: 'Search for a pattern. If /index has been run, uses TF-IDF scoring for semantic results.',
    usage: '/search TODO  |  /search "function render"',
    category: 'tools',
  },
  {
    name: 'find',
    trigger: '/find',
    icon: '◎',
    description: 'Find files by name pattern',
    detail: 'Find files matching a glob pattern without asking the AI.',
    usage: '/find *.ts  |  /find *.test.*',
    category: 'tools',
  },
  {
    name: 'ping',
    trigger: '/ping',
    icon: '◉',
    description: 'Test provider connectivity and latency',
    detail: 'Sends a test request to the current provider and measures response time. Useful for diagnosing connection issues.',
    usage: '/ping',
    category: 'providers',
  },
  // ── v4: Nuclear features ──────────────────────────────────────────────────
  {
    name: 'swarm',
    trigger: '/swarm',
    icon: '⇶',
    description: 'Split task into parallel sub-agents and run simultaneously',
    detail: 'Decomposes a task into N subtasks, runs them in parallel with independent tool executors, and merges results.',
    usage: '/swarm "refactor all service files" 3',
    category: 'tools',
  },
  {
    name: 'test-loop',
    trigger: '/test-loop',
    icon: '↻',
    description: 'Run tests, feed failures to agent, repeat until green',
    detail: 'Auto-detects your test runner, runs tests, asks Nyx to fix failures, and loops until all pass or max iterations reached.',
    usage: '/test-loop  |  /test-loop 10',
    category: 'tools',
  },
  {
    name: 'autopilot',
    trigger: '/autopilot',
    icon: '⬡',
    description: 'Background daemon: auto-commit when tests pass after file changes',
    detail: 'Watches the working directory for changes. When tests pass, auto-creates a git commit. Use /autopilot off to stop.',
    usage: '/autopilot  |  /autopilot on  |  /autopilot off',
    category: 'git',
  },
  {
    name: 'dna',
    trigger: '/dna',
    icon: '⌬',
    description: 'Analyze git history to extract your coding style and pin it',
    detail: 'Reads recent git commits authored by you, extracts naming conventions, patterns, and style, then pins it as context so Nyx always matches your code.',
    usage: '/dna',
    category: 'context',
  },
  {
    name: 'budget',
    trigger: '/budget',
    icon: '$',
    description: 'Set a USD spend cap — auto-switches to local model when hit',
    detail: 'Hard cap on session spending. When reached, automatically switches to Ollama to continue free. Use /budget off to remove the limit.',
    usage: '/budget 5.00  |  /budget 5.00 qwen2.5-coder:7b  |  /budget off',
    category: 'providers',
  },
  {
    name: 'routing',
    trigger: '/routing',
    icon: '⇌',
    description: 'Route different steps to different models (planning/execution/review)',
    detail: 'Use expensive models for planning, cheap/local for execution, smart for review. Set per-phase: planning=claude-opus-4-6 execution=ollama review=gpt-4o',
    usage: '/routing  |  /routing planning=claude-opus-4-6 execution=ollama  |  /routing clear',
    category: 'providers',
  },
  {
    name: 'safe',
    trigger: '/safe',
    icon: '⊛',
    description: 'Toggle safe mode: git stash before edits, auto-revert on test fail',
    detail: 'When enabled, Nyx stashes before making changes. If tests fail after the run, changes are reverted automatically.',
    usage: '/safe  |  /safe on  |  /safe off',
    category: 'git',
  },
  {
    name: 'evolve',
    trigger: '/evolve',
    icon: '↑',
    description: 'Post-session eval — update .nyx.md with patterns learned this session',
    detail: 'Analyzes the conversation to extract what worked, what you corrected, and project conventions learned. Appends findings to .nyx.md.',
    usage: '/evolve',
    category: 'context',
  },
  {
    name: 'chaos',
    trigger: '/chaos',
    icon: '⚡',
    description: 'Proactive unsolicited code improvement hunt across the codebase',
    detail: 'Switches to chaos-refactor persona and sweeps the codebase for dead code, duplicates, naming issues, and anti-patterns — without being asked.',
    usage: '/chaos',
    category: 'tools',
  },
  {
    name: 'benchmark',
    trigger: '/benchmark',
    icon: '⊞',
    description: 'Run same prompt on all configured providers and compare results',
    detail: 'Sends the prompt to every provider with an API key configured, measures latency and cost, and displays a side-by-side comparison.',
    usage: '/benchmark "explain what React hooks are"',
    category: 'providers',
  },
  {
    name: 'privacy',
    trigger: '/privacy',
    icon: '⊝',
    description: 'Show all providers called and estimated tokens sent this session',
    detail: 'Displays a breakdown of every provider called, total tokens sent to each, and estimated cost — so you know exactly what left your machine.',
    usage: '/privacy',
    category: 'providers',
  },
];
