// src/providers/client.ts
// Unified streaming client for Ollama, Claude, OpenAI, Groq

import { Provider, ProviderConfig, Message, ToolCall, PROVIDERS } from '../core/types.js';

export interface StreamChunk {
  type: 'text' | 'tool_call' | 'tool_result' | 'done' | 'error';
  text?: string;
  toolCall?: ToolCall;
  error?: string;
}

export type ChunkCallback = (chunk: StreamChunk) => void;

// ─── Tool definitions (sent to the model) ─────────────────────────────────────

const TOOLS_DEFINITION = [
  {
    name: 'read_file',
    description: 'Read the contents of a file',
    parameters: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'File path to read' },
      },
      required: ['path'],
    },
  },
  {
    name: 'write_file',
    description: 'Write content to a file (creates or overwrites)',
    parameters: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'File path to write' },
        content: { type: 'string', description: 'Content to write' },
      },
      required: ['path', 'content'],
    },
  },
  {
    name: 'patch_file',
    description: 'Replace a specific string in a file with new content',
    parameters: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'File path to patch' },
        old_str: { type: 'string', description: 'Exact string to replace' },
        new_str: { type: 'string', description: 'Replacement string' },
      },
      required: ['path', 'old_str', 'new_str'],
    },
  },
  {
    name: 'run_shell',
    description: 'Run a shell command and return stdout/stderr',
    parameters: {
      type: 'object',
      properties: {
        command: { type: 'string', description: 'Shell command to run' },
        cwd: { type: 'string', description: 'Working directory (optional)' },
      },
      required: ['command'],
    },
  },
  {
    name: 'list_dir',
    description: 'List files and directories at a path',
    parameters: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'Directory path' },
        recursive: { type: 'boolean', description: 'List recursively' },
      },
      required: ['path'],
    },
  },
  {
    name: 'git_operation',
    description: 'Run a git command',
    parameters: {
      type: 'object',
      properties: {
        args: { type: 'string', description: 'Git arguments (e.g. "status", "diff HEAD")' },
      },
      required: ['args'],
    },
  },
];

// ─── Ollama client ─────────────────────────────────────────────────────────────

async function streamOllama(
  config: ProviderConfig,
  model: string,
  messages: Message[],
  onChunk: ChunkCallback,
): Promise<void> {
  const res = await fetch(`${config.baseUrl}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      messages,
      stream: true,
      tools: TOOLS_DEFINITION,
    }),
  });

  if (!res.ok || !res.body) {
    const text = await res.text();
    onChunk({ type: 'error', error: `Ollama error ${res.status}: ${text}` });
    return;
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';

    for (const line of lines) {
      if (!line.trim()) continue;
      try {
        const obj = JSON.parse(line);
        const msg = obj.message;
        if (!msg) continue;

        if (msg.content) {
          onChunk({ type: 'text', text: msg.content });
        }
        if (msg.tool_calls) {
          for (const tc of msg.tool_calls) {
            onChunk({
              type: 'tool_call',
              toolCall: {
                name: tc.function.name,
                args: tc.function.arguments ?? {},
              },
            });
          }
        }
        if (obj.done) {
          onChunk({ type: 'done' });
        }
      } catch {
        // Malformed JSON line — skip
      }
    }
  }
}

// ─── Anthropic (Claude) client ────────────────────────────────────────────────

async function streamClaude(
  config: ProviderConfig,
  model: string,
  messages: Message[],
  onChunk: ChunkCallback,
): Promise<void> {
  const apiKey = config.apiKey;
  if (!apiKey) {
    onChunk({ type: 'error', error: 'No Anthropic API key set. Use /apikey sk-ant-...' });
    return;
  }

  // Convert tools to Anthropic format
  const claudeTools = TOOLS_DEFINITION.map((t) => ({
    name: t.name,
    description: t.description,
    input_schema: t.parameters,
  }));

  const res = await fetch(`${config.baseUrl}/v1/messages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model,
      max_tokens: 8096,
      messages,
      tools: claudeTools,
      stream: true,
    }),
  });

  if (!res.ok || !res.body) {
    const text = await res.text();
    onChunk({ type: 'error', error: `Claude error ${res.status}: ${text}` });
    return;
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let currentToolName = '';
  let currentToolInput = '';
  let inToolUse = false;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const raw = line.slice(6).trim();
        if (raw === '[DONE]') { onChunk({ type: 'done' }); continue; }
        try {
          const ev = JSON.parse(raw);
          if (ev.type === 'content_block_start' && ev.content_block?.type === 'tool_use') {
            inToolUse = true;
            currentToolName = ev.content_block.name;
            currentToolInput = '';
          } else if (ev.type === 'content_block_delta') {
            if (inToolUse && ev.delta?.type === 'input_json_delta') {
              currentToolInput += ev.delta.partial_json ?? '';
            } else if (ev.delta?.type === 'text_delta') {
              onChunk({ type: 'text', text: ev.delta.text });
            }
          } else if (ev.type === 'content_block_stop' && inToolUse) {
            try {
              const args = JSON.parse(currentToolInput || '{}');
              onChunk({ type: 'tool_call', toolCall: { name: currentToolName, args } });
            } catch {
              onChunk({ type: 'tool_call', toolCall: { name: currentToolName, args: {} } });
            }
            inToolUse = false;
          } else if (ev.type === 'message_stop') {
            onChunk({ type: 'done' });
          }
        } catch {
          // skip
        }
      }
    }
  }
}

