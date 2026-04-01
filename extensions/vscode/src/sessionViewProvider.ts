import * as vscode from 'vscode';
import { LocalcodeServer } from './server';
import { SettingsManager } from './settings';

export class SessionViewProvider implements vscode.WebviewViewProvider {
  private view?: vscode.WebviewView;

  constructor(
    private extensionUri: vscode.Uri,
    private server: LocalcodeServer,
    private settings: SettingsManager,
  ) {}

  resolveWebviewView(webviewView: vscode.WebviewView): void {
    this.view = webviewView;
    webviewView.webview.options = { enableScripts: true };
    webviewView.webview.html = this.getHtml();

    webviewView.webview.onDidReceiveMessage(async (message: { command: string }) => {
      if (message.command === 'refresh') {
        this.refresh();
      }
    });
  }

  async refresh(): Promise<void> {
    const stats = await this.server.getSessionStats();
    this.view?.webview.postMessage({ type: 'stats', stats });
  }

  private getHtml(): string {
    return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
  body { font-family: var(--vscode-font-family); padding: 12px; color: var(--vscode-editor-foreground); }
  .stat { display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid var(--vscode-panel-border); }
  .stat-label { color: var(--vscode-descriptionForeground); }
  .stat-value { font-weight: bold; }
  h3 { margin: 0 0 8px 0; }
  button { padding: 4px 12px; background: var(--vscode-button-background); color: var(--vscode-button-foreground); border: none; border-radius: 3px; cursor: pointer; margin-top: 8px; }
</style>
</head>
<body>
  <h3>Session Stats</h3>
  <div id="stats">
    <div class="stat"><span class="stat-label">Messages</span><span class="stat-value" id="messages">-</span></div>
    <div class="stat"><span class="stat-label">Tokens Used</span><span class="stat-value" id="tokens">-</span></div>
    <div class="stat"><span class="stat-label">Est. Cost</span><span class="stat-value" id="cost">-</span></div>
    <div class="stat"><span class="stat-label">Agent Dispatches</span><span class="stat-value" id="agents">-</span></div>
    <div class="stat"><span class="stat-label">Tool Calls</span><span class="stat-value" id="tools">-</span></div>
    <div class="stat"><span class="stat-label">Duration</span><span class="stat-value" id="duration">-</span></div>
  </div>
  <button onclick="refresh()">Refresh</button>
<script>
  const vscode = acquireVsCodeApi();
  function refresh() { vscode.postMessage({ command: 'refresh' }); }
  window.addEventListener('message', (e) => {
    if (e.data.type === 'stats') {
      const s = e.data.stats;
      document.getElementById('messages').textContent = s.messageCount;
      document.getElementById('tokens').textContent = s.tokensUsed.toLocaleString();
      document.getElementById('cost').textContent = '$' + s.estimatedCost.toFixed(4);
      document.getElementById('agents').textContent = s.agentDispatches;
      document.getElementById('tools').textContent = s.toolCalls;
      document.getElementById('duration').textContent = s.duration;
    }
  });
  refresh();
</script>
</body>
</html>`;
  }
}
