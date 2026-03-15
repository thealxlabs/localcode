// src/ui/PermissionPrompt.tsx
// Claude Code-style permission prompt before destructive tool calls
import React from 'react';
import { Box, Text } from 'ink';
const TOOL_DESCRIPTIONS = {
    write_file: 'Write file',
    patch_file: 'Patch file',
    run_shell: 'Run shell command',
    git_operation: 'Git operation',
    read_file: 'Read file',
    list_dir: 'List directory',
};
const SENSITIVE_TOOLS = new Set(['write_file', 'patch_file', 'run_shell', 'git_operation']);
export function needsPermission(toolCall) {
    return SENSITIVE_TOOLS.has(toolCall.name);
}
function formatArgs(args) {
    const parts = [];
    for (const [k, v] of Object.entries(args)) {
        if (typeof v === 'string' && v.length > 60) {
            parts.push(`${k}='${v.slice(0, 60)}…'`);
        }
        else {
            parts.push(`${k}='${v}'`);
        }
    }
    return parts.join('  ');
}
export function PermissionPrompt({ toolCall }) {
    const desc = TOOL_DESCRIPTIONS[toolCall.name] ?? toolCall.name;
    const argStr = formatArgs(toolCall.args);
    return (React.createElement(Box, { flexDirection: "column", borderStyle: "round", borderColor: "yellow", paddingX: 1, marginY: 1 },
        React.createElement(Box, { flexDirection: "row", marginBottom: 1 },
            React.createElement(Text, { color: "yellow", bold: true }, "\u26A0  Permission required")),
        React.createElement(Box, { flexDirection: "row" },
            React.createElement(Text, { color: "gray", dimColor: true }, "Tool   "),
            React.createElement(Text, { color: "yellowBright", bold: true }, desc)),
        argStr && (React.createElement(Box, { flexDirection: "row" },
            React.createElement(Text, { color: "gray", dimColor: true }, "Args   "),
            React.createElement(Text, { color: "white" }, argStr))),
        React.createElement(Box, { marginTop: 1 },
            React.createElement(Text, { color: "gray" },
                '  ',
                React.createElement(Text, { color: "greenBright", bold: true }, "y"),
                React.createElement(Text, { color: "gray" }, "  allow once    "),
                React.createElement(Text, { color: "yellow", bold: true }, "a"),
                React.createElement(Text, { color: "gray" }, "  allow all this session    "),
                React.createElement(Text, { color: "red", bold: true }, "n"),
                React.createElement(Text, { color: "gray" }, "  deny")))));
}
//# sourceMappingURL=PermissionPrompt.js.map