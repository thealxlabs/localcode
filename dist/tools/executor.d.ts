import { ToolCall, ToolResult } from '../core/types.js';
export declare class ToolExecutor {
    private workingDir;
    private sessionFiles;
    private changeHistory;
    constructor(workingDir: string);
    execute(tool: ToolCall): Promise<ToolResult>;
    private resolvePath;
    private readFile;
    private writeFile;
    private patchFile;
    private deleteFile;
    private moveFile;
    private runShell;
    private listDir;
    private searchFiles;
    private findFiles;
    private gitOperation;
    getSessionFiles(): Record<string, string>;
    undoLastChange(): string | null;
    unifiedDiff(filePath: string): string | null;
}
//# sourceMappingURL=executor.d.ts.map