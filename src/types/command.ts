export type LocalCommandResult =
  | { type: 'text'; value: string }
  | { type: 'compact'; compactionResult: unknown; displayText?: string }
  | { type: 'skip' }

export type PromptCommand = {
  type: 'prompt'
  progressMessage: string
  contentLength: number
  argNames?: string[]
  allowedTools?: string[]
  model?: string
  source: string
  disableNonInteractive?: boolean
  context?: 'inline' | 'fork'
  agent?: string
  getPromptForCommand(args: string, context: unknown): Promise<unknown[]>
}

export type LocalCommandCall = (
  args: string,
  context: unknown,
) => Promise<LocalCommandResult>

export type LocalCommandModule = {
  call: LocalCommandCall
}

export type CommandBase = {
  description: string
  isEnabled?: () => boolean
  isHidden?: boolean
  name: string
  aliases?: string[]
  argumentHint?: string
  whenToUse?: string
  version?: string
  userInvocable?: boolean
  immediate?: boolean
  isSensitive?: boolean
  userFacingName?: () => string
}

export type Command = CommandBase & (PromptCommand | { type: 'local'; load: () => Promise<LocalCommandModule> } | { type: 'local-jsx'; load: () => Promise<{ call: unknown }> })

export function getCommandName(cmd: CommandBase): string {
  return cmd.userFacingName?.() ?? cmd.name
}

export function isCommandEnabled(cmd: CommandBase): boolean {
  return cmd.isEnabled?.() ?? true
}
