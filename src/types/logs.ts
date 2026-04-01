export type SerializedMessage = {
  type: string
  content: unknown
  cwd: string
  userType: string
  entrypoint?: string
  sessionId: string
  timestamp: string
  version: string
  gitBranch?: string
  slug?: string
  isMeta?: boolean
}

export type LogOption = {
  date: string
  messages: SerializedMessage[]
  fullPath?: string
  value: number
  created: Date
  modified: Date
  firstPrompt: string
  messageCount: number
  fileSize?: number
  isSidechain: boolean
  isLite?: boolean
  sessionId?: string
  teamName?: string
  agentName?: string
  agentColor?: string
  agentSetting?: string
  isTeammate?: boolean
  summary?: string
  customTitle?: string
  tag?: string
  gitBranch?: string
  projectPath?: string
  prNumber?: number
  prUrl?: string
  prRepository?: string
  mode?: 'coordinator' | 'normal'
}

export type TranscriptMessage = SerializedMessage & {
  parentUuid: string | null
  logicalParentUuid?: string | null
  isSidechain: boolean
  gitBranch?: string
  agentId?: string
  teamName?: string
  agentName?: string
  agentColor?: string
  promptId?: string
}

export function sortLogs(logs: LogOption[]): LogOption[] {
  return logs.sort((a, b) => {
    const modifiedDiff = b.modified.getTime() - a.modified.getTime()
    if (modifiedDiff !== 0) return modifiedDiff
    return b.created.getTime() - a.created.getTime()
  })
}
