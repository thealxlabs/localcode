import * as vscode from 'vscode';
import axios from 'axios';
import { SettingsManager } from './settings';
import { StatusBarManager } from './statusBar';

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
}

interface AgentInfo {
  id: string;
  name: string;
  category: string;
  description: string;
  emoji?: string;
  color?: string;
}

interface SessionStats {
  messageCount: number;
  tokensUsed: number;
  estimatedCost: number;
  agentDispatches: number;
  toolCalls: number;
  duration: string;
}

export class LocalcodeServer {
  private baseUrl: string = '';
  private apiKey: string = '';
  private model: string = '';
  private provider: string = '';
  private temperature: number = 0.3;
  private maxTokens: number = 8192;
  private messages: ChatMessage[] = [];
  private isStreaming = false;
  private abortController: AbortController | null = null;
  private sessionStartTime: number = Date.now();
  private totalTokens = 0;
  private totalAgentDispatches = 0;
  private totalToolCalls = 0;

  constructor(private settings: SettingsManager) {
    this.updateFromSettings();
  }

  private updateFromSettings() {
    this.provider = this.settings.get('provider', 'ollama');
    this.model = this.settings.get('model', 'qwen2.5-coder:7b');
    this.apiKey = this.settings.get('apiKey', '');
    this.baseUrl = this.settings.get('baseUrl', 'http://localhost:11434');
    this.temperature = this.settings.get('temperature', 0.3);
    this.maxTokens = this.settings.get('maxTokens', 8192);
  }

  async start(): Promise<void> {
    this.updateFromSettings();
    // Test connection
    if (this.provider === 'ollama') {
      try {
        await axios.get(`${this.baseUrl}/api/tags`, { timeout: 5000 });
      } catch {
        throw new Error('Cannot connect to Ollama. Make sure it is running on ' + this.baseUrl);
      }
    }
  }

  stop(): void {
    this.abortController?.abort();
  }

  updateConfig(settings: Record<string, unknown>): void {
    this.updateFromSettings();
  }

  private getApiHeaders(): Record<string, string> {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (this.apiKey) {
      if (this.provider === 'openai' || this.provider === 'groq' || this.provider === 'openrouter') {
        headers['Authorization'] = `Bearer ${this.apiKey}`;
      } else if (this.provider === 'anthropic') {
        headers['x-api-key'] = this.apiKey;
        headers['anthropic-version'] = '2023-06-01';
      }
    }
    return headers;
  }

  private getApiUrl(): string {
    switch (this.provider) {
      case 'ollama':
        return `${this.baseUrl}/api/chat`;
      case 'openai':
        return `${this.baseUrl || 'https://api.openai.com'}/v1/chat/completions`;
      case 'anthropic':
        return `${this.baseUrl || 'https://api.anthropic.com'}/v1/messages`;
      case 'groq':
        return `${this.baseUrl || 'https://api.groq.com'}/openai/v1/chat/completions`;
      case 'openrouter':
        return `${this.baseUrl || 'https://openrouter.ai'}/api/v1/chat/completions`;
      default:
        return `${this.baseUrl}/v1/chat/completions`;
    }
  }

  async sendMessage(
    message: string,
    onChunk?: (chunk: string) => void,
    onDone?: () => void,
    onError?: (error: string) => void,
  ): Promise<string> {
    this.messages.push({ role: 'user', content: message, timestamp: Date.now() });

    this.abortController = new AbortController();
    this.isStreaming = true;

    try {
      let fullResponse = '';

      if (this.provider === 'ollama') {
        fullResponse = await this.streamOllama(onChunk);
      } else if (this.provider === 'anthropic') {
        fullResponse = await this.streamAnthropic(onChunk);
      } else {
        fullResponse = await this.streamOpenAICompatible(onChunk);
      }

      this.messages.push({ role: 'assistant', content: fullResponse, timestamp: Date.now() });
      this.isStreaming = false;
      onDone?.();
      return fullResponse;
    } catch (err) {
      this.isStreaming = false;
      const errorMsg = err instanceof Error ? err.message : String(err);
      onError?.(errorMsg);
      throw err;
    }
  }

