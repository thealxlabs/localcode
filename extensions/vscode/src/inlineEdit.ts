import * as vscode from 'vscode';
import { LocalcodeServer } from './server';
import { SettingsManager } from './settings';
import { StatusBarManager } from './statusBar';

export class InlineEditController {
  constructor(
    private editor: vscode.TextEditor,
    private server: LocalcodeServer,
    private settings: SettingsManager,
    private statusBar: StatusBarManager,
  ) {}

  async showInlineEdit(): Promise<void> {
    const selection = this.editor.selection;
    const selectedText = this.editor.document.getText(selection);
    const document = this.editor.document;
    const language = document.languageId;

    const prompt = await vscode.window.showInputBox({
      prompt: 'What should I do with the selected code?',
      placeHolder: selectedText
        ? 'e.g., refactor this to use async/await'
        : 'e.g., add a function that sorts the array',
    });

    if (!prompt) return;

    const context = selectedText || document.getText();
    const fullPrompt = `${prompt}\n\n\`\`\`${language}\n${context}\n\`\`\`\n\nReply with ONLY the updated code, no explanations.`;

    this.statusBar.updateStatus('loading', 'Localcode Editing...');

    const edit = new vscode.WorkspaceEdit();
    const range = selectedText ? selection : new vscode.Range(0, 0, document.lineCount, 0);

    try {
      let response = '';
      await this.server.sendMessage(
        fullPrompt,
        (chunk) => { response += chunk; },
        () => {
          edit.replace(document.uri, range, response);
          vscode.workspace.applyEdit(edit).then(() => {
            this.statusBar.updateStatus('ready', 'Localcode Ready');
            vscode.window.showInformationMessage('Edit applied by Localcode');
          });
        },
        (error) => {
          this.statusBar.updateStatus('error', 'Edit Failed');
          vscode.window.showErrorMessage(`Edit failed: ${error}`);
        },
      );
    } catch (err) {
      this.statusBar.updateStatus('error', 'Edit Failed');
    }
  }
}
