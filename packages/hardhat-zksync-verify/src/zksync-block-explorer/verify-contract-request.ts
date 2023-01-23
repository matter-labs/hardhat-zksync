export interface ZkSyncBlockExplorerVerifyRequest {
    contractAddress: string;
    contractName: string;
    sourceCode: string;
    codeFormat: string;
    compilerSolcVersion: string;
    compilerZksolcVersion: string;
    optimizationUsed: boolean;
    constructorArguments: string;
}
