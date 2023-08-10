
export interface ZkSyncVyperBlockExplorerVerifyRequest {
    contractAddress: string;
    contractName: string;
    sourceCode: any;
    codeFormat: string;
    compilerVyperVersion: string;
    compilerZkvyperVersion: string;
    optimizationUsed: boolean;
    constructorArguments: string;
}