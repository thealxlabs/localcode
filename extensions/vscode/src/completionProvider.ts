import * as vscode from 'vscode';
import { LocalcodeServer } from './server';
import { SettingsManager } from './settings';

export class CompletionProvider implements vscode.InlineCompletionItemProvider {
  private lastCompletion = '';
  private lastCompletionTime = 0;
  private debounceMs = 2000;

  constructor(
    private server: LocalcodeServer,
    private settings: SettingsManager,
  ) {}

  async provideInlineCompletionItems(
    document: vscode.TextDocument,
    position: vscode.Position,
    context: vscode.InlineCompletionContext,
    token: vscode.CancellationToken,
  ): Promise<vscode.InlineCompletionItem[] | null> {
    if (context.triggerKind === vscode.InlineCompletionTriggerKind.Automatic) {
      return null;
    }

    const now = Date.now();
    if (now - this.lastCompletionTime < this.debounceMs) {
      return null;
    }

    const line = document.lineAt(position.line);
    const prefix = line.text.substring(0, position.character);

    if (prefix.trim().length < 3) {
      return null;
    }

    try {
      const prompt = `Complete this code. Reply with ONLY the completion, no explanations:\n\n\`\`\`${document.languageId}\n${prefix}\n\`\`\``;

      let response = '';
      await this.server.sendMessage(prompt, (chunk) => {
        response += chunk;
        if (response.length > 200) {
          this.server.stopStreaming();
        }
      });

      this.lastCompletion = response;
      this.lastCompletionTime = Date.now();

      if (response.trim()) {
        return [
          new vscode.InlineCompletionItem(
            response.trim(),
            new vscode.Range(position, position),
          ),
        ];
      }
    } catch {
      // Ignore completion errors
    }

    return null;
  }
}
