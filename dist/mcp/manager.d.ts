import { McpTool, McpCallResult, McpServerConfig } from './client.js';
export type { McpTool, McpCallResult, McpServerConfig };
export declare function loadMcpConfigs(): McpServerConfig[];
export declare function saveMcpConfigs(configs: McpServerConfig[]): void;
export declare class McpManager {
    private clients;
    private configs;
    constructor();
    getConfigs(): McpServerConfig[];
    /** Connect to all saved servers */
    connectAll(onStatus?: (msg: string) => void): Promise<void>;
    /** Connect to one server */
    connect(config: McpServerConfig, onStatus?: (msg: string) => void): Promise<string | null>;
    /** Disconnect a server */
    disconnect(name: string): void;
    /** All tools from all connected servers */
    getAllTools(): McpTool[];
    /** Get tool definitions in the format each provider expects */
    getToolDefinitions(): Array<{
        name: string;
        description: string;
        parameters: Record<string, unknown>;
    }>;
    /** Call an MCP tool by its namespaced name */
    callTool(namespacedName: string, args: Record<string, unknown>): Promise<McpCallResult>;
    isMcpTool(name: string): boolean;
    getStatus(): Array<{
        name: string;
        connected: boolean;
        toolCount: number;
        transport: string;
    }>;
}
//# sourceMappingURL=manager.d.ts.map