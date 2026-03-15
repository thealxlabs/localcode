// src/ui/CommandPicker.tsx
// Claude Code-style slash command picker — pops above input when user types /
import React from 'react';
import { Box, Text } from 'ink';
import { SLASH_COMMANDS } from '../core/types.js';
const CATEGORY_LABELS = {
    session: 'Session',
    context: 'Context',
    git: 'Git',
    tools: 'Tools',
    providers: 'Providers',
};
export function CommandPicker({ query, selectedIndex, onSelect, onDismiss, }) {
    const q = query.toLowerCase().replace(/^\//, '');
    const filtered = q
        ? SLASH_COMMANDS.filter((c) => c.name.startsWith(q) ||
            c.trigger.includes(q) ||
            c.description.toLowerCase().includes(q))
        : SLASH_COMMANDS;
    const clamped = Math.min(selectedIndex, Math.max(0, filtered.length - 1));
    const selected = filtered[clamped];
    const useGroups = !q;
    const MAX_VISIBLE = 12;
    // Build ordered category groups from SLASH_COMMANDS order
    const groups = [];
    if (useGroups) {
        const seen = new Set();
        for (const cmd of SLASH_COMMANDS) {
            if (!seen.has(cmd.category)) {
                seen.add(cmd.category);
                groups.push({
                    category: cmd.category,
                    commands: SLASH_COMMANDS.filter((c) => c.category === cmd.category),
                });
            }
        }
    }
    return (React.createElement(Box, { flexDirection: "column", borderStyle: "round", borderColor: "gray", paddingX: 1 },
        React.createElement(Box, { flexDirection: "row", marginBottom: 0 },
            React.createElement(Text, { color: "gray", dimColor: true }, '  '),
            q ? (React.createElement(React.Fragment, null,
                React.createElement(Text, { color: "gray", dimColor: true }, "Matching "),
                React.createElement(Text, { color: "yellowBright", bold: true },
                    "/",
                    q))) : (React.createElement(Text, { color: "gray", dimColor: true }, "Commands"))),
        filtered.length === 0 ? (React.createElement(Box, { paddingX: 1 },
            React.createElement(Text, { color: "gray", dimColor: true },
                "No commands match \"/",
                q,
                "\""))) : useGroups ? (groups.map(({ category, commands }) => (React.createElement(Box, { key: category, flexDirection: "column" },
            React.createElement(Box, null,
                React.createElement(Text, { color: "gray", dimColor: true },
                    '  ─── ',
                    CATEGORY_LABELS[category] ?? category,
                    ' ')),
            commands.map((cmd) => {
                const idx = filtered.indexOf(cmd);
                return React.createElement(CommandRow, { key: cmd.trigger, cmd: cmd, isSelected: idx === clamped });
            }))))) : (filtered.slice(0, MAX_VISIBLE).map((cmd, i) => (React.createElement(CommandRow, { key: cmd.trigger, cmd: cmd, isSelected: i === clamped })))),
        filtered.length > MAX_VISIBLE && !useGroups && (React.createElement(Box, { paddingX: 1 },
            React.createElement(Text, { color: "gray", dimColor: true },
                "  +",
                filtered.length - MAX_VISIBLE,
                " more \u2014 keep typing to filter"))),
        selected && (React.createElement(Box, { flexDirection: "column", marginTop: 0, borderStyle: "single", borderColor: "gray", paddingX: 1 },
            React.createElement(Text, { color: "white" }, selected.description),
            selected.detail && (React.createElement(Text, { color: "gray", dimColor: true }, selected.detail)),
            selected.usage && (React.createElement(Box, { flexDirection: "row" },
                React.createElement(Text, { color: "gray", dimColor: true }, "usage  "),
                React.createElement(Text, { color: "cyan" }, selected.usage))))),
        React.createElement(Box, { paddingX: 1 },
            React.createElement(Text, { color: "gray", dimColor: true }, '↑↓ navigate  ↵ select  esc dismiss'))));
}
function CommandRow({ cmd, isSelected }) {
    return (React.createElement(Box, { flexDirection: "row" },
        React.createElement(Text, { color: isSelected ? 'yellowBright' : 'gray' }, isSelected ? '▶ ' : '  '),
        React.createElement(Box, { width: 2 },
            React.createElement(Text, { color: isSelected ? 'yellowBright' : 'gray' }, cmd.icon)),
        React.createElement(Box, { width: 14 },
            React.createElement(Text, { color: isSelected ? 'yellowBright' : 'cyan', bold: isSelected }, cmd.trigger)),
        React.createElement(Text, { color: isSelected ? 'white' : 'gray', dimColor: !isSelected }, cmd.description)));
}
//# sourceMappingURL=CommandPicker.js.map