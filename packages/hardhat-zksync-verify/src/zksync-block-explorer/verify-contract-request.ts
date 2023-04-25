import { CompilerInput } from 'hardhat/types';

export interface ZkSyncBlockExplorerVerifyRequest {
    contractAddress: string;
    contractName: string;
    sourceCode: string | CompilerInput;
    codeFormat: string;
    compilerSolcVersion: string;
    compilerZksolcVersion: string;
    optimizationUsed: boolean;
    constructorArguments: string;
}
