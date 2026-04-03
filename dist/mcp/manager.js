// src/mcp/manager.ts
// Manages all connected MCP servers with auto-reconnection
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { createMcpClient } from './client.js';
import { logger } from '../core/logger.js';
const MCP_CONFIG_FILE = path.join(os.homedir(), '.localcode', 'mcp.json');
const RECONNECT_INTERVAL = 30000; // 30 seconds
const MAX_RECONNECT_ATTEMPTS = 5;
export function loadMcpConfigs() {
    if (!fs.existsSync(MCP_CONFIG_FILE))
        return [];
    try {
        return JSON.parse(fs.readFileSync(MCP_CONFIG_FILE, 'utf8'));
    }
    catch {
        return [];
    }
}
export function saveMcpConfigs(configs) {
    fs.mkdirSync(path.dirname(MCP_CONFIG_FILE), { recursive: true });
    fs.writeFileSync(MCP_CONFIG_FILE, JSON.stringify(configs, null, 2), 'utf8');
}
export class McpManager {
    clients = new Map();
    configs = [];
    reconnectTimers = new Map();
    reconnectAttempts = new Map();
    autoReconnect = true;
    constructor() {
        this.configs = loadMcpConfigs();
    }
    getConfigs() {
        return this.configs;
    }
    setAutoReconnect(enabled) {
        this.autoReconnect = enabled;
    }
    async connectAll(onStatus) {
        for (const config of this.configs) {
            await this.connect(config, onStatus);
        }
    }
    async connect(config, onStatus) {
        // Clear any existing reconnect timer
        const existingTimer = this.reconnectTimers.get(config.name);
        if (existingTimer) {
            clearTimeout(existingTimer);
            this.reconnectTimers.delete(config.name);
        }
        this.reconnectAttempts.delete(config.name);
        try {
            onStatus?.(`Connecting to MCP server "${config.name}"…`);
            const client = createMcpClient(config);
            await client.connect();
            this.clients.set(config.name, client);
            if (!this.configs.find((c) => c.name === config.name)) {
                this.configs.push(config);
                saveMcpConfigs(this.configs);
            }
            onStatus?.(`✓ Connected to "${config.name}" — ${client.tools.length} tools`);
            logger.info('MCP server connected', { name: config.name, tools: client.tools.length });
            return null;
        }
        catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            onStatus?.(`✕ Failed to connect "${config.name}": ${msg}`);
            logger.warn('MCP server connection failed', { name: config.name, error: msg });
            // Schedule auto-reconnect
            if (this.autoReconnect) {
                this.scheduleReconnect(config, onStatus);
            }
            return msg;
        }
    }
    scheduleReconnect(config, onStatus) {
        const attempts = this.reconnectAttempts.get(config.name) ?? 0;
        if (attempts >= MAX_RECONNECT_ATTEMPTS) {
            logger.warn('MCP server max reconnect attempts reached', { name: config.name });
            return;
        }
        this.reconnectAttempts.set(config.name, attempts + 1);
        const delay = RECONNECT_INTERVAL * Math.pow(2, attempts);
        logger.info('Scheduling MCP reconnect', { name: config.name, attempt: attempts + 1, delay });
        const timer = setTimeout(async () => {
            this.reconnectTimers.delete(config.name);
            onStatus?.(`Reconnecting to "${config.name}" (attempt ${attempts + 1}/${MAX_RECONNECT_ATTEMPTS})…`);
            await this.connect(config, onStatus);
        }, delay);
        this.reconnectTimers.set(config.name, timer);
    }
    disconnect(name) {
        const timer = this.reconnectTimers.get(name);
        if (timer) {
            clearTimeout(timer);
            this.reconnectTimers.delete(name);
        }
        this.reconnectAttempts.delete(name);
        const client = this.clients.get(name);
        if (client) {
            client.disconnect();
            this.clients.delete(name);
        }
        this.configs = this.configs.filter((c) => c.name !== name);
        saveMcpConfigs(this.configs);
        logger.info('MCP server disconnected', { name });
    }
    /** Force reconnect of a specific server */
    async reconnect(name, onStatus) {
        const config = this.configs.find((c) => c.name === name);
        if (!config) {
            return `Server "${name}" not found in configs`;
        }
        this.disconnect(name);
        return this.connect(config, onStatus);
    }
    /** Check health of all connected servers and reconnect if needed */
    async healthCheck(onStatus) {
        for (const config of this.configs) {
            const client = this.clients.get(config.name);
            if (!client || !client.connected) {
                if (this.autoReconnect) {
                    await this.connect(config, onStatus);
                }
            }
        }
    }
    getAllTools() {
        const tools = [];
        for (const client of this.clients.values()) {
            tools.push(...client.tools);
        }
        return tools;
    }
    getToolDefinitions() {
        return this.getAllTools().map((t) => ({
            name: `mcp__${t.serverName}__${t.name}`,
            description: `[${t.serverName}] ${t.description}`,
            parameters: t.inputSchema,
        }));
    }
    async callTool(namespacedName, args) {
        const parts = namespacedName.split('__');
        if (parts.length < 3 || parts[0] !== 'mcp') {
            return { success: false, output: `Invalid MCP tool name: ${namespacedName}` };
        }
        const serverName = parts[1];
        const toolName = parts.slice(2).join('__');
        let client = this.clients.get(serverName);
        // If client is disconnected, try to reconnect
        if (!client || !client.connected) {
            const config = this.configs.find((c) => c.name === serverName);
            if (config) {
                logger.info('Reconnecting MCP server for tool call', { name: serverName });
                await this.connect(config);
                client = this.clients.get(serverName);
            }
        }
        if (!client) {
            return { success: false, output: `MCP server "${serverName}" not connected` };
        }
        return client.callTool(toolName, args);
    }
    isMcpTool(name) {
        return name.startsWith('mcp__');
    }
    getStatus() {
        return this.configs.map((config) => {
            const client = this.clients.get(config.name);
            return {
                name: config.name,
                connected: client?.connected ?? false,
                toolCount: client?.tools.length ?? 0,
                transport: config.transport,
                reconnectAttempts: this.reconnectAttempts.get(config.name) ?? 0,
            };
        });
    }
    /** Cleanup all timers on shutdown */
    dispose() {
        for (const timer of this.reconnectTimers.values()) {
            clearTimeout(timer);
        }
        this.reconnectTimers.clear();
        for (const client of this.clients.values()) {
            client.disconnect();
        }
        this.clients.clear();
    }
}
//# sourceMappingURL=manager.js.map