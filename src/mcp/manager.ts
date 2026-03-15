// src/mcp/manager.ts
// Manages all connected MCP servers and their tools

import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { McpTool, McpCallResult, McpServerConfig, createMcpClient } from './client.js';
import type { McpClientBase } from './client.js';

// Re-export for convenience
export type { McpTool, McpCallResult, McpServerConfig };

const MCP_CONFIG_FILE = path.join(os.homedir(), '.localcode', 'mcp.json');

// ─── Persist/load server configs ──────────────────────────────────────────────

export function loadMcpConfigs(): McpServerConfig[] {
  if (!fs.existsSync(MCP_CONFIG_FILE)) return [];
  try {
    return JSON.parse(fs.readFileSync(MCP_CONFIG_FILE, 'utf8')) as McpServerConfig[];
  } catch {
    return [];
  }
}

export function saveMcpConfigs(configs: McpServerConfig[]): void {
  fs.mkdirSync(path.dirname(MCP_CONFIG_FILE), { recursive: true });
  fs.writeFileSync(MCP_CONFIG_FILE, JSON.stringify(configs, null, 2), 'utf8');
}

// ─── McpManager ───────────────────────────────────────────────────────────────

export class McpManager {
  private clients = new Map<string, McpClientBase>();
  private configs: McpServerConfig[] = [];

  constructor() {
    this.configs = loadMcpConfigs();
  }

  getConfigs(): McpServerConfig[] {
    return this.configs;
  }

  /** Connect to all saved servers */
  async connectAll(onStatus?: (msg: string) => void): Promise<void> {
    for (const config of this.configs) {
      await this.connect(config, onStatus);
    }
  }

  /** Connect to one server */
  async connect(config: McpServerConfig, onStatus?: (msg: string) => void): Promise<string | null> {
    try {
      onStatus?.(`Connecting to MCP server "${config.name}"…`);
      const client = createMcpClient(config);
      await client.connect();
      this.clients.set(config.name, client);

      // Save config if new
      if (!this.configs.find((c) => c.name === config.name)) {
        this.configs.push(config);
        saveMcpConfigs(this.configs);
      }

      onStatus?.(`✓ Connected to "${config.name}" — ${client.tools.length} tools`);
      return null;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      onStatus?.(`✕ Failed to connect "${config.name}": ${msg}`);
      return msg;
    }
  }

  /** Disconnect a server */
  disconnect(name: string): void {
    const client = this.clients.get(name);
    if (client) {
      client.disconnect();
      this.clients.delete(name);
    }
    this.configs = this.configs.filter((c) => c.name !== name);
    saveMcpConfigs(this.configs);
  }

  /** All tools from all connected servers */
  getAllTools(): McpTool[] {
    const tools: McpTool[] = [];
    for (const client of this.clients.values()) {
      tools.push(...client.tools);
    }
    return tools;
  }

  /** Get tool definitions in the format each provider expects */
  getToolDefinitions(): Array<{ name: string; description: string; parameters: Record<string, unknown> }> {
    return this.getAllTools().map((t) => ({
      name: `mcp__${t.serverName}__${t.name}`,  // namespaced to avoid conflicts
      description: `[${t.serverName}] ${t.description}`,
      parameters: t.inputSchema,
    }));
  }

  /** Call an MCP tool by its namespaced name */
  async callTool(namespacedName: string, args: Record<string, unknown>): Promise<McpCallResult> {
    // Format: mcp__serverName__toolName
    const parts = namespacedName.split('__');
    if (parts.length < 3 || parts[0] !== 'mcp') {
      return { success: false, output: `Invalid MCP tool name: ${namespacedName}` };
    }

    const serverName = parts[1];
    const toolName = parts.slice(2).join('__');
    const client = this.clients.get(serverName);

    if (!client) {
      return { success: false, output: `MCP server "${serverName}" not connected` };
    }

    return client.callTool(toolName, args);
  }

  isMcpTool(name: string): boolean {
    return name.startsWith('mcp__');
  }

  getStatus(): Array<{ name: string; connected: boolean; toolCount: number; transport: string }> {
    return this.configs.map((config) => {
      const client = this.clients.get(config.name);
      return {
        name: config.name,
        connected: client?.connected ?? false,
        toolCount: client?.tools.length ?? 0,
        transport: config.transport,
      };
    });
  }
}
