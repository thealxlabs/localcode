import { readFileSync, readdirSync, statSync } from 'fs'
import { join } from 'path'
import { homedir } from 'os'
import type { AgentDefinition, AgentCategory, AgentRegistry } from './types.js'

function parseFrontMatter(content: string): { metadata: Record<string, string>; body: string } {
  const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/)
  if (!match) return { metadata: {}, body: content }
  
  const metadata: Record<string, string> = {}
  match[1].split('\n').forEach(line => {
    const [key, ...valueParts] = line.split(':')
    if (key && valueParts.length) {
      metadata[key.trim()] = valueParts.join(':').trim()
    }
  })
  return { metadata, body: match[2].trim() }
}

function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

function loadAgentFile(filePath: string, category: string): AgentDefinition | null {
  try {
    const content = readFileSync(filePath, 'utf-8')
    const { metadata, body } = parseFrontMatter(content)
    
    const name = metadata.name || metadata.title || ''
    if (!name) return null
    
    return {
      id: slugify(name),
      name: name.replace(/^.*[-\s]/, '').trim(),
      category,
      description: metadata.description || body.substring(0, 200).replace(/[#*_]/g, '').trim(),
      color: metadata.color,
      emoji: metadata.emoji,
      vibe: metadata.vibe,
      prompt: body,
    }
  } catch {
    return null
  }
}

function loadAgentsFromDir(basePath: string): AgentDefinition[] {
  const agents: AgentDefinition[] = []
  
  try {
    const entries = readdirSync(basePath)
    for (const entry of entries) {
      const fullPath = join(basePath, entry)
      const stat = statSync(fullPath)
      
      if (stat.isDirectory() && entry !== 'node_modules') {
        const categoryName = entry.replace(/[-_]/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
        const files = readdirSync(fullPath).filter(f => f.endsWith('.md'))
        
        for (const file of files) {
          const agent = loadAgentFile(join(fullPath, file), categoryName)
          if (agent) agents.push(agent)
        }
      } else if (entry.endsWith('.md')) {
        const agent = loadAgentFile(fullPath, 'general')
        if (agent) agents.push(agent)
      }
    }
  } catch {
    // Directory doesn't exist or isn't accessible
  }
  
  return agents
}

export function buildAgentRegistry(): AgentRegistry {
  const allAgents: AgentDefinition[] = []
  
  // Load from ~/.localcode/agents/ (global agents)
  const globalPath = join(homedir(), '.localcode', 'agents')
  allAgents.push(...loadAgentsFromDir(globalPath))
  
  // Load from project .localcode/agents/
  const projectPath = join(process.cwd(), '.localcode', 'agents')
  allAgents.push(...loadAgentsFromDir(projectPath))
  
  // Deduplicate by ID (later sources override earlier ones)
  const seen = new Map<string, AgentDefinition>()
  for (const agent of allAgents) {
    seen.set(agent.id, agent)
  }
  const unique = [...seen.values()]
  
  const categories = [...new Set(unique.map(a => a.category))].map(cat => ({
    id: slugify(cat),
    name: cat,
    emoji: getCategoryEmoji(cat),
    agents: unique.filter(a => a.category === cat),
  }))
  
  return {
    categories,
    allAgents: unique,
    getAgent(id: string) {
      return unique.find(a => a.id === id)
    },
    getAgentsByCategory(category: string) {
      return unique.filter(a => a.category === category)
    },
    searchAgents(query: string) {
      const q = query.toLowerCase()
      return unique.filter(a =>
        a.name.toLowerCase().includes(q) ||
        a.description.toLowerCase().includes(q) ||
        a.category.toLowerCase().includes(q) ||
        (a.vibe && a.vibe.toLowerCase().includes(q))
      )
    },
  }
}

function getCategoryEmoji(category: string): string {
  const map: Record<string, string> = {
    'engineering': '💻',
    'design': '🎨',
    'marketing': '📈',
    'product': '📦',
    'project management': '📋',
    'testing': '🧪',
    'support': '🛠️',
    'specialized': '⚡',
    'strategy': '🎯',
    'integrations': '🔗',
    'sales': '💰',
    'general': '🤖',
  }
  return map[category.toLowerCase()] || '📁'
}

let cachedRegistry: AgentRegistry | null = null

export function getAgentRegistry(): AgentRegistry {
  if (!cachedRegistry) {
    cachedRegistry = buildAgentRegistry()
  }
  return cachedRegistry
}

export function reloadAgentRegistry(): AgentRegistry {
  cachedRegistry = null
  return buildAgentRegistry()
}
