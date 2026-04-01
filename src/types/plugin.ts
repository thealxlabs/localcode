export type McpServerConfig = {
  command: string
  args?: string[]
  env?: Record<string, string>
}

export type LspServerConfig = {
  command: string
  args?: string[]
  env?: Record<string, string>
}

export type PluginAuthor = {
  name: string
  email?: string
  url?: string
}

export type CommandMetadata = {
  description?: string
  argumentHint?: string
}

export type PluginManifest = {
  name: string
  version: string
  description?: string
  authors?: PluginAuthor[]
  repository?: string
  license?: string
  icon?: string
  homepage?: string
  keywords?: string[]
  engines?: Record<string, string>
}

export type BuiltinPluginDefinition = {
  name: string
  description: string
  version?: string
  skills?: unknown[]
  hooks?: unknown
  mcpServers?: Record<string, McpServerConfig>
  isAvailable?: () => boolean
  defaultEnabled?: boolean
}

export type PluginRepository = {
  url: string
  branch: string
  lastUpdated?: string
  commitSha?: string
}

export type PluginConfig = {
  repositories: Record<string, PluginRepository>
}

export type LoadedPlugin = {
  name: string
  manifest: PluginManifest
  path: string
  source: string
  repository: string
  enabled?: boolean
  isBuiltin?: boolean
  sha?: string
  commandsPath?: string
  commandsPaths?: string[]
  commandsMetadata?: Record<string, CommandMetadata>
  agentsPath?: string
  agentsPaths?: string[]
  skillsPath?: string
  skillsPaths?: string[]
  outputStylesPath?: string
  outputStylesPaths?: string[]
  hooksConfig?: unknown
  mcpServers?: Record<string, McpServerConfig>
  lspServers?: Record<string, LspServerConfig>
  settings?: Record<string, unknown>
}

export type PluginComponent = 'commands' | 'agents' | 'skills' | 'hooks' | 'output-styles'

export type PluginError = {
  type: string
  source: string
  plugin?: string
  error?: string
  [key: string]: unknown
}

export type PluginLoadResult = {
  enabled: LoadedPlugin[]
  disabled: LoadedPlugin[]
  errors: PluginError[]
}

export function getPluginErrorMessage(error: PluginError): string {
  return error.error ?? `${error.type}: ${error.plugin ?? 'unknown'}`
}