  private async streamOllama(onChunk?: (chunk: string) => void): Promise<string> {
    let response = '';
    const res = await axios.post(
      `${this.baseUrl}/api/chat`,
      {
        model: this.model,
        messages: this.messages.map(m => ({ role: m.role, content: m.content })),
        stream: true,
        options: {
          temperature: this.temperature,
          num_predict: this.maxTokens,
        },
      },
      {
        responseType: 'stream',
        signal: this.abortController?.signal,
      },
    );

    return new Promise((resolve, reject) => {
      let buffer = '';
      res.data.on('data', (chunk: Buffer) => {
        buffer += chunk.toString();
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const parsed = JSON.parse(line);
            const content = parsed.message?.content || '';
            if (content) {
              response += content;
              onChunk?.(content);
            }
            if (parsed.done) {
              this.totalTokens += (parsed.prompt_eval_count || 0) + (parsed.eval_count || 0);
              resolve(response);
            }
          } catch {
            // Skip malformed lines
          }
        }
      });
      res.data.on('error', reject);
    });
  }

  private async streamOpenAICompatible(onChunk?: (chunk: string) => void): Promise<string> {
    let response = '';
    const res = await axios.post(
      this.getApiUrl(),
      {
        model: this.model,
        messages: this.messages.map(m => ({ role: m.role, content: m.content })),
        temperature: this.temperature,
        max_tokens: this.maxTokens,
        stream: true,
      },
      {
        headers: this.getApiHeaders(),
        responseType: 'stream',
        signal: this.abortController?.signal,
      },
    );

    return new Promise((resolve, reject) => {
      let buffer = '';
      res.data.on('data', (chunk: Buffer) => {
        buffer += chunk.toString();
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || trimmed === 'data: [DONE]') continue;
          if (!trimmed.startsWith('data: ')) continue;

          try {
            const parsed = JSON.parse(trimmed.slice(6));
            const content = parsed.choices?.[0]?.delta?.content || '';
            if (content) {
              response += content;
              onChunk?.(content);
            }
          } catch {
            // Skip
          }
        }
      });
      res.data.on('end', () => resolve(response));
      res.data.on('error', reject);
    });
  }

  private async streamAnthropic(onChunk?: (chunk: string) => void): Promise<string> {
    let response = '';
    const res = await axios.post(
      this.getApiUrl(),
      {
        model: this.model,
        system: this.messages.filter(m => m.role === 'system').map(m => m.content).join('\n'),
        messages: this.messages.filter(m => m.role !== 'system').map(m => ({ role: m.role, content: m.content })),
        max_tokens: this.maxTokens,
        temperature: this.temperature,
        stream: true,
      },
      {
        headers: this.getApiHeaders(),
        responseType: 'stream',
        signal: this.abortController?.signal,
      },
    );

    return new Promise((resolve, reject) => {
      let buffer = '';
      res.data.on('data', (chunk: Buffer) => {
        buffer += chunk.toString();
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || !trimmed.startsWith('data: ')) continue;

          try {
            const parsed = JSON.parse(trimmed.slice(6));
            if (parsed.type === 'content_block_delta') {
              const content = parsed.delta?.text || '';
              if (content) {
                response += content;
                onChunk?.(content);
              }
            }
          } catch {
            // Skip
          }
        }
      });
      res.data.on('end', () => resolve(response));
      res.data.on('error', reject);
    });
  }

  stopStreaming(): void {
    this.abortController?.abort();
    this.isStreaming = false;
  }

  clearSession(): void {
    this.messages = [];
    this.sessionStartTime = Date.now();
    this.totalTokens = 0;
    this.totalAgentDispatches = 0;
    this.totalToolCalls = 0;
  }

  getMessages(): ChatMessage[] {
    return [...this.messages];
  }

  async getAvailableAgents(): Promise<AgentInfo[]> {
    // Read from ~/.localcode/agents/
    const { readFileSync, readdirSync, statSync, existsSync } = await import('fs');
    const { join } = await import('path');
    const { homedir } = await import('os');

    const agentsDir = join(homedir(), '.localcode', 'agents');
    if (!existsSync(agentsDir)) return [];

    const agents: AgentInfo[] = [];

    function scanDir(dir: string, category: string) {
      const entries = readdirSync(dir);
      for (const entry of entries) {
        const fullPath = join(dir, entry);
        const stat = statSync(fullPath);
        if (stat.isDirectory() && entry !== 'node_modules') {
          scanDir(fullPath, entry.replace(/[-_]/g, ' '));
        } else if (entry.endsWith('.md')) {
          try {
            const content = readFileSync(fullPath, 'utf-8');
            const fmMatch = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
            if (fmMatch) {
              const metadata: Record<string, string> = {};
              fmMatch[1].split('\n').forEach(line => {
                const idx = line.indexOf(':');
                if (idx > 0) metadata[line.substring(0, idx).trim()] = line.substring(idx + 1).trim();
              });
              agents.push({
                id: entry.replace('.md', '').replace(/[-_]/g, '-'),
                name: metadata.name || entry.replace('.md', ''),
                category: category,
                description: metadata.description || '',
                emoji: metadata.emoji,
                color: metadata.color,
              });
            }
          } catch {
            // Skip
          }
        }
      }
    }

    scanDir(agentsDir, 'general');
    return agents;
  }

  async activateAgent(agentId: string): Promise<void> {
    this.totalAgentDispatches++;
    // Agent activation is handled by appending to the system message
    const agents = await this.getAvailableAgents();
    const agent = agents.find(a => a.id === agentId);
    if (agent) {
      const systemMsg = this.messages.find(m => m.role === 'system');
      if (systemMsg) {
        systemMsg.content += `\n\n--- Active Agent: ${agent.name} ---\n${agent.description}`;
      } else {
        this.messages.unshift({
          role: 'system',
          content: `Active Agent: ${agent.name}\n${agent.description}`,
          timestamp: Date.now(),
        });
      }
    }
  }

  async getGitDiff(): Promise<string> {
    const { exec } = await import('child_process');
    return new Promise((resolve) => {
      exec('git diff --cached && git diff', (err, stdout) => {
        resolve(err ? '' : stdout);
      });
    });
  }

  async generateCommitMessage(diff: string): Promise<{ message: string }> {
    if (!diff) return { message: '' };
    const prompt = `Generate a concise, conventional commit message for these changes. Reply with ONLY the commit message, nothing else.\n\n${diff.slice(0, 5000)}`;
    const response = await this.sendMessage(prompt);
    return { message: response.trim() };
  }

  async extractMemoryFromChanges(filePath: string, content: string): Promise<void> {
    // Auto-extract patterns from saved files
    if (!this.settings.get('memoryAutoExtract', true)) return;

    const patterns = [
      { regex: /export\s+(?:const|function|class|interface|type)\s+(\w+)/g, type: 'export' },
      { regex: /import\s+.*from\s+['"](.+?)['"]/g, type: 'import' },
      { regex: /\/\/\s*TODO[:\s]*(.+)/gi, type: 'todo' },
      { regex: /\/\/\s*FIXME[:\s]*(.+)/gi, type: 'fixme' },
    ];

    const findings: string[] = [];
    for (const { regex, type } of patterns) {
      let match;
      while ((match = regex.exec(content)) !== null) {
        findings.push(`[${type}] ${match[1] || match[0]}`);
      }
    }

    if (findings.length > 0) {
      // Store in session memory
      this.totalToolCalls += findings.length;
    }
  }

  async getSessionStats(): Promise<SessionStats> {
    const durationMs = Date.now() - this.sessionStartTime;
    const hours = Math.floor(durationMs / 3600000);
    const minutes = Math.floor((durationMs % 3600000) / 60000);
    const seconds = Math.floor((durationMs % 60000) / 1000);

    return {
      messageCount: this.messages.length,
      tokensUsed: this.totalTokens,
      estimatedCost: this.totalTokens * 0.00001, // Rough estimate
      agentDispatches: this.totalAgentDispatches,
      toolCalls: this.totalToolCalls,
      duration: `${hours}h ${minutes}m ${seconds}s`,
    };
  }

  getIsStreaming(): boolean {
    return this.isStreaming;
  }
}
