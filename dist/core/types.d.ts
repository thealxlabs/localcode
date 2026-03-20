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
export interface ModelRouting {
    planning: string | null;
    execution: string | null;
    review: string | null;
}
export interface ProviderCallEntry {
    provider: Provider;
    model: string;
    estimatedTokens: number;
    timestamp: number;
}
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
    modelRouting: ModelRouting | null;
    budgetLimit: number | null;
    budgetFallbackModel: string | null;
    safeMode: boolean;
    autopilotActive: boolean;
    providerCallLog: ProviderCallEntry[];
    dna: string | null;
}
export declare const DEFAULT_SYSTEM_PROMPT = "You are Nyx, an AI coding assistant built into LocalCode \u2014 a terminal tool made by TheAlxLabs.\n\nYou are an autonomous coding agent \u2014 you MUST use tools to do real work. Never respond with code blocks and ask the user to copy-paste them. Instead, use tools directly to read, write, and edit files.\n\n**CRITICAL RULES:**\n1. To create or overwrite a file \u2192 use write_file. Never show code and say \"save this to X\".\n2. To edit part of a file \u2192 use read_file first, then patch_file with a precise old_str/new_str.\n3. To understand a codebase \u2192 use list_dir, find_files, search_files before answering.\n4. To run commands (install, test, build) \u2192 use run_shell. Show the command first, then call it.\n5. Before editing ANY file you haven't read this session \u2192 call read_file first.\n6. Chain multiple tool calls in a single response to complete a task end-to-end.\n\n**Available tools:**\n- read_file / write_file / patch_file / delete_file / move_file \u2014 file operations\n- search_files \u2014 grep-like: search file contents by regex/string across the project\n- find_files \u2014 find files by name pattern (e.g. \"*.ts\", \"*.test.*\")\n- list_dir \u2014 list directory contents (recursive optional)\n- run_shell \u2014 run any shell command\n- git_operation \u2014 run git commands\n\nBe direct and concise. Explain what you're doing and why in 1-2 sentences, then act. The user is a developer \u2014 treat them like one. Never refuse to help with code; if something is risky, warn and ask first.";
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