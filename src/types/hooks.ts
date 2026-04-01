export type HookResult = {
  output?: string
  error?: string
}

export type HookDefinition = {
  name: string
  hookFn: (args: unknown) => Promise<HookResult> | HookResult
}

export type PromptRequest = {
  prompt: string
  message: string
  options: Array<{ key: string; label: string; description?: string }>
}

export type PromptResponse = {
  prompt_response: string
  selected: string
}

export type HookJSONOutput = Record<string, unknown>
export type SyncHookJSONOutput = HookJSONOutput
export type AsyncHookJSONOutput = HookJSONOutput & { async: true; asyncTimeout?: number }

export type HookCallbackContext = {
  getAppState: () => unknown
  updateAttributionState: (updater: (prev: unknown) => unknown) => void
}

export type HookCallback = {
  type: 'callback'
  callback: (input: unknown, toolUseID: string | null, abort: AbortSignal | undefined, hookIndex?: number, context?: HookCallbackContext) => Promise<HookJSONOutput>
  timeout?: number
  internal?: boolean
}

export type HookCallbackMatcher = {
  matcher?: string
  hooks: HookCallback[]
  pluginName?: string
}

export type HookProgress = {
  type: 'hook_progress'
  hookEvent: string
  hookName: string
  command: string
  promptText?: string
  statusMessage?: string
}

export type HookBlockingError = {
  blockingError: string
  command: string
}

export type PermissionRequestResult =
  | { behavior: 'allow'; updatedInput?: Record<string, unknown>; updatedPermissions?: unknown[] }
  | { behavior: 'deny'; message?: string; interrupt?: boolean }

export type HookResult_ = {
  message?: unknown
  systemMessage?: unknown
  blockingError?: HookBlockingError
  outcome: 'success' | 'blocking' | 'non_blocking_error' | 'cancelled'
  preventContinuation?: boolean
  stopReason?: string
  permissionBehavior?: 'ask' | 'deny' | 'allow' | 'passthrough'
  hookPermissionDecisionReason?: string
  additionalContext?: string
  initialUserMessage?: string
  updatedInput?: Record<string, unknown>
  updatedMCPToolOutput?: unknown
  permissionRequestResult?: PermissionRequestResult
  retry?: boolean
}

export type AggregatedHookResult = {
  message?: unknown
  blockingErrors?: HookBlockingError[]
  preventContinuation?: boolean
  stopReason?: string
  hookPermissionDecisionReason?: string
  permissionBehavior?: string
  additionalContexts?: string[]
  initialUserMessage?: string
  updatedInput?: Record<string, unknown>
  updatedMCPToolOutput?: unknown
  permissionRequestResult?: PermissionRequestResult
  retry?: boolean
}
