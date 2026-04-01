import * as vscode from 'vscode';
import { LocalcodeServer } from './server';
import { SettingsManager } from './settings';
import { StatusBarManager } from './statusBar';

export class ChatViewProvider implements vscode.WebviewViewProvider {
  private view?: vscode.WebviewView;

  constructor(
    private extensionUri: vscode.Uri,
    private server: LocalcodeServer,
    private settings: SettingsManager,
    private statusBar: StatusBarManager,
  ) {}

  resolveWebviewView(webviewView: vscode.WebviewView): void {
    this.view = webviewView;
    webviewView.webview.options = { enableScripts: true };
    webviewView.webview.html = this.getHtml();

    webviewView.webview.onDidReceiveMessage(async (message) => {
      switch (message.command) {
        case 'sendMessage':
          await this.handleMessage(message.text);
          break;
        case 'stopStreaming':
          this.server.stopStreaming();
          break;
        case 'clearSession':
          this.server.clearSession();
          this.view?.webview.postMessage({ type: 'clear' });
          break;
      }
    });
  }

  async sendMessage(text: string): Promise<void> {
    if (!this.view) {
      await vscode.commands.executeCommand('localcode.chatView.focus');
    }
    await this.handleMessage(text);
  }

  clearMessages(): void {
    this.view?.webview.postMessage({ type: 'clear' });
  }

  private async handleMessage(text: string): Promise<void> {
    if (!this.view) return;

    this.view.webview.postMessage({ type: 'userMessage', text });
    this.statusBar.updateStatus('loading', 'Localcode Thinking...');

    let fullResponse = '';
    try {
      await this.server.sendMessage(
        text,
        (chunk) => {
          fullResponse += chunk;
          this.view?.webview.postMessage({ type: 'streamChunk', text: chunk });
        },
        () => {
          this.statusBar.updateStatus('ready', 'Localcode Ready');
          this.view?.webview.postMessage({ type: 'streamDone' });
        },
        (error) => {
          this.statusBar.updateStatus('error', 'Error');
          this.view?.webview.postMessage({ type: 'error', text: error });
        },
      );
    } catch (err) {
      this.statusBar.updateStatus('error', 'Error');
    }
  }

  private getHtml(): string {
    return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: var(--vscode-font-family); padding: 12px; color: var(--vscode-editor-foreground); background: var(--vscode-editor-background); }
  #messages { display: flex; flex-direction: column; gap: 8px; margin-bottom: 12px; max-height: 60vh; overflow-y: auto; }
  .message { padding: 8px 12px; border-radius: 8px; max-width: 90%; line-height: 1.5; white-space: pre-wrap; word-wrap: break-word; }
  .user { background: var(--vscode-button-background); color: var(--vscode-button-foreground); align-self: flex-end; }
  .assistant { background: var(--vscode-editor-inactiveSelectionBackground); align-self: flex-start; }
  .system { background: var(--vscode-badge-background); color: var(--vscode-badge-foreground); align-self: center; font-size: 0.85em; }
  .error { background: var(--vscode-inputValidation-errorBackground); color: var(--vscode-inputValidation-errorForeground); border: 1px solid var(--vscode-inputValidation-errorBorder); }
  #input-area { display: flex; gap: 8px; position: sticky; bottom: 0; background: var(--vscode-editor-background); padding-top: 8px; border-top: 1px solid var(--vscode-panel-border); }
  #input { flex: 1; padding: 8px 12px; border: 1px solid var(--vscode-input-border); border-radius: 4px; background: var(--vscode-input-background); color: var(--vscode-input-foreground); resize: none; font-family: inherit; min-height: 36px; }
  #send { padding: 8px 16px; background: var(--vscode-button-background); color: var(--vscode-button-foreground); border: none; border-radius: 4px; cursor: pointer; }
  #send:hover { background: var(--vscode-button-hoverBackground); }
  #stop { display: none; padding: 8px 16px; background: var(--vscode-errorForeground); color: white; border: none; border-radius: 4px; cursor: pointer; }
  code { background: var(--vscode-textCodeBlock-background); padding: 2px 6px; border-radius: 3px; font-family: var(--vscode-editor-font-family); font-size: 0.9em; }
  pre { background: var(--vscode-textCodeBlock-background); padding: 8px 12px; border-radius: 6px; overflow-x: auto; margin: 8px 0; }
  pre code { background: none; padding: 0; }
  .typing-indicator::after { content: '▋'; animation: blink 1s infinite; }
  @keyframes blink { 0%, 50% { opacity: 1; } 51%, 100% { opacity: 0; } }
</style>
</head>
<body>
  <div id="messages"></div>
  <div id="input-area">
    <textarea id="input" placeholder="Ask Localcode anything..." rows="1"></textarea>
    <button id="send">Send</button>
    <button id="stop">Stop</button>
  </div>
<script>
  const vscode = acquireVsCodeApi();
  const messages = document.getElementById('messages');
  const input = document.getElementById('input');
  const sendBtn = document.getElementById('send');
  const stopBtn = document.getElementById('stop');
  let currentAssistantEl = null;

  function addMessage(role, text, isError) {
    const el = document.createElement('div');
    el.className = 'message ' + (isError ? 'error' : role);
    el.textContent = text;
    messages.appendChild(el);
    messages.scrollTop = messages.scrollHeight;
    return el;
  }

  function formatCodeBlocks(text) {
    return text.replace(/\`\`\`(\w*)\n?([\s\S]*?)\`\`\`/g, '<pre><code>$2</code></pre>')
               .replace(/\`([^\`]+)\`/g, '<code>$1</code>')
               .replace(/\n/g, '<br>');
  }

  sendBtn.addEventListener('click', () => {
    const text = input.value.trim();
    if (!text) return;
    addMessage('user', text);
    vscode.postMessage({ command: 'sendMessage', text });
    currentAssistantEl = addMessage('assistant', '', false);
    currentAssistantEl.classList.add('typing-indicator');
    input.value = '';
    sendBtn.style.display = 'none';
    stopBtn.style.display = 'block';
  });

  stopBtn.addEventListener('click', () => {
    vscode.postMessage({ command: 'stopStreaming' });
    sendBtn.style.display = 'block';
    stopBtn.style.display = 'none';
    if (currentAssistantEl) currentAssistantEl.classList.remove('typing-indicator');
  });

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendBtn.click();
    }
  });

  window.addEventListener('message', (event) => {
    const msg = event.data;
    switch (msg.type) {
      case 'userMessage':
        addMessage('user', msg.text);
        break;
      case 'streamChunk':
        if (currentAssistantEl) {
          currentAssistantEl.classList.remove('typing-indicator');
          currentAssistantEl.innerHTML = formatCodeBlocks(currentAssistantEl.textContent + msg.text);
          messages.scrollTop = messages.scrollHeight;
        }
        break;
      case 'streamDone':
        sendBtn.style.display = 'block';
        stopBtn.style.display = 'none';
        if (currentAssistantEl) currentAssistantEl.classList.remove('typing-indicator');
        currentAssistantEl = null;
        break;
      case 'error':
        if (currentAssistantEl) {
          currentAssistantEl.className = 'message error';
          currentAssistantEl.textContent = msg.text;
          currentAssistantEl.classList.remove('typing-indicator');
        }
        sendBtn.style.display = 'block';
        stopBtn.style.display = 'none';
        currentAssistantEl = null;
        break;
      case 'clear':
        messages.innerHTML = '';
        currentAssistantEl = null;
        break;
    }
  });
</script>
</body>
</html>`;
  }
}
