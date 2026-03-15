import { EventEmitter } from 'events';
export interface McpTool {
    name: string;
    description: string;
    inputSchema: Record<string, unknown>;
    serverName: string;
}
export interface McpCallResult {
    success: boolean;
    output: string;
    rawContent?: unknown;
}
export interface McpServerConfig {
    name: string;
    transport: 'stdio' | 'http';
    command?: string;
    args?: string[];
    env?: Record<string, string>;
    url?: string;
    headers?: Record<string, string>;
}
export declare abstract class McpClientBase extends EventEmitter {
    protected reqId: number;
    tools: McpTool[];
    readonly name: string;
    connected: boolean;
    constructor(name: string);
    protected nextId(): number;
    abstract send(method: string, params?: unknown): Promise<unknown>;
    abstract connect(): Promise<void>;
    abstract disconnect(): void;
    initialize(): Promise<void>;
    callTool(toolName: string, args: Record<string, unknown>): Promise<McpCallResult>;
}
export declare class StdioMcpClient extends McpClientBase {
    private proc;
    private pending;
    private buffer;
    private config;
    constructor(config: McpServerConfig);
    connect(): Promise<void>;
    send(method: string, params?: unknown): Promise<unknown>;
    disconnect(): void;
}
export declare class HttpMcpClient extends McpClientBase {
    private config;
    constructor(config: McpServerConfig);
    connect(): Promise<void>;
    send(method: string, params?: unknown): Promise<unknown>;
    disconnect(): void;
}
export declare function createMcpClient(config: McpServerConfig): McpClientBase;
//# sourceMappingURL=client.d.ts.map