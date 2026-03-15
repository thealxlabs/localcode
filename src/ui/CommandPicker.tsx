// src/ui/CommandPicker.tsx
// Claude Code-style slash command picker — pops above input when user types /

import React from 'react';
import { Box, Text } from 'ink';
import { SlashCommand, SLASH_COMMANDS } from '../core/types.js';

const CATEGORY_LABELS: Record<string, string> = {
  session:   'Session',
  context:   'Context',
  git:       'Git',
  tools:     'Tools',
  providers: 'Providers',
};

interface CommandPickerProps {
  query: string;
  selectedIndex: number;
  onSelect: (cmd: SlashCommand) => void;
  onDismiss: () => void;
}

export function CommandPicker({
  query,
  selectedIndex,
  onSelect,
  onDismiss,
}: CommandPickerProps): React.ReactElement {
  const q = query.toLowerCase().replace(/^\//, '');
  const filtered: SlashCommand[] = q
    ? SLASH_COMMANDS.filter(
        (c) =>
          c.name.startsWith(q) ||
          c.trigger.includes(q) ||
          c.description.toLowerCase().includes(q),
      )
    : SLASH_COMMANDS;

  const clamped = Math.min(selectedIndex, Math.max(0, filtered.length - 1));
  const selected = filtered[clamped];

  const useGroups = !q;
  const MAX_VISIBLE = 12;

  // Build ordered category groups from SLASH_COMMANDS order
  const groups: Array<{ category: string; commands: SlashCommand[] }> = [];
  if (useGroups) {
    const seen = new Set<string>();
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

  return (
    <Box flexDirection="column" borderStyle="round" borderColor="gray" paddingX={1}>
      {/* Header */}
      <Box flexDirection="row" marginBottom={0}>
        <Text color="gray" dimColor>{'  '}</Text>
        {q ? (
          <>
            <Text color="gray" dimColor>Matching </Text>
            <Text color="yellowBright" bold>/{q}</Text>
          </>
        ) : (
          <Text color="gray" dimColor>Commands</Text>
        )}
      </Box>

      {/* Command list */}
      {filtered.length === 0 ? (
        <Box paddingX={1}>
          <Text color="gray" dimColor>No commands match "/{q}"</Text>
        </Box>
      ) : useGroups ? (
        groups.map(({ category, commands }) => (
          <Box key={category} flexDirection="column">
            <Box>
              <Text color="gray" dimColor>{'  ─── '}{CATEGORY_LABELS[category] ?? category}{' '}</Text>
            </Box>
            {commands.map((cmd) => {
              const idx = filtered.indexOf(cmd);
              return <CommandRow key={cmd.trigger} cmd={cmd} isSelected={idx === clamped} />;
            })}
          </Box>
        ))
      ) : (
        filtered.slice(0, MAX_VISIBLE).map((cmd, i) => (
          <CommandRow key={cmd.trigger} cmd={cmd} isSelected={i === clamped} />
        ))
      )}

      {filtered.length > MAX_VISIBLE && !useGroups && (
        <Box paddingX={1}>
          <Text color="gray" dimColor>  +{filtered.length - MAX_VISIBLE} more — keep typing to filter</Text>
        </Box>
      )}

      {/* Detail pane for selected command */}
      {selected && (
        <Box flexDirection="column" marginTop={0} borderStyle="single" borderColor="gray" paddingX={1}>
          <Text color="white">{selected.description}</Text>
          {selected.detail && (
            <Text color="gray" dimColor>{selected.detail}</Text>
          )}
          {selected.usage && (
            <Box flexDirection="row">
              <Text color="gray" dimColor>usage  </Text>
              <Text color="cyan">{selected.usage}</Text>
            </Box>
          )}
        </Box>
      )}

      {/* Nav hint */}
      <Box paddingX={1}>
        <Text color="gray" dimColor>{'↑↓ navigate  ↵ select  esc dismiss'}</Text>
      </Box>
    </Box>
  );
}

function CommandRow({ cmd, isSelected }: { cmd: SlashCommand; isSelected: boolean }): React.ReactElement {
  return (
    <Box flexDirection="row">
      <Text color={isSelected ? 'yellowBright' : 'gray'}>{isSelected ? '▶ ' : '  '}</Text>
      <Box width={2}><Text color={isSelected ? 'yellowBright' : 'gray'}>{cmd.icon}</Text></Box>
      <Box width={14}>
        <Text color={isSelected ? 'yellowBright' : 'cyan'} bold={isSelected}>{cmd.trigger}</Text>
      </Box>
      <Text color={isSelected ? 'white' : 'gray'} dimColor={!isSelected}>{cmd.description}</Text>
    </Box>
  );
}
