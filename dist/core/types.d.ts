export type Provider = 'ollama' | 'claude' | 'openai' | 'groq';
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
export interface SessionState {
    provider: Provider;
    model: string;
    messages: Message[];
    checkpoints: Checkpoint[];
    allowAllTools: boolean;
    workingDir: string;
    apiKeys: Partial<Record<Provider, string>>;
}
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