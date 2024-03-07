export declare class JsonRpcServer {
    private readonly serverBinaryPath;
    private serverProcess;
    constructor(serverBinaryPath: string);
    listen(args?: string[], blockProcess?: boolean): Promise<void>;
    stop(): Promise<void>;
}
//# sourceMappingURL=server.d.ts.map