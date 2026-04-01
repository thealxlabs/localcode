// src/ui/AgentPicker.tsx

import React, { useState, useMemo } from 'react';
import { Box, Text } from 'ink';
import type { AgentDefinition, AgentCategory } from '../agents/registry/types.js';

interface AgentPickerProps {
  categories: AgentCategory[];
  allAgents: AgentDefinition[];
  query: string;
  selectedIndex: number;
  onSelect: (agent: AgentDefinition) => void;
  onDismiss: () => void;
}

export function AgentPicker({
  categories,
  allAgents,
  query,
  selectedIndex,
  onSelect,
  onDismiss,
}: AgentPickerProps): React.ReactElement {
  const q = query.toLowerCase().trim();

  const filtered = useMemo(() => {
    if (!q) return allAgents;
    return allAgents.filter(
      (a) =>
        a.name.toLowerCase().includes(q) ||
        a.description.toLowerCase().includes(q) ||
        a.category.toLowerCase().includes(q) ||
        (a.vibe && a.vibe.toLowerCase().includes(q))
    );
  }, [allAgents, q]);

  const clamped = Math.min(selectedIndex, Math.max(0, filtered.length - 1));
  const selected = filtered[clamped];
  const MAX_VISIBLE = 12;

  // Group by category
  const grouped = useMemo(() => {
    if (!q) {
      return categories
        .filter((cat) => cat.agents.length > 0)
        .map((cat) => ({
          category: cat.name,
          emoji: cat.emoji,
          agents: cat.agents,
        }));
    }
    const map = new Map<string, { emoji: string; agents: AgentDefinition[] }>();
    for (const agent of filtered) {
      const cat = categories.find((c) => c.id === agent.category.toLowerCase().replace(/[^a-z0-9]/g, '-'));
      const catName = agent.category;
      const emoji = cat?.emoji || '📁';
      if (!map.has(catName)) map.set(catName, { emoji, agents: [] });
      map.get(catName)!.agents.push(agent);
    }
    return [...map.entries()].map(([name, data]) => ({
      category: name,
      emoji: data.emoji,
      agents: data.agents,
    }));
  }, [filtered, categories, q]);

  return (
    <Box flexDirection="column" borderStyle="round" borderColor="cyan" paddingX={1} width={80}>
      <Box flexDirection="row" marginBottom={0}>
        <Text color="cyan" bold>  Agents</Text>
        {q && (
          <>
            <Text color="gray"> — searching </Text>
            <Text color="yellowBright">{q}</Text>
          </>
        )}
        <Text color="gray" dimColor> ({filtered.length} agents)</Text>
      </Box>

      {filtered.length === 0 ? (
        <Box paddingX={1}>
          <Text color="gray" dimColor>No agents found</Text>
        </Box>
      ) : (
        grouped.map(({ category, emoji, agents }) => (
          <Box key={category} flexDirection="column">
            <Box>
              <Text color="gray" dimColor>{`  ${emoji} ${category}`}</Text>
            </Box>
            {agents.slice(0, MAX_VISIBLE).map((agent) => {
              const idx = filtered.indexOf(agent);
              return (
                <AgentRow
                  key={agent.id}
                  agent={agent}
                  isSelected={idx === clamped}
                />
              );
            })}
            {agents.length > MAX_VISIBLE && (
              <Box paddingX={1}>
                <Text color="gray" dimColor>{`  +${agents.length - MAX_VISIBLE} more`}</Text>
              </Box>
            )}
          </Box>
        ))
      )}

      {selected && (
        <Box flexDirection="column" marginTop={0} borderStyle="single" borderColor="gray" paddingX={1}>
          <Text color="white">{selected.description}</Text>
          {selected.vibe && (
            <Text color="gray" dimColor>vibe: {selected.vibe}</Text>
          )}
        </Box>
      )}

      <Box paddingX={1}>
        <Text color="gray" dimColor>{'↑↓ navigate  ↵ activate  esc dismiss'}</Text>
      </Box>
    </Box>
  );
}

function AgentRow({ agent, isSelected }: { agent: AgentDefinition; isSelected: boolean }): React.ReactElement {
  const color = agent.color || 'cyan';
  return (
    <Box flexDirection="row">
      <Text color={isSelected ? 'yellowBright' : 'gray'}>{isSelected ? '▶ ' : '  '}</Text>
      <Box width={2}>
        <Text>{agent.emoji || '🤖'}</Text>
      </Box>
      <Box width={22}>
        <Text color={isSelected ? 'yellowBright' : color} bold={isSelected}>
          {agent.name.length > 20 ? agent.name.slice(0, 19) + '…' : agent.name}
        </Text>
      </Box>
      <Text color={isSelected ? 'white' : 'gray'} dimColor={!isSelected}>
        {agent.description.length > 40 ? agent.description.slice(0, 39) + '…' : agent.description}
      </Text>
    </Box>
  );
}
