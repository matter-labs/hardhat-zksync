import { Artifacts } from 'hardhat/internal/artifacts';
import { Artifact } from 'hardhat/types';
import { VyperOutput, ContractOutput } from '@nomiclabs/hardhat-vyper/dist/src/types';
import { getArtifactFromVyperOutput } from '@nomiclabs/hardhat-vyper/dist/src/util';
import { FactoryDeps } from './types';
import { zeroxlify } from './utils';

const ZK_ARTIFACT_FORMAT_VERSION = 'hh-zkvyper-artifact-1';

export enum PROXY_NAME {
    __VYPER_MINIMAL_PROXY_CONTRACT = '__VYPER_MINIMAL_PROXY_CONTRACT',
    __VYPER_FORWARDER_CONTRACT = '__VYPER_FORWARDER_CONTRACT',
}

export const proxyNames = Object.values(PROXY_NAME).map((name) => name.toString());

export interface ProxtContractOutput {
    proxyName: PROXY_NAME;
    output: ContractOutput;
}

export class ZkArtifacts extends Artifacts {
    public compilerOutput?: VyperOutput;
    public proxyContractOutput?: ProxtContractOutput;

    public override async saveArtifactAndDebugFile(artifact: Artifact, pathToBuildInfo?: string) {
        /* eslint-disable */
        if (this.proxyContractOutput != null) {
            const proxyArtifact = {
                ...getArtifactFromVyperOutput(`.${this.proxyContractOutput.proxyName}`, this.proxyContractOutput.output),
                contractName: this.proxyContractOutput.proxyName,
                _format: ZK_ARTIFACT_FORMAT_VERSION,
            };
            /* eslint-disable */
            await super.saveArtifactAndDebugFile(proxyArtifact, pathToBuildInfo);

            this.proxyContractOutput = undefined;
            this.addValidArtifacts([{
                sourceName: proxyArtifact.sourceName,
                artifacts: [proxyArtifact.contractName]
            }]);
        }

        if (artifact.sourceName.endsWith('.vy') || artifact.sourceName.endsWith('.v.py')) {
            let factoryDeps: FactoryDeps = {};
            /* eslint-disable */
            // @ts-ignore
            let entries: Array<[string, string]> = Object.entries(this.compilerOutput[artifact.sourceName]?.factory_deps ?? {});
            for (const [hash, dependency] of entries) {
                factoryDeps[zeroxlify(hash)] = proxyNames.includes(dependency) ? `.${dependency}:${dependency}` : dependency;
            }

            return await super.saveArtifactAndDebugFile({
                ...artifact,
                _format: ZK_ARTIFACT_FORMAT_VERSION,
                // @ts-ignore
                factoryDeps
            }, pathToBuildInfo);
            /* eslint-disable */
        }

        return await super.saveArtifactAndDebugFile(artifact, pathToBuildInfo);
    }
}
