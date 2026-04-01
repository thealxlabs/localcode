// src/settings/types.ts

export type PermissionMode = 'ask' | 'allow' | 'deny';

export type PermissionConfig = {
  fileEdit: PermissionMode;
  fileWrite: PermissionMode;
  bash: PermissionMode;
  bashPatterns: Record<string, PermissionMode>;
  webFetch: PermissionMode;
  toolUse: PermissionMode;
};

export type AgentAutoDispatchConfig = {
  enabled: boolean;
  requireApproval: boolean;
  maxConcurrentAgents: number;
  budgetLimit: number;
  preferredModel: string;
  fallbackModel: string;
  dispatchStrategy: 'smart' | 'parallel' | 'sequential';
  qualityGate: boolean;
  maxRetries: number;
};

export type ProviderConfig = {
  provider: string;
  model: string;
  apiKey: string;
  baseUrl: string;
  temperature: number;
  topP: number;
  maxTokens: number;
};

export type ThemeConfig = {
  name: string;
  customColors?: Record<string, string>;
  showHeader: boolean;
  showStatusBar: boolean;
  showLineNumbers: boolean;
  compactMode: boolean;
};

export type UIConfig = {
  theme: ThemeConfig;
  showWelcomeScreen: boolean;
  showAgentStatus: boolean;
  showToolOutput: boolean;
  showTokenCount: boolean;
  showCostEstimate: boolean;
  autoScroll: boolean;
  maxDisplayLines: number;
  codeBlockTheme: string;
};

export type SessionConfig = {
  autoSave: boolean;
  autoSaveInterval: number;
  maxHistorySize: number;
  autoCompact: boolean;
  compactThreshold: number;
  persistAcrossRestarts: boolean;
  defaultWorkingDir: string;
};

export type ToolConfig = {
  enabledTools: string[];
  toolTimeout: number;
  maxOutputLength: number;
  sandboxMode: boolean;
  allowedDirectories: string[];
  blockedCommands: string[];
};

export type GitConfig = {
  enabled: boolean;
  autoCommit: boolean;
  autoCommitMessage: string;
  autoStash: boolean;
  autoRevertOnTestFail: boolean;
  showDiff: boolean;
};

export type MemoryConfig = {
  enabled: boolean;
  autoExtract: boolean;
  persistentMemory: boolean;
  memoryFile: string;
};

export type AnalyticsConfig = {
  enabled: boolean;
  trackUsage: boolean;
  trackPerformance: boolean;
  trackErrors: boolean;
  shareAnonymousData: boolean;
};

export type MCPConfig = {
  enabled: boolean;
  servers: Record<string, { command: string; args: string[]; env?: Record<string, string> }>;
  autoConnect: boolean;
  timeout: number;
};

export type Settings = {
  version: string;
  provider: ProviderConfig;
  permissions: PermissionConfig;
  agentDispatch: AgentAutoDispatchConfig;
  ui: UIConfig;
  session: SessionConfig;
  tools: ToolConfig;
  git: GitConfig;
  memory: MemoryConfig;
  analytics: AnalyticsConfig;
  mcp: MCPConfig;
  customAgents: string[];
  agentOverrides: Record<string, Partial<{
    model: string;
    temperature: number;
    maxSteps: number;
    permission: PermissionConfig;
    disabled: boolean;
  }>>;
};

export const DEFAULT_SETTINGS: Settings = {
  version: '4.0.0',
  provider: {
    provider: 'ollama',
    model: 'qwen2.5-coder:7b',
    apiKey: '',
    baseUrl: 'http://localhost:11434',
    temperature: 0.3,
    topP: 0.9,
    maxTokens: 8192,
  },
  permissions: {
    fileEdit: 'allow',
    fileWrite: 'allow',
    bash: 'allow',
    bashPatterns: {
      'git *': 'allow',
      'ls *': 'allow',
      'cat *': 'allow',
      'find *': 'allow',
      'grep *': 'allow',
      'npm test*': 'allow',
      'npm run build*': 'allow',
      'python *': 'allow',
      'node *': 'allow',
    },
    webFetch: 'allow',
    toolUse: 'allow',
  },
  agentDispatch: {
    enabled: true,
    requireApproval: false,
    maxConcurrentAgents: 5,
    budgetLimit: 10.0,
    preferredModel: 'qwen2.5-coder:7b',
    fallbackModel: 'qwen2.5-coder:3b',
    dispatchStrategy: 'smart',
    qualityGate: true,
    maxRetries: 3,
  },
  ui: {
    theme: {
      name: 'dark',
      showHeader: true,
      showStatusBar: true,
      showLineNumbers: true,
      compactMode: false,
    },
    showWelcomeScreen: true,
    showAgentStatus: true,
    showToolOutput: true,
    showTokenCount: true,
    showCostEstimate: true,
    autoScroll: true,
    maxDisplayLines: 500,
    codeBlockTheme: 'monokai',
  },
  session: {
    autoSave: true,
    autoSaveInterval: 30,
    maxHistorySize: 1000,
    autoCompact: true,
    compactThreshold: 50,
    persistAcrossRestarts: true,
    defaultWorkingDir: process.cwd(),
  },
  tools: {
    enabledTools: ['read_file', 'write_file', 'patch_file', 'run_shell', 'search_files', 'find_files', 'list_dir', 'delete_file', 'move_file', 'git_operation'],
    toolTimeout: 30000,
    maxOutputLength: 10000,
    sandboxMode: true,
    allowedDirectories: [],
    blockedCommands: ['rm -rf /', 'mkfs', 'dd if=', 'shutdown', 'reboot', 'curl * | sh', 'wget * | sh'],
  },
  git: {
    enabled: true,
    autoCommit: false,
    autoCommitMessage: 'auto: changes by Localcode',
    autoStash: false,
    autoRevertOnTestFail: false,
    showDiff: true,
  },
  memory: {
    enabled: true,
    autoExtract: true,
    persistentMemory: true,
    memoryFile: '.localcode.md',
  },
  analytics: {
    enabled: true,
    trackUsage: true,
    trackPerformance: true,
    trackErrors: true,
    shareAnonymousData: false,
  },
  mcp: {
    enabled: true,
    servers: {},
    autoConnect: true,
    timeout: 30000,
  },
  customAgents: [],
  agentOverrides: {},
};
