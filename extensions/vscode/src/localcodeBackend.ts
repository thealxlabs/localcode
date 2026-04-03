// extensions/vscode/src/localcodeBackend.ts
// Connects to localcode CLI backend via child process and JSON-RPC

import * as vscode from 'vscode';
import { ChildProcess, spawn } from 'child_process';
import { EventEmitter } from 'events';

interface JsonRpcRequest {
  jsonrpc: '2.0';
  id: number;
  method: string;
  params?: Record<string, unknown>;
}

interface JsonRpcResponse {
  jsonrpc: '2.0';
  id: number;
  result?: unknown;
  error?: { code: number; message: string; data?: unknown };
}

interface JsonRpcNotification {
  jsonrpc: '2.0';
  method: string;
  params?: Record<string, unknown>;
}

export class LocalcodeBackend extends EventEmitter {
  private process: ChildProcess | null = null;
  private buffer = '';
  private requestId = 0;
  private pendingRequests = new Map<number, { resolve: (value: unknown) => void; reject: (error: Error) => void }>();
  private status: 'stopped' | 'starting' | 'running' | 'error' = 'stopped';

  constructor(private outputChannel: vscode.OutputChannel) {
    super();
  }

  getStatus(): string {
    return this.status;
  }

  async start(): Promise<void> {
    if (this.status === 'running') return;
    this.status = 'starting';

    try {
      this.process = spawn('localcode', ['--headless', '--json'], {
        stdio: ['pipe', 'pipe', 'pipe'],
        env: { ...process.env },
      });

      this.process.stdout?.on('data', (data: Buffer) => {
        this.buffer += data.toString();
        this.processBuffer();
      });

      this.process.stderr?.on('data', (data: Buffer) => {
        const msg = data.toString();
        this.outputChannel.appendLine(`[localcode stderr] ${msg}`);
        this.emit('stderr', msg);
      });

      this.process.on('close', (code: number | null) => {
        this.outputChannel.appendLine(`[localcode] Process exited with code ${code}`);
        this.status = 'stopped';
        this.emit('stopped', code);
      });

      this.process.on('error', (err: Error) => {
        this.outputChannel.appendLine(`[localcode] Process error: ${err.message}`);
        this.status = 'error';
        this.emit('error', err);
      });

      // Wait for ready signal
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error('Localcode backend failed to start within 10 seconds')), 10000);
        const onReady = () => {
          clearTimeout(timeout);
          this.status = 'running';
          this.removeListener('stderr', onStderr);
          resolve();
        };
        const onStderr = (msg: string) => {
          if (msg.includes('ready') || msg.includes('started')) {
            onReady();
          }
        };
        this.on('stderr', onStderr);
        // Fallback: assume ready after short delay
        setTimeout(() => {
          if (this.status === 'starting') {
            this.status = 'running';
            this.removeListener('stderr', onStderr);
            resolve();
          }
        }, 2000);
      });

      this.outputChannel.appendLine('[localcode] Backend started');
    } catch (err) {
      this.status = 'error';
      this.outputChannel.appendLine(`[localcode] Failed to start: ${err instanceof Error ? err.message : String(err)}`);
      throw err;
    }
  }

  async stop(): Promise<void> {
    if (this.process) {
      this.process.kill('SIGTERM');
      this.process = null;
    }
    this.status = 'stopped';
    this.buffer = '';
    for (const [id, { reject }] of this.pendingRequests) {
      reject(new Error('Backend stopped'));
      this.pendingRequests.delete(id);
    }
  }

  async sendRequest(method: string, params?: Record<string, unknown>): Promise<unknown> {
    if (this.status !== 'running') {
      await this.start();
    }

    const id = ++this.requestId;
    const request: JsonRpcRequest = { jsonrpc: '2.0', id, method, params };

    return new Promise((resolve, reject) => {
      this.pendingRequests.set(id, { resolve, reject });
      this.write(JSON.stringify(request) + '\n');
    });
  }

  sendNotification(method: string, params?: Record<string, unknown>): void {
    if (this.status !== 'running') return;
    const notification: JsonRpcNotification = { jsonrpc: '2.0', method, params };
    this.write(JSON.stringify(notification) + '\n');
  }

  private write(data: string): void {
    if (this.process?.stdin) {
      this.process.stdin.write(data);
    }
  }

  private processBuffer(): void {
    const lines = this.buffer.split('\n');
    this.buffer = lines.pop() || '';

    for (const line of lines) {
      if (!line.trim()) continue;
      try {
        const msg = JSON.parse(line);
        if (msg.id !== undefined) {
          // Response
          const pending = this.pendingRequests.get(msg.id);
          if (pending) {
            this.pendingRequests.delete(msg.id);
            if (msg.error) {
              pending.reject(new Error(msg.error.message));
            } else {
              pending.resolve(msg.result);
            }
          }
        } else if (msg.method) {
          // Notification
          this.emit(msg.method, msg.params);
        }
      } catch {
        // Ignore parse errors
      }
    }
  }
}
