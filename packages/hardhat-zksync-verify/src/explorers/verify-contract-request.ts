import { CompilerInput } from 'hardhat/types';

export interface ZkSyncExplorerVerifyRequest {
    contractAddress: string;
    contractName: string;
    sourceCode: CompilerInput;
    codeFormat: string;
    compilerSolcVersion: string;
    compilerZksolcVersion: string;
    optimizationUsed: boolean;
    constructorArguments: string;
}

export interface ZkSyncEtherscanExplorerVerifyRequest {
    action: 'verifysourcecode';
    module: 'contract';
    apikey: string;
    compilermode: 'zksync';
    zksolcVersion: string;
    contractaddress: string;
    contractname: string;
    sourceCode: CompilerInput;
    codeformat: string;
    compilerversion: string;
    optimizationUsed?: string;
    constructorArguements: string;
}
