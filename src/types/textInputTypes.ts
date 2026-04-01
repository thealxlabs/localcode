import type React from 'react'

export type InlineGhostText = {
  readonly text: string
  readonly fullCommand: string
  readonly insertPosition: number
}

export type ImageDimensions = {
  width: number
  height: number
}

export type TextHighlight = {
  start: number
  end: number
  color?: string
}

export type PastedContent = {
  id: number
  type: 'text' | 'image'
  content: string
  mediaType?: string
  filename?: string
  dimensions?: ImageDimensions
  sourcePath?: string
}

export type Key = {
  name: string
  ctrl: boolean
  meta: boolean
  shift: boolean
  sequence: string
}

export type MessageOrigin = 'human' | 'system' | 'agent' | 'bridge'

export type AssistantMessage = {
  type: 'assistant'
  content: unknown
  uuid?: string
}

export type PermissionResult = {
  behavior: 'allow' | 'deny' | 'ask' | 'passthrough'
  [key: string]: unknown
}

export type BaseTextInputProps = {
  readonly onHistoryUp?: () => void
  readonly onHistoryDown?: () => void
  readonly placeholder?: string
  readonly multiline?: boolean
  readonly focus?: boolean
  readonly mask?: string
  readonly showCursor?: boolean
  readonly highlightPastedText?: boolean
  readonly value: string
  readonly onChange: (value: string) => void
  readonly onSubmit?: (value: string) => void
  readonly onExit?: () => void
  readonly onExitMessage?: (show: boolean, key?: string) => void
  readonly onHistoryReset?: () => void
  readonly onClearInput?: () => void
  readonly columns: number
  readonly maxVisibleLines?: number
  readonly onImagePaste?: (base64Image: string, mediaType?: string, filename?: string, dimensions?: ImageDimensions, sourcePath?: string) => void
  readonly onPaste?: (text: string) => void
  readonly onIsPastingChange?: (isPasting: boolean) => void
  readonly disableCursorMovementForUpDownKeys?: boolean
  readonly disableEscapeDoublePress?: boolean
  readonly cursorOffset: number
  onChangeCursorOffset: (offset: number) => void
  readonly argumentHint?: string
  readonly onUndo?: () => void
  readonly dimColor?: boolean
  readonly highlights?: TextHighlight[]
  readonly placeholderElement?: React.ReactNode
  readonly inlineGhostText?: InlineGhostText
  readonly inputFilter?: (input: string, key: Key) => string
}

export type VimMode = 'INSERT' | 'NORMAL'

export type VimTextInputProps = BaseTextInputProps & {
  readonly initialMode?: VimMode
  readonly onModeChange?: (mode: VimMode) => void
}

export type BaseInputState = {
  onInput: (input: string, key: Key) => void
  renderedValue: string
  offset: number
  setOffset: (offset: number) => void
  cursorLine: number
  cursorColumn: number
  viewportCharOffset: number
  viewportCharEnd: number
  isPasting?: boolean
  pasteState?: { chunks: string[]; timeoutId: ReturnType<typeof setTimeout> | null }
}

export type TextInputState = BaseInputState

export type VimInputState = BaseInputState & {
  mode: VimMode
  setMode: (mode: VimMode) => void
}

export type PromptInputMode = 'bash' | 'prompt' | 'orphaned-permission' | 'task-notification'

export type EditablePromptInputMode = Exclude<PromptInputMode, `${string}-notification`>

export type QueuePriority = 'now' | 'next' | 'later'

export type QueuedCommand = {
  value: string | unknown[]
  mode: PromptInputMode
  priority?: QueuePriority
  uuid?: string
  orphanedPermission?: unknown
  pastedContents?: Record<number, PastedContent>
  preExpansionValue?: string
  skipSlashCommands?: boolean
  bridgeOrigin?: boolean
  isMeta?: boolean
  origin?: MessageOrigin
  workload?: string
  agentId?: string
}

export function isValidImagePaste(c: PastedContent): boolean {
  return c.type === 'image' && c.content.length > 0
}

export function getImagePasteIds(pastedContents: Record<number, PastedContent> | undefined): number[] | undefined {
  if (!pastedContents) return undefined
  const ids = Object.values(pastedContents).filter(isValidImagePaste).map(c => c.id)
  return ids.length > 0 ? ids : undefined
}

export type OrphanedPermission = {
  permissionResult: PermissionResult
  assistantMessage: AssistantMessage
}
