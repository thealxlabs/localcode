// src/ui/App.tsx
// Main TUI application — Claude Code inspired
import React, { useState, useRef, useCallback } from 'react';
import { Box, Text, useInput, useApp, useStdout } from 'ink';
import TextInput from 'ink-text-input';
import { exec } from 'child_process';
import { PROVIDERS, SLASH_COMMANDS, } from '../core/types.js';
import { NyxHeader } from './NyxHeader.js';
import { CommandPicker } from './CommandPicker.js';
import { PermissionPrompt, needsPermission } from './PermissionPrompt.js';
import { streamProvider } from '../providers/client.js';
import { ToolExecutor } from '../tools/executor.js';
import { saveSession, createCheckpoint, restoreCheckpoint, estimateTokens, } from '../sessions/manager.js';
export function App({ initialState }) {
    const { exit } = useApp();
    const { stdout } = useStdout();
    // ── State ────────────────────────────────────────────────────────────────────
    const [session, setSession] = useState(initialState);
    const [displayMessages, setDisplayMessages] = useState([]);
    const [input, setInput] = useState('');
    const [isStreaming, setIsStreaming] = useState(false);
    const [mood, setMood] = useState('idle');
    const [showPicker, setShowPicker] = useState(false);
    const [pickerQuery, setPickerQuery] = useState('');
    const [pickerSelectedIndex, setPickerSelectedIndex] = useState(0);
    const [pendingPermission, setPendingPermission] = useState(null);
    const [history, setHistory] = useState([]);
    const [historyIndex, setHistoryIndex] = useState(-1);
    const executorRef = useRef(new ToolExecutor(initialState.workingDir));
    const streamingIdRef = useRef(null);
    // Compute filtered commands for picker
    const q = pickerQuery.toLowerCase();
    const filteredCommands = q
        ? SLASH_COMMANDS.filter((c) => c.name.startsWith(q) || c.description.toLowerCase().includes(q))
        : SLASH_COMMANDS;
    // ── Helpers ──────────────────────────────────────────────────────────────────
    const addDisplay = useCallback((msg) => {
        const id = `msg_${Date.now()}_${Math.random().toString(36).slice(2)}`;
        setDisplayMessages((prev) => [...prev, { ...msg, id }]);
        return id;
    }, []);
    const updateDisplay = useCallback((id, patch) => {
        setDisplayMessages((prev) => prev.map((m) => (m.id === id ? { ...m, ...patch } : m)));
    }, []);
    const sysMsg = useCallback((text, isError = false) => {
        addDisplay({ role: 'system', content: text, isError });
    }, [addDisplay]);
    // Ask for permission — returns a Promise that resolves when user presses y/n/a
    const requestPermission = useCallback((toolCall) => {
        return new Promise((resolve) => {
            setPendingPermission({
                toolCall,
                resolve: (allowed, allowAll = false) => {
                    setPendingPermission(null);
                    resolve({ allowed, allowAll });
                },
            });
        });
    }, []);
    // ── Slash command handler ─────────────────────────────────────────────────────
    const handleSlashCommand = useCallback(async (raw) => {
        const parts = raw.trim().split(/\s+/);
        const cmd = parts[0].toLowerCase();
        const args = parts.slice(1).join(' ');
        switch (cmd) {
            case '/help': {
                setShowPicker(true);
                setPickerQuery('');
                setPickerSelectedIndex(0);
                setInput('/');
                return;
            }
            case '/clear': {
                setDisplayMessages([]);
                setSession((s) => ({ ...s, messages: [] }));
                setMood('idle');
                sysMsg('Conversation cleared.');
                return;
            }
            case '/provider': {
                if (!args) {
                    const list = Object.values(PROVIDERS)
                        .map((p) => {
                        const hasKey = !!session.apiKeys[p.name];
                        const active = session.provider === p.name ? '▶ ' : '  ';
                        const keyMark = p.requiresKey ? (hasKey ? '⚿ ' : '✕ ') : '  ';
                        return `${active}${keyMark}${p.displayName}  (${p.name})  default: ${p.defaultModel}`;
                    })
                        .join('\n');
                    sysMsg(`Available providers:\n${list}`);
                    return;
                }
                const provider = args.toLowerCase();
                if (!PROVIDERS[provider]) {
                    sysMsg(`Unknown provider: ${args}. Options: ollama, claude, openai, groq`, true);
                    return;
                }
                const newModel = PROVIDERS[provider].defaultModel;
                setSession((s) => ({ ...s, provider, model: newModel }));
                sysMsg(`Switched to ${PROVIDERS[provider].displayName} — model: ${newModel}`);
                return;
            }
            case '/apikey': {
                if (!args) {
                    sysMsg('Usage: /apikey <key>');
                    return;
                }
                const masked = args.slice(0, 8) + '...';
                setSession((s) => ({
                    ...s,
                    apiKeys: { ...s.apiKeys, [s.provider]: args },
                }));
                sysMsg(`API key set for ${PROVIDERS[session.provider].displayName}: ${masked}`);
                return;
            }
            case '/model': {
                if (!args) {
                    sysMsg(`Current model: ${session.model}\nUsage: /model <model-name>`);
                    return;
                }
                setSession((s) => ({ ...s, model: args }));
                sysMsg(`Model set to: ${args}`);
                return;
            }
            case '/checkpoint': {
                const label = args || `checkpoint-${Date.now()}`;
                setSession((s) => {
                    const { state, checkpoint } = createCheckpoint(s, label);
                    saveSession(state);
                    return state;
                });
                sysMsg(`Checkpoint saved: "${label}"`);
                return;
            }
            case '/restore': {
                const cps = session.checkpoints;
                if (!cps.length) {
                    sysMsg('No checkpoints saved. Use /checkpoint <label> to create one.');
                    return;
                }
                if (!args) {
                    const list = cps
                        .map((c, i) => `  ${i + 1}. ${c.label}  (${new Date(c.timestamp).toLocaleTimeString()})  id: ${c.id}`)
                        .join('\n');
                    sysMsg(`Checkpoints:\n${list}\n\nUsage: /restore <id>`);
                    return;
                }
                const restored = restoreCheckpoint(session, args);
                if (!restored) {
                    sysMsg(`Checkpoint not found: ${args}`, true);
                    return;
                }
                setSession(restored);
                setDisplayMessages([]);
                sysMsg(`Restored checkpoint: ${args}`);
                return;
            }
            case '/commit': {
                setMood('thinking');
                sysMsg('Generating commit message…');
                try {
                    const stdout = await new Promise((res, rej) => {
                        exec('git diff --staged', { cwd: session.workingDir }, (err, out) => {
                            if (err)
                                rej(err);
                            else
                                res(out);
                        });
                    });
                    if (!stdout.trim()) {
                        sysMsg('No staged changes. Run `git add` first.', true);
                        setMood('error');
                        return;
                    }
                    // Ask the model to generate a commit message
                    const prompt = `Generate a conventional commit message for this diff. Reply with ONLY the commit message, nothing else.\n\n${stdout.slice(0, 4000)}`;
                    let commitMsg = '';
                    await streamProvider(session.provider, session.apiKeys, session.model, [{ role: 'user', content: prompt }], (chunk) => { if (chunk.text)
                        commitMsg += chunk.text; });
                    commitMsg = commitMsg.trim().split('\n')[0];
                    const fullMsg = `${commitMsg}\n\nCo-authored-by: Nyx <nyx@thealxlabs.ca>`;
                    exec(`git commit -m "${fullMsg.replace(/"/g, '\\"')}"`, { cwd: session.workingDir }, (err, out) => {
                        if (err) {
                            sysMsg(`Commit failed: ${err.message}`, true);
                            setMood('error');
                        }
                        else {
                            sysMsg(`Committed: ${commitMsg}`);
                            setMood('happy');
                        }
                    });
                }
                catch (err) {
                    sysMsg(`Commit error: ${err}`, true);
                    setMood('error');
                }
                return;
            }
            case '/diff': {
                const files = executorRef.current.getSessionFiles();
                const paths = Object.keys(files);
                if (!paths.length) {
                    sysMsg('No files modified in this session.');
                    return;
                }
                sysMsg(`Files modified this session:\n${paths.map((p) => `  ± ${p}`).join('\n')}`);
                return;
            }
            case '/context': {
                if (!args) {
                    sysMsg('Usage: /context <file-or-folder>');
                    return;
                }
                const result = await executorRef.current.execute({ name: 'list_dir', args: { path: args, recursive: true } });
                if (!result.success) {
                    // Try reading as file
                    const fileResult = await executorRef.current.execute({ name: 'read_file', args: { path: args } });
                    if (!fileResult.success) {
                        sysMsg(`Could not read: ${args}`, true);
                        return;
                    }
                    const contextMsg = { role: 'user', content: `Context for ${args}:\n\`\`\`\n${fileResult.output}\n\`\`\`` };
                    setSession((s) => ({ ...s, messages: [...s.messages, contextMsg] }));
                    sysMsg(`Added ${args} to context (${fileResult.output.split('\n').length} lines)`);
                }
                else {
                    const contextMsg = { role: 'user', content: `Directory contents of ${args}:\n${result.output}` };
                    setSession((s) => ({ ...s, messages: [...s.messages, contextMsg] }));
                    sysMsg(`Added directory ${args} to context`);
                }
                return;
            }
            case '/allowall': {
                setSession((s) => ({ ...s, allowAllTools: !s.allowAllTools }));
                sysMsg(`Tool permissions: ${!session.allowAllTools ? 'all allowed (no prompts)' : 'per-call prompts restored'}`);
                return;
            }
            case '/compact': {
                if (!session.messages.length) {
                    sysMsg('No conversation to compact.');
                    return;
                }
                sysMsg('Compacting conversation…');
                setMood('thinking');
                const prompt = `Summarize the following conversation in 3-5 concise sentences, preserving key decisions, code context, and goals:\n\n${session.messages.map((m) => `${m.role}: ${m.content.slice(0, 500)}`).join('\n\n')}`;
                let summary = '';
                await streamProvider(session.provider, session.apiKeys, session.model, [{ role: 'user', content: prompt }], (chunk) => { if (chunk.text)
                    summary += chunk.text; });
                const summaryMsg = { role: 'system', content: `[Compacted conversation summary]\n${summary}` };
                setSession((s) => ({ ...s, messages: [summaryMsg] }));
                setDisplayMessages([]);
                sysMsg(`Conversation compacted. Summary:\n${summary}`);
                setMood('idle');
                return;
            }
            case '/status': {
                const tokens = estimateTokens(session.messages);
                const cps = session.checkpoints.length;
                const provider = PROVIDERS[session.provider];
                const hasKey = provider.requiresKey ? (session.apiKeys[session.provider] ? '✓' : '✕ missing') : 'n/a';
                sysMsg(`Provider  ${provider.displayName}\n` +
                    `Model     ${session.model}\n` +
                    `API key   ${hasKey}\n` +
                    `Messages  ${session.messages.length}\n` +
                    `~Tokens   ${tokens.toLocaleString()}\n` +
                    `Checkpts  ${cps}\n` +
                    `CWD       ${session.workingDir}\n` +
                    `AllowAll  ${session.allowAllTools ? 'yes' : 'no'}`);
                return;
            }
            case '/exit': {
                saveSession(session);
                exit();
                return;
            }
            default:
                sysMsg(`Unknown command: ${cmd}. Type / to see all commands.`, true);
        }
    }, [session, sysMsg, addDisplay, exit]);
    // ── Main send handler ─────────────────────────────────────────────────────────
    const sendMessage = useCallback(async (text) => {
        if (!text.trim() || isStreaming)
            return;
        // Add to history
        setHistory((h) => [text, ...h.slice(0, 99)]);
        setHistoryIndex(-1);
        setInput('');
        // Handle @context syntax inline
        let processedText = text;
        const atMatches = text.match(/@[\w./\\-]+/g) ?? [];
        for (const match of atMatches) {
            const p = match.slice(1);
            const result = await executorRef.current.execute({ name: 'read_file', args: { path: p } });
            if (result.success) {
                processedText = processedText.replace(match, `\n\`\`\`${p}\n${result.output}\n\`\`\``);
            }
        }
        const userMsg = { role: 'user', content: processedText };
        addDisplay({ role: 'user', content: text });
        setSession((s) => {
            const updated = { ...s, messages: [...s.messages, userMsg] };
            return updated;
        });
        setIsStreaming(true);
        setMood('thinking');
        // Create streaming display message
        const streamId = addDisplay({ role: 'assistant', content: '', streaming: true });
        streamingIdRef.current = streamId;
        let accumulated = '';
        // We need the current session state
        // Use a ref to get the latest session
        const currentSession = session;
        const run = async () => {
            const msgs = [...currentSession.messages, userMsg];
            await streamProvider(currentSession.provider, currentSession.apiKeys, currentSession.model, msgs, async (chunk) => {
                switch (chunk.type) {
                    case 'text':
                        accumulated += chunk.text ?? '';
                        updateDisplay(streamId, { content: accumulated, streaming: true });
                        break;
                    case 'tool_call': {
                        const toolCall = chunk.toolCall;
                        // Finalize text streaming
                        updateDisplay(streamId, { content: accumulated, streaming: false });
                        // Show tool call
                        const toolDisplayId = addDisplay({
                            role: 'tool',
                            content: `${toolCall.name}(${Object.entries(toolCall.args)
                                .slice(0, 2)
                                .map(([k, v]) => `${k}=${JSON.stringify(v).slice(0, 40)}`)
                                .join(', ')})`,
                            toolName: toolCall.name,
                            streaming: true,
                        });
                        // Permission check
                        let allowed = currentSession.allowAllTools;
                        let allowAll = false;
                        if (!allowed && needsPermission(toolCall)) {
                            setMood('waiting');
                            const perm = await requestPermission(toolCall);
                            allowed = perm.allowed;
                            allowAll = perm.allowAll;
                            if (allowAll) {
                                setSession((s) => ({ ...s, allowAllTools: true }));
                            }
                            setMood('thinking');
                        }
                        else {
                            allowed = true;
                        }
                        if (!allowed) {
                            updateDisplay(toolDisplayId, { content: `${toolCall.name} — denied`, streaming: false, isError: true });
                            break;
                        }
                        // Execute
                        const result = await executorRef.current.execute(toolCall);
                        updateDisplay(toolDisplayId, {
                            content: `${toolCall.name} → ${result.success ? result.output.slice(0, 120) : '✕ ' + result.output}`,
                            streaming: false,
                            isError: !result.success,
                        });
                        // Show diff if present
                        if (result.diff) {
                            addDisplay({
                                role: 'system',
                                content: `  ${result.diff.path}  +${result.diff.additions} -${result.diff.deletions}`,
                            });
                        }
                        // Feed result back to model context
                        const toolResultMsg = {
                            role: 'user',
                            content: `Tool result for ${toolCall.name}:\n${result.output.slice(0, 4000)}`,
                        };
                        msgs.push(toolResultMsg);
                        break;
                    }
                    case 'done':
                        updateDisplay(streamId, { streaming: false });
                        if (accumulated.trim()) {
                            setSession((s) => ({
                                ...s,
                                messages: [
                                    ...s.messages,
                                    userMsg,
                                    { role: 'assistant', content: accumulated },
                                ],
                            }));
                        }
                        break;
                    case 'error':
                        updateDisplay(streamId, {
                            content: chunk.error ?? 'Unknown error',
                            streaming: false,
                            isError: true,
                        });
                        setMood('error');
                        break;
                }
            });
        };
        try {
            await run();
        }
        catch (err) {
            updateDisplay(streamId, {
                content: `Error: ${err instanceof Error ? err.message : String(err)}`,
                streaming: false,
                isError: true,
            });
            setMood('error');
        }
        finally {
            setIsStreaming(false);
            setMood((m) => (m === 'thinking' || m === 'waiting' ? 'idle' : m));
        }
    }, [isStreaming, session, addDisplay, updateDisplay, requestPermission]);
    // ── Input handling ────────────────────────────────────────────────────────────
    const handleInputChange = useCallback((val) => {
        setInput(val);
        if (val.startsWith('/')) {
            const query = val.slice(1); // empty string when just "/"
            setPickerQuery(query);
            setShowPicker(true);
            setPickerSelectedIndex(0);
        }
        else {
            setShowPicker(false);
            setPickerQuery('');
        }
    }, []);
    const handleSubmit = useCallback(async (val) => {
        const v = val.trim();
        if (!v)
            return;
        if (showPicker) {
            // Select the highlighted command from filtered list
            const q = pickerQuery.toLowerCase();
            const filtered = q
                ? SLASH_COMMANDS.filter((c) => c.name.startsWith(q) || c.description.toLowerCase().includes(q) || c.trigger.includes(q))
                : SLASH_COMMANDS;
            const selected = filtered[Math.min(pickerSelectedIndex, filtered.length - 1)];
            if (selected) {
                setInput('');
                setShowPicker(false);
                setPickerQuery('');
                await handleSlashCommand(selected.trigger);
                return;
            }
        }
        if (v.startsWith('/')) {
            setShowPicker(false);
            setPickerQuery('');
            await handleSlashCommand(v);
            return;
        }
        await sendMessage(v);
    }, [showPicker, pickerQuery, pickerSelectedIndex, handleSlashCommand, sendMessage]);
    useInput((inputChar, key) => {
        // Permission prompt input
        if (pendingPermission) {
            if (inputChar === 'y')
                pendingPermission.resolve(true, false);
            else if (inputChar === 'a')
                pendingPermission.resolve(true, true);
            else if (inputChar === 'n')
                pendingPermission.resolve(false, false);
            return;
        }
        // Picker navigation
        if (showPicker) {
            const filtered = pickerQuery
                ? SLASH_COMMANDS.filter((c) => c.name.startsWith(pickerQuery) || c.description.toLowerCase().includes(pickerQuery))
                : SLASH_COMMANDS;
            if (key.upArrow) {
                setPickerSelectedIndex((i) => Math.max(0, i - 1));
                return;
            }
            if (key.downArrow) {
                setPickerSelectedIndex((i) => Math.min(filtered.length - 1, i + 1));
                return;
            }
            if (key.escape) {
                setShowPicker(false);
                setInput('');
                return;
            }
            if (key.return) {
                const selected = filtered[pickerSelectedIndex];
                if (selected) {
                    setInput('');
                    setShowPicker(false);
                    handleSlashCommand(selected.trigger);
                }
                return;
            }
        }
        // Shell history navigation (only when not in picker)
        if (!showPicker) {
            if (key.upArrow && !isStreaming) {
                const newIndex = Math.min(historyIndex + 1, history.length - 1);
                setHistoryIndex(newIndex);
                setInput(history[newIndex] ?? '');
                return;
            }
            if (key.downArrow && !isStreaming) {
                const newIndex = Math.max(historyIndex - 1, -1);
                setHistoryIndex(newIndex);
                setInput(newIndex === -1 ? '' : history[newIndex]);
                return;
            }
        }
        if (key.ctrl && inputChar === 'c') {
            saveSession(session);
            exit();
        }
    });
    // ── Render ────────────────────────────────────────────────────────────────────
    const termHeight = stdout?.rows ?? 24;
    const maxMessages = Math.max(5, termHeight - 12);
    return (React.createElement(Box, { flexDirection: "column", height: termHeight },
        React.createElement(NyxHeader, { mood: mood, provider: session.provider, model: session.model, workingDir: session.workingDir, tokenCount: estimateTokens(session.messages), allowAll: session.allowAllTools }),
        React.createElement(Box, { flexDirection: "column", flexGrow: 1, overflowY: "hidden" }, displayMessages.slice(-maxMessages).map((msg) => (React.createElement(MessageRow, { key: msg.id, msg: msg })))),
        pendingPermission && (React.createElement(PermissionPrompt, { toolCall: pendingPermission.toolCall })),
        showPicker && (React.createElement(CommandPicker, { query: pickerQuery, selectedIndex: pickerSelectedIndex, onSelect: (cmd) => {
                setInput('');
                setShowPicker(false);
                handleSlashCommand(cmd.trigger);
            }, onDismiss: () => { setShowPicker(false); setInput(''); } })),
        React.createElement(Box, { borderStyle: "round", borderColor: isStreaming ? 'gray' : 'yellowBright', paddingX: 1, flexDirection: "row" },
            React.createElement(Text, { color: isStreaming ? 'gray' : 'yellowBright' }, isStreaming ? '⟳ ' : '❯ '),
            isStreaming ? (React.createElement(Text, { color: "gray", dimColor: true }, "Generating\u2026")) : (React.createElement(TextInput, { value: input, onChange: handleInputChange, onSubmit: handleSubmit, placeholder: "Message Nyx\u2026  (/ for commands)" }))),
        React.createElement(Box, null,
            React.createElement(Text, { color: "gray", dimColor: true }, '  ctrl+c exit  / commands  @file context  ↑↓ history'))));
}
// ─── Message row component ─────────────────────────────────────────────────────
function MessageRow({ msg }) {
    const roleColors = {
        user: 'yellowBright',
        assistant: 'white',
        system: 'gray',
        tool: 'cyan',
    };
    const roleIcons = {
        user: '❯ ',
        assistant: '◈ ',
        system: '· ',
        tool: '⟳ ',
    };
    const color = msg.isError ? 'red' : roleColors[msg.role] ?? 'white';
    return (React.createElement(Box, { flexDirection: "row", marginBottom: 0 },
        React.createElement(Text, { color: color, dimColor: msg.role === 'system' }, roleIcons[msg.role] ?? '  '),
        React.createElement(Box, { flexGrow: 1, flexWrap: "wrap" },
            React.createElement(Text, { color: color, dimColor: msg.role === 'system' },
                msg.content,
                msg.streaming && React.createElement(Text, { color: "gray" }, " \u258C")))));
}
//# sourceMappingURL=App.js.map