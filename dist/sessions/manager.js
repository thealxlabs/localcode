// src/sessions/manager.ts
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { PROVIDERS } from '../core/types.js';
const SESSION_DIR = path.join(os.homedir(), '.localcode');
const STATE_FILE = path.join(SESSION_DIR, 'session.json');
function ensureDir() {
    fs.mkdirSync(SESSION_DIR, { recursive: true });
}
export function loadSession() {
    ensureDir();
    // Auto-detect API keys from env
    const apiKeys = {};
    if (process.env.ANTHROPIC_API_KEY)
        apiKeys.claude = process.env.ANTHROPIC_API_KEY;
    if (process.env.OPENAI_API_KEY)
        apiKeys.openai = process.env.OPENAI_API_KEY;
    if (process.env.GROQ_API_KEY)
        apiKeys.groq = process.env.GROQ_API_KEY;
    const defaults = {
        provider: 'ollama',
        model: PROVIDERS.ollama.defaultModel,
        messages: [],
        checkpoints: [],
        allowAllTools: false,
        workingDir: process.cwd(),
        apiKeys,
    };
    if (!fs.existsSync(STATE_FILE))
        return defaults;
    try {
        const saved = JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
        // Merge env keys on top of saved keys
        return {
            ...defaults,
            ...saved,
            apiKeys: { ...saved.apiKeys, ...apiKeys },
            // Don't restore messages/allowAllTools across sessions
            messages: [],
            allowAllTools: false,
        };
    }
    catch {
        return defaults;
    }
}
export function saveSession(state) {
    ensureDir();
    // Persist everything except live messages and allowAllTools
    const toSave = {
        provider: state.provider,
        model: state.model,
        checkpoints: state.checkpoints,
        workingDir: state.workingDir,
        apiKeys: state.apiKeys,
    };
    fs.writeFileSync(STATE_FILE, JSON.stringify(toSave, null, 2), 'utf8');
}
export function createCheckpoint(state, label) {
    const checkpoint = {
        id: `cp_${Date.now()}`,
        label,
        timestamp: Date.now(),
        messages: [...state.messages],
        files: {}, // populated by the caller with session file snapshots
    };
    const updatedState = {
        ...state,
        checkpoints: [...state.checkpoints, checkpoint],
    };
    return { state: updatedState, checkpoint };
}
export function restoreCheckpoint(state, checkpointId) {
    const cp = state.checkpoints.find((c) => c.id === checkpointId);
    if (!cp)
        return null;
    return {
        ...state,
        messages: [...cp.messages],
    };
}
export function estimateTokens(messages) {
    // Rough estimate: 1 token ≈ 4 chars
    const total = messages.reduce((acc, m) => acc + m.content.length, 0);
    return Math.ceil(total / 4);
}
export function isFirstRun() {
    return !fs.existsSync(STATE_FILE);
}
//# sourceMappingURL=manager.js.map