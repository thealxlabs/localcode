import React from 'react';
import { ToolCall } from '../core/types.js';
interface PermissionPromptProps {
    toolCall: ToolCall;
}
export declare function needsPermission(toolCall: ToolCall): boolean;
export declare function PermissionPrompt({ toolCall }: PermissionPromptProps): React.ReactElement;
export {};
//# sourceMappingURL=PermissionPrompt.d.ts.map