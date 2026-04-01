import * as vscode from 'vscode';

export class StatusBarManager {
  private statusItem: vscode.StatusBarItem;
  private tokenItem: vscode.StatusBarItem;
  private costItem: vscode.StatusBarItem;
  private agentItem: vscode.StatusBarItem;
  private tokensUsed = 0;
  private estimatedCost = 0;

  constructor(context: vscode.ExtensionContext) {
    this.statusItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
    this.statusItem.command = 'localcode.chat';
    this.statusItem.tooltip = 'Localcode - Click to open chat';

    this.tokenItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 99);
    this.tokenItem.tooltip = 'Tokens used this session';

    this.costItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 98);
    this.costItem.tooltip = 'Estimated cost this session';

    this.agentItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 97);
    this.agentItem.command = 'localcode.agent';
    this.agentItem.tooltip = 'Click to activate an agent';

    context.subscriptions.push(this.statusItem, this.tokenItem, this.costItem, this.agentItem);
    this.updateStatus('ready', 'Localcode');
  }

  updateStatus(state: 'ready' | 'loading' | 'error' | 'warning', text: string): void {
    const icons: Record<string, string> = {
      ready: '$(check)',
      loading: '$(loading~spin)',
      error: '$(error)',
      warning: '$(warning)',
    };
    this.statusItem.text = `${icons[state] || ''} ${text}`;
    this.statusItem.show();

    if (state === 'error') {
      this.statusItem.backgroundColor = new vscode.ThemeColor('statusBarItem.errorBackground');
    } else if (state === 'loading') {
      this.statusItem.backgroundColor = new vscode.ThemeColor('statusBarItem.prominentBackground');
    } else {
      this.statusItem.backgroundColor = undefined;
    }
  }

  updateTokens(tokens: number): void {
    this.tokensUsed = tokens;
    this.tokenItem.text = `$(symbol-numeric) ${tokens.toLocaleString()} tokens`;
    this.tokenItem.show();
  }

  updateCost(cost: number): void {
    this.estimatedCost = cost;
    this.costItem.text = `$(debug-console) $${cost.toFixed(4)}`;
    this.costItem.show();
  }

  updateActiveAgent(agentName: string): void {
    this.agentItem.text = `$(robot) ${agentName}`;
    this.agentItem.show();
  }

  updateConfig(config: Record<string, unknown>): void {
    const showTokens = config.showTokenCount !== false;
    const showCost = config.showCostEstimate !== false;
    const showAgent = config.showAgentStatus !== false;

    this.tokenItem[showTokens ? 'show' : 'hide']();
    this.costItem[showCost ? 'show' : 'hide']();
    this.agentItem[showAgent ? 'show' : 'hide']();
  }

  dispose(): void {
    this.statusItem.dispose();
    this.tokenItem.dispose();
    this.costItem.dispose();
    this.agentItem.dispose();
  }
}
