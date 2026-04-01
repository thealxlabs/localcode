import * as vscode from 'vscode';

export class SettingsManager {
  private config: vscode.WorkspaceConfiguration;

  constructor(private context: vscode.ExtensionContext) {
    this.config = vscode.workspace.getConfiguration('localcode');
  }

  get<T>(key: string, defaultValue: T): T {
    return this.config.get<T>(key, defaultValue);
  }

  async set(key: string, value: unknown): Promise<void> {
    await this.config.update(key, value, vscode.ConfigurationTarget.Global);
  }

  getAll(): Record<string, unknown> {
    const result: Record<string, unknown> = {};
    const keys = [
      'provider', 'model', 'apiKey', 'baseUrl', 'temperature', 'maxTokens',
      'autoDispatch', 'autoDispatchRequireApproval', 'maxConcurrentAgents',
      'budgetLimit', 'qualityGate', 'maxRetries',
      'permissionFileEdit', 'permissionBash',
      'autoSave', 'autoCompact', 'compactThreshold',
      'gitAutoCommit', 'gitAutoStash',
      'memoryEnabled', 'memoryAutoExtract',
      'showAgentStatus', 'showTokenCount', 'showCostEstimate',
      'mcpEnabled', 'mcpServers', 'theme', 'logLevel',
    ];
    for (const key of keys) {
      result[key] = this.config.get(key);
    }
    return result;
  }

  reload(): void {
    this.config = vscode.workspace.getConfiguration('localcode');
  }
}
