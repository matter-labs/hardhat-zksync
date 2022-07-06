import { Artifacts } from 'hardhat/internal/artifacts';
import { Artifact } from 'hardhat/types';
import { VyperOutput } from '@nomiclabs/hardhat-vyper/dist/src/types';

const ZK_ARTIFACT_FORMAT_VERSION = 'hh-zkvyper-artifact-1';

export class ZkArtifacts extends Artifacts {
    compilerOutput: Partial<VyperOutput> = {};

    override async saveArtifactAndDebugFile(artifact: Artifact, pathToBuildInfo?: string) {
        if (artifact.sourceName.endsWith('.vy') || artifact.sourceName.endsWith('.v.py')) {
            return await super.saveArtifactAndDebugFile({
                ...artifact,
                _format: ZK_ARTIFACT_FORMAT_VERSION,
                // @ts-ignore
                factoryDeps: this.compilerOutput == null ? {} : this.compilerOutput[artifact.sourceName].factory_deps
            }, pathToBuildInfo);
        }
        return await super.saveArtifactAndDebugFile(artifact, pathToBuildInfo);
    }
}
