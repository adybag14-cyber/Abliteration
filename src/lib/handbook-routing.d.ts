export const readerRoots: string[];
export const readerRootFiles: string[];
export function isReaderSource(source: string): boolean;
export function sourceRoute(source: string): string;
export function readerBase(base?: string): "/" | "/Abliteration/";
export function readerUrl(source: string, base?: string): string;
