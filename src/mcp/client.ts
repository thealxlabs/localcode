// src/mcp/client.ts
// MCP (Model Context Protocol) client — stdio and HTTP/SSE transports

import { spawn, ChildProcess } from 'child_process';
import { EventEmitter } from 'events';

export interface McpTool {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
  serverName: string;  // which MCP server provides this tool
}

export interface McpCallResult {
  success: boolean;
  output: string;
  rawContent?: unknown;
}

export interface McpServerConfig {
  name: string;
  transport: 'stdio' | 'http';
  // stdio
  command?: string;
  args?: string[];
  env?: Record<string, string>;
  // http / SSE
  url?: string;
  headers?: Record<string, string>;
}

// ─── JSON-RPC helpers ──────────────────────────────────────────────────────────

interface JsonRpcRequest {
  jsonrpc: '2.0';
  id: number;
  method: string;
  params?: unknown;
}

interface JsonRpcResponse {
  jsonrpc: '2.0';
  id: number;
  result?: unknown;
  error?: { code: number; message: string; data?: unknown };
}

// ─── Base MCP client ───────────────────────────────────────────────────────────

export abstract class McpClientBase extends EventEmitter {
  protected reqId = 0;
  public tools: McpTool[] = [];
  public readonly name: string;
  public connected = false;

  constructor(name: string) {
    super();
    this.name = name;
  }

  protected nextId(): number {
    return ++this.reqId;
  }

  abstract send(method: string, params?: unknown): Promise<unknown>;
  abstract connect(): Promise<void>;
  abstract disconnect(): void;

  async initialize(): Promise<void> {
    // MCP initialize handshake
    await this.send('initialize', {
      protocolVersion: '2024-11-05',
      capabilities: { tools: {} },
      clientInfo: { name: 'localcode', version: '2.2.0' },
    });

    // Fetch tool list
    const result = await this.send('tools/list', {}) as { tools?: Array<{
      name: string;
      description?: string;
      inputSchema?: Record<string, unknown>;
    }> };

    this.tools = (result?.tools ?? []).map((t) => ({
      name: t.name,
      description: t.description ?? '',
      inputSchema: t.inputSchema ?? { type: 'object', properties: {} },
      serverName: this.name,
    }));

    this.connected = true;
  }

  async callTool(toolName: string, args: Record<string, unknown>): Promise<McpCallResult> {
    try {
      const result = await this.send('tools/call', {
        name: toolName,
        arguments: args,
      }) as { content?: Array<{ type: string; text?: string }> };

      const text = (result?.content ?? [])
        .filter((c) => c.type === 'text')
        .map((c) => c.text ?? '')
        .join('\n');

      return { success: true, output: text || JSON.stringify(result), rawContent: result };
    } catch (err) {
      return {
        success: false,
        output: err instanceof Error ? err.message : String(err),
      };
    }
  }
}

// ─── Stdio transport ───────────────────────────────────────────────────────────

export class StdioMcpClient extends McpClientBase {
  private proc: ChildProcess | null = null;
  private pending = new Map<number, { resolve: (v: unknown) => void; reject: (e: Error) => void }>();
  private buffer = '';
  private config: McpServerConfig;

  constructor(config: McpServerConfig) {
    super(config.name);
    this.config = config;
  }

  async connect(): Promise<void> {
    const { command, args = [], env = {} } = this.config;
    if (!command) throw new Error(`MCP server "${this.name}" missing command`);

    this.proc = spawn(command, args, {
      env: { ...process.env, ...env },
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    this.proc.stdout!.on('data', (chunk: Buffer) => {
      this.buffer += chunk.toString();
      const lines = this.buffer.split('\n');
      this.buffer = lines.pop() ?? '';
      for (const line of lines) {
        if (!line.trim()) continue;
        try {
          const msg = JSON.parse(line) as JsonRpcResponse;
          const handler = this.pending.get(msg.id);
          if (handler) {
            this.pending.delete(msg.id);
            if (msg.error) {
              handler.reject(new Error(`MCP error ${msg.error.code}: ${msg.error.message}`));
            } else {
              handler.resolve(msg.result);
            }
          }
        } catch {
          // not JSON — ignore
        }
      }
    });

    this.proc.stderr!.on('data', (chunk: Buffer) => {
      this.emit('stderr', chunk.toString());
    });

    this.proc.on('exit', (code) => {
      this.connected = false;
      this.emit('disconnect', code);
      // Reject all pending
      for (const [, h] of this.pending) {
        h.reject(new Error(`MCP server "${this.name}" exited`));
      }
      this.pending.clear();
    });

    await this.initialize();
  }

  async send(method: string, params?: unknown): Promise<unknown> {
    return new Promise((resolve, reject) => {
      const id = this.nextId();
      const req: JsonRpcRequest = { jsonrpc: '2.0', id, method, params };
      this.pending.set(id, { resolve, reject });

      // 30s timeout
      const timer = setTimeout(() => {
        this.pending.delete(id);
        reject(new Error(`MCP request timed out: ${method}`));
      }, 30_000);

      this.pending.get(id)!.resolve = (v) => { clearTimeout(timer); resolve(v); };
      this.pending.get(id)!.reject  = (e) => { clearTimeout(timer); reject(e); };

      try {
        this.proc!.stdin!.write(JSON.stringify(req) + '\n');
      } catch (err) {
        this.pending.delete(id);
        reject(err);
      }
    });
  }

  disconnect(): void {
    this.proc?.kill();
    this.proc = null;
    this.connected = false;
  }
}

// ─── HTTP / SSE transport ──────────────────────────────────────────────────────

export class HttpMcpClient extends McpClientBase {
  private config: McpServerConfig;

  constructor(config: McpServerConfig) {
    super(config.name);
    this.config = config;
  }

  async connect(): Promise<void> {
    await this.initialize();
  }

  async send(method: string, params?: unknown): Promise<unknown> {
    const { url, headers = {} } = this.config;
    if (!url) throw new Error(`MCP server "${this.name}" missing url`);

    const id = this.nextId();
    const body: JsonRpcRequest = { jsonrpc: '2.0', id, method, params };

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      throw new Error(`MCP HTTP error ${res.status}: ${await res.text()}`);
    }

    const data = await res.json() as JsonRpcResponse;
    if (data.error) {
      throw new Error(`MCP error ${data.error.code}: ${data.error.message}`);
    }
    return data.result;
  }

  disconnect(): void {
    this.connected = false;
  }
}

// ─── Factory ───────────────────────────────────────────────────────────────────

export function createMcpClient(config: McpServerConfig): McpClientBase {
  if (config.transport === 'http') return new HttpMcpClient(config);
  return new StdioMcpClient(config);
}
