import { McpTool, McpCallResult, McpServerConfig } from './client.js';
export type { McpTool, McpCallResult, McpServerConfig };
export declare function loadMcpConfigs(): McpServerConfig[];
export declare function saveMcpConfigs(configs: McpServerConfig[]): void;
export declare class McpManager {
    private clients;
    private configs;
    private reconnectTimers;
    private reconnectAttempts;
    private autoReconnect;
    constructor();
    getConfigs(): McpServerConfig[];
    setAutoReconnect(enabled: boolean): void;
    connectAll(onStatus?: (msg: string) => void): Promise<void>;
    connect(config: McpServerConfig, onStatus?: (msg: string) => void): Promise<string | null>;
    private scheduleReconnect;
    disconnect(name: string): void;
    /** Force reconnect of a specific server */
    reconnect(name: string, onStatus?: (msg: string) => void): Promise<string | null>;
    /** Check health of all connected servers and reconnect if needed */
    healthCheck(onStatus?: (msg: string) => void): Promise<void>;
    getAllTools(): McpTool[];
    getToolDefinitions(): Array<{
        name: string;
        description: string;
        parameters: Record<string, unknown>;
    }>;
    callTool(namespacedName: string, args: Record<string, unknown>): Promise<McpCallResult>;
    isMcpTool(name: string): boolean;
    getStatus(): Array<{
        name: string;
        connected: boolean;
        toolCount: number;
        transport: string;
        reconnectAttempts: number;
    }>;
    /** Cleanup all timers on shutdown */
    dispose(): void;
}
//# sourceMappingURL=manager.d.ts.map