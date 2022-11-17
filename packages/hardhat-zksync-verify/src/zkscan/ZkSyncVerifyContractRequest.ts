export interface ZKScanVerifyRequest {
    contractAddress: string;
    contractName: string;
    sourceCode: string;
    compilerSolcVersion: string;
    compilerZksolcVersion: string;
    optimizationUsed: boolean;
    constructorArguments: string;
}
