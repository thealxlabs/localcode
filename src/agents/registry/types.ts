export interface AgentDefinition {
  id: string
  name: string
  category: string
  description: string
  color?: string
  emoji?: string
  vibe?: string
  prompt: string
}

export interface AgentCategory {
  id: string
  name: string
  emoji: string
  agents: AgentDefinition[]
}

export interface AgentRegistry {
  categories: AgentCategory[]
  allAgents: AgentDefinition[]
  getAgent(id: string): AgentDefinition | undefined
  getAgentsByCategory(category: string): AgentDefinition[]
  searchAgents(query: string): AgentDefinition[]
}
