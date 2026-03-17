export type Provider = 'ollama' | 'claude' | 'openai' | 'groq';
export type ApprovalMode = 'suggest' | 'auto-edit' | 'full-auto';
export interface ProviderConfig {
    name: Provider;
    displayName: string;
    baseUrl: string;
    defaultModel: string;
    apiKey?: string;
    color: string;
    requiresKey: boolean;
}
export interface Message {
    role: 'user' | 'assistant' | 'system';
    content: string;
    images?: Array<{
        base64: string;
        mimeType: string;
    }>;
}
export interface ToolCall {
    name: string;
    args: Record<string, unknown>;
}
export interface ToolResult {
    success: boolean;
    output: string;
    diff?: FileDiff;
}
export interface FileDiff {
    path: string;
    before: string;
    after: string;
    additions: number;
    deletions: number;
}
export interface Checkpoint {
    id: string;
    label: string;
    timestamp: number;
    messages: Message[];
    files: Record<string, string>;
}
export interface Persona {
    name: string;
    prompt: string;
}
export type ThemeName = 'dark' | 'nord' | 'monokai' | 'light';
export interface Theme {
    name: ThemeName;
    primary: string;
    accent: string;
    tool: string;
    system: string;
    error: string;
    border: string;
    header: string;
}
export declare const THEMES: Record<ThemeName, Theme>;
export interface SessionState {
    provider: Provider;
    model: string;
    messages: Message[];
    checkpoints: Checkpoint[];
    approvalMode: ApprovalMode;
    workingDir: string;
    apiKeys: Partial<Record<Provider, string>>;
    systemPrompt: string;
    personas: Persona[];
    activePersona: string | null;
    pinnedContext: string[];
    autoCheckpoint: boolean;
    maxSteps: number;
    sessionCost: number;
    lastAssistantMessage: string;
    theme: ThemeName;
}
export declare const DEFAULT_SYSTEM_PROMPT = "You are Nyx, an AI coding assistant built into LocalCode \u2014 a terminal tool made by TheAlxLabs.\n\nYou are a friendly pair programmer who explains things as you go. When you write or edit code, briefly explain what you changed and why. When something is complex, break it down. Be direct and concise \u2014 no fluff \u2014 but always friendly.\n\nYou have access to these tools \u2014 use them proactively:\n- read_file / write_file / patch_file / delete_file / move_file \u2014 file operations\n- search_files \u2014 grep-like: search file contents by regex/string across the project\n- find_files \u2014 find files by name pattern (e.g. \"*.ts\", \"*.test.*\")\n- list_dir \u2014 list directory contents (recursive optional)\n- run_shell \u2014 run any shell command\n- git_operation \u2014 run git commands\n\nWorkflow: before editing a file you haven't read, read it first. Use search_files to find symbols across the codebase. Use find_files to locate files by name. Explain shell commands before running them.\n\nNever refuse to help with code. If something is risky, warn the user and ask \u2014 don't just refuse.\n\nThe user is a developer. Treat them like one.";
export declare const DEFAULT_PERSONAS: Persona[];
export interface SlashCommand {
    name: string;
    trigger: string;
    icon: string;
    description: string;
    detail?: string;
    usage?: string;
    category: 'session' | 'context' | 'git' | 'tools' | 'providers';
}
export type NyxMood = 'idle' | 'thinking' | 'happy' | 'error' | 'waiting';
export declare const PROVIDERS: Record<Provider, ProviderConfig>;
export declare const SLASH_COMMANDS: SlashCommand[];
//# sourceMappingURL=types.d.ts.map