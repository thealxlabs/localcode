import React from 'react';
import { SlashCommand } from '../core/types.js';
interface CommandPickerProps {
    query: string;
    selectedIndex: number;
    onSelect: (cmd: SlashCommand) => void;
    onDismiss: () => void;
}
export declare function CommandPicker({ query, selectedIndex, onSelect, onDismiss, }: CommandPickerProps): React.ReactElement;
export {};
//# sourceMappingURL=CommandPicker.d.ts.map