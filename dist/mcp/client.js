// src/mcp/client.ts
// MCP (Model Context Protocol) client — stdio and HTTP/SSE transports
import { spawn } from 'child_process';
import { EventEmitter } from 'events';
// ─── Base MCP client ───────────────────────────────────────────────────────────
export class McpClientBase extends EventEmitter {
    reqId = 0;
    tools = [];
    name;
    connected = false;
    constructor(name) {
        super();
        this.name = name;
    }
    nextId() {
        return ++this.reqId;
    }
    async initialize() {
        // MCP initialize handshake
        await this.send('initialize', {
            protocolVersion: '2024-11-05',
            capabilities: { tools: {} },
            clientInfo: { name: 'localcode', version: '2.2.0' },
        });
        // Fetch tool list
        const result = await this.send('tools/list', {});
        this.tools = (result?.tools ?? []).map((t) => ({
            name: t.name,
            description: t.description ?? '',
            inputSchema: t.inputSchema ?? { type: 'object', properties: {} },
            serverName: this.name,
        }));
        this.connected = true;
    }
    async callTool(toolName, args) {
        try {
            const result = await this.send('tools/call', {
                name: toolName,
                arguments: args,
            });
            const text = (result?.content ?? [])
                .filter((c) => c.type === 'text')
                .map((c) => c.text ?? '')
                .join('\n');
            return { success: true, output: text || JSON.stringify(result), rawContent: result };
        }
        catch (err) {
            return {
                success: false,
                output: err instanceof Error ? err.message : String(err),
            };
        }
    }
}
// ─── Stdio transport ───────────────────────────────────────────────────────────
export class StdioMcpClient extends McpClientBase {
    proc = null;
    pending = new Map();
    buffer = '';
    config;
    constructor(config) {
        super(config.name);
        this.config = config;
    }
    async connect() {
        const { command, args = [], env = {} } = this.config;
        if (!command)
            throw new Error(`MCP server "${this.name}" missing command`);
        this.proc = spawn(command, args, {
            env: { ...process.env, ...env },
            stdio: ['pipe', 'pipe', 'pipe'],
        });
        this.proc.stdout.on('data', (chunk) => {
            this.buffer += chunk.toString();
            const lines = this.buffer.split('\n');
            this.buffer = lines.pop() ?? '';
            for (const line of lines) {
                if (!line.trim())
                    continue;
                try {
                    const msg = JSON.parse(line);
                    const handler = this.pending.get(msg.id);
                    if (handler) {
                        this.pending.delete(msg.id);
                        if (msg.error) {
                            handler.reject(new Error(`MCP error ${msg.error.code}: ${msg.error.message}`));
                        }
                        else {
                            handler.resolve(msg.result);
                        }
                    }
                }
                catch {
                    // not JSON — ignore
                }
            }
        });
        this.proc.stderr.on('data', (chunk) => {
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
    async send(method, params) {
        return new Promise((resolve, reject) => {
            const id = this.nextId();
            const req = { jsonrpc: '2.0', id, method, params };
            this.pending.set(id, { resolve, reject });
            // 30s timeout
            const timer = setTimeout(() => {
                this.pending.delete(id);
                reject(new Error(`MCP request timed out: ${method}`));
            }, 30_000);
            this.pending.get(id).resolve = (v) => { clearTimeout(timer); resolve(v); };
            this.pending.get(id).reject = (e) => { clearTimeout(timer); reject(e); };
            try {
                this.proc.stdin.write(JSON.stringify(req) + '\n');
            }
            catch (err) {
                this.pending.delete(id);
                reject(err);
            }
        });
    }
    disconnect() {
        this.proc?.kill();
        this.proc = null;
        this.connected = false;
    }
}
// ─── HTTP / SSE transport ──────────────────────────────────────────────────────
export class HttpMcpClient extends McpClientBase {
    config;
    constructor(config) {
        super(config.name);
        this.config = config;
    }
    async connect() {
        await this.initialize();
    }
    async send(method, params) {
        const { url, headers = {} } = this.config;
        if (!url)
            throw new Error(`MCP server "${this.name}" missing url`);
        const id = this.nextId();
        const body = { jsonrpc: '2.0', id, method, params };
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
        const data = await res.json();
        if (data.error) {
            throw new Error(`MCP error ${data.error.code}: ${data.error.message}`);
        }
        return data.result;
    }
    disconnect() {
        this.connected = false;
    }
}
// ─── Factory ───────────────────────────────────────────────────────────────────
export function createMcpClient(config) {
    if (config.transport === 'http')
        return new HttpMcpClient(config);
    return new StdioMcpClient(config);
}
//# sourceMappingURL=client.js.map