import React from 'react';
import { NyxMood, Provider } from '../core/types.js';
interface NyxHeaderProps {
    mood: NyxMood;
    provider: Provider;
    model: string;
    workingDir: string;
    tokenCount: number;
    allowAll: boolean;
}
export declare function NyxHeader({ mood, provider, model, workingDir, tokenCount, allowAll, }: NyxHeaderProps): React.ReactElement;
export {};
//# sourceMappingURL=NyxHeader.d.ts.map