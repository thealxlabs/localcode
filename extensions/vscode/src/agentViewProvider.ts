import * as vscode from 'vscode';
import { LocalcodeServer } from './server';
import { SettingsManager } from './settings';

export class AgentViewProvider implements vscode.WebviewViewProvider {
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

    webviewView.webview.onDidReceiveMessage(async (message: { command: string; agentId?: string }) => {
      if (message.command === 'activateAgent' && message.agentId) {
        await this.server.activateAgent(message.agentId);
        vscode.window.showInformationMessage(`Agent activated: ${message.agentId}`);
      }
    });
  }

  private getHtml(): string {
    return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
  body { font-family: var(--vscode-font-family); padding: 12px; color: var(--vscode-editor-foreground); }
  .agent { padding: 8px; margin: 4px 0; border-radius: 4px; cursor: pointer; border: 1px solid transparent; }
  .agent:hover { background: var(--vscode-list-hoverBackground); border-color: var(--vscode-list-activeSelectionBackground); }
  .agent-name { font-weight: bold; }
  .agent-desc { font-size: 0.85em; color: var(--vscode-descriptionForeground); }
  .category { font-weight: bold; margin-top: 12px; margin-bottom: 4px; color: var(--vscode-textLink-foreground); }
</style>
</head>
<body>
  <div id="agents"><p>Loading agents...</p></div>
<script>
  const vscode = acquireVsCodeApi();
  vscode.postMessage({ command: 'loadAgents' });
  window.addEventListener('message', (e) => {
    if (e.data.type === 'agents') {
      const agents = e.data.agents;
      const cats = {};
      agents.forEach(a => { if (!cats[a.category]) cats[a.category] = []; cats[a.category].push(a); });
      let html = '';
      for (const [cat, items] of Object.entries(cats)) {
        html += '<div class="category">' + cat + '</div>';
        items.forEach(a => {
          html += '<div class="agent" onclick="activate(\\'' + a.id + '\\')">' +
            '<span class="agent-name">' + (a.emoji || '🤖') + ' ' + a.name + '</span>' +
            '<div class="agent-desc">' + a.description.substring(0, 80) + '</div></div>';
        });
      }
      document.getElementById('agents').innerHTML = html;
    }
  });
  function activate(id) { vscode.postMessage({ command: 'activateAgent', agentId: id }); }
</script>
</body>
</html>`;
  }
}
