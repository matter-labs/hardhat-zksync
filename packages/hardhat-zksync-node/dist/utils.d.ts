import { CommandArguments } from './types';
export declare function constructCommandArgs(args: CommandArguments): string[];
export declare function getPlatform(): string;
export declare function getRPCServerBinariesDir(): Promise<string>;
export declare function getLatestRelease(owner: string, repo: string, userAgent: string, timeout: number): Promise<any>;
export declare function getNodeUrl(repo: string, release: string): Promise<string>;
export declare function download(url: string, filePath: string, userAgent: string, version: string, timeoutMillis?: number, extraHeaders?: {
    [name: string]: string;
}): Promise<void>;
export declare function isPortAvailable(port: number): Promise<boolean>;
export declare function waitForNodeToBeReady(port: number, maxAttempts?: number): Promise<void>;
export declare function getAvailablePort(startPort: number, maxAttempts: number): Promise<number>;
export declare function adjustTaskArgsForPort(taskArgs: string[], currentPort: number): string[];
export declare function configureNetwork(network: any, port: number): void;
//# sourceMappingURL=utils.d.ts.map