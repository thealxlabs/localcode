# LocalCode

> A local AI coding assistant for your terminal — powered by Ollama, Claude, OpenAI, or Groq.

```
 /\_/\   LocalCode  v2.1  @localcode/cli
( ·.· )  provider  Ollama  qwen2.5-coder:7b
 > ♥ <   cwd       ~/projects/myapp            [idle]
          tokens    0
```

## Install

```bash
npm install -g @localcode/cli
```

Or run without installing:

```bash
npx @localcode/cli
```

Or via the install script:

```bash
curl -fsSL https://localcode.thealxlabs.ca/install.sh | sh
```

## First run

On first launch, LocalCode walks you through setup — choosing a provider, entering an API key if needed, and verifying your Ollama install if using local models.

For Ollama (free, local, no key needed):

```bash
# Install Ollama first
curl -fsSL https://ollama.com/install.sh | sh
ollama pull qwen2.5-coder:7b

# Then launch
localcode
```

For Claude:

```bash
ANTHROPIC_API_KEY=sk-ant-xxx localcode
# or set it inside the app with /apikey sk-ant-xxx
```

## Providers

| Provider | Models | Key required |
|----------|--------|--------------|
| Ollama   | qwen2.5-coder, llama3, mistral, etc. | No |
| Claude   | claude-sonnet-4-5, claude-opus-4-5, etc. | Yes |
| OpenAI   | gpt-4o, gpt-4o-mini, etc. | Yes |
| Groq     | llama-3.3-70b, mixtral, etc. | Yes |

Switch providers inside the app:

```
/provider claude
/apikey sk-ant-xxx
```

## Commands

Type `/` to open the command picker. All commands:

| Command | Description |
|---------|-------------|
| `/clear` | Clear conversation history |
| `/compact` | Summarize & compress the conversation |
| `/status` | Show session info (provider, tokens, checkpoints) |
| `/checkpoint <label>` | Save a checkpoint |
| `/restore` | List and restore checkpoints |
| `/commit` | AI-generated git commit, co-authored by Nyx |
| `/diff` | Show files modified this session |
| `/context <path>` | Add a file or folder to context |
| `/allowall` | Toggle permission prompts for tool calls |
| `/provider [name]` | Switch provider |
| `/apikey <key>` | Set API key for current provider |
| `/model <name>` | Change model |
| `/exit` | Exit |

## Context injection

Reference files inline in your messages:

```
fix the bug in @src/app.ts
refactor everything in @src/
```

## Features

- **Permission prompts** — asks before any file write, patch, or delete
- **Streaming diffs** — shows exactly what changed after every file edit
- **Checkpoints** — save and restore full conversation state
- **Shell history** — ↑/↓ to navigate previous messages
- **Nyx** — your AI assistant, co-authors every commit

## Environment variables

```bash
ANTHROPIC_API_KEY   # Claude
OPENAI_API_KEY      # OpenAI
GROQ_API_KEY        # Groq
```

## Requirements

- Node.js 18+
- Ollama (if using local models)

## License

MIT © [TheAlxLabs](https://github.com/thealxlabs)
