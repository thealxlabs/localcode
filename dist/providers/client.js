// src/providers/client.ts
// Unified streaming + agent loop client for Ollama, Claude, OpenAI, Groq
import { PROVIDERS } from '../core/types.js';
// ─── Built-in tool definitions ─────────────────────────────────────────────────
export const BUILTIN_TOOLS = [
    {
        name: 'read_file',
        description: 'Read the contents of a file',
        parameters: {
            type: 'object',
            properties: { path: { type: 'string', description: 'File path to read' } },
            required: ['path'],
        },
    },
    {
        name: 'write_file',
        description: 'Write content to a file (creates or overwrites)',
        parameters: {
            type: 'object',
            properties: {
                path: { type: 'string', description: 'File path to write' },
                content: { type: 'string', description: 'Content to write' },
            },
            required: ['path', 'content'],
        },
    },
    {
        name: 'patch_file',
        description: 'Replace a specific string in a file with new content',
        parameters: {
            type: 'object',
            properties: {
                path: { type: 'string', description: 'File path to patch' },
                old_str: { type: 'string', description: 'Exact string to replace' },
                new_str: { type: 'string', description: 'Replacement string' },
            },
            required: ['path', 'old_str', 'new_str'],
        },
    },
    {
        name: 'run_shell',
        description: 'Run a shell command and return stdout/stderr',
        parameters: {
            type: 'object',
            properties: {
                command: { type: 'string', description: 'Shell command to run' },
                cwd: { type: 'string', description: 'Working directory (optional)' },
            },
            required: ['command'],
        },
    },
    {
        name: 'list_dir',
        description: 'List files and directories at a path',
        parameters: {
            type: 'object',
            properties: {
                path: { type: 'string', description: 'Directory path' },
                recursive: { type: 'boolean', description: 'List recursively' },
            },
            required: ['path'],
        },
    },
    {
        name: 'git_operation',
        description: 'Run a git command',
        parameters: {
            type: 'object',
            properties: {
                args: { type: 'string', description: 'Git arguments (e.g. "status", "diff HEAD")' },
            },
            required: ['args'],
        },
    },
];
// ─── Ollama agent ─────────────────────────────────────────────────────────────
async function runOllamaAgent(config, model, messages, onChunk, agentCfg, systemPrompt) {
    // Build message list with system prompt
    const history = [];
    if (systemPrompt)
        history.push({ role: 'system', content: systemPrompt });
    for (const m of messages)
        history.push({ role: m.role, content: m.content });
    const tools = agentCfg.tools.map((t) => ({
        type: 'function',
        function: { name: t.name, description: t.description, parameters: t.parameters },
    }));
    for (let step = 0; step < agentCfg.maxSteps; step++) {
        await onChunk({ type: 'agent_step', step, maxSteps: agentCfg.maxSteps });
        const res = await fetch(`${config.baseUrl}/api/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ model, messages: history, stream: true, tools }),
        });
        if (!res.ok || !res.body) {
            await onChunk({ type: 'error', error: `Ollama error ${res.status}: ${await res.text()}` });
            return;
        }
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buf = '';
        let assistantText = '';
        const toolCalls = [];
        while (true) {
            const { done, value } = await reader.read();
            if (done)
                break;
            buf += decoder.decode(value, { stream: true });
            const lines = buf.split('\n');
            buf = lines.pop() ?? '';
            for (const line of lines) {
                if (!line.trim())
                    continue;
                try {
                    const obj = JSON.parse(line);
                    const msg = obj.message;
                    if (!msg)
                        continue;
                    if (msg.content) {
                        assistantText += msg.content;
                        await onChunk({ type: 'text', text: msg.content });
                    }
                    if (msg.tool_calls) {
                        for (const tc of msg.tool_calls) {
                            toolCalls.push({ name: tc.function.name, args: tc.function.arguments ?? {} });
                        }
                    }
                }
                catch { /* skip */ }
            }
        }
        // Add assistant turn to history
        history.push({ role: 'assistant', content: assistantText });
        // No tool calls → agent is done
        if (!toolCalls.length) {
            await onChunk({ type: 'done' });
            return;
        }
        // Execute tool calls
        for (const toolCall of toolCalls) {
            const perm = await agentCfg.onToolCall(toolCall, step);
            if (!perm.allowed) {
                history.push({ role: 'tool', content: `Tool call denied by user: ${toolCall.name}` });
                continue;
            }
            const result = await agentCfg.executeTool(toolCall);
            agentCfg.onToolResult(toolCall, result.output, result.diff);
            // Feed result back
            history.push({
                role: 'tool',
                content: result.output.slice(0, 8000),
            });
        }
    }
    // Hit max steps
    await onChunk({ type: 'error', error: `Agent reached max steps (${agentCfg.maxSteps}). Use /agent --steps N to increase.` });
}
// ─── Claude agent ──────────────────────────────────────────────────────────────
async function runClaudeAgent(config, model, messages, onChunk, agentCfg, systemPrompt) {
    if (!config.apiKey) {
        await onChunk({ type: 'error', error: 'No Anthropic API key. Use /apikey sk-ant-...' });
        return;
    }
    const claudeTools = agentCfg.tools.map((t) => ({
        name: t.name,
        description: t.description,
        input_schema: t.parameters,
    }));
    const history = messages.map((m) => ({
        role: m.role === 'assistant' ? 'assistant' : 'user',
        content: m.content,
    }));
    for (let step = 0; step < agentCfg.maxSteps; step++) {
        await onChunk({ type: 'agent_step', step, maxSteps: agentCfg.maxSteps });
        const res = await fetch(`${config.baseUrl}/v1/messages`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': config.apiKey,
                'anthropic-version': '2023-06-01',
            },
            body: JSON.stringify({
                model,
                max_tokens: 8096,
                system: systemPrompt,
                messages: history,
                tools: claudeTools,
                stream: true,
            }),
        });
        if (!res.ok || !res.body) {
            await onChunk({ type: 'error', error: `Claude error ${res.status}: ${await res.text()}` });
            return;
        }
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buf = '';
        let assistantText = '';
        const toolUses = [];
        let currentToolId = '';
        let currentToolName = '';
        let currentToolInput = '';
        let stopReason = '';
        while (true) {
            const { done, value } = await reader.read();
            if (done)
                break;
            buf += decoder.decode(value, { stream: true });
            const lines = buf.split('\n');
            buf = lines.pop() ?? '';
            for (const line of lines) {
                if (!line.startsWith('data: '))
                    continue;
                const raw = line.slice(6).trim();
                if (raw === '[DONE]')
                    continue;
                try {
                    const ev = JSON.parse(raw);
                    if (ev.type === 'content_block_start') {
                        if (ev.content_block?.type === 'tool_use') {
                            currentToolId = ev.content_block.id;
                            currentToolName = ev.content_block.name;
                            currentToolInput = '';
                        }
                    }
                    else if (ev.type === 'content_block_delta') {
                        if (ev.delta?.type === 'text_delta') {
                            assistantText += ev.delta.text;
                            await onChunk({ type: 'text', text: ev.delta.text });
                        }
                        else if (ev.delta?.type === 'input_json_delta') {
                            currentToolInput += ev.delta.partial_json ?? '';
                        }
                    }
                    else if (ev.type === 'content_block_stop' && currentToolName) {
                        toolUses.push({ id: currentToolId, name: currentToolName, input: currentToolInput });
                        currentToolName = '';
                    }
                    else if (ev.type === 'message_delta') {
                        stopReason = ev.delta?.stop_reason ?? '';
                    }
                }
                catch { /* skip */ }
            }
        }
        // Build assistant message content for history
        const assistantContent = [];
        if (assistantText)
            assistantContent.push({ type: 'text', text: assistantText });
        for (const tu of toolUses) {
            try {
                assistantContent.push({ type: 'tool_use', id: tu.id, name: tu.name, input: JSON.parse(tu.input || '{}') });
            }
            catch {
                assistantContent.push({ type: 'tool_use', id: tu.id, name: tu.name, input: {} });
            }
        }
        history.push({ role: 'assistant', content: assistantContent });
        // No tool calls or end_turn → done
        if (!toolUses.length || stopReason === 'end_turn') {
            await onChunk({ type: 'done' });
            return;
        }
        // Execute tools, build tool_result message
        const toolResults = [];
        for (const tu of toolUses) {
            let parsedInput = {};
            try {
                parsedInput = JSON.parse(tu.input || '{}');
            }
            catch { /* ok */ }
            const toolCall = { name: tu.name, args: parsedInput };
            const perm = await agentCfg.onToolCall(toolCall, step);
            let resultContent = 'Tool call denied by user.';
            if (perm.allowed) {
                const result = await agentCfg.executeTool(toolCall);
                agentCfg.onToolResult(toolCall, result.output, result.diff);
                resultContent = result.output.slice(0, 8000);
            }
            toolResults.push({
                type: 'tool_result',
                tool_use_id: tu.id,
                content: resultContent,
            });
        }
        history.push({ role: 'user', content: toolResults });
    }
    await onChunk({ type: 'error', error: `Agent reached max steps (${agentCfg.maxSteps}).` });
}
// ─── OpenAI-compatible agent (OpenAI + Groq) ─────────────────────────────────
async function runOpenAIAgent(baseUrl, apiKey, model, messages, onChunk, agentCfg, providerName, systemPrompt) {
    if (!apiKey) {
        await onChunk({ type: 'error', error: `No ${providerName} API key. Use /apikey ...` });
        return;
    }
    const oaiTools = agentCfg.tools.map((t) => ({
        type: 'function',
        function: { name: t.name, description: t.description, parameters: t.parameters },
    }));
    const history = [];
    if (systemPrompt)
        history.push({ role: 'system', content: systemPrompt });
    for (const m of messages)
        history.push({ role: m.role, content: m.content });
    for (let step = 0; step < agentCfg.maxSteps; step++) {
        await onChunk({ type: 'agent_step', step, maxSteps: agentCfg.maxSteps });
        const res = await fetch(`${baseUrl}/v1/chat/completions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
            body: JSON.stringify({ model, messages: history, tools: oaiTools, tool_choice: 'auto', stream: true }),
        });
        if (!res.ok || !res.body) {
            await onChunk({ type: 'error', error: `${providerName} error ${res.status}: ${await res.text()}` });
            return;
        }
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buf = '';
        let assistantText = '';
        const tcAccum = {};
        let finishReason = '';
        while (true) {
            const { done, value } = await reader.read();
            if (done)
                break;
            buf += decoder.decode(value, { stream: true });
            const lines = buf.split('\n');
            buf = lines.pop() ?? '';
            for (const line of lines) {
                if (!line.startsWith('data: '))
                    continue;
                const raw = line.slice(6).trim();
                if (raw === '[DONE]')
                    continue;
                try {
                    const ev = JSON.parse(raw);
                    const delta = ev.choices?.[0]?.delta;
                    finishReason = ev.choices?.[0]?.finish_reason ?? finishReason;
                    if (!delta)
                        continue;
                    if (delta.content) {
                        assistantText += delta.content;
                        await onChunk({ type: 'text', text: delta.content });
                    }
                    if (delta.tool_calls) {
                        for (const tc of delta.tool_calls) {
                            const idx = tc.index ?? 0;
                            if (!tcAccum[idx])
                                tcAccum[idx] = { id: tc.id ?? '', name: '', args: '' };
                            if (tc.id)
                                tcAccum[idx].id = tc.id;
                            if (tc.function?.name)
                                tcAccum[idx].name += tc.function.name;
                            if (tc.function?.arguments)
                                tcAccum[idx].args += tc.function.arguments;
                        }
                    }
                }
                catch { /* skip */ }
            }
        }
        const toolCalls = Object.values(tcAccum);
        // Add assistant message to history
        const assistantMsg = { role: 'assistant', content: assistantText || null };
        if (toolCalls.length) {
            assistantMsg.tool_calls = toolCalls.map((tc) => ({
                id: tc.id,
                type: 'function',
                function: { name: tc.name, arguments: tc.args },
            }));
        }
        history.push(assistantMsg);
        // No tool calls → done
        if (!toolCalls.length || finishReason === 'stop') {
            await onChunk({ type: 'done' });
            return;
        }
        // Execute tools
        for (const tc of toolCalls) {
            let args = {};
            try {
                args = JSON.parse(tc.args || '{}');
            }
            catch { /* ok */ }
            const toolCall = { name: tc.name, args };
            const perm = await agentCfg.onToolCall(toolCall, step);
            let resultContent = 'Tool call denied by user.';
            if (perm.allowed) {
                const result = await agentCfg.executeTool(toolCall);
                agentCfg.onToolResult(toolCall, result.output, result.diff);
                resultContent = result.output.slice(0, 8000);
            }
            history.push({ role: 'tool', content: resultContent, tool_call_id: tc.id });
        }
    }
    await onChunk({ type: 'error', error: `Agent reached max steps (${agentCfg.maxSteps}).` });
}
// ─── Public API ───────────────────────────────────────────────────────────────
export async function runAgent(provider, apiKeys, model, messages, onChunk, agentCfg, systemPrompt) {
    const config = { ...PROVIDERS[provider], apiKey: apiKeys[provider] };
    switch (provider) {
        case 'ollama':
            return runOllamaAgent(config, model, messages, onChunk, agentCfg, systemPrompt);
        case 'claude':
            return runClaudeAgent(config, model, messages, onChunk, agentCfg, systemPrompt);
        case 'openai':
            return runOpenAIAgent(config.baseUrl, config.apiKey ?? '', model, messages, onChunk, agentCfg, 'OpenAI', systemPrompt);
        case 'groq':
            return runOpenAIAgent(config.baseUrl, config.apiKey ?? '', model, messages, onChunk, agentCfg, 'Groq', systemPrompt);
    }
}
// Keep streamProvider as a simple single-turn wrapper (for /compact, /commit etc)
export async function streamProvider(provider, apiKeys, model, messages, onChunk, systemPrompt) {
    return runAgent(provider, apiKeys, model, messages, onChunk, {
        maxSteps: 1,
        tools: BUILTIN_TOOLS,
        onToolCall: async () => ({ allowed: true, allowAll: false }),
        onToolResult: () => { },
        executeTool: async () => ({ success: false, output: 'Tool calls disabled in single-turn mode' }),
    }, systemPrompt);
}
// ─── Token cost estimates ─────────────────────────────────────────────────────
const COST_PER_1M = {
    'claude-sonnet-4-5': { in: 3, out: 15 },
    'claude-opus-4-5': { in: 15, out: 75 },
    'claude-haiku-4-5': { in: 0.25, out: 1.25 },
    'gpt-4o': { in: 2.5, out: 10 },
    'gpt-4o-mini': { in: 0.15, out: 0.6 },
    'llama-3.3-70b-versatile': { in: 0.59, out: 0.79 },
    'mixtral-8x7b-32768': { in: 0.24, out: 0.24 },
};
export function estimateCost(model, inputTokens, outputTokens) {
    const rates = COST_PER_1M[model];
    if (!rates)
        return 0;
    return (inputTokens / 1_000_000) * rates.in + (outputTokens / 1_000_000) * rates.out;
}
export async function listModels(provider, apiKeys) {
    try {
        if (provider === 'ollama') {
            const res = await fetch('http://localhost:11434/api/tags');
            if (!res.ok)
                return [];
            const data = await res.json();
            return data.models.map((m) => m.name);
        }
        if (provider === 'openai') {
            const key = apiKeys.openai;
            if (!key)
                return [];
            const res = await fetch('https://api.openai.com/v1/models', {
                headers: { Authorization: `Bearer ${key}` },
            });
            if (!res.ok)
                return [];
            const data = await res.json();
            return data.data.map((m) => m.id).filter((id) => id.startsWith('gpt')).sort();
        }
        if (provider === 'groq') {
            const key = apiKeys.groq;
            if (!key)
                return [];
            const res = await fetch('https://api.groq.com/openai/v1/models', {
                headers: { Authorization: `Bearer ${key}` },
            });
            if (!res.ok)
                return [];
            const data = await res.json();
            return data.data.map((m) => m.id).sort();
        }
        if (provider === 'claude') {
            return ['claude-opus-4-5', 'claude-sonnet-4-5', 'claude-haiku-4-5-20251001'];
        }
        return [];
    }
    catch {
        return [];
    }
}
//# sourceMappingURL=client.js.map