// ─── OpenAI-compatible client (OpenAI + Groq) ────────────────────────────────

async function streamOpenAICompat(
  baseUrl: string,
  apiKey: string,
  model: string,
  messages: Message[],
  onChunk: ChunkCallback,
  providerName: string,
): Promise<void> {
  if (!apiKey) {
    onChunk({ type: 'error', error: `No ${providerName} API key set. Use /apikey ...` });
    return;
  }

  const openaiTools = TOOLS_DEFINITION.map((t) => ({
    type: 'function' as const,
    function: {
      name: t.name,
      description: t.description,
      parameters: t.parameters,
    },
  }));

  const res = await fetch(`${baseUrl}/v1/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages,
      tools: openaiTools,
      tool_choice: 'auto',
      stream: true,
    }),
  });

  if (!res.ok || !res.body) {
    const text = await res.text();
    onChunk({ type: 'error', error: `${providerName} error ${res.status}: ${text}` });
    return;
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  // Track partial tool calls (can arrive across multiple chunks)
  const toolCallAccumulators: Record<number, { name: string; args: string }> = {};

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';

    for (const line of lines) {
      if (!line.startsWith('data: ')) continue;
      const raw = line.slice(6).trim();
      if (raw === '[DONE]') { onChunk({ type: 'done' }); continue; }
      try {
        const ev = JSON.parse(raw);
        const delta = ev.choices?.[0]?.delta;
        if (!delta) continue;

        if (delta.content) {
          onChunk({ type: 'text', text: delta.content });
        }

        if (delta.tool_calls) {
          for (const tc of delta.tool_calls) {
            const idx = tc.index ?? 0;
            if (!toolCallAccumulators[idx]) {
              toolCallAccumulators[idx] = { name: tc.function?.name ?? '', args: '' };
            }
            if (tc.function?.name) toolCallAccumulators[idx].name = tc.function.name;
            if (tc.function?.arguments) toolCallAccumulators[idx].args += tc.function.arguments;
          }
        }

        // Flush complete tool calls when finish_reason is tool_calls
        if (ev.choices?.[0]?.finish_reason === 'tool_calls') {
          for (const acc of Object.values(toolCallAccumulators)) {
            try {
              const args = JSON.parse(acc.args || '{}');
              onChunk({ type: 'tool_call', toolCall: { name: acc.name, args } });
            } catch {
              onChunk({ type: 'tool_call', toolCall: { name: acc.name, args: {} } });
            }
          }
          onChunk({ type: 'done' });
        }
      } catch {
        // skip
      }
    }
  }
}

// ─── Unified entrypoint ───────────────────────────────────────────────────────

export async function streamProvider(
  provider: Provider,
  apiKeys: Partial<Record<Provider, string>>,
  model: string,
  messages: Message[],
  onChunk: ChunkCallback,
): Promise<void> {
  const config = { ...PROVIDERS[provider], apiKey: apiKeys[provider] };

  switch (provider) {
    case 'ollama':
      return streamOllama(config, model, messages, onChunk);
    case 'claude':
      return streamClaude(config, model, messages, onChunk);
    case 'openai':
      return streamOpenAICompat(
        config.baseUrl, config.apiKey ?? '', model, messages, onChunk, 'OpenAI',
      );
    case 'groq':
      return streamOpenAICompat(
        config.baseUrl, config.apiKey ?? '', model, messages, onChunk, 'Groq',
      );
  }
}
