import * as vscode from 'vscode';
import { LocalcodeServer } from './server';
import { ChatViewProvider } from './chatViewProvider';
import { AgentViewProvider } from './agentViewProvider';
import { SessionViewProvider } from './sessionViewProvider';
import { InlineEditController } from './inlineEdit';
import { CompletionProvider } from './completionProvider';
import { StatusBarManager } from './statusBar';
import { SettingsManager } from './settings';

let server: LocalcodeServer;
let statusBar: StatusBarManager;
let settings: SettingsManager;

export function activate(context: vscode.ExtensionContext) {
  console.log('Localcode extension activated');

  settings = new SettingsManager(context);
  server = new LocalcodeServer(settings);
  statusBar = new StatusBarManager(context);

  // Initialize server
  server.start().then(() => {
    statusBar.updateStatus('ready', 'Localcode Ready');
  }).catch((err) => {
    statusBar.updateStatus('error', `Localcode Error: ${err.message}`);
  });

  // Register view providers
  const chatProvider = new ChatViewProvider(context.extensionUri, server, settings, statusBar);
  const agentProvider = new AgentViewProvider(context.extensionUri, server, settings);
  const sessionProvider = new SessionViewProvider(context.extensionUri, server, settings);

  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider('localcode.chatView', chatProvider),
    vscode.window.registerWebviewViewProvider('localcode.agentView', agentProvider),
    vscode.window.registerWebviewViewProvider('localcode.sessionView', sessionProvider),
  );

  // Register commands
  context.subscriptions.push(
    vscode.commands.registerCommand('localcode.chat', () => {
      vscode.commands.executeCommand('localcode.chatView.focus');
    }),

    vscode.commands.registerCommand('localcode.inlineEdit', async () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) return;
      const controller = new InlineEditController(editor, server, settings, statusBar);
      await controller.showInlineEdit();
    }),

    vscode.commands.registerCommand('localcode.generate', async () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) return;
      const selection = editor.selection;
      const context = editor.document.getText(selection);
      const prompt = await vscode.window.showInputBox({
        prompt: 'What should I generate?',
        placeHolder: 'e.g., a function that sorts an array',
      });
      if (!prompt) return;
      await chatProvider.sendMessage(`Generate code for: ${prompt}\n\nContext:\n${context || '(no selection)'}`);
    }),

    vscode.commands.registerCommand('localcode.explain', async () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) return;
      const selection = editor.selection;
      const code = editor.document.getText(selection) || editor.document.getText();
      await chatProvider.sendMessage(`Explain this code:\n\n\`\`\`${editor.document.languageId}\n${code}\n\`\`\``);
    }),

    vscode.commands.registerCommand('localcode.fix', async () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) return;
      const selection = editor.selection;
      const code = editor.document.getText(selection) || editor.document.getText();
      const diagnostics = vscode.languages.getDiagnostics(editor.document.uri);
      const relevantDiagnostics = diagnostics.filter(d => selection.contains(d.range) || d.severity === vscode.DiagnosticSeverity.Error);
      const diagText = relevantDiagnostics.map(d => `${d.message} (line ${d.range.start.line + 1})`).join('\n');
      await chatProvider.sendMessage(`Fix issues in this code:\n\n\`\`\`${editor.document.languageId}\n${code}\n\`\`\`\n\nIssues:\n${diagText || 'No specific issues detected'}`);
    }),

    vscode.commands.registerCommand('localcode.review', async () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) return;
      const code = editor.document.getText();
      await chatProvider.sendMessage(`Review this code for best practices, security, performance, and maintainability:\n\n\`\`\`${editor.document.languageId}\n${code}\n\`\`\``);
    }),

    vscode.commands.registerCommand('localcode.test', async () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) return;
      const selection = editor.selection;
      const code = editor.document.getText(selection) || editor.document.getText();
      const fileName = editor.document.fileName;
      await chatProvider.sendMessage(`Generate comprehensive tests for this code. File: ${fileName}\n\n\`\`\`${editor.document.languageId}\n${code}\n\`\`\``);
    }),

    vscode.commands.registerCommand('localcode.commit', async () => {
      const scm = vscode.scm;
      const input = scm.inputBox.value;
      const changes = await server.getGitDiff();
      const result = await server.generateCommitMessage(changes);
      if (result.message) {
        scm.inputBox.value = result.message;
        vscode.window.showInformationMessage('Commit message generated by Localcode');
      }
    }),

    vscode.commands.registerCommand('localcode.agent', async () => {
      const agents = await server.getAvailableAgents();
      const items = agents.map(a => ({
        label: `${a.emoji || '🤖'} ${a.name}`,
        description: a.description,
        detail: a.category,
        agent: a,
      }));
      const selected = await vscode.window.showQuickPick(items, {
        placeHolder: 'Select an agent to activate',
        matchOnDescription: true,
        matchOnDetail: true,
      });
      if (selected) {
        await server.activateAgent(selected.agent.id);
        vscode.window.showInformationMessage(`Agent activated: ${selected.agent.name}`);
      }
    }),

    vscode.commands.registerCommand('localcode.orchestrate', async () => {
      const task = await vscode.window.showInputBox({
        prompt: 'What task should the multi-agent pipeline execute?',
        placeHolder: 'e.g., refactor the authentication system',
      });
      if (!task) return;
      const mode = await vscode.window.showQuickPick(
        [
          { label: 'Full', description: 'All 7 phases, all agents' },
          { label: 'Sprint', description: '4 phases, focused agents' },
          { label: 'Micro', description: 'Quick task, minimal agents' },
        ],
        { placeHolder: 'Select pipeline mode' },
      );
      if (!mode) return;
      await chatProvider.sendMessage(`/orchestrate "${task}" ${mode.label.toLowerCase()}`);
    }),

    vscode.commands.registerCommand('localcode.settings', () => {
      vscode.commands.executeCommand('workbench.action.openSettings', '@ext:thealxlabs.localcode');
    }),

    vscode.commands.registerCommand('localcode.toggleAutoDispatch', async () => {
      const current = settings.get('autoDispatch', true);
      await settings.set('autoDispatch', !current);
      vscode.window.showInformationMessage(`Auto agent dispatch ${!current ? 'enabled' : 'disabled'}`);
    }),

    vscode.commands.registerCommand('localcode.clearSession', async () => {
      await server.clearSession();
      chatProvider.clearMessages();
      vscode.window.showInformationMessage('Session cleared');
    }),

    vscode.commands.registerCommand('localcode.showSessionStats', async () => {
      const stats = await server.getSessionStats();
      const output = vscode.window.createOutputChannel('Localcode Stats');
      output.appendLine(`=== Localcode Session Stats ===`);
      output.appendLine(`Messages: ${stats.messageCount}`);
      output.appendLine(`Tokens Used: ${stats.tokensUsed.toLocaleString()}`);
      output.appendLine(`Estimated Cost: $${stats.estimatedCost.toFixed(4)}`);
      output.appendLine(`Agent Dispatches: ${stats.agentDispatches}`);
      output.appendLine(`Tools Used: ${stats.toolCalls}`);
      output.appendLine(`Duration: ${stats.duration}`);
      output.show();
    }),
  );

  // Register completion provider for inline suggestions
  const completionProvider = new CompletionProvider(server, settings);
  context.subscriptions.push(
    vscode.languages.registerInlineCompletionItemProvider(
      { pattern: '**/*' },
      completionProvider,
    ),
  );

  // Listen for config changes
  context.subscriptions.push(
    vscode.workspace.onDidChangeConfiguration((e) => {
      if (e.affectsConfiguration('localcode')) {
        settings.reload();
        server.updateConfig(settings.getAll());
        statusBar.updateConfig(settings.getAll());
      }
    }),
  );

  // Listen for file saves to auto-extract memory
  context.subscriptions.push(
    vscode.workspace.onDidSaveTextDocument(async (doc) => {
      if (settings.get('memoryAutoExtract', true)) {
        await server.extractMemoryFromChanges(doc.uri.fsPath, doc.getText());
      }
    }),
  );

  // Listen for git changes to auto-commit
  if (settings.get('gitAutoCommit', false)) {
    const watcher = vscode.workspace.createFileSystemWatcher('**/.git/HEAD');
    context.subscriptions.push(watcher);
  }

  statusBar.updateConfig(settings.getAll());

  return {
    server,
    settings,
    statusBar,
  };
}

export function deactivate() {
  server?.stop();
  statusBar?.dispose();
}
