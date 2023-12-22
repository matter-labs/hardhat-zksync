import { Artifacts } from 'hardhat/internal/artifacts';
import { Artifact } from 'hardhat/types';
import { VyperOutput, ContractOutput } from '@nomiclabs/hardhat-vyper/dist/src/types';
import { getArtifactFromVyperOutput } from '@nomiclabs/hardhat-vyper/dist/src/util';
import { FactoryDeps } from './types';
import { zeroxlify } from './utils';

const ZK_ARTIFACT_FORMAT_VERSION = 'hh-zkvyper-artifact-1';

export class ZkArtifacts extends Artifacts {
    public compilerOutput?: VyperOutput;
    public forwarderOutput?: ContractOutput;

    public override async saveArtifactAndDebugFile(artifact: Artifact, pathToBuildInfo?: string) {
        /* eslint-disable */
        if (this.forwarderOutput != null) {
            const forwarderArtifact = {
                ...getArtifactFromVyperOutput(".__VYPER_FORWARDER_CONTRACT", this.forwarderOutput),
                contractName: "__VYPER_FORWARDER_CONTRACT",
                _format: ZK_ARTIFACT_FORMAT_VERSION,
            };
            /* eslint-disable */
            await super.saveArtifactAndDebugFile(forwarderArtifact, pathToBuildInfo);

            this.forwarderOutput = undefined;
            this.addValidArtifacts([{
                sourceName: forwarderArtifact.sourceName,
                artifacts: [forwarderArtifact.contractName]
            }]);
        }

        if (artifact.sourceName.endsWith('.vy') || artifact.sourceName.endsWith('.v.py')) {
            let factoryDeps: FactoryDeps = {};
            /* eslint-disable */
            // @ts-ignore
            let entries: Array<[string, string]> = Object.entries(this.compilerOutput[artifact.sourceName]?.factory_deps ?? {});
            for (const [hash, dependency] of entries) {
                factoryDeps[zeroxlify(hash)] = 
                    dependency == "__VYPER_FORWARDER_CONTRACT" 
                        ? ".__VYPER_FORWARDER_CONTRACT:__VYPER_FORWARDER_CONTRACT" 
                        : dependency;
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
